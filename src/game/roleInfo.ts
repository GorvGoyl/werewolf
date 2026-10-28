import type { Role, RoleNames } from "./types"
import type { Team } from "./roles"
import { roleName, rolePlural } from "./roles"

// What each role does, written for a game master running their first game. The role's card
// (tap any role) and "How to play" both read from here.
export type RoleInfo = {
  team: Team
  // One line beside the role's switch, when choosing the roles
  blurb: string
  summary: string
  // When the game master calls them at night
  wakes: string
  goal: string
  details: string[]
}

export const TEAM_LABEL: Record<Team, string> = {
  wolves: "Wolf pack",
  village: "Village",
  wildcard: "Wildcard",
}

// Every line uses what the cards are called
export function roleInfo(role: Role, rn: RoleNames): RoleInfo {
  const wolf = roleName("wolf", rn).toLowerCase()
  const wolves = rolePlural("wolf", rn).toLowerCase()
  const queen = roleName("queen_wolf", rn)
  const baby = roleName("baby_wolf", rn)
  const seer = roleName("seer", rn)
  const wizard = roleName("wizard", rn)
  const courtesan = roleName("courtesan", rn)

  const goal: Record<Team, string> = {
    wolves: `Wins when the ${wolves} equal or outnumber everyone else`,
    village: `Wins with the village once every ${wolf} is dead`,
    wildcard: "Wins with the village, or with the pack once bitten",
  }

  const roles: Record<Role, Omit<RoleInfo, "goal">> = {
    wolf: {
      team: "wolves",
      blurb: "Every night the pack kills a player.",
      summary: `Every night, from the very first, the ${wolves} wake up together and pick a player to kill.`,
      wakes: "Wakes up with the pack, every night",
      details: [`The ${wolves} know each other`, "During the day they pretend to be villagers"],
    },
    queen_wolf: {
      team: "wolves",
      blurb: `A ${wolf} the ${seer} can't see. Counts as one of the ${wolves}.`,
      summary: `A ${wolf} the ${seer} can't see.`,
      wakes: "Wakes up with the pack, every night",
      details: [
        `Hunts with the pack and counts as a ${wolf}`,
        `The ${seer} sees her as "not a ${wolf}"`,
        "On Night 1 she wakes up alone first, so you know who she is",
      ],
    },
    baby_wolf: {
      team: "wildcard",
      blurb: `A villager who joins the pack if the ${wolves} bite them.`,
      summary: `Starts with the village, but joins the pack if the ${wolves} bite them.`,
      wakes: "Wakes up on Night 1 only, so you know who it is",
      details: [
        `If the ${wolves} pick them, they survive and become a ${wolf} the next night: tap their shoulder before waking the pack`,
        `The ${seer} sees them as "not a ${wolf}" until they turn`,
        `At the ${courtesan}'s house they're safe: no bite, no change`,
      ],
    },
    courtesan: {
      team: "village",
      blurb: `Invites a guest each night. Her guest is safe from ${wolves}.`,
      summary: `Every night, invites a guest who is then safe from the ${wolves}.`,
      wakes: "Wakes up first, every night",
      details: [
        `If the ${wolves} attack her guest, nobody dies`,
        `If she invites a ${wolf}, she dies`,
        `If the ${wolves} attack her, she and her guest both die (a ${wolf} guest survives)`,
        "She can't invite the same player two nights in a row",
      ],
    },
    wizard: {
      team: "village",
      blurb: "One save potion and one kill potion for the whole game.",
      summary: "Has two potions, each usable once per game: one saves a life, one takes one.",
      wakes: `Wakes up after the ${wolves}, every night`,
      details: [
        "You point at who is dying tonight, and they can save one of them",
        `Saving the attacked ${courtesan} saves her guest too`,
        "Can poison any other player",
        `If the ${wizard} is dying tonight, they can still use a potion`,
      ],
    },
    seer: {
      team: "village",
      blurb: `Checks one player each night: ${wolf} or not.`,
      summary: `Every night, checks one player: ${wolf} or not.`,
      wakes: "Wakes up last, every night",
      details: [
        "They point at a player, and you show them the answer on this phone",
        `${rolePlural("wolf", rn)} show as "${wolf}"`,
        `The ${queen} shows as "not a ${wolf}", and so does the ${baby} until they turn`,
      ],
    },
    villager: {
      team: "village",
      blurb: "No special power.",
      summary: `No special power: finds the ${wolves} by talking and voting during the day.`,
      wakes: "Never wakes up at night",
      details: [`You never call them: whoever doesn't wake up on Night 1 is a ${roleName("villager", rn)}`],
    },
  }

  const info = roles[role]
  return { ...info, goal: goal[info.team] }
}
