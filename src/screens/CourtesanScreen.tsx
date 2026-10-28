import { useState } from "react"
import { roleName } from "../game/roles"
import { hasHadTurn } from "../game/reducer"
import { aliveId, alivePlayers, findRole, playerName } from "../game/selectors"
import { nightQuestion, openEyes } from "../game/script"
import { ActionBar, Button, Callout, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { ROLE_ICON } from "../components/icons"
import { asList } from "../lib/cx"
import {
  CloseEyesStep,
  DeadRoleStep,
  IdentifyStep,
  NightfallStep,
  WakeStep,
  needsNightfall,
  needsWake,
  nightEyebrow,
} from "./night"
import type { ScreenProps } from "./props"

export function CourtesanScreen({ state, dispatch }: ScreenProps) {
  const name = roleName("courtesan", state.roleNames)
  const courtesan = findRole(state, "courtesan")

  if (needsNightfall(state)) {
    return (
      <NightfallStep
        state={state}
        dispatch={dispatch}
      />
    )
  }

  if (!courtesan) {
    return (
      <IdentifyStep
        key="identify-courtesan"
        state={state}
        dispatch={dispatch}
        role="courtesan"
        title={name}
        lines={[openEyes(state, "courtesan")]}
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
        busy="choosing a guest"
      />
    )
  }

  if (needsWake(state)) {
    return (
      <WakeStep
        state={state}
        dispatch={dispatch}
        role="courtesan"
        title={name}
        subtitle={`${courtesan.name} wakes up.`}
      />
    )
  }

  if (hasHadTurn(state)) {
    return (
      <CloseEyesStep
        state={state}
        dispatch={dispatch}
        role="courtesan"
        title={name}
        subtitle={`${courtesan.name} invited ${playerName(state, state.currentNightEvent.courtesanGuest)}.`}
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

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON.courtesan}
          title={name}
          subtitle={`${courtesan?.name} picks a guest for the night.`}
          role="courtesan"
        />
        <ScriptCard lines={[nightQuestion(state, "courtesan")]} />
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
