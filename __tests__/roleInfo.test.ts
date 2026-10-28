import { describe, expect, it } from "vitest"
import { ROLE_ORDER } from "../src/game/roles"
import { roleInfo } from "../src/game/roleInfo"
import type { RoleNames } from "../src/game/types"

// Every card renamed, like a group playing with their own deck
const RENAMED: RoleNames = {
  wolf: "Loup",
  queen_wolf: "Reine",
  baby_wolf: "Louveteau",
  courtesan: "Hôtesse",
  wizard: "Sorcière",
  seer: "Voyante",
  villager: "Paysan",
}

function everyLine(rn: RoleNames): string[] {
  return ROLE_ORDER.flatMap((role) => {
    const info = roleInfo(role, rn)
    const player = [info.player.does, ...info.player.rules, info.player.tip]
    return [info.blurb, info.summary, info.wakes, info.goal, ...info.details, ...player]
  })
}

describe("Role cards", () => {
  it("say what every role does, when it wakes and how it wins", () => {
    for (const role of ROLE_ORDER) {
      const info = roleInfo(role, {})
      expect(info.summary).not.toBe("")
      expect(info.wakes).toMatch(/wakes up/i)
      expect(info.goal).toMatch(/^Wins/)
      expect(info.details.length).toBeGreaterThan(0)
    }
  })

  it("tell whoever holds the card what to do, with a tip for a first game", () => {
    for (const role of ROLE_ORDER) {
      const { player } = roleInfo(role, {})
      expect(player.does).toMatch(/\byou/i)
      expect(player.tip).not.toBe("")
    }
  })

  it("use what the cards are called", () => {
    const text = everyLine(RENAMED).join("\n")
    // "villager" stays: it means anyone in the village, not the card
    expect(text).not.toMatch(/wolf|wolves|prostitute|courtesan|wizard|seer/i)
    expect(text).toContain("Voyante")
    expect(text).toContain("loups")
    expect(text).toContain("Paysan")
  })
})
