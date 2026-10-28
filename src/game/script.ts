import type { Death, GameConfig, GameState, Role, RoleNames, Winner } from "./types"
import { roleName, rolePlural } from "./roles"
import { playerName } from "./selectors"
import { joinNames } from "./text"

// What the game master reads out loud. Each line has many wordings, and every night (or day) of a
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
  "It's getting dark. Everyone, close your eyes.",
  "The moon is up. Everyone, close your eyes.",
  "Time for bed, village. Everyone, close your eyes.",
  "The streets are empty. Everyone, close your eyes.",
  "Night falls. Everyone, close your eyes. Hands still, please.",
  "Night falls. Everyone, close your eyes and keep them closed.",
  "Something is moving in the dark. Everyone, close your eyes.",
  "Everyone, close your eyes. Yes, you too.",
  "Night falls. Everyone, close your eyes. No snoring.",
  "Everyone, close your eyes. Don't let the {wolves} bite.",
  "The last candle goes out. Everyone, close your eyes.",
  "Night falls. Everyone, close your eyes. Trust no one.",
  "The village yawns. Everyone, close your eyes.",
  "The fire dies down. Everyone, close your eyes.",
  "The crickets are out. Everyone, close your eyes.",
  "Night falls. Everyone, close your eyes. Try not to have nightmares.",
  "Night falls. Everyone, close your eyes. Breathe normally.",
]

// Every role can hear these
const OPEN_EYES = [
  "{role}, open your eyes.",
  "{role}, wake up and open your eyes.",
  "{role}, it's your turn. Open your eyes.",
  "{role}, open your eyes. The village is asleep.",
  "{role}, open your eyes. Quietly, please.",
  "{role}, open your eyes. Everyone else, keep yours closed.",
  "{role}, open your eyes. Not a sound.",
  "{role}, open your eyes. You know the drill.",
  "Psst, {role}. Open your eyes.",
  "{role}, open your eyes. Your turn to shine.",
  "{role}, open your eyes. The coast is clear.",
  "Good evening, {role}. Open your eyes.",
  "{role}, open your eyes. Everyone else is snoring.",
  "Attention, {role}. Open your eyes.",
  "{role}, open your eyes. Careful, the floor creaks.",
  "{role}, open your eyes. Look around, but don't move.",
  "{role}, open your eyes. Eyes only, no talking.",
  "{role}, open your eyes. No sudden moves.",
  "{role}, open your eyes. Keep a poker face.",
  "{role}, open your eyes. One eye is fine too.",
  "{role}, open your eyes. Shh, the walls have ears.",
  "{role}, open your eyes. Careful, someone might be peeking.",
  "{role}, open your eyes. And don't laugh.",
]

const CLOSE_EYES = [
  "{role}, close your eyes.",
  "Thank you, {role}. Close your eyes.",
  "That's all, {role}. Close your eyes.",
  "Good night, {role}. Close your eyes.",
  "{role}, close your eyes and go back to sleep.",
  "{role}, close your eyes. Act natural.",
  "{role}, close your eyes. Back to your dreams.",
  "Noted. {role}, close your eyes.",
  "{role}, close your eyes. Sleep well.",
  "{role}, close your eyes. As you were.",
  "Got it, {role}. Close your eyes.",
  "{role}, close your eyes. See you in the morning.",
  "{role}, you can close your eyes now.",
  "{role}, close your eyes. Pretend you were asleep all along.",
  "{role}, close your eyes. Not a peep.",
  "{role}, close your eyes. Mission accomplished.",
  "{role}, close your eyes. Nothing to see here.",
  "{role}, close your eyes. Dream of something nice.",
  "{role}, close your eyes. See you on the other side.",
  "{role}, close your eyes. Back to snoring.",
  "{role}, close your eyes. Quiet as a mouse.",
  "{role}, close your eyes. The night goes on.",
  "{role}, close your eyes. Wipe that smile off your face.",
  "{role}, close your eyes. Stay out of trouble.",
]

// The roles woken at night, in the order they wake. "wolf" is the whole pack, called by the plural.
export type NightRole = Exclude<Role, "villager">
const WAKE_ORDER: NightRole[] = ["courtesan", "baby_wolf", "queen_wolf", "wolf", "wizard", "seer"]

