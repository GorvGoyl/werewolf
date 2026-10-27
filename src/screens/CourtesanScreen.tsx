import { useState } from "react"
import { roleName } from "../game/roles"
import { aliveId, alivePlayers, findRole, playerName } from "../game/selectors"
import { closeEyes, nightQuestion, openEyes } from "../game/script"
import { ActionBar, Button, Callout, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { ROLE_ICON } from "../components/icons"
import { asList } from "../lib/cx"
import { DeadRoleStep, IdentifyStep, nightEyebrow, nightfall } from "./night"
import type { ScreenProps } from "./props"

export function CourtesanScreen({ state, dispatch }: ScreenProps) {
  const name = roleName("courtesan", state.roleNames)
  const courtesan = findRole(state, "courtesan")

  if (!courtesan) {
    return (
      <IdentifyStep
        key="identify-courtesan"
        state={state}
        dispatch={dispatch}
        role="courtesan"
        title={name}
        lines={[...nightfall(state, true), openEyes(state, "courtesan")]}
        instruction="Tap the player who opened their eyes"
        confirmLabel={([who]) => `${who} is the ${name}`}
        onConfirm={([id]) => dispatch({ type: "ASSIGN_ROLE", playerId: id, role: "courtesan" })}
      />
    )
  }

  if (!courtesan.isAlive) {
    return (
      <DeadRoleStep
        state={state}
        dispatch={dispatch}
        role="courtesan"
        opening={nightfall(state, true)}
      />
    )
  }

  return (
    <CourtesanInvite
      state={state}
      dispatch={dispatch}
    />
  )
}

function CourtesanInvite({ state, dispatch }: ScreenProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const name = roleName("courtesan", state.roleNames)
  const courtesan = findRole(state, "courtesan")
  // She can't invite the same player two nights in a row
  const lastGuest = aliveId(state, state.lastCourtesanGuest)

  const disabledIds: string[] = []
  const notes: Record<string, string> = {}
  if (courtesan) {
    disabledIds.push(courtesan.id)
    notes[courtesan.id] = name
  }
  if (lastGuest) {
    disabledIds.push(lastGuest)
    notes[lastGuest] = "Last night's guest"
  }

  // On Night 1 she already opened her eyes to be identified
  const awake = state.currentNight > 1
  const lines = nightfall(state, awake)
  if (awake) lines.push(openEyes(state, "courtesan"))
  lines.push(nightQuestion(state, "courtesan"))

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON.courtesan}
          title={name}
          subtitle={`${courtesan?.name} picks a guest for the night.`}
        />
        <ScriptCard
          lines={lines}
          after={[closeEyes(state, "courtesan")]}
        />
        {lastGuest && (
          <Callout
            tone="sun"
            icon="ban"
            title={`Not ${playerName(state, lastGuest)} again`}>
            They were last night's guest, so she must pick someone else.
          </Callout>
        )}
        <Instruction>Tap the guest she points at</Instruction>
        <PlayerGrid
          players={alivePlayers(state)}
          selectedIds={asList(selected)}
          onSelect={setSelected}
          disabledIds={disabledIds}
          notes={notes}
          showRoles={state.showRoleBadges}
          babyWolfPlayerId={state.babyWolfPlayerId}
        />
      </Screen>
      <ActionBar>
        <Button
          disabled={!selected}
          icon={selected !== null && ROLE_ICON.courtesan}
          onClick={() => {
            if (selected) dispatch({ type: "SET_COURTESAN_GUEST", playerId: selected })
          }}>
          {selected && `Invite ${playerName(state, selected)}`}
          {!selected && "Tap the guest"}
        </Button>
      </ActionBar>
    </>
  )
}
