import { describe, expect, it } from "vitest"
import {
  createInitialState,
  gameReducer,
  getNightSteps,
  keepSettings,
  splitNames,
} from "../src/game/reducer"
import { getPlayersInDanger, resolveDeaths } from "../src/game/deaths"
import { getLineup, isConfigValid, isWolf, pluralize, rolePlural } from "../src/game/roles"
import { getTimeline, getWolvesStep } from "../src/game/selectors"
import { applyHandOver, applyImport, handOverLink, readHandOver, readImportFromHash, sanitizeState } from "../src/game/storage"
import { detectPlatform } from "../src/lib/install"
import type { GameAction, GameConfig, GameState, Player } from "../src/game/types"
import { DEFAULT_GAME_CONFIG } from "../src/game/types"

const NAMES = ["ali", "G", "chris", "ha", "josie", "julia", "liana", "maud"]

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

function setupGame(names: string[] = NAMES): GameState {
  return gameReducer(createInitialState(), { type: "ADD_PLAYERS", names })
}

function idOf(state: GameState, name: string): string {
  const player = state.players.find((p) => p.name.toLowerCase() === name.toLowerCase())
  if (!player) throw new Error(`no player ${name}`)
  return player.id
}

function byName(state: GameState, name: string): Player {
  return state.players.find((p) => p.id === idOf(state, name))!
}

type Night1 = {
  guest?: string
  target: string
  save?: string
  kill?: string
  check?: string
}

// Plays Night 1 from its first step to dawn with these identities:
// G = Courtesan, julia = Baby Wolf, josie = Queen Wolf, maud = Wolf, ha = Wizard, chris = Seer
function playNight1(state: GameState, night: Night1): GameState {
  const config = state.gameConfig
  let s = state
  const id = (name: string) => idOf(s, name)

  if (config.hasCourtesan) {
    expect(s.currentPhase.type).toBe("night_courtesan")
    s = run(s, { type: "ASSIGN_ROLE", playerId: id("G"), role: "courtesan" })
    s = run(s, { type: "SET_COURTESAN_GUEST", playerId: id(night.guest ?? "ali") })
  }
  if (config.hasBabyWolf) {
    expect(s.currentPhase.type).toBe("night_baby_wolf")
    s = run(s, { type: "IDENTIFY_BABY_WOLF", playerId: id("julia") })
  }
  expect(s.currentPhase.type).toBe("night_wolves")
  if (config.hasQueenWolf) {
    expect(getWolvesStep(s)).toBe("queen")
    s = run(s, { type: "ASSIGN_ROLE", playerId: id("josie"), role: "queen_wolf" })
  }
  const regular = config.wolfCount - (config.hasQueenWolf ? 1 : 0)
  if (regular > 0) {
    expect(getWolvesStep(s)).toBe("pack")
    const pack = ["maud", "liana", "ali"].slice(0, regular).map(id)
    s = run(s, { type: "ASSIGN_WOLVES", playerIds: pack })
  }
  expect(getWolvesStep(s)).toBe("attack")
  s = run(s, { type: "SET_WOLF_TARGET", playerId: id(night.target) })

  if (config.hasWizard) {
    expect(s.currentPhase.type).toBe("night_wizard")
    s = run(s, { type: "ASSIGN_ROLE", playerId: id("ha"), role: "wizard" })
    s = run(s, {
      type: "WIZARD_DECIDE",
      saveId: night.save ? id(night.save) : null,
      killId: night.kill ? id(night.kill) : null,
    })
  }
  if (config.hasSeer) {
    expect(s.currentPhase.type).toBe("night_seer")
    s = run(s, { type: "ASSIGN_ROLE", playerId: id("chris"), role: "seer" })
    s = run(s, { type: "SET_SEER_CHECK", playerId: id(night.check ?? "ali") })
    s = run(s, { type: "SKIP_TO_NEXT_PHASE" })
  }
  return s
}

// A game at Day 1 where nobody died on Night 1 (the wolves bit the Courtesan's guest)
function buildGameWithRoles(config?: Partial<GameConfig>): GameState {
  const fullConfig: GameConfig = { ...DEFAULT_GAME_CONFIG, ...config }
  let state = run(setupGame(), { type: "START_ROLE_CONFIG" }, { type: "SET_GAME_CONFIG", config: fullConfig })
  const quietNight = fullConfig.hasCourtesan
    ? { guest: "liana", target: "liana" }
    : { target: "liana", save: fullConfig.hasWizard ? "liana" : undefined }
  state = playNight1(state, quietNight)
  if (state.currentPhase.type === "night_results") state = run(state, { type: "START_DAY" })
  return state
}

// ===========================
// 1. SETUP & PLAYERS
// ===========================
describe("Setup & players", () => {
  it("creates the initial state", () => {
    const state = createInitialState()
    expect(state.players).toHaveLength(0)
    expect(state.currentPhase).toEqual({ type: "setup" })
    expect(state.currentNight).toBe(0)
    expect(state.gameConfig).toEqual(DEFAULT_GAME_CONFIG)
    expect(state.showRoleBadges).toBe(true)
  })

  it("adds players, trimmed and capitalized", () => {
    const state = setupGame(["  alice  ", "Bob"])
    expect(state.players.map((p) => p.name)).toEqual(["Alice", "Bob"])
    expect(state.players[0].role).toBeNull()
    expect(state.players[0].isAlive).toBe(true)
  })

  it("skips duplicate names, ignoring case", () => {
    let state = setupGame(["Alice", "alice", "ALICE "])
    state = run(state, { type: "ADD_PLAYERS", names: ["Alice"] })
    expect(state.players.map((p) => p.name)).toEqual(["Alice"])
  })

  it("splits pasted lists into names", () => {
    expect(splitNames("ana, ben\ncleo;  dev  ,,")).toEqual(["Ana", "Ben", "Cleo", "Dev"])
  })

  it("gives players unique ids", () => {
    const state = setupGame(["A", "B", "C"])
    expect(new Set(state.players.map((p) => p.id)).size).toBe(3)
  })

  it("removes one player or all of them", () => {
    let state = setupGame(["Alice", "Bob", "Charlie"])
    state = run(state, { type: "REMOVE_PLAYER", id: idOf(state, "Bob") })
    expect(state.players.map((p) => p.name)).toEqual(["Alice", "Charlie"])
    state = run(state, { type: "REMOVE_ALL_PLAYERS" })
    expect(state.players).toHaveLength(0)
  })

  it("remembers every name, newest first, even after removal", () => {
    let state = setupGame(["Alice", "Bob"])
    state = run(state, { type: "REMOVE_ALL_PLAYERS" }, { type: "ADD_PLAYERS", names: ["Cleo"] })
    expect(state.savedNames).toEqual(["Cleo", "Bob", "Alice"])
    state = run(state, { type: "ADD_PLAYERS", names: ["alice"] })
    expect(state.savedNames).toEqual(["Alice", "Cleo", "Bob"])
  })

  it("forgets a saved name", () => {
    let state = setupGame(["Alice", "Bob"])
    state = run(state, { type: "FORGET_SAVED_NAME", name: "alice" })
    expect(state.savedNames).toEqual(["Bob"])
    expect(state.players).toHaveLength(2)
  })

  it("doesn't change players once the game started", () => {
    const state = buildGameWithRoles()
    expect(run(state, { type: "ADD_PLAYERS", names: ["Zed"] })).toBe(state)
    expect(run(state, { type: "REMOVE_PLAYER", id: state.players[0].id })).toBe(state)
  })
})

