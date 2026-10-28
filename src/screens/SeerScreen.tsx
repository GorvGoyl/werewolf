import { useState } from "react"
import { roleName } from "../game/roles"
import { alivePlayers, findRole, getPlayer, playerName } from "../game/selectors"
import { closeEyes, nightQuestion, openEyes } from "../game/script"
import { ActionBar, Avatar, Button, IconTile, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { ROLE_ICON } from "../components/icons"
import { asList, cx } from "../lib/cx"
import { DeadRoleStep, IdentifyStep, isLastNightStep, nightEyebrow } from "./night"
import type { ScreenProps } from "./props"

export function SeerScreen({ state, dispatch }: ScreenProps) {
  const name = roleName("seer", state.roleNames)
  const seer = findRole(state, "seer")

  if (!seer) {
    return (
      <IdentifyStep
        key="identify-seer"
        state={state}
        dispatch={dispatch}
        role="seer"
        title={name}
        lines={[openEyes(state, "seer")]}
        instruction="Tap the player who opened their eyes"
        confirmLabel={([who]) => `${who} is the ${name}`}
        onConfirm={([id]) => dispatch({ type: "ASSIGN_ROLE", playerId: id, role: "seer" })}
      />
    )
  }

  if (!seer.isAlive) {
    return (
      <DeadRoleStep
        state={state}
        dispatch={dispatch}
        role="seer"
        opening={[]}
      />
    )
  }

  if (state.currentNightEvent.seerChecked) {
    return (
      <SeerResult
        state={state}
        dispatch={dispatch}
      />
    )
  }

  return (
    <SeerPick
      state={state}
      dispatch={dispatch}
    />
  )
}

function SeerPick({ state, dispatch }: ScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const name = roleName("seer", state.roleNames)
  const seer = findRole(state, "seer")

  // On Night 1 the Seer already opened their eyes to be identified
  const lines: string[] = []
  if (state.currentNight > 1) lines.push(openEyes(state, "seer"))
  lines.push(nightQuestion(state, "seer"))

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON.seer}
          title={name}
          subtitle={`${seer?.name} checks one player.`}
          role="seer"
        />
        <ScriptCard lines={lines} />
        <Instruction>Tap the player they point at</Instruction>
        <PlayerGrid
          players={alivePlayers(state).filter((p) => p.id !== seer?.id)}
          selectedIds={asList(selected)}
          onSelect={setSelected}
          showRoles={state.showRoleBadges}
          babyWolfPlayerId={state.babyWolfPlayerId}
        />
      </Screen>
      <ActionBar>
        <Button
          disabled={!selected}
          icon={selected !== null && ROLE_ICON.seer}
          onClick={() => {
            if (selected) dispatch({ type: "SET_SEER_CHECK", playerId: selected })
          }}>
          {selected && `Reveal ${playerName(state, selected)}`}
          {!selected && "Tap a player"}
        </Button>
      </ActionBar>
    </>
  )
}

function SeerResult({ state, dispatch }: ScreenProps) {
  const name = roleName("seer", state.roleNames)
  const checked = getPlayer(state, state.currentNightEvent.seerChecked)
  const isWolf = state.currentNightEvent.seerResult === "wolf"
  const last = isLastNightStep(state)

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON.seer}
          title={name}
          subtitle={`Show the ${name} the answer.`}
          role="seer"
        />
        <div
          className={cx(
            "mb-5 flex animate-pop flex-col items-center rounded-3xl border px-4 py-7 text-center",
            isWolf && "border-blood-500/40 bg-blood-500/15",
            !isWolf && "border-leaf-500/40 bg-leaf-500/15",
          )}>
          <div className="flex items-center gap-3">
            <Avatar name={checked?.name ?? "?"} />
            <div className="text-[20px] font-semibold text-mist-100">{checked?.name}</div>
          </div>
          <div className="mt-5">
            {isWolf && (
              <IconTile
                icon={ROLE_ICON.wolf}
                tone="blood"
                size="xl"
              />
            )}
            {!isWolf && (
              <IconTile
                icon="innocent"
                tone="leaf"
                size="xl"
              />
            )}
          </div>
          <div className={cx("mt-3 text-[30px] font-bold", isWolf && "text-blood-400", !isWolf && "text-leaf-400")}>
            {isWolf && "Wolf"}
            {!isWolf && "Not a wolf"}
          </div>
        </div>
        <ScriptCard
          lines={[closeEyes(state, "seer")]}
          tone="mist"
        />
      </Screen>
      <ActionBar>
        <Button
          icon={last && "sunrise"}
          onClick={() => dispatch({ type: "SKIP_TO_NEXT_PHASE" })}>
          {last && "Continue to dawn"}
          {!last && "Continue"}
        </Button>
      </ActionBar>
    </>
  )
}
