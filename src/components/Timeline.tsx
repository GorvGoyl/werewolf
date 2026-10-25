import type { ReactNode } from "react"
import type { DayEvent, Death, GameState, NightEvent, Player } from "../game/types"
import type { Chapter } from "../game/selectors"
import { getPlayer, getTimeline, wasBabyWolfBitten } from "../game/selectors"
import { isWolf, roleName, rolePlural } from "../game/roles"
import { causeText } from "../game/text"
import { cx } from "../lib/cx"
import type { IconName } from "./icons"
import { Icon, ROLE_ICON, playerIcon } from "./icons"
import { roleLabel } from "./RoleList"
import type { Tone } from "./ui"
import { Avatar, IconTile, ROLE_TONE, playerTone, toneText } from "./ui"

type NightChapter = Extract<Chapter, { kind: "night" }>
type DayChapter = Extract<Chapter, { kind: "day" }>

type Note = { key: string; icon: IconName; tone: Tone; content: ReactNode }

const NOW_CARD: Record<"moon" | "sun", string> = {
  moon: "border-moon-500/40 shadow-[0_0_24px_-8px_rgba(139,124,246,0.5)]",
  sun: "border-sun-400/40 shadow-[0_0_24px_-8px_rgba(251,191,36,0.4)]",
}

const NOW_BADGE: Record<"moon" | "sun", string> = {
  moon: "bg-moon-500/15 text-moon-300",
  sun: "bg-sun-400/15 text-sun-300",
}

type Props = { state: GameState; newestFirst?: boolean }

