import { useState } from "react"
import type { Player } from "../game/types"
import { isWolf, roleName } from "../game/roles"
import { alivePlayers, eliminatedToday, playerName } from "../game/selectors"
import { ActionBar, Avatar, Button, IconTile, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { Icon, ROLE_ICON, playerIcon } from "../components/icons"
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
          icon="vote"
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
          icon={selected !== null && "vote"}
          onClick={() => {
            if (selected) dispatch({ type: "ELIMINATE_PLAYER", playerId: selected })
          }}>
          {selected && `Vote out ${playerName(state, selected)}`}
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
          icon="vote"
          title={`${player.name} is out`}
          tone="sun"
        />
        <div
          className={cx(
            "mb-5 flex animate-pop flex-col items-center rounded-3xl border px-4 py-7 text-center",
            wolf && "border-blood-500/40 bg-blood-500/15",
            !wolf && "border-leaf-500/40 bg-leaf-500/15",
          )}>
          <div className="flex items-center gap-3">
            <Avatar name={player.name} />
            <div className="text-[20px] font-semibold text-mist-100">{player.name}</div>
          </div>
          <div className="mt-5">
            {wolf && (
              <IconTile
                icon={ROLE_ICON.wolf}
                tone="blood"
                size="xl"
              />
            )}
            {!wolf && (
              <IconTile
                icon="innocent"
                tone="leaf"
                size="xl"
              />
            )}
          </div>
          <div className={cx("mt-3 text-[30px] font-bold", wolf && "text-blood-400", !wolf && "text-leaf-400")}>
            {wolf && "Was a wolf"}
            {!wolf && "Was not a wolf"}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[15px] text-mist-300">
            <Icon
              name={playerIcon(player, state.babyWolfPlayerId)}
              className="size-7"
            />
            Card: {roleName(player.role, state.roleNames)}
          </div>
        </div>
        <ScriptCard
          lines={[`${player.name}, you're out of the game.`]}
          tone="sun"
        />
      </Screen>
      <ActionBar>
        <Button
          icon="moon"
          onClick={() => dispatch({ type: "START_NEXT_NIGHT" })}>
          Start Night {state.currentNight + 1}
        </Button>
      </ActionBar>
    </>
  )
}