// Wordings that only suit one role. Each role hears its own about one night in three.
const OPEN_EYES_ALSO: Partial<Record<NightRole, string[]>> = {
  courtesan: [
    "{role}, open your eyes. Your guest list is waiting.",
    "{role}, open your eyes. Time to send an invitation.",
    "{role}, open your eyes. Time to play host.",
  ],
  baby_wolf: [
    "{role}, open your eyes. Just so I know who you are.",
    "{role}, open your eyes. Don't worry, nothing happens yet.",
    "{role}, open your eyes. Just a quick hello.",
  ],
  queen_wolf: [
    "{role}, open your eyes, Your Majesty.",
    "{role}, open your eyes. The pack awaits your orders.",
    "{role}, open your eyes. Nobody suspects you. Yet.",
  ],
  wolf: [
    "{role}, open your eyes and find each other.",
    "{role}, open your eyes. Try not to drool.",
    "{role}, open your eyes. Hungry?",
    "{role}, open your eyes. Nobody suspects a thing.",
  ],
  wizard: ["{role}, open your eyes. Let's see the damage.", "{role}, open your eyes. Wand at the ready."],
  seer: [
    "{role}, open your eyes. Time to snoop.",
    "{role}, open your eyes. Your crystal ball is warmed up.",
    "{role}, open your eyes. Let's see what you can see.",
    "{role}, open your eyes. Someone has a secret.",
  ],
}

const CLOSE_EYES_ALSO: Partial<Record<NightRole, string[]>> = {
  courtesan: ["{role}, close your eyes. Lights out.", "{role}, close your eyes. Invitation sent."],
  baby_wolf: [
    "{role}, close your eyes. Sleep tight.",
    "{role}, close your eyes. That's all for now.",
    "{role}, close your eyes. Grow up fast.",
  ],
  wolf: [
    "{role}, close your eyes. Try to look surprised in the morning.",
    "{role}, close your eyes. Nobody saw a thing.",
    "{role}, close your eyes. Not a word of this tomorrow.",
    "{role}, close your eyes. Practice your innocent face.",
    "{role}, close your eyes. Same time tomorrow?",
    "{role}, close your eyes. Your secret's safe with me.",
  ],
  wizard: ["{role}, close your eyes. No more magic tonight.", "{role}, close your eyes. Wand away."],
  seer: [
    "{role}, close your eyes. Use it wisely.",
    "{role}, close your eyes. Keep a straight face tomorrow.",
    "{role}, close your eyes. Knowledge is power.",
  ],
}

export type AskedRole = "courtesan" | "wolf" | "seer"

const NIGHT_QUESTION: Record<AskedRole, string[]> = {
  courtesan: [
    "{role}, who do you want to invite tonight?",
    "{role}, who's your guest tonight?",
    "{role}, who are you inviting over tonight?",
    "{role}, who gets an invitation tonight?",
    "{role}, point at tonight's guest.",
    "{role}, who would you like to invite?",
    "{role}, whose name is on tonight's invitation?",
    "{role}, who do you want to keep safe tonight?",
    "{role}, who's on your guest list tonight?",
    "{role}, who gets to hide at your place tonight?",
    "{role}, send out an invitation. Who's it for?",
    "{role}, choose your guest.",
  ],
  wolf: [
    "{role}, who do you want to kill tonight?",
    "{role}, choose your victim.",
    "{role}, agree on a victim and point at them.",
    "{role}, who's on the menu tonight?",
    "{role}, who should the village miss tomorrow?",
    "{role}, who won't be waking up tomorrow?",
    "{role}, point at tonight's victim.",
    "{role}, who's it going to be?",
    "{role}, who do you want gone?",
    "{role}, pick someone. Together, please.",
    "{role}, who has been talking too much?",
    "{role}, who knows too much?",
    "{role}, whose turn is it to disappear?",
    "{role}, choose wisely. Who dies tonight?",
    "{role}, who gets the knock on the door tonight?",
  ],
  seer: [
    "{role}, whose card do you want to see?",
    "{role}, who do you want to check tonight?",
    "{role}, point at a player and I'll show you if they're a {wolf}.",
    "{role}, who are you curious about tonight?",
    "{role}, whose secret do you want to know?",
    "{role}, who do you trust the least?",
    "{role}, who should we take a peek at?",
    "{role}, who's been acting strange?",
    "{role}, whose card are we looking at tonight?",
    "{role}, pick a player. I'll show you the truth.",
    "{role}, who's been on your mind?",
    "{role}, who would you like to investigate?",
    "{role}, who gets a background check tonight?",
  ],
}

// The Wizard hears both potions' questions every night, the same way, so the table can't tell when
// nobody is dying, a potion is used up or the Wizard is dead. While reading the save potion's, the
// game master points at whoever is dying, or shakes their head when nobody is.
const SAVE_QUESTION = [
  "This person is dying tonight. Do you want to save them?",
  "This person won't survive the night. Do you want to save them?",
  "Tonight, this person dies. Do you want to save them?",
  "This person is dying tonight. Will you use your save potion?",
  "This person won't see the morning. Do you want to save them?",
  "This person is about to die. Do you want to save them?",
  "This person is dying tonight. Save them, or let them go?",
]

