import type { GameAction, GamePhase, GameState, NightEvent, NightStep, Player, Role } from "./types"
import { DEFAULT_GAME_CONFIG } from "./types"
import { STEP_ROLE, isWolf, seerSees } from "./roles"
import { resolveDeaths } from "./deaths"

const UNIQUE_ROLES: Role[] = ["courtesan", "queen_wolf", "baby_wolf", "wizard", "seer"]
const NIGHT_STEPS: NightStep[] = ["night_courtesan", "night_baby_wolf", "night_wolves", "night_wizard", "night_seer"]
const MAX_SAVED_NAMES = 100

// A dead role's turn: nothing happens. The Baby Wolf and the wolves are never called dead.
const NOTHING_DONE: Partial<Record<NightStep, Partial<NightEvent>>> = {
  night_courtesan: { courtesanGuest: null },
  night_wizard: { wizardSaved: null, wizardKilled: null },
  night_seer: { seerChecked: null, seerResult: null },
}

export function createInitialState(): GameState {
  return {
    players: [],
    currentPhase: { type: "setup" },
    currentNight: 0,
    currentDay: 0,
    nightEvents: [],
    dayEvents: [],
    wizardSavePotionUsed: false,
    wizardKillPotionUsed: false,
    lastCourtesanGuest: null,
    currentNightEvent: {},
    gameConfig: DEFAULT_GAME_CONFIG,
    babyWolfPlayerId: null,
    babyWolfTransformNight: null,
    scriptSeed: 0,
    gameMaster: null,
    savedNames: [],
    timerMinutes: 3,
    roleNames: {},
    showRoleBadges: true,
  }
}

export function makePlayerId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ")
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

// Split pasted text like "Ana, Ben\nCleo" into names
export function splitNames(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map(normalizeName)
    .filter((n) => n.length > 0)
}

export function sameName(a: string, b: string): boolean {
  return a.toLocaleLowerCase() === b.toLocaleLowerCase()
}

// Newest names first, no duplicates
export function rememberNames(savedNames: string[], names: string[]): string[] {
  const result: string[] = []
  for (const name of [...[...names].reverse(), ...savedNames]) {
    if (!result.some((n) => sameName(n, name))) result.push(name)
  }
  return result.slice(0, MAX_SAVED_NAMES)
}

export function isNightStep(phase: GamePhase): phase is { type: NightStep } {
  return NIGHT_STEPS.includes(phase.type as NightStep)
}

// The night's wake-up order. The Baby Wolf only wakes on Night 1, to be identified.
export function getNightSteps(state: Pick<GameState, "gameConfig" | "currentNight">): NightStep[] {
  const config = state.gameConfig
  const steps: NightStep[] = []
  if (config.hasCourtesan) steps.push("night_courtesan")
  if (config.hasBabyWolf && state.currentNight === 1) steps.push("night_baby_wolf")
  steps.push("night_wolves")
  if (config.hasWizard) steps.push("night_wizard")
  if (config.hasSeer) steps.push("night_seer")
  return steps
}

export function checkWinCondition(players: Player[]): GamePhase | null {
  const alive = players.filter((p) => p.isAlive)
  const aliveWolves = alive.filter((p) => isWolf(p.role))
  const aliveOthers = alive.filter((p) => !isWolf(p.role))

  if (aliveWolves.length === 0) return { type: "game_over", winner: "village" }
  if (aliveWolves.length >= aliveOthers.length) return { type: "game_over", winner: "wolves" }
  return null
}

// The role woken at this step of the night has had their turn: the game master tells them to close
// their eyes, then goes on. Until then the step stays, so Undo goes back to their choice.
export function hasHadTurn(state: GameState): boolean {
  const event = state.currentNightEvent
  const phase = state.currentPhase.type
  if (phase === "night_courtesan") return event.courtesanGuest !== undefined
  if (phase === "night_baby_wolf") return state.babyWolfPlayerId !== null
  if (phase === "night_wolves") return event.wolfTarget !== undefined
  if (phase === "night_wizard") return event.wizardSaved !== undefined
  if (phase === "night_seer") return event.seerChecked !== undefined
  return false
}

