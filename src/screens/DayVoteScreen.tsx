import { useState } from "react"
import type { Player } from "../game/types"
import { isWolf, roleName } from "../game/roles"
import { checkWinCondition, hasSaid } from "../game/reducer"
import { alivePlayers, eliminatedToday, playerName } from "../game/selectors"
import { discussLine, voteLine, votedOutLine } from "../game/script"
import { ActionBar, Avatar, Button, IconTile, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { Icon, ROLE_ICON, playerIcon } from "../components/icons"
import { cardRole } from "../components/RoleList"
import { asList, cx } from "../lib/cx"
import { useShowRole } from "../lib/useShowRole"
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
  // The village talks first, then votes on a screen of its own
  if (!hasSaid(state, "discuss")) {
    return (
      <Discussion
        state={state}
        dispatch={dispatch}
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

function Discussion({ state, dispatch }: ScreenProps) {
  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`Day ${state.currentDay}`}
          icon="users"
          title="Discussion"
          subtitle={`${alivePlayers(state).length} players alive`}
          tone="sun"
        />
        <ScriptCard
          lines={[discussLine(state)]}
          tone="sun"
        />
        <DayTimer
          minutes={state.timerMinutes}
          onMinutesChange={(minutes) => dispatch({ type: "SET_TIMER_MINUTES", minutes })}
        />
      </Screen>
      <ActionBar>
        <Button
          tone="sun"
          icon="vote"
          onClick={() => dispatch({ type: "SAID", cue: "discuss" })}>
          Start the vote
        </Button>
      </ActionBar>
    </>
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
        <ScriptCard
          lines={[voteLine(state)]}
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
  const showRole = useShowRole()
  const wolf = isWolf(player.role)
  const won = checkWinCondition(state.players) !== null
  const role = cardRole(state, player) ?? "villager"
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
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => showRole(role)}
            className="mt-1 flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] text-mist-300 active:bg-white/10">
            <Icon
              name={playerIcon(player, state.babyWolfPlayerId)}
              className="size-7"
            />
            Card: {roleName(player.role, state.roleNames)}
          </button>
        </div>
        <ScriptCard
          lines={[votedOutLine(state, player.name)]}
          tone="sun"
        />
      </Screen>
      <ActionBar>
        {/* A vote that ended the game goes on to the winner */}
        {won && (
          <Button
            icon="trophy"
            onClick={() => dispatch({ type: "START_NEXT_NIGHT" })}>
            See who won
          </Button>
        )}
        {!won && (
          <Button
            icon="moon"
            onClick={() => dispatch({ type: "START_NEXT_NIGHT" })}>
            Start Night {state.currentNight + 1}
          </Button>
        )}
      </ActionBar>
    </>
  )
}
