import { describe, expect, it } from "vitest"
import { createInitialState, gameReducer } from "../src/game/reducer"
import type { AskedRole, NightRole } from "../src/game/script"
import {
  closeEyes,
  dawnLines,
  dayLines,
  killQuestion,
  nightQuestion,
  nightfallLine,
  noPotionsLine,
  openEyes,
  saveQuestion,
  votedOutLine,
  winnerLine,
} from "../src/game/script"
import { sanitizeState } from "../src/game/storage"
import type { Death, GameState, RoleNames } from "../src/game/types"
import { DEFAULT_GAME_CONFIG } from "../src/game/types"

const NIGHT_ROLES: NightRole[] = ["courtesan", "queen_wolf", "baby_wolf", "wolf", "wizard", "seer"]
const ASKED_ROLES: AskedRole[] = ["courtesan", "wolf", "seer"]
// How the game master calls each role with the standard card names
const CALLED: Record<NightRole, string> = {
  courtesan: "Prostitute",
  queen_wolf: "Queen Wolf",
  baby_wolf: "Baby Wolf",
  wolf: "Wolves",
  wizard: "Wizard",
  seer: "Seer",
}
const BOTH_DIED: Death[] = [
  { playerId: "a", cause: "wolves" },
  { playerId: "b", cause: "wizard" },
]

type Read = (state: GameState) => string

// A game with this seed on night (and day) `round`
function game(seed: number, round: number, roleNames: RoleNames = {}): GameState {
  return {
    ...createInitialState(),
    players: [
      { id: "a", name: "Ana", role: "seer", isAlive: false },
      { id: "b", name: "Ben", role: "villager", isAlive: false },
    ],
    scriptSeed: seed,
    currentNight: round,
    currentDay: round,
    roleNames,
  }
}

// Every wording of a line, found by reading it on many nights of many games
function everyWording(read: Read, roleNames: RoleNames = {}): string[] {
  const seen = new Set<string>()
  for (let seed = 0; seed < 50; seed++) {
    for (let round = 1; round <= 10; round++) seen.add(read(game(seed, round, roleNames)))
  }
  return [...seen]
}

// The wordings one game reads on its first nights
function firstNights(read: Read, seed: number, nights: number): string[] {
  return Array.from({ length: nights }, (_, i) => read(game(seed, i + 1)))
}

function everyLine(): Read[] {
  return [
    nightfallLine,
    ...NIGHT_ROLES.map((role): Read => (s) => openEyes(s, role)),
    ...NIGHT_ROLES.map((role): Read => (s) => closeEyes(s, role)),
    ...ASKED_ROLES.map((role): Read => (s) => nightQuestion(s, role)),
    (s) => saveQuestion(s, 0),
    (s) => saveQuestion(s, 1),
    (s) => saveQuestion(s, 2),
    killQuestion,
    noPotionsLine,
    (s) => dawnLines(s, [])[0],
    (s) => dawnLines(s, [])[1],
    (s) => dawnLines(s, BOTH_DIED)[1],
    (s) => dayLines(s)[0],
    (s) => dayLines(s)[1],
    (s) => votedOutLine(s, "Ana"),
    (s) => winnerLine(s, "village"),
    (s) => winnerLine(s, "wolves"),
  ]
}

