import type { RoleNames, Winner } from "../game/types"
import { rolePlural } from "../game/roles"
import { winnerLine } from "../game/script"
import { ActionBar, Button, IconTile, Screen, ScriptCard, SectionLabel } from "../components/ui"
import type { Tone } from "../components/ui"
import { RoleList } from "../components/RoleList"
import { Timeline } from "../components/Timeline"
import { cx } from "../lib/cx"
import type { ScreenProps } from "./props"

function winnerTitle(winner: Winner, rn: RoleNames): string {
  if (winner === "village") return "The village wins!"
  return `The ${rolePlural("wolf", rn).toLowerCase()} win!`
}

function winnerTone(winner: Winner): Tone {
  if (winner === "village") return "leaf"
  return "blood"
}

type Props = Pick<ScreenProps, "state"> & { winner: Winner; onPlayAgain: () => void; onHandOver: () => void }

export function GameOverScreen({ state, winner, onPlayAgain, onHandOver }: Props) {
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
            {winnerTitle(winner, state.roleNames)}
          </h1>
          <div className="mt-1 text-[15px] text-mist-300">
            After {nights} night{nights !== 1 && "s"}
          </div>
        </div>

        <ScriptCard
          lines={[winnerLine(state, winner)]}
          tone={tone}
        />

        <RoleList state={state} />

        <SectionLabel>What happened</SectionLabel>
        <Timeline state={state} />
      </Screen>
      <ActionBar>
        <Button
          tone={tone}
          icon="restart"
          onClick={onPlayAgain}>
          Play again
        </Button>
        <Button
          variant="ghost"
          icon="handOver"
          onClick={onHandOver}>
          Next game on another phone
        </Button>
      </ActionBar>
    </>
  )
}