// The wolves bit the Baby Wolf: they survive and join the pack next night.
// Not when they were the guest of a living Courtesan — her house protects them.
export function isBabyWolfBitten(players: Player[], nightEvent: Partial<NightEvent>): boolean {
  const target = players.find((p) => p.id === nightEvent.wolfTarget)
  if (!target || target.role !== "baby_wolf") return false
  const courtesanAlive = players.some((p) => p.role === "courtesan" && p.isAlive)
  return !(courtesanAlive && nightEvent.courtesanGuest === target.id)
}

function advanceNight(state: GameState): GameState {
  const steps = getNightSteps(state)
  const index = steps.indexOf(state.currentPhase.type as NightStep)
  if (index === -1) return state
  if (index < steps.length - 1) {
    return { ...state, currentPhase: { type: steps[index + 1] } }
  }
  return resolveNight(state)
}

function resolveNight(state: GameState): GameState {
  // Everyone who didn't wake up on Night 1 is a Villager
  const players = state.players.map((p) => (p.role === null ? { ...p, role: "villager" as const } : p))
  const event = state.currentNightEvent
  const deaths = resolveDeaths(players, event, event.wizardSaved ?? null)

  const nightEvent: NightEvent = {
    night: state.currentNight,
    courtesanGuest: event.courtesanGuest ?? null,
    wolfTarget: event.wolfTarget ?? null,
    wizardSaved: event.wizardSaved ?? null,
    wizardKilled: event.wizardKilled ?? null,
    seerChecked: event.seerChecked ?? null,
    seerResult: event.seerResult ?? null,
    deaths,
  }

  const babyWolfBitten = isBabyWolfBitten(players, event) && !deaths.some((d) => d.playerId === event.wolfTarget)

  const updatedPlayers = players.map((p) => {
    if (deaths.some((d) => d.playerId === p.id)) return { ...p, isAlive: false }
    return p
  })

  const resolved: GameState = {
    ...state,
    players: updatedPlayers,
    nightEvents: [...state.nightEvents, nightEvent],
    lastCourtesanGuest: event.courtesanGuest ?? null,
    currentNightEvent: {},
    babyWolfTransformNight: babyWolfBitten ? state.currentNight + 1 : state.babyWolfTransformNight,
  }

  const winPhase = checkWinCondition(updatedPlayers)
  if (winPhase) return { ...resolved, currentPhase: winPhase }
  return { ...resolved, currentPhase: { type: "night_results" } }
}

function startNight(state: GameState, night: number): GameState {
  const steps = getNightSteps({ gameConfig: state.gameConfig, currentNight: night })
  return {
    ...state,
    currentNight: night,
    currentNightEvent: { night },
    currentPhase: { type: steps[0] },
  }
}