// ===========================
// 2. ROLE CONFIG
// ===========================
describe("Role config", () => {
  it("START_ROLE_CONFIG moves to role_config", () => {
    const state = run(setupGame(["A", "B", "C", "D", "E"]), { type: "START_ROLE_CONFIG" })
    expect(state.currentPhase).toEqual({ type: "role_config" })
  })

  it("SET_GAME_CONFIG stores the config and starts Night 1 at its first step", () => {
    const config: GameConfig = { ...DEFAULT_GAME_CONFIG, wolfCount: 1, hasQueenWolf: false, hasCourtesan: false }
    const state = run(setupGame(["A", "B", "C", "D", "E"]), { type: "START_ROLE_CONFIG" }, { type: "SET_GAME_CONFIG", config })
    expect(state.gameConfig).toEqual(config)
    expect(state.currentPhase).toEqual({ type: "night_wolves" })
    expect(state.currentNight).toBe(1)
    expect(state.currentNightEvent).toEqual({ night: 1 })
  })

  it("starts Night 1 with the Courtesan when she's in play", () => {
    const state = run(setupGame(), { type: "START_ROLE_CONFIG" }, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    expect(state.currentPhase).toEqual({ type: "night_courtesan" })
  })

  it("validates the number of wolves", () => {
    expect(isConfigValid({ ...DEFAULT_GAME_CONFIG, wolfCount: 2 }, 8)).toBe(true)
    expect(isConfigValid({ ...DEFAULT_GAME_CONFIG, wolfCount: 4 }, 8)).toBe(false)
    expect(isConfigValid({ ...DEFAULT_GAME_CONFIG, wolfCount: 0 }, 8)).toBe(false)
  })

  it("lists the lineup", () => {
    expect(getLineup({ ...DEFAULT_GAME_CONFIG, wolfCount: 3, hasBabyWolf: true }, 12)).toEqual([
      { role: "queen_wolf", count: 1 },
      { role: "wolf", count: 2 },
      { role: "baby_wolf", count: 1 },
      { role: "courtesan", count: 1 },
      { role: "wizard", count: 1 },
      { role: "seer", count: 1 },
      { role: "villager", count: 5 },
    ])
  })
})

// ===========================
// 3. NIGHT 1 — identify + act
// ===========================
describe("Night 1", () => {
  it("wakes the roles in order and they act like any other night", () => {
    let state = run(setupGame(), { type: "START_ROLE_CONFIG" }, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    state = playNight1(state, { guest: "liana", target: "ali", check: "maud" })
    expect(state.currentPhase).toEqual({ type: "night_results" })

    const night = state.nightEvents[0]
    expect(night.night).toBe(1)
    expect(night.courtesanGuest).toBe(idOf(state, "liana"))
    expect(night.wolfTarget).toBe(idOf(state, "ali"))
    expect(night.seerChecked).toBe(idOf(state, "maud"))
    expect(night.seerResult).toBe("wolf")
    expect(night.deaths).toEqual([{ playerId: idOf(state, "ali"), cause: "wolves" }])
    expect(byName(state, "ali").isAlive).toBe(false)
  })

  it("the Courtesan's guest is protected on Night 1 too", () => {
    let state = run(setupGame(), { type: "START_ROLE_CONFIG" }, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    state = playNight1(state, { guest: "ali", target: "ali" })
    expect(state.nightEvents[0].deaths).toHaveLength(0)
  })

  it("the Wizard can use potions on Night 1", () => {
    let state = run(setupGame(), { type: "START_ROLE_CONFIG" }, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    state = playNight1(state, { guest: "liana", target: "ali", save: "ali", kill: "maud" })
    expect(state.nightEvents[0].deaths).toEqual([{ playerId: idOf(state, "maud"), cause: "wizard" }])
    expect(state.wizardSavePotionUsed).toBe(true)
    expect(state.wizardKillPotionUsed).toBe(true)
  })

  it("everyone who didn't wake up becomes a Villager at dawn", () => {
    const state = buildGameWithRoles()
    expect(state.players.every((p) => p.role !== null)).toBe(true)
    expect(state.players.filter((p) => p.role === "villager").map((p) => p.name)).toEqual(["Ali", "Julia", "Liana"])
  })

  it("is followed by the night results, then Day 1", () => {
    const state = buildGameWithRoles()
    expect(state.currentPhase).toEqual({ type: "day_vote" })
    expect(state.currentDay).toBe(1)
    expect(state.nightEvents).toHaveLength(1)
  })

  it("asks for the Queen Wolf, then the other wolves, then the kill", () => {
    let state = run(setupGame(), { type: "SET_GAME_CONFIG", config: { ...DEFAULT_GAME_CONFIG, wolfCount: 3, hasCourtesan: false } })
    expect(getWolvesStep(state)).toBe("queen")
    state = run(state, { type: "ASSIGN_ROLE", playerId: idOf(state, "josie"), role: "queen_wolf" })
    expect(getWolvesStep(state)).toBe("pack")
    state = run(state, { type: "ASSIGN_WOLVES", playerIds: [idOf(state, "maud"), idOf(state, "liana")] })
    expect(getWolvesStep(state)).toBe("attack")
  })

  it("skips the pack step when the Queen is the only wolf", () => {
    let state = run(setupGame(), {
      type: "SET_GAME_CONFIG",
      config: { ...DEFAULT_GAME_CONFIG, wolfCount: 1, hasCourtesan: false },
    })
    state = run(state, { type: "ASSIGN_ROLE", playerId: idOf(state, "josie"), role: "queen_wolf" })
    expect(getWolvesStep(state)).toBe("attack")
  })

  it("wakes the Baby Wolf only on Night 1", () => {
    const config = { ...DEFAULT_GAME_CONFIG, hasBabyWolf: true }
    expect(getNightSteps({ gameConfig: config, currentNight: 1 })).toEqual([
      "night_courtesan",
      "night_baby_wolf",
      "night_wolves",
      "night_wizard",
      "night_seer",
    ])
    expect(getNightSteps({ gameConfig: config, currentNight: 2 })).not.toContain("night_baby_wolf")

    let state = run(setupGame(), { type: "SET_GAME_CONFIG", config })
    state = playNight1(state, { guest: "liana", target: "liana" })
    expect(state.babyWolfPlayerId).toBe(idOf(state, "julia"))
    expect(byName(state, "julia").role).toBe("baby_wolf")
  })

  it("keeps a role unique when it's identified again", () => {
    let state = run(setupGame(), { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    state = run(
      state,
      { type: "ASSIGN_ROLE", playerId: idOf(state, "G"), role: "courtesan" },
      { type: "ASSIGN_ROLE", playerId: idOf(state, "ali"), role: "courtesan" },
    )
    expect(state.players.filter((p) => p.role === "courtesan").map((p) => p.name)).toEqual(["Ali"])
  })

  it("works with wolves only", () => {
    let state = run(setupGame(["A", "B", "C", "D", "E", "F"]), {
      type: "SET_GAME_CONFIG",
      config: { wolfCount: 2, hasQueenWolf: false, hasBabyWolf: false, hasCourtesan: false, hasWizard: false, hasSeer: false },
    })
    expect(state.currentPhase).toEqual({ type: "night_wolves" })
    state = run(
      state,
      { type: "ASSIGN_WOLVES", playerIds: [idOf(state, "A"), idOf(state, "B")] },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "C") },
    )
    expect(state.currentPhase).toEqual({ type: "night_results" })
    expect(state.players.filter((p) => p.role === "wolf")).toHaveLength(2)
    expect(state.players.filter((p) => p.role === "villager")).toHaveLength(4)
    expect(byName(state, "C").isAlive).toBe(false)
  })
})

// ===========================
// 4. SEER
// ===========================
describe("Seer", () => {
  function atSeer(): GameState {
    let state = run(setupGame(), { type: "SET_GAME_CONFIG", config: { ...DEFAULT_GAME_CONFIG, hasBabyWolf: true } })
    state = run(
      state,
      { type: "ASSIGN_ROLE", playerId: idOf(state, "G"), role: "courtesan" },
      { type: "SET_COURTESAN_GUEST", playerId: idOf(state, "liana") },
      { type: "IDENTIFY_BABY_WOLF", playerId: idOf(state, "julia") },
      { type: "ASSIGN_ROLE", playerId: idOf(state, "josie"), role: "queen_wolf" },
      { type: "ASSIGN_WOLVES", playerIds: [idOf(state, "maud")] },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "liana") },
      { type: "ASSIGN_ROLE", playerId: idOf(state, "ha"), role: "wizard" },
      { type: "WIZARD_DECIDE", saveId: null, killId: null },
      { type: "ASSIGN_ROLE", playerId: idOf(state, "chris"), role: "seer" },
    )
    expect(state.currentPhase).toEqual({ type: "night_seer" })
    return state
  }

  it("sees a regular wolf as a wolf", () => {
    const state = atSeer()
    expect(run(state, { type: "SET_SEER_CHECK", playerId: idOf(state, "maud") }).currentNightEvent.seerResult).toBe("wolf")
  })

  it("sees the Queen Wolf as not a wolf", () => {
    const state = atSeer()
    expect(run(state, { type: "SET_SEER_CHECK", playerId: idOf(state, "josie") }).currentNightEvent.seerResult).toBe(
      "not_wolf",
    )
  })

  it("sees the Baby Wolf and unidentified players as not wolves", () => {
    const state = atSeer()
    expect(run(state, { type: "SET_SEER_CHECK", playerId: idOf(state, "julia") }).currentNightEvent.seerResult).toBe(
      "not_wolf",
    )
    expect(run(state, { type: "SET_SEER_CHECK", playerId: idOf(state, "ali") }).currentNightEvent.seerResult).toBe(
      "not_wolf",
    )
  })

  it("checks only one player per night", () => {
    let state = atSeer()
    state = run(state, { type: "SET_SEER_CHECK", playerId: idOf(state, "ali") })
    state = run(state, { type: "SET_SEER_CHECK", playerId: idOf(state, "maud") })
    expect(state.currentNightEvent.seerChecked).toBe(idOf(state, "ali"))
  })
})

// ===========================
// 5. DEATH RESOLUTION
// ===========================
describe("Death resolution", () => {
  function makePlayers(): Player[] {
    return [
      { id: "courtesan", name: "G", role: "courtesan", isAlive: true },
      { id: "wolf1", name: "josie", role: "queen_wolf", isAlive: true },
      { id: "wolf2", name: "maud", role: "wolf", isAlive: true },
      { id: "wizard", name: "ha", role: "wizard", isAlive: true },
      { id: "seer", name: "chris", role: "seer", isAlive: true },
      { id: "v1", name: "ali", role: "villager", isAlive: true },
      { id: "v2", name: "julia", role: "villager", isAlive: true },
      { id: "baby", name: "liana", role: "baby_wolf", isAlive: true },
    ]
  }

  it("a normal wolf attack kills the target", () => {
    expect(resolveDeaths(makePlayers(), { wolfTarget: "v1" }, null)).toEqual([{ playerId: "v1", cause: "wolves" }])
  })

  it("wolves attack the Courtesan's guest — nobody dies", () => {
    expect(resolveDeaths(makePlayers(), { courtesanGuest: "v1", wolfTarget: "v1" }, null)).toHaveLength(0)
  })

  it("wolves attack the Courtesan — she and her guest die", () => {
    const deaths = resolveDeaths(makePlayers(), { courtesanGuest: "v1", wolfTarget: "courtesan" }, null)
    expect(deaths).toEqual([
      { playerId: "courtesan", cause: "wolves" },
      { playerId: "v1", cause: "at_courtesan" },
    ])
  })

  it("wolves attack the Courtesan — a wolf guest survives", () => {
    const ids = resolveDeaths(makePlayers(), { courtesanGuest: "wolf1", wolfTarget: "courtesan" }, null).map(
      (d) => d.playerId,
    )
    expect(ids).toEqual(["courtesan"])
  })

  it("the Courtesan dies when she invites a wolf", () => {
    const deaths = resolveDeaths(makePlayers(), { courtesanGuest: "wolf1", wolfTarget: "v1" }, null)
    expect(deaths).toEqual([
      { playerId: "courtesan", cause: "invited_wolf" },
      { playerId: "v1", cause: "wolves" },
    ])
  })

  it("the Courtesan dies once when she invites a wolf and is attacked", () => {
    const deaths = resolveDeaths(makePlayers(), { courtesanGuest: "wolf2", wolfTarget: "courtesan" }, null)
    expect(deaths.filter((d) => d.playerId === "courtesan")).toHaveLength(1)
    expect(deaths.find((d) => d.playerId === "wolf2")).toBeUndefined()
  })

  it("the Wizard's save cancels a death", () => {
    expect(resolveDeaths(makePlayers(), { wolfTarget: "v1" }, "v1")).toHaveLength(0)
  })

  it("the Wizard can save the Courtesan from inviting a wolf", () => {
    const ids = resolveDeaths(makePlayers(), { courtesanGuest: "wolf1", wolfTarget: "v1" }, "courtesan").map(
      (d) => d.playerId,
    )
    expect(ids).toEqual(["v1"])
  })

  it("saving the attacked Courtesan saves her guest too", () => {
    expect(resolveDeaths(makePlayers(), { courtesanGuest: "v1", wolfTarget: "courtesan" }, "courtesan")).toHaveLength(0)
  })

  it("saving only the guest of the attacked Courtesan leaves her dying", () => {
    expect(resolveDeaths(makePlayers(), { courtesanGuest: "v1", wolfTarget: "courtesan" }, "v1")).toEqual([
      { playerId: "courtesan", cause: "wolves" },
    ])
  })

  it("the kill potion adds a death", () => {
    const deaths = resolveDeaths(makePlayers(), { wolfTarget: "v1", wizardKilled: "wolf1" }, null)
    expect(deaths).toEqual([
      { playerId: "v1", cause: "wolves" },
      { playerId: "wolf1", cause: "wizard" },
    ])
  })

  it("save and kill in the same night", () => {
    expect(resolveDeaths(makePlayers(), { wolfTarget: "v1", wizardKilled: "wolf2" }, "v1")).toEqual([
      { playerId: "wolf2", cause: "wizard" },
    ])
  })

  it("no wolf target — no deaths", () => {
    expect(resolveDeaths(makePlayers(), {}, null)).toHaveLength(0)
  })

  it("a player dies only once", () => {
    const deaths = resolveDeaths(makePlayers(), { wolfTarget: "v1", wizardKilled: "v1" }, null)
    expect(deaths.filter((d) => d.playerId === "v1")).toHaveLength(1)
  })

  it("a dead Courtesan doesn't protect or die", () => {
    const players = makePlayers().map((p) => (p.id === "courtesan" ? { ...p, isAlive: false } : p))
    expect(resolveDeaths(players, { courtesanGuest: "wolf1", wolfTarget: "v1" }, null)).toEqual([
      { playerId: "v1", cause: "wolves" },
    ])
  })

  it("the Baby Wolf survives a wolf attack", () => {
    expect(resolveDeaths(makePlayers(), { wolfTarget: "baby" }, null)).toHaveLength(0)
  })

  it("wolves attack the Courtesan with no guest — normal attack", () => {
    expect(resolveDeaths(makePlayers(), { wolfTarget: "courtesan" }, null)).toEqual([
      { playerId: "courtesan", cause: "wolves" },
    ])
  })

  it("lists who is in danger for the Wizard", () => {
    expect(getPlayersInDanger(makePlayers(), { courtesanGuest: "v2", wolfTarget: "courtesan", wizardKilled: "v1" })).toEqual([
      { playerId: "courtesan", cause: "wolves" },
      { playerId: "v2", cause: "at_courtesan" },
    ])
  })
})

// ===========================
// 6. NIGHT 2+ FLOW
// ===========================
describe("Night 2+ flow", () => {
  it("full config: courtesan → wolves → wizard → seer → results", () => {
    let state = run(buildGameWithRoles(), { type: "START_NEXT_NIGHT" })
    expect(state.currentPhase).toEqual({ type: "night_courtesan" })
    expect(state.currentNight).toBe(2)

    state = run(state, { type: "SET_COURTESAN_GUEST", playerId: idOf(state, "julia") })
    expect(state.currentPhase).toEqual({ type: "night_wolves" })
    expect(getWolvesStep(state)).toBe("attack")

    state = run(state, { type: "SET_WOLF_TARGET", playerId: idOf(state, "ali") })
    expect(state.currentPhase).toEqual({ type: "night_wizard" })

    state = run(state, { type: "WIZARD_DECIDE", saveId: null, killId: null })
    expect(state.currentPhase).toEqual({ type: "night_seer" })

    state = run(state, { type: "SKIP_TO_NEXT_PHASE" })
    expect(state.currentPhase).toEqual({ type: "night_results" })
    expect(byName(state, "ali").isAlive).toBe(false)
  })

  it("skips the steps of roles that aren't in play", () => {
    let state = run(buildGameWithRoles({ hasCourtesan: false, hasWizard: false }), { type: "START_NEXT_NIGHT" })
    expect(state.currentPhase).toEqual({ type: "night_wolves" })
    state = run(state, { type: "SET_WOLF_TARGET", playerId: idOf(state, "ali") })
    expect(state.currentPhase).toEqual({ type: "night_seer" })
  })

  it("dead roles are skipped with SKIP_TO_NEXT_PHASE", () => {
    let state = run(buildGameWithRoles(), { type: "START_NEXT_NIGHT" })
    state = run(state, { type: "SKIP_TO_NEXT_PHASE" })
    expect(state.currentPhase).toEqual({ type: "night_wolves" })
  })

  it("ignores a double tap on confirm", () => {
    let state = run(buildGameWithRoles(), { type: "START_NEXT_NIGHT" })
    state = run(state, { type: "SET_COURTESAN_GUEST", playerId: idOf(state, "julia") })
    state = run(state, { type: "SET_WOLF_TARGET", playerId: idOf(state, "ali") })
    const again = run(state, { type: "SET_WOLF_TARGET", playerId: idOf(state, "ali") })
    expect(again).toBe(state)
    expect(again.currentPhase).toEqual({ type: "night_wizard" })
  })

  it("SKIP_TO_NEXT_PHASE does nothing outside the night", () => {
    const state = buildGameWithRoles()
    expect(run(state, { type: "SKIP_TO_NEXT_PHASE" })).toBe(state)
  })

  it("resets the night's choices after dawn", () => {
    let state = run(buildGameWithRoles(), { type: "START_NEXT_NIGHT" })
    state = run(
      state,
      { type: "SET_COURTESAN_GUEST", playerId: idOf(state, "ali") },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "julia") },
      { type: "WIZARD_DECIDE", saveId: null, killId: null },
      { type: "SKIP_TO_NEXT_PHASE" },
    )
    expect(state.currentNightEvent).toEqual({})
    expect(state.lastCourtesanGuest).toBe(idOf(state, "ali"))
  })

  it("forgets the last guest when the Courtesan was skipped", () => {
    let state = run(buildGameWithRoles(), { type: "START_NEXT_NIGHT" })
    state = run(
      state,
      { type: "SKIP_TO_NEXT_PHASE" },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "julia") },
      { type: "WIZARD_DECIDE", saveId: null, killId: null },
      { type: "SKIP_TO_NEXT_PHASE" },
    )
    expect(state.lastCourtesanGuest).toBeNull()
  })
})

