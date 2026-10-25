import { useState } from "react"
import type { Player } from "../game/types"
import { isWolf, roleName } from "../game/roles"
import { alivePlayers, eliminatedToday, playerName } from "../game/selectors"
import { ActionBar, Avatar, Button, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { asList, cx } from "../lib/cx"
import { DayTimer } from "./DayTimer"
import type { ScreenProps } from "./props"

export function DayVoteScreen({ state, dispatch }: ScreenProps) {
  const out = eliminatedToday(state)
  if (out.length > 0) {
    return (
      <DayResult
        state={state}
        dispatch={dispatch}
        player={out[out.length - 1]}
      />
    )
  }
  return (
    <DayVote
      state={state}
      dispatch={dispatch}
    />
  )
}

function DayVote({ state, dispatch }: ScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const alive = alivePlayers(state)

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`Day ${state.currentDay}`}
          emoji="☀️"
          title="Village vote"
          subtitle={`${alive.length} players alive`}
          tone="sun"
        />
        <DayTimer
          minutes={state.timerMinutes}
          onMinutesChange={(minutes) => dispatch({ type: "SET_TIMER_MINUTES", minutes })}
        />
        <ScriptCard
          lines={["Discuss: who do you think the wolves are?", "Time to vote. Who leaves the village?"]}
          tone="sun"
        />
        <Instruction>Tap the player voted out</Instruction>
        <PlayerGrid
          players={alive}
          selectedIds={asList(selected)}
          onSelect={setSelected}
          tone="sun"
          showRoles={state.showRoleBadges}
          babyWolfPlayerId={state.babyWolfPlayerId}
        />
      </Screen>
      <ActionBar>
        <Button
          tone="sun"
          disabled={!selected}
          onClick={() => {
            if (selected) dispatch({ type: "ELIMINATE_PLAYER", playerId: selected })
          }}>
          {selected && `🗳️ Vote out ${playerName(state, selected)}`}
          {!selected && "Tap who's voted out"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "SKIP_ELIMINATION" })}>
          Nobody is voted out today
        </Button>
      </ActionBar>
    </>
  )
}

type DayResultProps = ScreenProps & { player: Player }

function DayResult({ state, dispatch, player }: DayResultProps) {
  const wolf = isWolf(player.role)
  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`Day ${state.currentDay}`}
          emoji="🗳️"
          title={`${player.name} is out`}
          tone="sun"
        />
        <div
          className={cx(
            "mb-4 flex animate-pop flex-col items-center rounded-3xl border px-4 py-7 text-center",
            wolf && "border-blood-500/40 bg-blood-500/15",
            !wolf && "border-leaf-500/40 bg-leaf-500/15",
          )}>
          <Avatar
            name={player.name}
            size="lg"
          />
          <div className="mt-2 text-lg font-semibold text-mist-100">{player.name}</div>
          <div className="mt-3 text-5xl">
            {wolf && "🐺"}
            {!wolf && "😇"}
          </div>
          <div className={cx("mt-2 text-2xl font-bold", wolf && "text-blood-400", !wolf && "text-leaf-400")}>
            {wolf && "Was a wolf"}
            {!wolf && "Was not a wolf"}
          </div>
          <div className="mt-1 text-[14px] text-mist-300">Card: {roleName(player.role, state.roleNames)}</div>
        </div>
        <ScriptCard
          lines={[`${player.name}, you're out of the game.`]}
          tone="sun"
        />
      </Screen>
      <ActionBar>
        <Button onClick={() => dispatch({ type: "START_NEXT_NIGHT" })}>🌙 Start Night {state.currentNight + 1}</Button>
      </ActionBar>
    </>
  )
}
