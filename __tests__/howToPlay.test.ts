import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HowToPlay } from "../src/components/HowToPlay"
import { guideLink, isGuidePath, readGuideCards } from "../src/game/storage"
import type { RoleNames } from "../src/game/types"

// The words on the guide, without the markup
function guideText(roleNames: RoleNames): string {
  return renderToStaticMarkup(createElement(HowToPlay, { roleNames }))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
}

describe("How to play", () => {
  it("explains the roles most games have, then the ones only some games add", () => {
    const text = guideText({})
    const extras = text.indexOf("Sometimes added")
    expect(text).toContain("Most games have the Prostitute, the Wizard and the Seer")
    for (const role of ["Villager", "Wolf", "Prostitute", "Wizard", "Seer"]) {
      expect(text.indexOf(role)).toBeLessThan(extras)
    }
    for (const role of ["Queen Wolf", "Baby Wolf"]) expect(text.indexOf(role)).toBeGreaterThan(extras)
  })

  it("uses what the cards are called", () => {
    const renamed: RoleNames = {
      wolf: "Loup",
      queen_wolf: "Reine",
      baby_wolf: "Louveteau",
      courtesan: "Hôtesse",
      wizard: "Sorcière",
      seer: "Voyante",
    }
    // The game and the wolves' team keep their names, like on the role cards
    const text = guideText(renamed).replaceAll("Werewolf", "").replaceAll("Wolf pack", "")
    expect(text).not.toMatch(/wolf|wolves|prostitute|courtesan|wizard|seer/i)
    expect(text).toContain("Sorcière")
    expect(text).toContain("loups")
  })

  it("has a short link of its own", () => {
    expect(guideLink({})).toBe("https://werewolf.gourav.io/how-to-play")
    expect(isGuidePath(new URL(guideLink({})).pathname)).toBe(true)
  })

  it("takes the card names along when they're renamed", () => {
    const names: RoleNames = { wizard: "Witch", courtesan: "Host; 2:00 #1 100%" }
    const link = guideLink(names)
    expect(link).toMatch(/^https:\/\/werewolf\.gourav\.io\/how-to-play#cards=/)
    expect(readGuideCards(new URL(link).hash)).toEqual(names)
  })

  it("ignores links it didn't make", () => {
    expect(readGuideCards("")).toEqual({})
    expect(readGuideCards("#rules")).toEqual({})
    expect(readGuideCards("#cards=wizard:%E0%A4")).toEqual({})
    expect(readGuideCards("#cards=king:Arthur;seer:")).toEqual({})
  })

  it("opens at its own address only", () => {
    for (const path of ["/how-to-play", "/how-to-play/", "/how-to-play.html"]) expect(isGuidePath(path)).toBe(true)
    for (const path of ["/", "/index.html", "/how-to-play-now", "/x/how-to-play"]) expect(isGuidePath(path)).toBe(false)
  })
})