// ===========================
// 7. WIZARD POTIONS
// ===========================
describe("Wizard potions", () => {
  function atWizard(state: GameState): GameState {
    let s = run(state, { type: "START_NEXT_NIGHT" })
    s = run(s, { type: "SET_COURTESAN_GUEST", playerId: idOf(s, "julia") }, { type: "SET_WOLF_TARGET", playerId: idOf(s, "ali") })
    expect(s.currentPhase).toEqual({ type: "night_wizard" })
    return s
  }

  it("marks used potions and can't use them twice", () => {
    let state = atWizard(buildGameWithRoles())
    state = run(state, { type: "WIZARD_DECIDE", saveId: idOf(state, "ali"), killId: null })
    expect(state.wizardSavePotionUsed).toBe(true)
    expect(state.wizardKillPotionUsed).toBe(false)
    state = run(state, { type: "SKIP_TO_NEXT_PHASE" }, { type: "START_DAY" })
    expect(byName(state, "ali").isAlive).toBe(true)

    state = atWizard(state)
    state = run(state, { type: "WIZARD_DECIDE", saveId: idOf(state, "ali"), killId: idOf(state, "maud") })
    expect(state.currentNightEvent.wizardSaved).toBeNull()
    expect(state.currentNightEvent.wizardKilled).toBe(idOf(state, "maud"))
    state = run(state, { type: "SKIP_TO_NEXT_PHASE" })
    expect(byName(state, "ali").isAlive).toBe(false)
    expect(byName(state, "maud").isAlive).toBe(false)
  })
})

