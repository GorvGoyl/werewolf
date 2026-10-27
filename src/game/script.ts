import type { Death, GameState, Role, RoleNames, Winner } from "./types"
import { roleName, rolePlural } from "./roles"
import { playerName } from "./selectors"
import { joinNames } from "./text"

// What the game master reads out loud. Each line has a few wordings, and every night (or day) of a
// game reads a different one, in an order that changes from game to game. Every wording keeps
// what players listen for: who is called, and "open your eyes" or "close your eyes".
//
// In braces: {role} is who is called, {wolf} and {wolves} what the wolf cards are called, {names}
// who died tonight, {name} who was voted out.

const NIGHTFALL = [
  "Night falls. Everyone, close your eyes.",
  "Night falls on the village. Everyone, close your eyes.",
  "The sun goes down. Everyone, close your eyes.",
  "The village goes to sleep. Everyone, close your eyes.",
  "Night falls. Lock your doors. Everyone, close your eyes.",
  "Night falls. Everyone, close your eyes. Sweet dreams, most of you.",
  "Everyone, close your eyes. Peekers get eaten first.",
]

const OPEN_EYES = [
  "{role}, open your eyes.",
  "{role}, wake up and open your eyes.",
  "{role}, it's your turn. Open your eyes.",
  "{role}, open your eyes. The village is asleep.",
  "{role}, open your eyes. Quietly, please.",
  "{role}, open your eyes. Everyone else, keep yours closed.",
]

const CLOSE_EYES = [
  "{role}, close your eyes.",
  "Thank you, {role}. Close your eyes.",
  "That's all, {role}. Close your eyes.",
  "Good night, {role}. Close your eyes.",
  "{role}, close your eyes and go back to sleep.",
  "{role}, close your eyes. Act natural.",
]

// The roles woken at night, in the order they wake. "wolf" is the whole pack, called by the plural.
export type NightRole = Exclude<Role, "villager">
const WAKE_ORDER: NightRole[] = ["courtesan", "baby_wolf", "queen_wolf", "wolf", "wizard", "seer"]

// Wordings that only suit one role, on top of the ones above
const OPEN_EYES_ALSO: Partial<Record<NightRole, string[]>> = {
  queen_wolf: ["{role}, open your eyes, Your Majesty."],
  baby_wolf: ["{role}, open your eyes. Just so I know who you are."],
  wolf: ["{role}, open your eyes and find each other."],
  seer: ["{role}, open your eyes. Time to snoop."],
}

const CLOSE_EYES_ALSO: Partial<Record<NightRole, string[]>> = {
  baby_wolf: ["{role}, close your eyes. Sleep tight."],
  wolf: ["{role}, close your eyes. Try to look surprised in the morning."],
  seer: ["{role}, close your eyes. Use it wisely."],
}

export type AskedRole = "courtesan" | "wolf" | "seer"

const NIGHT_QUESTION: Record<AskedRole, string[]> = {
  courtesan: [
    "{role}, who do you want to invite tonight?",
    "{role}, who's your guest tonight?",
    "{role}, who are you inviting over tonight?",
    "{role}, who gets an invitation tonight?",
    "{role}, point at tonight's guest.",
  ],
  wolf: [
    "{role}, who do you want to kill tonight?",
    "{role}, choose your victim.",
    "{role}, agree on a victim and point at them.",
    "{role}, who's on the menu tonight?",
    "{role}, who should the village miss tomorrow?",
    "{role}, who won't be waking up tomorrow?",
  ],
  seer: [
    "{role}, whose card do you want to see?",
    "{role}, who do you want to check tonight?",
    "{role}, point at a player and I'll show you if they're a {wolf}.",
    "{role}, who are you curious about tonight?",
    "{role}, whose secret do you want to know?",
    "{role}, who do you trust the least?",
  ],
}

