import type { GameState, NightEvent, RoleNames, Winner } from "../game/types"
import { isWolf, roleName, rolePlural } from "../game/roles"
import { playerName, wasBabyWolfBitten } from "../game/selectors"
import { ActionBar, Button, IconTile, Screen, ScriptCard, SectionLabel } from "../components/ui"
import type { Tone } from "../components/ui"
import type { IconName } from "../components/icons"
import { Icon } from "../components/icons"
import { RoleList } from "../components/RoleList"
import { cx } from "../lib/cx"
import { joinNames } from "./night"
import type { ScreenProps } from "./props"

type Line = { icon: IconName; text: string; tone: Tone }

const LINE_TEXT: Record<Tone, string> = {
  moon: "text-moon-300",
  blood: "text-blood-300",
  sun: "text-sun-300",
  leaf: "text-leaf-300",
  mist: "text-mist-300",
}

function attackOutcome(state: GameState, night: NightEvent): Line {
  const rn = state.roleNames
  const target = playerName(state, night.wolfTarget)
  const attack = `${rolePlural("wolf", rn)} attacked ${target}`
  if (night.deaths.some((d) => d.playerId === night.wolfTarget)) {
    return { icon: "wolf", text: `${attack}: died`, tone: "blood" }
  }
  if (wasBabyWolfBitten(state, night)) {
    return { icon: "wolf", text: `${attack}: bitten, joined the pack`, tone: "sun" }
  }
  if (night.courtesanGuest === night.wolfTarget) {
    return { icon: "wolf", text: `${attack}: safe at the ${roleName("courtesan", rn)}'s`, tone: "leaf" }
  }
  if (night.wizardSaved === night.wolfTarget) {
    return { icon: "wolf", text: `${attack}: saved by the ${roleName("wizard", rn)}`, tone: "leaf" }
  }
  return { icon: "wolf", text: `${attack}: survived`, tone: "leaf" }
}

function nightLines(state: GameState, night: NightEvent): Line[] {
  const rn: RoleNames = state.roleNames
  const lines: Line[] = []
  if (night.courtesanGuest) {
    lines.push({
      icon: "rose",
      text: `${roleName("courtesan", rn)} invited ${playerName(state, night.courtesanGuest)}`,
      tone: "mist",
    })
  }
  if (night.wolfTarget) lines.push(attackOutcome(state, night))
  if (night.wizardSaved && night.wizardSaved !== night.wolfTarget) {
    lines.push({
      icon: "heal",
      text: `${roleName("wizard", rn)} saved ${playerName(state, night.wizardSaved)}`,
      tone: "leaf",
    })
  }
  if (night.wizardKilled) {
    lines.push({
      icon: "poison",
      text: `${roleName("wizard", rn)} poisoned ${playerName(state, night.wizardKilled)}`,
      tone: "blood",
    })
  }
  if (night.seerChecked) {
    const wolf = night.seerResult === "wolf"
    let verdict = "not a wolf"
    if (wolf) verdict = "wolf"
    lines.push({
      icon: "eye",
      text: `${roleName("seer", rn)} checked ${playerName(state, night.seerChecked)}: ${verdict}`,
      tone: "moon",
    })
  }
  if (night.deaths.length === 0) lines.push({ icon: "sunrise", text: "Nobody died", tone: "leaf" })
  if (night.deaths.length > 0) {
    const names = night.deaths.map((d) => playerName(state, d.playerId))
    lines.push({ icon: "skull", text: `Died: ${joinNames(names)}`, tone: "blood" })
  }
  return lines
}

function dayLines(state: GameState, day: number): Line[] {
  const lines: Line[] = []
  for (const event of state.dayEvents) {
    if (event.day !== day) continue
    if (!event.eliminated) {
      lines.push({ icon: "vote", text: "Nobody was voted out", tone: "mist" })
      continue
    }
    const text = `${playerName(state, event.eliminated)} voted out: ${roleName(event.revealedRole, state.roleNames)}`
    let tone: Tone = "leaf"
    if (isWolf(event.revealedRole)) tone = "blood"
    lines.push({ icon: "vote", text, tone })
  }
  return lines
}

function winnerText(winner: Winner, rn: RoleNames): { title: string; line: string } {
  const wolf = roleName("wolf", rn).toLowerCase()
  const wolves = rolePlural("wolf", rn).toLowerCase()
  if (winner === "village") return { title: "The village wins!", line: `The village wins! Every ${wolf} is dead.` }
  return { title: `The ${wolves} win!`, line: `The ${wolves} win! They've taken over the village.` }
}

function winnerTone(winner: Winner): Tone {
  if (winner === "village") return "leaf"
  return "blood"
}

type Props = ScreenProps & { winner: Winner }

export function GameOverScreen({ state, dispatch, winner }: Props) {
  const text = winnerText(winner, state.roleNames)
  const nights = state.nightEvents.length
  const village = winner === "village"
  const tone = winnerTone(winner)

  return (
    <>
      <Screen>
        <div
          className={cx(
            "mb-5 flex animate-pop flex-col items-center rounded-3xl border px-5 py-8 text-center",
            village && "border-leaf-500/40 bg-leaf-500/15",
            !village && "border-blood-500/40 bg-blood-500/15",
          )}>
          {village && (
            <IconTile
              icon="trophy"
              tone="leaf"
              size="xl"
            />
          )}
          {!village && (
            <IconTile
              icon="wolf"
              tone="blood"
              size="xl"
            />
          )}
          <h1
            className={cx(
              "mt-4 text-[32px] font-extrabold leading-tight tracking-tight",
              village && "text-leaf-400",
              !village && "text-blood-400",
            )}>
            {text.title}
          </h1>
          <div className="mt-1 text-[15px] text-mist-300">
            After {nights} night{nights !== 1 && "s"}
          </div>
        </div>

        <ScriptCard
          lines={[text.line]}
          tone={tone}
        />

        <RoleList state={state} />

        <SectionLabel>What happened</SectionLabel>
        <ol className="space-y-2">
          {state.nightEvents.map((night) => (
            <li key={night.night}>
              <TimelineCard
                label={`Night ${night.night}`}
                icon="moon"
                lines={nightLines(state, night)}
              />
              {dayLines(state, night.night).length > 0 && (
                <div className="mt-2">
                  <TimelineCard
                    label={`Day ${night.night}`}
                    icon="sun"
                    lines={dayLines(state, night.night)}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </Screen>
      <ActionBar>
        <Button
          tone={tone}
          icon="replay"
          onClick={() => dispatch({ type: "NEW_GAME" })}>
          Play again
        </Button>
      </ActionBar>
    </>
  )
}

type TimelineCardProps = { label: string; icon: IconName; lines: Line[] }

function TimelineCard({ label, icon, lines }: TimelineCardProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-night-800/70 px-4 py-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.16em] text-mist-400">
        <Icon
          name={icon}
          className="size-4"
        />
        {label}
      </div>
      <ul className="space-y-1.5">
        {lines.map((line) => (
          <li
            key={`${line.icon}${line.text}`}
            className={cx("flex gap-2.5 text-[15px] leading-snug", LINE_TEXT[line.tone])}>
            <Icon
              name={line.icon}
              className="mt-px size-[18px]"
            />
            <span>{line.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
