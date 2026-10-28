import type { ReactNode } from "react"
import type { Role, RoleNames } from "../game/types"
import { roleName, rolePlural } from "../game/roles"
import { TEAM_LABEL, roleInfo } from "../game/roleInfo"
import { cx } from "../lib/cx"
import type { IconName } from "./icons"
import { Icon, ROLE_ICON } from "./icons"
import type { Tone } from "./ui"
import { IconTile, ROLE_TONE, TEAM_TONE, toneText } from "./ui"

// The two sides first, then the roles most games have, in the order they wake up
const USUAL_ROLES: Role[] = ["villager", "wolf", "courtesan", "wizard", "seer"]
// Only in some games
const EXTRA_ROLES: Role[] = ["queen_wolf", "baby_wolf"]

type Props = { roleNames: RoleNames }

// The whole game for someone who has never played, in the order they'll meet it: the menu's How to
// play and the page sent to the players before game night both show it
export function HowToPlay({ roleNames: rn }: Props) {
  const wolf = roleName("wolf", rn).toLowerCase()
  const wolves = rolePlural("wolf", rn).toLowerCase()
  const courtesan = roleName("courtesan", rn)
  const wizard = roleName("wizard", rn)
  const seer = roleName("seer", rn)

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="rounded-3xl border border-white/5 bg-night-800/70 p-5">
          <div className="flex items-center justify-center gap-4">
            <IconTile
              icon="villager"
              tone="leaf"
              size="lg"
            />
            <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-mist-500">vs</span>
            <IconTile
              icon="wolf"
              tone="blood"
              size="lg"
            />
          </div>
          <p className="mt-4 text-[17px] leading-snug text-mist-100">
            Werewolf is a game of secrets and bluffing for 5 or more players, plus one game master.
          </p>
          <p className="mt-2 text-[16px] leading-snug text-mist-300">
            A few players are secretly {wolves}. Every night, they kill someone. Every day, everyone talks it over
            and votes out the player they think is a {wolf}.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/5 bg-night-800/70 p-4">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-mist-400">Who wins</div>
          <Win
            icon="villager"
            tone="leaf">
            The village wins once every {wolf} is dead.
          </Win>
          <Win
            icon="wolf"
            tone="blood">
            The {wolves} win once they equal or outnumber everyone else, like 2 {wolves} and 2 villagers.
          </Win>
        </div>
      </div>

      <Section
        icon="cards"
        title="Getting started">
        <Steps
          steps={[
            {
              icon: "gameMaster",
              text: "One person runs the game: the game master. They don't play, and they keep every secret.",
            },
            {
              icon: "cards",
              text: "The game master deals everyone a card, face down. Look at yours without letting anyone see it.",
            },
            {
              icon: "secret",
              text: "Your card is your role for the whole game. Never show it. During the day you can say what you are, or lie about it.",
            },
          ]}
        />
      </Section>

      <Section
        icon="moon"
        title="At night">
        <p className="mb-3 text-[16px] leading-snug text-mist-200">
          Everyone closes their eyes. The game master wakes the roles one at a time: when you hear yours, open your
          eyes, answer by pointing, and close them again when told.
        </p>
        <Steps
          steps={[
            { icon: ROLE_ICON.courtesan, text: <Named name={courtesan}>invites someone over for the night</Named> },
            { icon: ROLE_ICON.wolf, text: <Named name={rolePlural("wolf", rn)}>pick someone to kill</Named> },
            { icon: ROLE_ICON.wizard, text: <Named name={wizard}>can save whoever is dying, or poison someone</Named> },
            { icon: ROLE_ICON.seer, text: <Named name={seer}>finds out if someone is a {wolf}</Named> },
          ]}
        />
        <Notes
          notes={[
            "Villagers keep their eyes closed all night.",
            "A role that isn't in this game is skipped. One that is gets called every night, even after it dies, so nobody can tell who's gone.",
          ]}
        />
      </Section>

      <Section
        icon="sun"
        tone="sun"
        title="In the day">
        <Steps
          steps={[
            {
              icon: "sunrise",
              text: "Everyone opens their eyes, and the game master says who died in the night, but not how.",
            },
            { icon: "users", text: `Talk it over: who could be a ${wolf}? The ${wolves} pretend to be villagers too.` },
            {
              icon: "vote",
              text: "Vote: on the count of three, everyone points at who they want out. Whoever gets the most votes is out of the game. A tie? Nobody is.",
            },
            { icon: "moon", text: "Night falls again. Nights and days take turns until one side wins." },
          ]}
        />
      </Section>

      <Section
        icon="ban"
        tone="blood"
        title="Play fair">
        <Steps
          numbered={false}
          steps={[
            { icon: "ban", text: "No peeking at night, and no showing your card." },
            { icon: "tap", text: "At night, not a sound: point, nod or shake your head." },
            {
              icon: "skull",
              text: "Once you're dead, you're out of the game: no talking, no voting and no hints, not even with a face.",
            },
          ]}
        />
      </Section>

      <Section
        icon="cards"
        title="The roles">
        <p className="mb-3 text-[16px] leading-snug text-mist-200">
          The game master picks the roles for each game, so not every game has all of them. Most games have the{" "}
          {courtesan}, the {wizard} and the {seer}, plus {wolves} and villagers.
        </p>
        <div className="space-y-2.5">
          {USUAL_ROLES.map((role) => (
            <GuideRole
              key={role}
              role={role}
              roleNames={rn}
            />
          ))}
        </div>

        <h4 className="mt-6 text-[12px] font-bold uppercase tracking-[0.16em] text-mist-400">Sometimes added</h4>
        <p className="mb-3 mt-1 text-[14px] leading-snug text-mist-400">
          Only when the game master adds them, usually once everyone knows the basics.
        </p>
        <div className="space-y-2.5">
          {EXTRA_ROLES.map((role) => (
            <GuideRole
              key={role}
              role={role}
              roleNames={rn}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

type WinProps = { icon: IconName; tone: Tone; children: ReactNode }

function Win({ icon, tone, children }: WinProps) {
  return (
    <div className={cx("flex items-center gap-3 text-[15px] leading-snug", toneText(tone))}>
      <IconTile
        icon={icon}
        tone={tone}
        size="sm"
      />
      <span>{children}</span>
    </div>
  )
}

type SectionProps = { icon: IconName; tone?: Tone; title: string; children: ReactNode }

function Section({ icon, tone = "moon", title, children }: SectionProps) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-3 text-[21px] font-bold leading-tight tracking-tight text-mist-100">
        <IconTile
          icon={icon}
          tone={tone}
          size="sm"
        />
        {title}
      </h3>
      {children}
    </section>
  )
}

type Step = { icon: IconName; text: ReactNode }

type StepsProps = { steps: Step[]; numbered?: boolean }

function Steps({ steps, numbered = true }: StepsProps) {
  const List = numbered ? "ol" : "ul"
  return (
    <List className="rounded-2xl border border-white/5 bg-night-800/70 px-2 py-1.5">
      {steps.map((step, i) => (
        <li
          key={i}
          className="flex min-h-14 items-center gap-3 px-2 py-2 text-[15px] leading-snug text-mist-200">
          {numbered && (
            <span className="w-3 shrink-0 text-right text-[13px] font-semibold tabular-nums text-mist-500">{i + 1}</span>
          )}
          <Icon
            name={step.icon}
            className="size-9"
          />
          <span className="min-w-0">{step.text}</span>
        </li>
      ))}
    </List>
  )
}

type NamedProps = { name: string; children: ReactNode }

// A role, then what it does at night
function Named({ name, children }: NamedProps) {
  return (
    <>
      <span className="font-semibold text-mist-100">{name}</span> {children}
    </>
  )
}

function Notes({ notes }: { notes: string[] }) {
  return (
    <ul className="mt-2.5 space-y-1.5 px-1">
      {notes.map((note) => (
        <li
          key={note}
          className="flex gap-2 text-[14px] leading-snug text-mist-400">
          <span
            aria-hidden
            className="text-mist-500">
            •
          </span>
          <span>{note}</span>
        </li>
      ))}
    </ul>
  )
}

type GuideRoleProps = { role: Role; roleNames: RoleNames }

// What a card means for whoever holds it
function GuideRole({ role, roleNames: rn }: GuideRoleProps) {
  const info = roleInfo(role, rn)
  return (
    <div className="rounded-2xl border border-white/5 bg-night-800/70 p-4">
      <div className="flex items-center gap-3.5">
        <IconTile
          icon={ROLE_ICON[role]}
          tone={ROLE_TONE[role]}
        />
        <div className="min-w-0 flex-1">
          <div className={cx("text-[11px] font-bold uppercase tracking-wide", toneText(TEAM_TONE[info.team]))}>
            {TEAM_LABEL[info.team]}
          </div>
          <h4 className="text-[18px] font-bold leading-tight text-mist-100">{roleName(role, rn)}</h4>
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-snug text-mist-100">{info.player.does}</p>
      {info.player.rules.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {info.player.rules.map((rule) => (
            <li
              key={rule}
              className="flex gap-2 text-[14px] leading-snug text-mist-300">
              <span
                aria-hidden
                className="text-mist-500">
                •
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[14px] leading-snug text-moon-300">
        <span className="font-semibold">Tip:</span> {info.player.tip}
      </p>
    </div>
  )
}