// ===========================
// 8. DAY VOTE
// ===========================
describe("Day vote", () => {
  it("eliminates a player and reveals their role", () => {
    let state = buildGameWithRoles()
    state = run(state, { type: "ELIMINATE_PLAYER", playerId: idOf(state, "julia") })
    expect(byName(state, "julia").isAlive).toBe(false)
    expect(state.dayEvents).toEqual([{ day: 1, eliminated: idOf(state, "julia"), revealedRole: "villager" }])
    expect(state.currentPhase).toEqual({ type: "day_vote" })
  })

  it("can skip the elimination and go to the next night", () => {
    let state = run(buildGameWithRoles(), { type: "SKIP_ELIMINATION" })
    expect(state.dayEvents).toEqual([{ day: 1, eliminated: null, revealedRole: null }])
    expect(state.currentNight).toBe(2)
    expect(state.currentPhase).toEqual({ type: "night_courtesan" })
  })

  it("can't eliminate a dead player", () => {
    let state = buildGameWithRoles()
    state = run(state, { type: "ELIMINATE_PLAYER", playerId: idOf(state, "julia") })
    expect(run(state, { type: "ELIMINATE_PLAYER", playerId: idOf(state, "julia") })).toBe(state)
  })
})

// ===========================
// 9. WIN CONDITIONS
// ===========================
describe("Win conditions", () => {
  it("the village wins when every wolf is dead", () => {
    let state = buildGameWithRoles()
    state = run(
      state,
      { type: "ELIMINATE_PLAYER", playerId: idOf(state, "josie") },
      { type: "ELIMINATE_PLAYER", playerId: idOf(state, "maud") },
    )
    expect(state.currentPhase).toEqual({ type: "game_over", winner: "village" })
  })

  it("the wolves win when they equal the others", () => {
    let state = buildGameWithRoles()
    for (const name of ["ali", "julia", "liana", "G"]) {
      state = run(state, { type: "ELIMINATE_PLAYER", playerId: idOf(state, name) })
    }
    expect(state.currentPhase).toEqual({ type: "game_over", winner: "wolves" })
  })

  it("the wolves can win on Night 1", () => {
    let state = run(setupGame(["A", "B", "C", "D", "E"]), {
      type: "SET_GAME_CONFIG",
      config: { wolfCount: 2, hasQueenWolf: false, hasBabyWolf: false, hasCourtesan: false, hasWizard: false, hasSeer: false },
    })
    state = run(
      state,
      { type: "ASSIGN_WOLVES", playerIds: [idOf(state, "A"), idOf(state, "B")] },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "C") },
    )
    // 2 wolves vs 3 others before the kill, 2 vs 2 after
    expect(state.currentPhase).toEqual({ type: "game_over", winner: "wolves" })
  })
})

