import type { Death, NightEvent, Player } from "./types"
import { isWolf } from "./roles"

export function resolveDeaths(
  players: Player[],
  nightEvent: Partial<NightEvent>,
  wizardSavedId: string | null,
): Death[] {
  const deaths: Death[] = []
  const { courtesanGuest, wolfTarget, wizardKilled } = nightEvent

  const courtesan = players.find((p) => p.role === "courtesan" && p.isAlive)
  const courtesanId = courtesan?.id ?? null
  const guest = courtesanGuest ? players.find((p) => p.id === courtesanGuest) : undefined

  // --- Courtesan visiting a wolf ---
  if (courtesanId && guest && isWolf(guest.role)) {
    deaths.push({ playerId: courtesanId, cause: "invited_wolf" })
  }

  // --- Wolf attack scenarios (mutually exclusive) ---
  // Deaths that only happen because the wolves attacked the Courtesan's house
  const collateral: string[] = []
  if (wolfTarget) {
    if (courtesanId && wolfTarget === courtesanGuest) {
      // Scenario A: wolves attacked the Courtesan's guest → no one dies from the attack
      // (the guest is safe at the Courtesan's house)
    } else if (courtesanId && wolfTarget === courtesanId) {
      // Scenario B: wolves attacked the Courtesan → she and her guest both die
      // (the guest only dies if they're not a wolf — wolves don't kill their own)
      if (!deaths.some((d) => d.playerId === courtesanId)) {
        deaths.push({ playerId: courtesanId, cause: "wolves" })
      }
      if (guest && !isWolf(guest.role)) {
        deaths.push({ playerId: guest.id, cause: "at_courtesan" })
        collateral.push(guest.id)
      }
    } else {
      // Scenario C: normal attack
      // The Baby Wolf doesn't die from a wolf attack — they transform instead
      const target = players.find((p) => p.id === wolfTarget)
      if (!target || target.role !== "baby_wolf") {
        deaths.push({ playerId: wolfTarget, cause: "wolves" })
      }
    }
  }

  // --- Wizard kill potion ---
  if (wizardKilled) {
    deaths.push({ playerId: wizardKilled, cause: "wizard" })
  }

  // --- Wizard save potion ---
  // Saving someone cancels their death. Saving the Courtesan when the wolves attacked her
  // house also saves her guest, who would only have died in that attack.
  let survivors: string[] = []
  if (wizardSavedId) {
    survivors = [wizardSavedId]
    if (wizardSavedId === courtesanId && wolfTarget === courtesanId) {
      survivors = [...survivors, ...collateral]
    }
  }

  // A player can only die once, and the Wizard can't cancel his own kill potion
  const seen = new Set<string>()
  return deaths.filter((d) => {
    if (seen.has(d.playerId)) return false
    if (survivors.includes(d.playerId) && d.cause !== "wizard") return false
    seen.add(d.playerId)
    return true
  })
}

// Who the Wizard sees as dying tonight, before any potion
export function getPlayersInDanger(players: Player[], nightEvent: Partial<NightEvent>): Death[] {
  return resolveDeaths(
    players,
    { courtesanGuest: nightEvent.courtesanGuest, wolfTarget: nightEvent.wolfTarget },
    null,
  )
}