// The game night by night and day by day: who died, who was voted out, and what each role did
export function Timeline({ state, newestFirst = false }: Props) {
  const chapters = getTimeline(state)
  if (newestFirst) chapters.reverse()

  return (
    <ol aria-label="Nights and days">
      {chapters.map((chapter, index) => (
        <li key={`${chapter.kind}-${chapter.number}`}>
          {/* A short thread from the icon above, so the cards read as one story */}
          {index > 0 && (
            <span
              aria-hidden
              className="ml-8 block h-3 w-0.5 bg-white/10"
            />
          )}
          {chapter.kind === "night" && (
            <NightCard
              state={state}
              chapter={chapter}
            />
          )}
          {chapter.kind === "day" && (
            <DayCard
              state={state}
              chapter={chapter}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

type NightCardProps = { state: GameState; chapter: NightChapter }

function NightCard({ state, chapter }: NightCardProps) {
  const deaths = chapter.event.deaths ?? []
  const notes = nightNotes(state, chapter)
  return (
    <ChapterCard
      icon="moon"
      tone="moon"
      title={`Night ${chapter.number}`}
      now={chapter.now}>
      {deaths.map((death) => (
        <DeathRow
          key={death.playerId}
          state={state}
          death={death}
        />
      ))}
      {!chapter.now && deaths.length === 0 && (
        <NoteLine
          icon="heart"
          tone="leaf">
          <span className="font-semibold text-leaf-300">Nobody died</span>
        </NoteLine>
      )}
      {chapter.now && notes.length === 0 && <Pending>Nothing has happened yet tonight.</Pending>}
      {notes.length > 0 && (
        <ul className={cx("space-y-2", !chapter.now && "border-t border-white/5 pt-3")}>
          {notes.map((note) => (
            <li key={note.key}>
              <NoteLine
                icon={note.icon}
                tone={note.tone}>
                {note.content}
              </NoteLine>
            </li>
          ))}
        </ul>
      )}
    </ChapterCard>
  )
}

type DayCardProps = { state: GameState; chapter: DayChapter }

function DayCard({ state, chapter }: DayCardProps) {
  const out = chapter.events.filter((e) => e.eliminated)
  return (
    <ChapterCard
      icon="sun"
      tone="sun"
      title={`Day ${chapter.number}`}
      now={chapter.now}>
      {out.map((event) => (
        <VotedOutRow
          key={event.eliminated}
          state={state}
          event={event}
        />
      ))}
      {!chapter.now && out.length === 0 && (
        <NoteLine
          icon="vote"
          tone="mist">
          Nobody was voted out
        </NoteLine>
      )}
      {chapter.now && <Pending>The village hasn&apos;t voted yet.</Pending>}
    </ChapterCard>
  )
}

// What each role did in the night, beyond the deaths listed above it
function nightNotes(state: GameState, chapter: NightChapter): Note[] {
  const rn = state.roleNames
  const event = chapter.event
  const deaths = event.deaths ?? []
  const notes: Note[] = []

  if (event.courtesanGuest) {
    notes.push({
      key: "courtesan",
      icon: ROLE_ICON.courtesan,
      tone: ROLE_TONE.courtesan,
      content: (
        <>
          {roleName("courtesan", rn)} invited <Name id={event.courtesanGuest} state={state} />
        </>
      ),
    })
  }

  const baby = getPlayer(state, state.babyWolfPlayerId)
  if (baby?.role === "wolf" && state.babyWolfTransformNight === chapter.number) {
    notes.push({
      key: "baby",
      icon: ROLE_ICON.baby_wolf,
      tone: "sun",
      content: (
        <>
          <Name id={baby.id} state={state} /> joined the pack
        </>
      ),
    })
  }

  // A deadly attack is already in the deaths
  const target = event.wolfTarget
  if (target && !deaths.some((d) => d.playerId === target)) {
    const result = chapter.now ? null : attackResult(state, chapter.event)
    notes.push({
      key: "wolves",
      icon: ROLE_ICON.wolf,
      tone: ROLE_TONE.wolf,
      content: (
        <>
          {rolePlural("wolf", rn)} attacked <Name id={target} state={state} />
          {result && (
            <>
              : <Result tone={result.tone}>{result.text}</Result>
            </>
          )}
        </>
      ),
    })
  }

  // Once the night is over, saving the wolves' victim is the attack's result
  const saved = event.wizardSaved
  if (saved && (chapter.now || saved !== target)) {
    notes.push({
      key: "save",
      icon: "heal",
      tone: "leaf",
      content: (
        <>
          {roleName("wizard", rn)} saved <Name id={saved} state={state} />
        </>
      ),
    })
  }

  // Once the night is over, the poisoned player is in the deaths
  if (event.wizardKilled && chapter.now) {
    notes.push({
      key: "kill",
      icon: "poison",
      tone: "blood",
      content: (
        <>
          {roleName("wizard", rn)} poisoned <Name id={event.wizardKilled} state={state} />
        </>
      ),
    })
  }

  if (event.seerChecked) {
    const wolf = event.seerResult === "wolf"
    notes.push({
      key: "seer",
      icon: ROLE_ICON.seer,
      tone: ROLE_TONE.seer,
      content: (
        <>
          {roleName("seer", rn)} checked <Name id={event.seerChecked} state={state} />:{" "}
          {wolf && <Result tone="blood">wolf</Result>}
          {!wolf && <Result tone="leaf">not a wolf</Result>}
        </>
      ),
    })
  }

  return notes
}

// Why the wolves' victim is still alive
function attackResult(state: GameState, night: NightEvent): { text: string; tone: Tone } {
  const rn = state.roleNames
  if (wasBabyWolfBitten(state, night)) return { text: "bitten, joins the pack next night", tone: "sun" }
  if (night.courtesanGuest === night.wolfTarget) {
    return { text: `safe at the ${roleName("courtesan", rn)}'s`, tone: "leaf" }
  }
  if (night.wizardSaved === night.wolfTarget) return { text: `saved by the ${roleName("wizard", rn)}`, tone: "leaf" }
  return { text: "survived", tone: "leaf" }
}

type ChapterCardProps = { icon: IconName; tone: "moon" | "sun"; title: string; now: boolean; children: ReactNode }

function ChapterCard({ icon, tone, title, now, children }: ChapterCardProps) {
  return (
    <section
      aria-label={title}
      className={cx("rounded-2xl border bg-night-800/70 p-3", now && NOW_CARD[tone], !now && "border-white/5")}>
      <div className="flex items-center gap-3">
        <IconTile
          icon={icon}
          tone={tone}
          size="sm"
        />
        <h3 className="min-w-0 flex-1 text-[18px] font-bold tracking-tight text-mist-100">{title}</h3>
        {now && (
          <span
            className={cx(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.14em]",
              NOW_BADGE[tone],
            )}>
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            Now
          </span>
        )}
      </div>
      <div className="mt-3 space-y-3 px-1 pb-1">{children}</div>
    </section>
  )
}

type DeathRowProps = { state: GameState; death: Death }

function DeathRow({ state, death }: DeathRowProps) {
  const player = getPlayer(state, death.playerId)
  if (!player) return null
  return (
    <PersonRow
      state={state}
      player={player}>
      <span className="text-blood-300">{causeText(death.cause, state.roleNames)}</span>
    </PersonRow>
  )
}

type VotedOutRowProps = { state: GameState; event: DayEvent }

function VotedOutRow({ state, event }: VotedOutRowProps) {
  const player = getPlayer(state, event.eliminated)
  if (!player) return null
  const wolf = isWolf(event.revealedRole)
  return (
    <PersonRow
      state={state}
      player={player}>
      <span className="text-mist-300">Voted out · </span>
      {wolf && <span className="font-semibold text-blood-400">was a wolf</span>}
      {!wolf && <span className="font-semibold text-leaf-400">was not a wolf</span>}
    </PersonRow>
  )
}

type PersonRowProps = { state: GameState; player: Player; children: ReactNode }

// A player who left the game: name and card on top, how they left below
function PersonRow({ state, player, children }: PersonRowProps) {
  const tone = playerTone(player)
  return (
    <div className="flex gap-3">
      <Avatar
        name={player.name}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="max-w-full truncate text-[16px] font-semibold text-mist-100">{player.name}</span>
          <span className={cx("flex items-center gap-1 text-[13px] font-semibold", toneText(tone))}>
            <Icon
              name={playerIcon(player, state.babyWolfPlayerId)}
              className="size-4"
            />
            {roleLabel(state, player)}
          </span>
        </div>
        <div className="text-[15px] leading-snug">{children}</div>
      </div>
    </div>
  )
}

type NoteLineProps = { icon: IconName; tone: Tone; children: ReactNode }

function NoteLine({ icon, tone, children }: NoteLineProps) {
  return (
    <div className="flex gap-3 text-[15px] leading-snug text-mist-300">
      <span className="flex w-8 shrink-0 justify-center">
        <Icon
          name={icon}
          className={cx("mt-px size-[18px]", toneText(tone))}
        />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  )
}

type NameProps = { state: GameState; id: string }

function Name({ state, id }: NameProps) {
  return <span className="font-semibold text-mist-100">{getPlayer(state, id)?.name ?? "?"}</span>
}

type ResultProps = { tone: Tone; children: ReactNode }

function Result({ tone, children }: ResultProps) {
  return <span className={cx("font-semibold", toneText(tone))}>{children}</span>
}

function Pending({ children }: { children: ReactNode }) {
  return <p className="text-[15px] text-mist-400">{children}</p>
}