const KILL_QUESTION = [
  "Do you want to use your kill potion on anyone?",
  "Do you want to poison anyone tonight?",
  "Anyone you'd like to poison tonight?",
  "Any plans for your kill potion tonight?",
  "And your kill potion: does anyone deserve it tonight?",
  "Do you want to poison someone? Point at them.",
  "Is there anyone you'd like to get rid of?",
  "Do you want to use your kill potion? Now's your chance.",
]

const DAWN = [
  "Everyone, open your eyes.",
  "Good morning, village. Everyone, open your eyes.",
  "The sun is up. Everyone, open your eyes.",
  "Rise and shine. Everyone, open your eyes.",
  "Morning has come. Everyone, open your eyes.",
  "Everyone, open your eyes. Let's see who's still with us.",
  "The rooster crows. Everyone, open your eyes.",
  "A new day begins. Everyone, open your eyes.",
  "Wake up, village. Everyone, open your eyes.",
  "Everyone, open your eyes. Coffee's on.",
  "Everyone, open your eyes. Count your neighbors.",
  "The night is over. Everyone, open your eyes.",
  "Everyone, open your eyes. Slowly. It might be bad news.",
  "Birds are singing. Everyone, open your eyes.",
  "Daylight! Everyone, open your eyes.",
  "Morning, sleepyheads. Everyone, open your eyes.",
  "Time to face the day. Everyone, open your eyes.",
]

const NOBODY_DIED = [
  "Nobody died tonight.",
  "Everyone made it through the night.",
  "A quiet night. Nobody died.",
  "Nobody died tonight. Enjoy it while it lasts.",
  "Nobody died tonight. The {wolves} must be furious.",
  "Good news: nobody died tonight.",
  "Miracle of miracles: nobody died tonight.",
  "Everyone's still here. Nobody died tonight.",
  "Nobody died tonight. Somebody up there likes you.",
  "All present and accounted for. Nobody died.",
  "Not a single death tonight. Well done, everyone.",
  "Nobody died tonight. Suspicious, isn't it?",
]

// Reads right for one name or several ("Ana and Ben"), and never says who did it
const DIED = [
  "Tonight, {names} died.",
  "{names} didn't survive the night.",
  "{names} won't be joining us today.",
  "The village wakes up without {names}.",
  "Sadly, {names} didn't make it.",
  "We lost {names} tonight.",
  "Not everyone woke up: {names} died tonight.",
  "Rest in peace, {names}.",
  "{names} didn't wake up this morning.",
  "Bad news. {names} didn't make it through the night.",
  "Say goodbye to {names}.",
  "The night claimed {names}.",
  "{names} won't be voting today.",
  "Gone but not forgotten: {names}.",
  "The night was cruel. {names} died.",
  "{names} died tonight. Moment of silence, please.",
  "Tragic news: {names} died in the night.",
  "{names} won't be needing breakfast.",
]

const DISCUSS = [
  "Discuss: who do you think the {wolves} are?",
  "Who among you is a {wolf}? Discuss.",
  "The {wolves} are among you. Who are they?",
  "Time to talk. Who's been acting suspicious?",
  "Somebody here is lying. Who is it?",
  "Look around. Who seems a little too calm?",
  "Let the finger-pointing begin. Who's a {wolf}?",
  "Who looks guilty this morning?",
  "Who do you suspect, and why? Let's hear it.",
  "Who's been too quiet lately?",
  "The floor is open. Who do you suspect?",
  "Who has been acting a little too innocent?",
  "Somebody's hiding fur under that sweater. Who?",
  "Alibis, please. Where was everyone last night?",
  "Who's the {wolf}? Make your case.",
  "Who's been acting fishy? Speak up.",
  "Look your neighbors in the eye. Who's lying?",
  "Who's your prime suspect?",
  "Something smells off in this village. Who is it?",
  "Someone here has blood on their hands. Who?",
]

const VOTE = [
  "Time to vote. Who leaves the village?",
  "Enough talk. Who leaves the village?",
  "Decision time. Who are we voting out?",
  "The village must decide. Who goes?",
  "Time to vote. No pressure, but choose wisely.",
  "Time to vote. Who's out?",
  "Voting time. Who gets sent away?",
  "Hands ready. Time to vote.",
  "Moment of truth. Who are you voting out?",
  "Time to vote. May the best liar win.",
  "Let's vote. Who's leaving us today?",
  "Ballots, please. Who's out?",
  "Time to vote. Careful, it could be your best friend.",
]