function isAlivePlayer(state: GameState, id: string | null): boolean {
  if (!id) return false
  return state.players.some((p) => p.id === id && p.isAlive)
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const phase = state.currentPhase.type

  switch (action.type) {
    case "ADD_PLAYERS": {
      if (phase !== "setup") return state
      const added: Player[] = []
      for (const raw of action.names) {
        const name = normalizeName(raw)
        if (!name) continue
        const taken = [...state.players, ...added].some((p) => sameName(p.name, name))
        if (taken) continue
        added.push({ id: makePlayerId(), name, role: null, isAlive: true })
      }
      if (added.length === 0) return state
      // A game master who joins the players isn't running this game any more
      const master = state.gameMaster
      const masterPlays = master !== null && added.some((p) => sameName(p.name, master))
      return {
        ...state,
        players: [...state.players, ...added],
        savedNames: rememberNames(
          state.savedNames,
          added.map((p) => p.name),
        ),
        gameMaster: masterPlays ? null : master,
      }
    }

    case "REMOVE_PLAYER": {
      if (phase !== "setup") return state
      return { ...state, players: state.players.filter((p) => p.id !== action.id) }
    }

    case "REMOVE_ALL_PLAYERS": {
      if (phase !== "setup") return state
      return { ...state, players: [] }
    }

    case "FORGET_SAVED_NAME": {
      return { ...state, savedNames: state.savedNames.filter((n) => !sameName(n, action.name)) }
    }

    case "SET_GAME_MASTER": {
      if (phase !== "setup") return state
      const name = normalizeName(action.name)
      const previous = state.gameMaster
      if (!name || (previous !== null && sameName(previous, name))) return state
      // The new game master leaves the players, and whoever ran the last game plays instead
      const players = state.players.filter((p) => !sameName(p.name, name))
      if (previous !== null && !players.some((p) => sameName(p.name, previous))) {
        players.push({ id: makePlayerId(), name: previous, role: null, isAlive: true })
      }
      return {
        ...state,
        players,
        gameMaster: name,
        savedNames: rememberNames(state.savedNames, [name]),
      }
    }

    case "START_ROLE_CONFIG": {
      if (phase !== "setup") return state
      return { ...state, currentPhase: { type: "role_config" } }
    }

    case "BACK_TO_SETUP": {
      if (phase !== "role_config") return state
      return { ...state, currentPhase: { type: "setup" } }
    }

    case "SET_GAME_CONFIG": {
      if (phase !== "setup" && phase !== "role_config") return state
      const fresh: GameState = {
        ...state,
        gameConfig: action.config,
        players: state.players.map((p) => ({ ...p, role: null, isAlive: true })),
        currentDay: 0,
        nightEvents: [],
        dayEvents: [],
        wizardSavePotionUsed: false,
        wizardKillPotionUsed: false,
        lastCourtesanGuest: null,
        babyWolfPlayerId: null,
        babyWolfTransformNight: null,
        scriptSeed: Math.floor(Math.random() * 2 ** 32),
      }
      return startNight(fresh, 1)
    }

    case "ASSIGN_ROLE": {
      if (!isNightStep(state.currentPhase)) return state
      const unique = UNIQUE_ROLES.includes(action.role)
      return {
        ...state,
        players: state.players.map((p) => {
          if (p.id === action.playerId) return { ...p, role: action.role }
          if (unique && p.role === action.role) return { ...p, role: null }
          return p
        }),
        babyWolfPlayerId: action.role === "baby_wolf" ? action.playerId : state.babyWolfPlayerId,
      }
    }

    case "ASSIGN_WOLVES": {
      if (phase !== "night_wolves") return state
      return {
        ...state,
        players: state.players.map((p) => (action.playerIds.includes(p.id) ? { ...p, role: "wolf" } : p)),
      }
    }

    // A role's choice is recorded once. The step goes on with SKIP_TO_NEXT_PHASE, after they close their eyes.
    case "IDENTIFY_BABY_WOLF": {
      if (phase !== "night_baby_wolf" || hasHadTurn(state)) return state
      return gameReducer(state, { type: "ASSIGN_ROLE", playerId: action.playerId, role: "baby_wolf" })
    }

    case "SET_COURTESAN_GUEST": {
      if (phase !== "night_courtesan" || hasHadTurn(state) || !isAlivePlayer(state, action.playerId)) return state
      return { ...state, currentNightEvent: { ...state.currentNightEvent, courtesanGuest: action.playerId } }
    }

    case "SET_WOLF_TARGET": {
      if (phase !== "night_wolves" || hasHadTurn(state) || !isAlivePlayer(state, action.playerId)) return state
      return { ...state, currentNightEvent: { ...state.currentNightEvent, wolfTarget: action.playerId } }
    }

    case "WIZARD_DECIDE": {
      if (phase !== "night_wizard" || hasHadTurn(state)) return state
      const saveId = state.wizardSavePotionUsed ? null : action.saveId
      const killId = state.wizardKillPotionUsed ? null : action.killId
      return {
        ...state,
        currentNightEvent: { ...state.currentNightEvent, wizardSaved: saveId, wizardKilled: killId },
        wizardSavePotionUsed: state.wizardSavePotionUsed || saveId !== null,
        wizardKillPotionUsed: state.wizardKillPotionUsed || killId !== null,
      }
    }

    case "SET_SEER_CHECK": {
      if (phase !== "night_seer" || hasHadTurn(state)) return state
      const target = state.players.find((p) => p.id === action.playerId)
      if (!target) return state
      return {
        ...state,
        currentNightEvent: {
          ...state.currentNightEvent,
          seerChecked: action.playerId,
          seerResult: seerSees(target.role),
        },
      }
    }

    // A dead role is still called, so the table can't tell, and their turn passes with nothing done
    case "CALL_DEAD_ROLE": {
      if (!isNightStep(state.currentPhase) || hasHadTurn(state)) return state
      const step = state.currentPhase.type
      const nothing = NOTHING_DONE[step]
      const dead = state.players.some((p) => p.role === STEP_ROLE[step] && !p.isAlive)
      if (!nothing || !dead) return state
      return { ...state, currentNightEvent: { ...state.currentNightEvent, ...nothing } }
    }

    case "SKIP_TO_NEXT_PHASE": {
      return advanceNight(state)
    }

    case "START_DAY": {
      if (phase !== "night_results") return state
      return { ...state, currentPhase: { type: "day_vote" }, currentDay: state.currentNight }
    }

    case "ELIMINATE_PLAYER": {
      if (phase !== "day_vote" || !isAlivePlayer(state, action.playerId)) return state
      const player = state.players.find((p) => p.id === action.playerId)
      const players = state.players.map((p) => (p.id === action.playerId ? { ...p, isAlive: false } : p))
      const updated: GameState = {
        ...state,
        players,
        dayEvents: [
          ...state.dayEvents,
          { day: state.currentDay, eliminated: action.playerId, revealedRole: player?.role ?? null },
        ],
      }
      const winPhase = checkWinCondition(players)
      if (winPhase) return { ...updated, currentPhase: winPhase }
      return updated
    }

    case "SKIP_ELIMINATION": {
      if (phase !== "day_vote") return state
      const updated: GameState = {
        ...state,
        dayEvents: [...state.dayEvents, { day: state.currentDay, eliminated: null, revealedRole: null }],
      }
      return gameReducer(updated, { type: "START_NEXT_NIGHT" })
    }

    case "START_NEXT_NIGHT": {
      if (phase !== "day_vote") return state
      const nextNight = state.currentNight + 1
      // The bitten Baby Wolf joins the pack tonight
      const transform = state.babyWolfTransformNight === nextNight
      const players = state.players.map((p) => {
        if (transform && p.id === state.babyWolfPlayerId && p.isAlive) return { ...p, role: "wolf" as const }
        return p
      })
      return startNight({ ...state, players }, nextNight)
    }

    case "NEW_GAME": {
      // Same players with fresh roles; the game master, the role setup and settings stay
      return {
        ...createInitialState(),
        players: state.players.map((p) => ({ ...p, role: null, isAlive: true })),
        gameMaster: state.gameMaster,
        gameConfig: state.gameConfig,
        savedNames: state.savedNames,
        timerMinutes: state.timerMinutes,
        roleNames: state.roleNames,
        showRoleBadges: state.showRoleBadges,
      }
    }

    case "RESTORE_STATE": {
      return action.state
    }

    case "SET_TIMER_MINUTES": {
      return { ...state, timerMinutes: Math.min(15, Math.max(1, action.minutes)) }
    }

    case "SET_ROLE_NAMES": {
      return { ...state, roleNames: action.roleNames }
    }

    case "SET_SHOW_ROLE_BADGES": {
      return { ...state, showRoleBadges: action.show }
    }

    default:
      return state
  }
}

// Settings that undo should never roll back
export function keepSettings(target: GameState, current: GameState): GameState {
  return {
    ...target,
    savedNames: current.savedNames,
    timerMinutes: current.timerMinutes,
    roleNames: current.roleNames,
    showRoleBadges: current.showRoleBadges,
  }
}
