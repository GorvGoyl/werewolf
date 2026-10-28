export type Role = "courtesan" | "queen_wolf" | "wolf" | "baby_wolf" | "wizard" | "seer" | "villager"

export type Player = {
  id: string
  name: string
  role: Role | null // null until the player is identified on Night 1
  isAlive: boolean
}

export type DeathCause = "wolves" | "invited_wolf" | "at_courtesan" | "wizard"

export type Death = { playerId: string; cause: DeathCause }

export type SeerResult = "wolf" | "not_wolf"

export type NightEvent = {
  night: number
  courtesanGuest: string | null
  wolfTarget: string | null
  wizardSaved: string | null
  wizardKilled: string | null
  seerChecked: string | null
  seerResult: SeerResult | null
  deaths: Death[]
}

export type DayEvent = {
  day: number
  eliminated: string | null // null = the village voted nobody out
  revealedRole: Role | null
}

export type GameConfig = {
  wolfCount: number // total wolves INCLUDING the Queen Wolf
  hasQueenWolf: boolean
  hasBabyWolf: boolean
  hasCourtesan: boolean
  hasWizard: boolean
  hasSeer: boolean
}

export type NightStep = "night_courtesan" | "night_baby_wolf" | "night_wolves" | "night_wizard" | "night_seer"

export type Winner = "village" | "wolves"

export type GamePhase =
  | { type: "setup" }
  | { type: "role_config" }
  | { type: NightStep }
  | { type: "night_results" }
  | { type: "day_vote" }
  | { type: "game_over"; winner: Winner }

export type RoleNames = Partial<Record<Role, string>>

export type GameState = {
  players: Player[]
  currentPhase: GamePhase
  currentNight: number
  currentDay: number
  nightEvents: NightEvent[]
  dayEvents: DayEvent[]
  wizardSavePotionUsed: boolean
  wizardKillPotionUsed: boolean
  lastCourtesanGuest: string | null
  currentNightEvent: Partial<NightEvent>
  gameConfig: GameConfig
  babyWolfPlayerId: string | null
  babyWolfTransformNight: number | null
  // Picks which wording of each line the game master reads (see script.ts). New for every game.
  scriptSeed: number
  // Who runs the game on this phone. They get no card, so they're never one of the players.
  // A new game keeps them until someone else takes over.
  gameMaster: string | null
  // Settings below survive new games and undo
  savedNames: string[] // every name ever added, newest first
  timerMinutes: number
  roleNames: RoleNames
  showRoleBadges: boolean
}

export type GameAction =
  | { type: "ADD_PLAYERS"; names: string[] }
  | { type: "REMOVE_PLAYER"; id: string }
  | { type: "REMOVE_ALL_PLAYERS" }
  | { type: "FORGET_SAVED_NAME"; name: string }
  | { type: "SET_GAME_MASTER"; name: string }
  | { type: "START_ROLE_CONFIG" }
  | { type: "BACK_TO_SETUP" }
  | { type: "SET_GAME_CONFIG"; config: GameConfig }
  | { type: "ASSIGN_ROLE"; playerId: string; role: Role }
  | { type: "ASSIGN_WOLVES"; playerIds: string[] }
  | { type: "IDENTIFY_BABY_WOLF"; playerId: string }
  | { type: "SET_COURTESAN_GUEST"; playerId: string }
  | { type: "SET_WOLF_TARGET"; playerId: string }
  | { type: "WIZARD_DECIDE"; saveId: string | null; killId: string | null }
  | { type: "SET_SEER_CHECK"; playerId: string }
  | { type: "CALL_DEAD_ROLE" }
  | { type: "SKIP_TO_NEXT_PHASE" }
  | { type: "START_DAY" }
  | { type: "ELIMINATE_PLAYER"; playerId: string }
  | { type: "SKIP_ELIMINATION" }
  | { type: "START_NEXT_NIGHT" }
  | { type: "NEW_GAME" }
  | { type: "RESTORE_STATE"; state: GameState }
  | { type: "SET_TIMER_MINUTES"; minutes: number }
  | { type: "SET_ROLE_NAMES"; roleNames: RoleNames }
  | { type: "SET_SHOW_ROLE_BADGES"; show: boolean }

export const DEFAULT_GAME_CONFIG: GameConfig = {
  wolfCount: 2,
  hasQueenWolf: false,
  hasBabyWolf: false,
  hasCourtesan: true,
  hasWizard: true,
  hasSeer: true,
}

export const MIN_PLAYERS = 5