// ===========================
// 10. BABY WOLF
// ===========================
describe("Baby Wolf", () => {
  function nightTwoAttack(target: string, guest: string, kill?: string): GameState {
    let state = buildGameWithRoles({ hasBabyWolf: true })
    state = run(state, { type: "START_NEXT_NIGHT" })
    state = run(
      state,
      { type: "SET_COURTESAN_GUEST", playerId: idOf(state, guest) },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, target) },
      { type: "WIZARD_DECIDE", saveId: null, killId: kill ? idOf(state, kill) : null },
      { type: "SKIP_TO_NEXT_PHASE" },
    )
    return state
  }

  it("survives the bite and joins the pack the next night", () => {
    let state = nightTwoAttack("julia", "ali")
    expect(byName(state, "julia").isAlive).toBe(true)
    expect(state.babyWolfTransformNight).toBe(3)
    state = run(state, { type: "START_DAY" }, { type: "START_NEXT_NIGHT" })
    expect(byName(state, "julia").role).toBe("wolf")
    expect(isWolf(byName(state, "julia").role)).toBe(true)
  })

  it("doesn't transform when the Courtesan protects them", () => {
    const state = nightTwoAttack("julia", "julia")
    expect(state.babyWolfTransformNight).toBeNull()
  })

  it("doesn't transform when the Wizard kills them", () => {
    const state = nightTwoAttack("julia", "ali", "julia")
    expect(byName(state, "julia").isAlive).toBe(false)
    expect(state.babyWolfTransformNight).toBeNull()
  })
})