describe("Script", () => {
  it("every wording calls the role by name and says open or close your eyes", () => {
    for (const role of NIGHT_ROLES) {
      for (const line of everyWording((s) => openEyes(s, role))) {
        expect(line).toContain(CALLED[role])
        expect(line.toLowerCase()).toContain("open your eyes")
      }
      for (const line of everyWording((s) => closeEyes(s, role))) {
        expect(line).toContain(CALLED[role])
        expect(line.toLowerCase()).toContain("close your eyes")
      }
    }
    for (const role of ASKED_ROLES) {
      for (const line of everyWording((s) => nightQuestion(s, role))) expect(line).toContain(CALLED[role])
    }
    for (const line of everyWording(noPotionsLine)) expect(line).toContain("Wizard")
  })

  it("every wording keeps the cue everyone listens for", () => {
    for (const line of everyWording(nightfallLine)) expect(line).toContain("Everyone, close your eyes")
    for (const line of everyWording((s) => dawnLines(s, [])[0])) expect(line).toContain("Everyone, open your eyes")
    for (const line of everyWording((s) => dawnLines(s, BOTH_DIED)[1])) expect(line).toContain("Ana and Ben")
    for (const line of everyWording((s) => votedOutLine(s, "Ana"))) expect(line).toContain("Ana")
    // The game master points at whoever is dying
    for (const line of everyWording((s) => saveQuestion(s, 1))) expect(line.toLowerCase()).toContain("this person")
    for (const line of everyWording((s) => saveQuestion(s, 2))) expect(line.toLowerCase()).toContain("these people")
    for (const line of everyWording((s) => winnerLine(s, "village"))) expect(line).toMatch(/^The village wins!/)
    for (const line of everyWording((s) => winnerLine(s, "wolves"))) expect(line).toMatch(/^The wolves win!/)
  })

  it("every wording is a whole sentence, with nothing left to fill in", () => {
    for (const read of everyLine()) {
      for (const line of everyWording(read)) {
        expect(line).not.toMatch(/[{}]|undefined| {2}|^\s|\s$/)
        expect(line).toMatch(/^[A-Z].*[.?!]$/)
      }
    }
  })

  it("has a few wordings for every line", () => {
    for (const read of everyLine()) expect(everyWording(read).length).toBeGreaterThanOrEqual(3)
  })

  it("reads a different wording each night until it has read them all", () => {
    const reads: Read[] = [nightfallLine, (s) => nightQuestion(s, "seer"), (s) => dayLines(s)[0], (s) => dawnLines(s, [])[0]]
    for (const read of reads) {
      const count = everyWording(read).length
      for (const seed of [1, 2, 3]) {
        const nights = firstNights(read, seed, count)
        expect(new Set(nights).size).toBe(count)
        // Then it starts over in the same order
        expect(read(game(seed, count + 1))).toBe(nights[0])
      }
    }
  })

  it("a role hears a different wording on each of its first nights", () => {
    for (const role of NIGHT_ROLES) {
      for (const seed of [1, 2, 3, 4, 5]) {
        expect(new Set(firstNights((s) => openEyes(s, role), seed, 6)).size).toBe(6)
        expect(new Set(firstNights((s) => closeEyes(s, role), seed, 6)).size).toBe(6)
      }
    }
  })

  it("no two roles hear the same wording on the same night", () => {
    for (let seed = 0; seed < 20; seed++) {
      for (let night = 1; night <= 12; night++) {
        const state = game(seed, night)
        for (const read of [openEyes, closeEyes]) {
          const wordings = NIGHT_ROLES.map((role) => read(state, role).replace(CALLED[role], "{role}"))
          expect(new Set(wordings).size).toBe(NIGHT_ROLES.length)
        }
      }
    }
  })

  it("each game reads them in its own order", () => {
    expect(firstNights(nightfallLine, 1, 5)).not.toEqual(firstNights(nightfallLine, 2, 5))
    const setup = gameReducer(createInitialState(), { type: "ADD_PLAYERS", names: ["A", "B", "C", "D", "E"] })
    const one = gameReducer(setup, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    const two = gameReducer(setup, { type: "SET_GAME_CONFIG", config: DEFAULT_GAME_CONFIG })
    expect(one.scriptSeed).not.toBe(two.scriptSeed)
  })

  it("reads the same wording after a reload, even from a save older than the wordings", () => {
    const state = game(123456, 3)
    const reloaded = sanitizeState(JSON.parse(JSON.stringify(state)))!
    for (const read of everyLine()) expect(read(reloaded)).toBe(read(state))

    const { scriptSeed: _, ...older } = state
    const first = sanitizeState(older)!
    const again = sanitizeState(older)!
    for (const read of everyLine()) expect(read(again)).toBe(read(first))
  })

  it("uses what the cards are called", () => {
    const roleNames: RoleNames = { wolf: "Loup", seer: "Oracle", wizard: "Witch" }
    for (const line of everyWording((s) => openEyes(s, "wolf"), roleNames)) expect(line).toContain("Loups")
    for (const line of everyWording((s) => nightQuestion(s, "seer"), roleNames)) expect(line).toContain("Oracle")
    for (const line of everyWording(noPotionsLine, roleNames)) expect(line).toContain("Witch")
    for (const line of everyWording((s) => winnerLine(s, "wolves"), roleNames)) expect(line).toMatch(/^The loups win!/)

    const talk = [...everyWording((s) => dayLines(s)[0], roleNames), ...everyWording((s) => winnerLine(s, "village"), roleNames)]
    expect(talk.some((line) => line.includes("loup"))).toBe(true)
    for (const line of talk) expect(line).not.toMatch(/wol(f|ves)/i)
  })
})