// The Wizard's save potion, by how many are dying. The game master points at them.
const SAVE_QUESTION = {
  nobody: [
    "Nobody is dying tonight.",
    "Good news: nobody is dying tonight.",
    "Nobody is dying tonight. Your save potion can wait.",
  ],
  one: [
    "This person is dying tonight. Do you want to save them?",
    "This person won't survive the night. Do you want to save them?",
    "Tonight, this person dies. Do you want to save them?",
    "This person is dying tonight. Will you use your save potion?",
  ],
  several: [
    "These people are dying tonight. Do you want to save one of them?",
    "These people won't survive the night. Do you want to save one of them?",
    "Tonight, these people die. Do you want to save one of them?",
    "These people are dying tonight. Will you use your save potion on one of them?",
  ],
}

const KILL_QUESTION = [
  "Do you want to use your kill potion on anyone?",
  "Do you want to poison anyone tonight?",
  "Anyone you'd like to poison tonight?",
  "Any plans for your kill potion tonight?",
]

const NO_POTIONS = [
  "{role}, you have no potions left.",
  "{role}, you're out of potions.",
  "{role}, your potions are all used up.",
  "{role}, you're out of potions. Enjoy the night off.",
]

const DAWN = [
  "Everyone, open your eyes.",
  "Good morning, village. Everyone, open your eyes.",
  "The sun is up. Everyone, open your eyes.",
  "Rise and shine. Everyone, open your eyes.",
  "Morning has come. Everyone, open your eyes.",
  "Everyone, open your eyes. Let's see who's still with us.",
]

const NOBODY_DIED = [
  "Nobody died tonight.",
  "Everyone made it through the night.",
  "A quiet night. Nobody died.",
  "Nobody died tonight. Enjoy it while it lasts.",
  "Nobody died tonight. The {wolves} must be furious.",
]

// Reads right for one name or several ("Ana and Ben")
const DIED = [
  "Tonight, {names} died.",
  "{names} didn't survive the night.",
  "{names} won't be joining us today.",
  "The village wakes up without {names}.",
  "Sadly, {names} didn't make it.",
  "We lost {names} tonight.",
  "Not everyone woke up: {names} died tonight.",
]

const DISCUSS = [
  "Discuss: who do you think the {wolves} are?",
  "Who among you is a {wolf}? Discuss.",
  "The {wolves} are among you. Who are they?",
  "Time to talk. Who's been acting suspicious?",
  "Somebody here is lying. Who is it?",
  "Look around. Who seems a little too calm?",
  "Let the finger-pointing begin. Who's a {wolf}?",
]

const VOTE = [
  "Time to vote. Who leaves the village?",
  "Enough talk. Who leaves the village?",
  "Decision time. Who are we voting out?",
  "The village must decide. Who goes?",
  "Time to vote. No pressure, but choose wisely.",
]

const VOTED_OUT = [
  "{name}, you're out of the game.",
  "{name}, the village has spoken. You're out.",
  "Sorry, {name}. You're out of the game.",
  "Goodbye, {name}. You're out of the game.",
  "{name}, pack your bags. You're out.",
  "{name}, you're out. Thanks for playing.",
]

const WINNER: Record<Winner, string[]> = {
  village: [
    "The village wins! Every {wolf} is dead.",
    "The village wins! Not a single {wolf} left.",
    "The village wins! You can all sleep peacefully now.",
    "The village wins! The {wolves} never stood a chance.",
  ],
  wolves: [
    "The {wolves} win! They've taken over the village.",
    "The {wolves} win! Nobody is left to stop them.",
    "The {wolves} win! The village never saw it coming.",
    "The {wolves} win! Well played, liars.",
  ],
}

// Turns text into a well-mixed 32-bit number (FNV-1a, then MurmurHash3's finalizer)
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

// This game's order of 0 to count - 1 for a line. The same game and line always give the same order,
// so a wording stays put when the screen redraws, the app reloads or a step is undone.
function shuffled(state: GameState, line: string, count: number): number[] {
  const rank = (i: number) => hash(`${state.scriptSeed}:${line}:${i}`)
  return Array.from({ length: count }, (_, i) => i).sort((a, b) => rank(a) - rank(b))
}