// ===========================
// 11. NEW GAME, UNDO & SETTINGS
// ===========================
describe("New game & settings", () => {
  it("NEW_GAME keeps the players, the role setup and settings", () => {
    const config: GameConfig = { ...DEFAULT_GAME_CONFIG, wolfCount: 3, hasWizard: false }
    let state = buildGameWithRoles(config)
    state = run(state, { type: "SET_ROLE_NAMES", roleNames: { wolf: "Werewolf" } }, { type: "SET_TIMER_MINUTES", minutes: 5 })
    const names = state.players.map((p) => p.name)

    state = run(state, { type: "NEW_GAME" })
    expect(state.currentPhase).toEqual({ type: "setup" })
    expect(state.players.map((p) => p.name)).toEqual(names)
    expect(state.players.every((p) => p.role === null && p.isAlive)).toBe(true)
    expect(state.nightEvents).toHaveLength(0)
    expect(state.gameConfig).toEqual(config)
    expect(state.roleNames).toEqual({ wolf: "Werewolf" })
    expect(state.timerMinutes).toBe(5)
    expect(state.savedNames).toHaveLength(names.length)
  })

  it("starting a new game clears the previous game's roles and events", () => {
    let state = run(buildGameWithRoles(), { type: "NEW_GAME" }, { type: "START_ROLE_CONFIG" })
    state = run(state, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    expect(state.currentNight).toBe(1)
    expect(state.wizardSavePotionUsed).toBe(false)
    expect(state.players.every((p) => p.role === null)).toBe(true)
  })

  it("undo keeps the current settings", () => {
    const before = buildGameWithRoles()
    const current = run(before, { type: "SET_ROLE_NAMES", roleNames: { seer: "Oracle" } })
    expect(keepSettings(before, current).roleNames).toEqual({ seer: "Oracle" })
  })

  it("clamps the timer", () => {
    expect(run(createInitialState(), { type: "SET_TIMER_MINUTES", minutes: 99 }).timerMinutes).toBe(15)
    expect(run(createInitialState(), { type: "SET_TIMER_MINUTES", minutes: 0 }).timerMinutes).toBe(1)
  })
})

// ===========================
// 12. STORAGE
// ===========================
describe("Storage", () => {
  it("restores a saved game", () => {
    const state = buildGameWithRoles()
    expect(sanitizeState(JSON.parse(JSON.stringify(state)))).toEqual(state)
  })

  it("rejects garbage", () => {
    expect(sanitizeState(null)).toBeNull()
    expect(sanitizeState({ players: "nope" })).toBeNull()
    expect(sanitizeState([])).toBeNull()
  })

  it("keeps the names of a game it can't resume", () => {
    const old = {
      players: [{ id: "a", name: "Ana", role: "seer", isAlive: false }],
      currentPhase: { type: "night_role_discovery", step: 2 },
      nightEvents: [],
      dayEvents: [],
    }
    const state = sanitizeState(old)!
    expect(state.currentPhase).toEqual({ type: "setup" })
    expect(state.players).toEqual([{ id: "a", name: "Ana", role: null, isAlive: true }])
  })

  it("imports names and settings handed over by the old site", () => {
    const hash = `#import=${encodeURIComponent(
      JSON.stringify({ names: ["ana", "Ben"], roleNames: { wolf: "Loup" }, timerMinutes: 4, gameConfig: { wolfCount: 3 } }),
    )}`
    const payload = readImportFromHash(hash)!
    const state = applyImport(createInitialState(), payload, true)
    expect(state.players.map((p) => p.name)).toEqual(["Ana", "Ben"])
    expect(state.savedNames).toEqual(["Ben", "Ana"])
    expect(state.roleNames).toEqual({ wolf: "Loup" })
    expect(state.timerMinutes).toBe(4)
    expect(state.gameConfig.wolfCount).toBe(3)
  })

  it("an import never touches a game in progress", () => {
    const game = buildGameWithRoles()
    const state = applyImport(game, { names: ["Zed"], timerMinutes: 9 }, false)
    expect(state.players).toEqual(game.players)
    expect(state.savedNames[0]).toBe("Zed")
    expect(state.timerMinutes).toBe(game.timerMinutes)
  })

  it("an older address hands over its whole game on the first visit", () => {
    const game = buildGameWithRoles()
    const payload = readImportFromHash(`#import=${encodeURIComponent(JSON.stringify({ v: 2, state: game }))}`)!
    expect(applyImport(createInitialState(), payload, true)).toEqual(game)
  })

  it("an older address only adds names when this one already has a game", () => {
    const here = run(setupGame(["Zed", "Yan"]), { type: "SET_ROLE_NAMES", roleNames: { seer: "Oracle" } })
    const there = buildGameWithRoles()
    const state = applyImport(here, { v: 2, state: there } as never, false)
    expect(state.players.map((p) => p.name)).toEqual(["Zed", "Yan"])
    expect(state.roleNames).toEqual({ seer: "Oracle" })
    for (const name of ["Ali", "Maud", "Zed"]) expect(state.savedNames).toContain(name)
    expect(new Set(state.savedNames.map((n) => n.toLowerCase())).size).toBe(state.savedNames.length)
  })

  it("ignores broken import hashes", () => {
    expect(readImportFromHash("#import=%7Bbroken")).toBeNull()
    expect(readImportFromHash("#rules")).toBeNull()
  })
})

// ===========================
// 13. ROLE NAMES
// ===========================
describe("Role names", () => {
  it("pluralizes custom names", () => {
    expect(pluralize("Wolf")).toBe("Wolves")
    expect(pluralize("Werewolf")).toBe("Werewolves")
    expect(pluralize("Seer")).toBe("Seers")
    expect(pluralize("Loup")).toBe("Loups")
    expect(rolePlural("wolf", {})).toBe("Wolves")
    expect(rolePlural("wolf", { wolf: "Lycan" })).toBe("Lycans")
  })
})

// ===========================
// 14. INSTALL
// ===========================
describe("Install", () => {
  it("knows how each phone browser installs the app", () => {
    const firefoxAndroid = "Mozilla/5.0 (Android 15; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0"
    const chromeAndroid =
      "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
    const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
    expect(detectPlatform(firefoxAndroid, 5)).toBe("firefox-android")
    expect(detectPlatform(chromeAndroid, 5)).toBe("android")
    expect(detectPlatform(iphone, 5)).toBe("ios")
    expect(detectPlatform(mac, 5)).toBe("ios") // an iPad asking for the desktop site
    expect(detectPlatform(mac, 0)).toBe("desktop")
  })
})

// ===========================
// 15. TIMELINE
// ===========================
describe("Timeline", () => {
  function summary(state: GameState) {
    return getTimeline(state).map((c) => [c.kind, c.number, c.now])
  }

  it("is empty before the game starts", () => {
    expect(getTimeline(setupGame())).toEqual([])
  })

  it("lists every night and day so far, oldest first", () => {
    let state = buildGameWithRoles()
    state = run(state, { type: "ELIMINATE_PLAYER", playerId: idOf(state, "julia") }, { type: "START_NEXT_NIGHT" })
    state = run(
      state,
      { type: "SET_COURTESAN_GUEST", playerId: idOf(state, "ali") },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "liana") },
      { type: "WIZARD_DECIDE", saveId: null, killId: null },
      { type: "SKIP_TO_NEXT_PHASE" },
      { type: "START_DAY" },
    )
    expect(summary(state)).toEqual([
      ["night", 1, false],
      ["day", 1, false],
      ["night", 2, false],
      ["day", 2, true],
    ])
    const [, day1, night2] = getTimeline(state)
    expect(day1).toMatchObject({ events: [{ eliminated: idOf(state, "julia"), revealedRole: "villager" }] })
    expect(night2).toMatchObject({
      event: { courtesanGuest: idOf(state, "ali"), deaths: [{ playerId: idOf(state, "liana"), cause: "wolves" }] },
    })
  })

  it("shows the night being played with what happened so far", () => {
    let state = run(buildGameWithRoles(), { type: "SKIP_ELIMINATION" })
    state = run(
      state,
      { type: "SET_COURTESAN_GUEST", playerId: idOf(state, "ali") },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "liana") },
    )
    expect(summary(state)).toEqual([
      ["night", 1, false],
      ["day", 1, false],
      ["night", 2, true],
    ])
    expect(getTimeline(state)[2]).toMatchObject({
      event: { courtesanGuest: idOf(state, "ali"), wolfTarget: idOf(state, "liana") },
    })
  })

  it("keeps a day nobody was voted out", () => {
    const state = run(buildGameWithRoles(), { type: "SKIP_ELIMINATION" })
    expect(getTimeline(state)[1]).toEqual({
      kind: "day",
      number: 1,
      events: [{ day: 1, eliminated: null, revealedRole: null }],
      now: false,
    })
  })

  it("the day stops being now once someone is voted out", () => {
    let state = buildGameWithRoles()
    expect(getTimeline(state).at(-1)).toMatchObject({ kind: "day", number: 1, now: true, events: [] })
    state = run(state, { type: "ELIMINATE_PLAYER", playerId: idOf(state, "julia") })
    expect(state.currentPhase).toEqual({ type: "day_vote" })
    expect(getTimeline(state).at(-1)).toMatchObject({ kind: "day", number: 1, now: false })
  })

  it("ends with the night the wolves won", () => {
    let state = run(setupGame(["A", "B", "C", "D", "E"]), {
      type: "SET_GAME_CONFIG",
      config: { wolfCount: 2, hasQueenWolf: false, hasBabyWolf: false, hasCourtesan: false, hasWizard: false, hasSeer: false },
    })
    state = run(
      state,
      { type: "ASSIGN_WOLVES", playerIds: [idOf(state, "A"), idOf(state, "B")] },
      { type: "SET_WOLF_TARGET", playerId: idOf(state, "C") },
    )
    expect(state.currentPhase.type).toBe("game_over")
    expect(summary(state)).toEqual([["night", 1, false]])
  })
})