const VOTED_OUT = [
  "{name}, you're out of the game.",
  "{name}, the village has spoken. You're out.",
  "Sorry, {name}. You're out of the game.",
  "Goodbye, {name}. You're out of the game.",
  "{name}, pack your bags. You're out.",
  "{name}, you're out. Thanks for playing.",
  "{name}, you've been voted out.",
  "{name}, it's been a pleasure. You're out.",
  "{name}, the votes are in. You're out.",
  "{name}, you're out. No hard feelings.",
  "{name}, the door is that way. You're out.",
  "{name}, you're out. You'll be missed. Probably.",
  "{name}, you're out. Enjoy the view from the sidelines.",
  "{name}, your time is up. You're out.",
]

const WINNER: Record<Winner, string[]> = {
  village: [
    "The village wins! Every {wolf} is dead.",
    "The village wins! Not a single {wolf} left.",
    "The village wins! You can all sleep peacefully now.",
    "The village wins! The {wolves} never stood a chance.",
    "The village wins! The {wolves} are history.",
    "The village wins! Peace at last.",
    "The village wins! Time to celebrate.",
    "The village wins! No more howling at night.",
    "The village wins! Good riddance, {wolves}.",
    "The village wins! Good beats evil, for once.",
    "The village wins! Justice is served.",
  ],
  wolves: [
    "The {wolves} win! They've taken over the village.",
    "The {wolves} win! Nobody is left to stop them.",
    "The {wolves} win! The village never saw it coming.",
    "The {wolves} win! Well played, liars.",
    "The {wolves} win! The village is theirs now.",
    "The {wolves} win! Dinner is served.",
    "The {wolves} win! Fooled you all.",
    "The {wolves} win! Never trust a friendly face.",
    "The {wolves} win! The village should have listened.",
    "The {wolves} win! What a performance.",
    "The {wolves} win! Better luck next time, village.",
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

// The wordings in this game's order, one per round, so a wording only comes back once all the
// others have been read
function pick(state: GameState, line: string, wordings: string[], round: number): string {
  return wordings[shuffled(state, line, wordings.length)[round % wordings.length]]
}

// Who is called on a night. Everyone in play wakes on Night 1 to be identified; after that the
// Baby Wolf sleeps through and the Queen Wolf wakes with the pack.
function calledOn(config: GameConfig, night: number): NightRole[] {
  const called: Record<NightRole, boolean> = {
    courtesan: config.hasCourtesan,
    baby_wolf: config.hasBabyWolf && night === 1,
    queen_wolf: config.hasQueenWolf && night === 1,
    wolf: true,
    wizard: config.hasWizard,
    seer: config.hasSeer,
  }
  return WAKE_ORDER.filter((role) => called[role])
}

// About one night in three a role hears one of its own wordings. Otherwise it gets the next shared
// wording, dealt in this game's order to each role called, night after night: no two roles hear the
// same one on a night, and a wording only comes back once all the others have been heard.
function roleWording(state: GameState, line: string, role: NightRole, shared: string[], own: string[]): string {
  const night = state.currentNight
  if (own.length > 0) {
    const cycle = own.length * 3
    const mine = shuffled(state, `${line}:${role}`, cycle).indexOf(night % cycle)
    if (mine < own.length) return own[mine]
  }
  let dealt = 0
  for (let earlier = 1; earlier < night; earlier++) dealt += calledOn(state.gameConfig, earlier).length
  const tonight = calledOn(state.gameConfig, night)
  const seat = tonight.includes(role) ? tonight.indexOf(role) : tonight.length
  return pick(state, line, shared, dealt + seat)
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

export function saveQuestion(state: GameState): string {
  return say(state, "save", SAVE_QUESTION, state.currentNight)
}

export function killQuestion(state: GameState): string {
  return say(state, "kill", KILL_QUESTION, state.currentNight)
}

// Everyone wakes up, then hears who died
export function dawnLine(state: GameState): string {
  return say(state, "dawn", DAWN, state.currentNight)
}

export function deathsLine(state: GameState, deaths: Death[]): string {
  if (deaths.length === 0) return say(state, "nobody_died", NOBODY_DIED, state.currentNight)
  const names = joinNames(deaths.map((d) => playerName(state, d.playerId)))
  return say(state, "died", DIED, state.currentNight, { names })
}

// The village talks, then votes
export function discussLine(state: GameState): string {
  return say(state, "discuss", DISCUSS, state.currentDay)
}

export function voteLine(state: GameState): string {
  return say(state, "vote", VOTE, state.currentDay)
}

export function votedOutLine(state: GameState, name: string): string {
  return say(state, "voted_out", VOTED_OUT, state.currentDay, { name })
}

export function winnerLine(state: GameState, winner: Winner): string {
  return say(state, `winner:${winner}`, WINNER[winner], state.currentNight)
}