// One wording per night (or day), in this game's order, so a wording only comes back once all the
// others have been read
function pick(state: GameState, line: string, wordings: string[], round: number): string {
  return wordings[shuffled(state, line, wordings.length)[round % wordings.length]]
}

// A role's own wordings come up once every few nights. The other nights it takes one of the shared
// wordings, which go round the roles, so no two roles hear the same one on the same night.
function roleWording(state: GameState, line: string, role: NightRole, shared: string[], own: string[]): string {
  const night = state.currentNight
  const cycle = shared.length + own.length
  const ownNights = shuffled(state, `${line}:${role}`, cycle).slice(0, own.length)
  const mine = ownNights.indexOf(night % cycle)
  if (mine >= 0) return own[mine]
  return pick(state, line, shared, night + WAKE_ORDER.indexOf(role))
}

type Words = Record<string, string>

function fill(wording: string, rn: RoleNames, words: Words): string {
  const all: Words = {
    wolf: roleName("wolf", rn).toLowerCase(),
    wolves: rolePlural("wolf", rn).toLowerCase(),
    ...words,
  }
  return wording.replace(/\{(\w+)\}/g, (_, key: string) => all[key] ?? "")
}

function say(state: GameState, line: string, wordings: string[], round: number, words: Words = {}): string {
  return fill(pick(state, line, wordings, round), state.roleNames, words)
}

function calledName(role: NightRole, rn: RoleNames): string {
  if (role === "wolf") return rolePlural("wolf", rn)
  return roleName(role, rn)
}

export function nightfallLine(state: GameState): string {
  return say(state, "nightfall", NIGHTFALL, state.currentNight)
}

// A dead role is called with the same wordings, so the table can't tell
export function openEyes(state: GameState, role: NightRole): string {
  const wording = roleWording(state, "open", role, OPEN_EYES, OPEN_EYES_ALSO[role] ?? [])
  return fill(wording, state.roleNames, { role: calledName(role, state.roleNames) })
}

export function closeEyes(state: GameState, role: NightRole): string {
  const wording = roleWording(state, "close", role, CLOSE_EYES, CLOSE_EYES_ALSO[role] ?? [])
  return fill(wording, state.roleNames, { role: calledName(role, state.roleNames) })
}

export function nightQuestion(state: GameState, role: AskedRole): string {
  const name = calledName(role, state.roleNames)
  return say(state, `ask:${role}`, NIGHT_QUESTION[role], state.currentNight, { role: name })
}

export function saveQuestion(state: GameState, dying: number): string {
  if (dying === 0) return say(state, "save:nobody", SAVE_QUESTION.nobody, state.currentNight)
  if (dying === 1) return say(state, "save:one", SAVE_QUESTION.one, state.currentNight)
  return say(state, "save:several", SAVE_QUESTION.several, state.currentNight)
}

export function killQuestion(state: GameState): string {
  return say(state, "kill", KILL_QUESTION, state.currentNight)
}

export function noPotionsLine(state: GameState): string {
  return say(state, "no_potions", NO_POTIONS, state.currentNight, { role: roleName("wizard", state.roleNames) })
}

// Everyone wakes up and hears who died
export function dawnLines(state: GameState, deaths: Death[]): string[] {
  const wake = say(state, "dawn", DAWN, state.currentNight)
  if (deaths.length === 0) return [wake, say(state, "nobody_died", NOBODY_DIED, state.currentNight)]
  const names = joinNames(deaths.map((d) => playerName(state, d.playerId)))
  return [wake, say(state, "died", DIED, state.currentNight, { names })]
}

export function dayLines(state: GameState): string[] {
  return [say(state, "discuss", DISCUSS, state.currentDay), say(state, "vote", VOTE, state.currentDay)]
}

export function votedOutLine(state: GameState, name: string): string {
  return say(state, "voted_out", VOTED_OUT, state.currentDay, { name })
}

export function winnerLine(state: GameState, winner: Winner): string {
  return say(state, `winner:${winner}`, WINNER[winner], 0)
}
