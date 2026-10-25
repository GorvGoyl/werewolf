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

// gourav.io/werewolf (the old home) hands over its saved names and settings as #import=<json>
export type ImportPayload = {
  names?: unknown
  roleNames?: unknown
  timerMinutes?: unknown
  gameConfig?: unknown
}

export function applyImport(state: GameState, payload: ImportPayload, isFirstVisit: boolean): GameState {
  const names = sanitizeNames(payload.names)
  let next: GameState = { ...state, savedNames: rememberNames(state.savedNames, names) }

  if (next.currentPhase.type === "setup" && next.players.length === 0 && names.length > 0) {
    next = gameReducer(next, { type: "ADD_PLAYERS", names })
  }
  const roleNames = sanitizeRoleNames(payload.roleNames)
  if (Object.keys(next.roleNames).length === 0 && Object.keys(roleNames).length > 0) {
    next = { ...next, roleNames }
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
