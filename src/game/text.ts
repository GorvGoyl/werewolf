import type { DeathCause, RoleNames } from "./types"
import { roleName, rolePlural } from "./roles"

// "Ana", "Ana and Ben", "Ana, Ben and Cleo"
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

export function causeText(cause: DeathCause, rn: RoleNames): string {
  if (cause === "wolves") return `Attacked by the ${rolePlural("wolf", rn).toLowerCase()}`
  if (cause === "invited_wolf") return `Invited a ${roleName("wolf", rn).toLowerCase()} home`
  if (cause === "at_courtesan") return `Was at the ${roleName("courtesan", rn)}'s when she was attacked`
  return `Killed by the ${roleName("wizard", rn)}`
}
