import type { Role, RoleNames } from "./types"
import type { Team } from "./roles"
import { roleName, rolePlural } from "./roles"

// What each role does. The role's card (tap any role) is written for a game master running their
// first game; `player` is for How to play, said to whoever holds the card.
export type RoleInfo = {
  team: Team
  // One line beside the role's switch, when choosing the roles
  blurb: string
  summary: string
  // When the game master calls them at night
  wakes: string
  goal: string
  details: string[]
  // For someone who has never played: what they do, what else to know, and a tip for a first game
  player: { does: string; rules: string[]; tip: string }
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
      player: {
        does: `Every night you wake up with the other ${wolves}, and together you pick a player to kill.`,
        rules: [
          `On the first night you see who the other ${wolves} are. Nobody else knows.`,
          "Agree without a sound: keep pointing until you all point at the same player.",
          "During the day, pretend to be a villager and vote like one.",
        ],
        tip: "Look surprised in the morning, and quietly cast doubt on someone else.",
      },
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
      player: {
        does: `You're a ${wolf} the ${seer} can't catch: you show as "not a ${wolf}".`,
        rules: [
          `On the first night you open your eyes alone, before the other ${wolves}, so the game master knows who you are.`,
          `After that you hunt with the ${wolves} every night, and count as one of them.`,
        ],
        tip: `Play boldly: the ${seer} can't expose you.`,
      },
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
      player: {
        does: `You start on the village's side. If the ${wolves} pick you at night, you don't die: you join them.`,
        rules: [
          "You open your eyes on the first night only, so the game master knows who you are.",
          `The night after you're bitten, the game master taps your shoulder: open your eyes with the ${wolves} and hunt with them from then on.`,
          `Until then, the ${seer} sees you as "not a ${wolf}".`,
          `If the ${wolves} pick you while you're the ${courtesan}'s guest, you're safe: no bite, no change.`,
        ],
        tip: "Until you're bitten, help the village. After that, help the pack.",
      },
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
      player: {
        does: "Every night you wake up first and invite a player to spend the night at your place.",
        rules: [
          `If the ${wolves} attack your guest, nobody dies: your guest wasn't home.`,
          `If you invite a ${wolf}, you die.`,
          `If the ${wolves} attack you, you and your guest both die, unless your guest is a ${wolf}.`,
          "You can't invite yourself, or the same player two nights in a row.",
        ],
        tip: "Invite someone you trust: you might save their life.",
      },
    },
    wizard: {
      team: "village",
      blurb: "One save potion and one kill potion for the whole game.",
      summary: "Has two potions, each usable once per game: one saves a life, one takes one.",
      wakes: `Wakes up after the ${wolves}, every night`,
      details: [
        "You point at who is dying tonight (or shake your head if nobody is), and they can save one of them",
        `Saving the attacked ${courtesan} saves her guest too`,
        "Can poison any other player",
        `If the ${wizard} is dying tonight, they can still use a potion`,
        "You ask about both potions every night, even once they're used up, so the table can't tell",
      ],
      player: {
        does: `Every night you wake up after the ${wolves}. You have two potions, one use each: one saves a life, the other takes one.`,
        rules: [
          "First the game master points at whoever is dying tonight, or shakes their head if nobody is. Nod to save them, or shake your head.",
          "Then you can poison any other player: point at them, or shake your head.",
          "If you're the one dying, you can save yourself.",
          "You're asked about both potions every night, even once they're used up. Just shake your head, so nobody can tell.",
        ],
        tip: `Keep the kill potion for someone you're sure is a ${wolf}.`,
      },
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
      player: {
        does: `Every night you wake up last and point at a player. The game master shows you on their phone whether that player is a ${wolf}.`,
        rules: ["Only you see the answer. Use it during the day to steer the vote."],
        tip: `Don't say you're the ${seer} too soon: if the ${wolves} find out, you're next.`,
      },
    },
    villager: {
      team: "village",
      blurb: "No special power.",
      summary: `No special power: finds the ${wolves} by talking and voting during the day.`,
      wakes: "Never wakes up at night",
      details: [`You never call them: whoever doesn't wake up on Night 1 is a ${roleName("villager", rn)}`],
      player: {
        does: "You have no special power, and you sleep through every night.",
        rules: [`Your power is the day: talk, ask questions, and help vote out the ${wolves}.`],
        tip: "Watch who changes their story, and who's quick to blame others.",
      },
    },
  }

  const info = roles[role]
  return { ...info, goal: goal[info.team] }
}