// ===========================
// 16. GAME MASTER
// ===========================
describe("Game master", () => {
  function names(state: GameState): string[] {
    return state.players.map((p) => p.name)
  }

  it("a game master from the players leaves them and gets no card", () => {
    const state = run(setupGame(["Ana", "Ben", "Gus"]), { type: "SET_GAME_MASTER", name: "gus" })
    expect(state.gameMaster).toBe("Gus")
    expect(names(state)).toEqual(["Ana", "Ben"])
  })

  it("a new game master swaps in whoever ran the last game as a player", () => {
    let state = run(setupGame(["Ana", "Ben", "Gus"]), { type: "SET_GAME_MASTER", name: "Gourav" })
    expect(names(state)).toEqual(["Ana", "Ben", "Gus"])
    expect(state.savedNames[0]).toBe("Gourav")
    state = run(state, { type: "SET_GAME_MASTER", name: "Gus" })
    expect(state.gameMaster).toBe("Gus")
    expect(names(state)).toEqual(["Ana", "Ben", "Gourav"])
  })

  it("picking the same game master again changes nothing", () => {
    const state = run(setupGame(["Ana", "Ben"]), { type: "SET_GAME_MASTER", name: "Gourav" })
    expect(run(state, { type: "SET_GAME_MASTER", name: "gourav" })).toBe(state)
    expect(run(state, { type: "SET_GAME_MASTER", name: "  " })).toBe(state)
  })

  it("a game master who joins the players stops being the game master", () => {
    let state = run(setupGame(["Ana", "Ben"]), { type: "SET_GAME_MASTER", name: "Gourav" })
    state = run(state, { type: "ADD_PLAYERS", names: ["gourav"] })
    expect(state.gameMaster).toBeNull()
    expect(names(state)).toEqual(["Ana", "Ben", "Gourav"])
  })

  it("stays for the next game, and only changes before roles are dealt", () => {
    let state = run(setupGame(), { type: "SET_GAME_MASTER", name: "Gourav" }, { type: "START_ROLE_CONFIG" })
    expect(run(state, { type: "SET_GAME_MASTER", name: "Ali" })).toBe(state)
    state = run(state, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    expect(run(state, { type: "SET_GAME_MASTER", name: "Ali" })).toBe(state)
    state = run(state, { type: "NEW_GAME" })
    expect(state.gameMaster).toBe("Gourav")
    expect(names(state)).toEqual(NAMES.map((n) => n.charAt(0).toUpperCase() + n.slice(1)))
  })

  it("is restored from storage, and missing in older saves", () => {
    const state = run(setupGame(["Ana", "Ben"]), { type: "SET_GAME_MASTER", name: "Gourav" })
    expect(sanitizeState(JSON.parse(JSON.stringify(state)))!.gameMaster).toBe("Gourav")
    const { gameMaster: _, ...older } = state
    expect(sanitizeState(older)!.gameMaster).toBeNull()
    expect(sanitizeState({ ...state, gameMaster: 42 })!.gameMaster).toBeNull()
  })
})

// ===========================
// 17. HAND-OVER TO ANOTHER PHONE
// ===========================
describe("Hand-over", () => {
  function names(state: GameState): string[] {
    return state.players.map((p) => p.name)
  }

  // What the other phone ends up with after opening this phone's link
  function handedOver(from: GameState, to: GameState = createInitialState()): GameState {
    const link = handOverLink(from)
    return applyHandOver(to, readHandOver(link.slice(link.indexOf("#")))!)
  }

  it("makes a short, readable link", () => {
    const state = run(setupGame(["Ana", "Ben"]), { type: "SET_GAME_MASTER", name: "Gourav" })
    expect(handOverLink(state)).toBe("https://werewolf.gourav.io/#players=Ana,Ben&gm=Gourav&roles=2qcws&t=3")
  })

  it("sends the players, the game master, the roles, the card names and the timer", () => {
    const config: GameConfig = { ...DEFAULT_GAME_CONFIG, wolfCount: 3, hasBabyWolf: true, hasWizard: false }
    const from: GameState = {
      ...run(setupGame(["Ana", "Ben", "Cleo", "Dev", "Eli"]), { type: "SET_GAME_MASTER", name: "Gourav" }),
      gameConfig: config,
      roleNames: { wolf: "Loup", seer: "Oracle" },
      timerMinutes: 5,
    }
    const to = handedOver(from)
    expect(to.currentPhase).toEqual({ type: "setup" })
    expect(names(to)).toEqual(["Ana", "Ben", "Cleo", "Dev", "Eli"])
    expect(to.gameMaster).toBe("Gourav")
    expect(to.gameConfig).toEqual(config)
    expect(to.roleNames).toEqual({ wolf: "Loup", seer: "Oracle" })
    expect(to.timerMinutes).toBe(5)
  })

  it("the new game master picks themselves and the last one plays", () => {
    const from = run(setupGame(["Ana", "Ben", "Gus"]), { type: "SET_GAME_MASTER", name: "Gourav" })
    const to = run(handedOver(from), { type: "SET_GAME_MASTER", name: "Gus" })
    expect(to.gameMaster).toBe("Gus")
    expect(names(to)).toEqual(["Ana", "Ben", "Gourav"])
  })

  it("keeps unusual names intact", () => {
    const odd = ["Zoë", "李雷", "สมชาย", "Ana B", "R&D", "50% Sam", "Mo#1", "Lou+1", "Al=1", "Jo:Jo"]
    expect(names(handedOver(setupGame(odd)))).toEqual(odd)
  })

  it("replaces a game in progress and remembers this phone's names", () => {
    const to = handedOver(setupGame(["Zed", "Yan"]), buildGameWithRoles())
    expect(to.currentPhase).toEqual({ type: "setup" })
    expect(names(to)).toEqual(["Zed", "Yan"])
    for (const name of ["Ali", "Maud", "Zed"]) expect(to.savedNames).toContain(name)
  })

  it("keeps this phone's card names when the other one uses the standard ones", () => {
    const here = run(createInitialState(), { type: "SET_ROLE_NAMES", roleNames: { seer: "Oracle" } })
    expect(handedOver(setupGame(["Zed"]), here).roleNames).toEqual({ seer: "Oracle" })
  })

  it("ignores links it didn't make and repairs odd values", () => {
    expect(readHandOver("#players=")).toBeNull()
    expect(readHandOver("#players=%E0%A4")).toBeNull()
    expect(readHandOver("#rules")).toBeNull()
    expect(readHandOver("#players=Ana,,Ben&roles=zz&t=99")).toMatchObject({
      players: ["Ana", "Ben"],
      gameMaster: null,
      gameConfig: DEFAULT_GAME_CONFIG,
      timerMinutes: 15,
    })
  })
})
