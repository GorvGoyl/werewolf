import type { GameConfig, GameState, Player, Role, RoleNames } from "./types"
import { DEFAULT_GAME_CONFIG } from "./types"
import { createInitialState, normalizeName, rememberNames, gameReducer } from "./reducer"

const STATE_KEY = "werewolf.state.v2"
const HISTORY_KEY = "werewolf.history.v2"
export const MAX_HISTORY = 40

const ROLES: Role[] = ["courtesan", "queen_wolf", "wolf", "baby_wolf", "wizard", "seer", "villager"]
const PHASES = [
  "setup",
  "role_config",
  "night_courtesan",
  "night_baby_wolf",
  "night_wolves",
  "night_wizard",
  "night_seer",
  "night_results",
  "day_vote",
  "game_over",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sanitizePlayers(value: unknown): Player[] | null {
  if (!Array.isArray(value)) return null
  const players: Player[] = []
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.name !== "string") return null
    const role = ROLES.includes(item.role as Role) ? (item.role as Role) : null
    players.push({ id: item.id, name: item.name, role, isAlive: item.isAlive !== false })
  }
  return players
}

function sanitizeConfig(value: unknown): GameConfig {
  if (!isRecord(value)) return DEFAULT_GAME_CONFIG
  return {
    wolfCount: typeof value.wolfCount === "number" && value.wolfCount >= 1 ? Math.floor(value.wolfCount) : 2,
    hasQueenWolf: value.hasQueenWolf !== false,
    hasBabyWolf: value.hasBabyWolf === true,
    hasCourtesan: value.hasCourtesan !== false,
    hasWizard: value.hasWizard !== false,
    hasSeer: value.hasSeer !== false,
  }
}

function sanitizeRoleNames(value: unknown): RoleNames {
  if (!isRecord(value)) return {}
  const names: RoleNames = {}
  for (const role of ROLES) {
    const name = value[role]
    if (typeof name === "string" && name.trim()) names[role] = name.trim().slice(0, 40)
  }
  return names
}

function sanitizeGameMaster(value: unknown): string | null {
  if (typeof value !== "string") return null
  return normalizeName(value) || null
}

function sanitizeNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((n): n is string => typeof n === "string")
    .map(normalizeName)
    .filter(Boolean)
}

// Returns a usable state from stored JSON, or null when it's unusable
export function sanitizeState(value: unknown): GameState | null {
  if (!isRecord(value)) return null
  const players = sanitizePlayers(value.players)
  if (!players) return null

  const base = createInitialState()
  const settings = {
    savedNames: sanitizeNames(value.savedNames),
    timerMinutes:
      typeof value.timerMinutes === "number" ? Math.min(15, Math.max(1, Math.round(value.timerMinutes))) : 3,
    roleNames: sanitizeRoleNames(value.roleNames),
    showRoleBadges: value.showRoleBadges !== false,
    gameConfig: sanitizeConfig(value.gameConfig),
    gameMaster: sanitizeGameMaster(value.gameMaster),
  }

  const phase = isRecord(value.currentPhase) ? value.currentPhase : null
  const phaseType = typeof phase?.type === "string" ? phase.type : ""
  if (!PHASES.includes(phaseType) || !Array.isArray(value.nightEvents) || !Array.isArray(value.dayEvents)) {
    // Something we can't resume: keep the players and settings, start over
    return {
      ...base,
      ...settings,
      players: players.map((p) => ({ ...p, role: null, isAlive: true })),
    }
  }

  return { ...base, ...(value as Partial<GameState>), ...settings, players }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return null
    return sanitizeState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: the game still works, it just won't survive a reload
  }
}

export function loadHistory(): GameState[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(sanitizeState)
      .filter((s): s is GameState => s !== null)
      .slice(-MAX_HISTORY)
  } catch {
    return []
  }
}

export function saveHistory(history: GameState[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)))
  } catch {
    // Undo history is a nice-to-have
  }
}

// Older addresses hand their saved data over in the URL as #import=<json>, since each address
// has its own storage: gourav.io/werewolf sends names and settings, an older address of this
// app sends its whole saved game as `state`
export type ImportPayload = {
  names?: unknown
  roleNames?: unknown
  timerMinutes?: unknown
  gameConfig?: unknown
  state?: unknown
}

export function applyImport(state: GameState, payload: ImportPayload, isFirstVisit: boolean): GameState {
  const fullState = sanitizeState(payload.state)
  if (fullState && isFirstVisit) return fullState

  let incomingNames = sanitizeNames(payload.names)
  let incomingRoleNames = sanitizeRoleNames(payload.roleNames)
  if (fullState) {
    incomingNames = [...fullState.savedNames].reverse().concat(fullState.players.map((p) => p.name))
    incomingRoleNames = fullState.roleNames
  }

  let next: GameState = { ...state, savedNames: rememberNames(state.savedNames, incomingNames) }
  if (next.currentPhase.type === "setup" && next.players.length === 0 && incomingNames.length > 0 && !fullState) {
    next = gameReducer(next, { type: "ADD_PLAYERS", names: incomingNames })
  }
  if (Object.keys(next.roleNames).length === 0 && Object.keys(incomingRoleNames).length > 0) {
    next = { ...next, roleNames: incomingRoleNames }
  }
  if (isFirstVisit) {
    if (typeof payload.timerMinutes === "number") {
      next = gameReducer(next, { type: "SET_TIMER_MINUTES", minutes: payload.timerMinutes })
    }
    if (isRecord(payload.gameConfig)) {
      next = { ...next, gameConfig: sanitizeConfig(payload.gameConfig) }
    }
  }
  return next
}

export function readImportFromHash(hash: string): ImportPayload | null {
  if (!hash.startsWith("#import=")) return null
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(hash.slice("#import=".length)))
    if (!isRecord(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export const HOME_URL = "https://werewolf.gourav.io/"
// Addresses the app used to live at. They forward to HOME_URL, taking the saved game along once.
const OLD_HOSTS = ["gorv-werewolf.vercel.app"]
const FORWARDED_KEY = "werewolf.forwarded"

// True when this page is on an old address and is leaving for the main one
export function forwardToHome(): boolean {
  if (!OLD_HOSTS.includes(window.location.hostname)) return false
  let hash = ""
  try {
    const saved = loadState()
    if (saved && !localStorage.getItem(FORWARDED_KEY)) {
      hash = `#import=${encodeURIComponent(JSON.stringify({ v: 2, state: saved }))}`
      localStorage.setItem(FORWARDED_KEY, "1")
    }
  } catch {
    // Can't read storage: just go
  }
  window.location.replace(HOME_URL + hash)
  return true
}

export type Boot = { state: GameState; history: GameState[]; openRules: boolean }

// Runs once, before React renders
export function boot(): Boot {
  const saved = loadState()
  let state = saved ?? createInitialState()
  let history = saved ? loadHistory() : []
  let openRules = false

  const hash = window.location.hash
  const payload = readImportFromHash(hash)
  if (payload) {
    state = applyImport(state, payload, saved === null)
    history = []
  }
  if (hash === "#rules") openRules = true
  if (payload || hash === "#rules") {
    window.history.replaceState(null, "", window.location.pathname + window.location.search)
  }
  return { state, history, openRules }
}
