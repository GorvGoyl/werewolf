import type { ReactNode } from "react"
import { useState } from "react"
import type { GameState, Role } from "../game/types"
import { STEP_ROLE, roleName, stepName } from "../game/roles"
import { getNightSteps, hasHadTurn } from "../game/reducer"
import type { NightRole } from "../game/script"
import { closeEyes, nightfallLine, openEyes } from "../game/script"
import type { IconName } from "../components/icons"
import { ROLE_ICON } from "../components/icons"
import { ActionBar, Button, Callout, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import type { Tone } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import type { ScreenProps } from "./props"

// Lines that open the night, on the first screen the GM sees
export function nightfall(state: GameState, firstScreenOfStep: boolean): string[] {
  const first = getNightSteps(state)[0] === state.currentPhase.type
  if (first && firstScreenOfStep) return [nightfallLine(state)]
  return []
}

// Who wakes up after this step, or dawn after the last one
function nextStep(state: GameState): { label: string; icon: IconName } {
  const steps = getNightSteps(state)
  const next = steps[steps.findIndex((step) => step === state.currentPhase.type) + 1]
  if (!next) return { label: "Continue to dawn", icon: "sunrise" }
  return { label: `Next: ${stepName(next, state.roleNames)}`, icon: ROLE_ICON[STEP_ROLE[next]] }
}

type NextStepButtonProps = ScreenProps & { tone?: Tone }

// Ends this step of the night, once the role's eyes are closed
export function NextStepButton({ state, dispatch, tone = "moon" }: NextStepButtonProps) {
  const next = nextStep(state)
  return (
    <Button
      tone={tone}
      icon={next.icon}
      onClick={() => dispatch({ type: "SKIP_TO_NEXT_PHASE" })}>
      {next.label}
    </Button>
  )
}

export function nightEyebrow(state: GameState): string {
  return `Night ${state.currentNight}`
}

type IdentifyStepProps = ScreenProps & {
  role: Role
  title: string
  lines: string[]
  instruction: string
  count?: number
  confirmLabel: (names: string[]) => string
  onConfirm: (ids: string[]) => void
  hint?: ReactNode
  tone?: Tone
}

// Night 1: the GM taps whoever opened their eyes for this role
export function IdentifyStep({
  state,
  role,
  title,
  lines,
  instruction,
  count = 1,
  confirmLabel,
  onConfirm,
  hint,
  tone = "moon",
}: IdentifyStepProps) {
  const [selected, setSelected] = useState<string[]>([])
  const rn = state.roleNames

  const identified = state.players.filter((p) => p.role !== null)
  const notes: Record<string, string> = {}
  for (const player of identified) notes[player.id] = roleName(player.role, rn)

  function handleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (count === 1) return [id]
      if (prev.length >= count) return prev
      return [...prev, id]
    })
  }

  const names = selected.map((id) => state.players.find((p) => p.id === id)?.name ?? "")
  const ready = selected.length === count

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`${nightEyebrow(state)} · Who is it?`}
          icon={ROLE_ICON[role]}
          title={title}
          tone={tone}
          role={role}
        />
        <ScriptCard
          lines={lines}
          tone={tone}
        />
        {hint}
        <Instruction>{instruction}</Instruction>
        <PlayerGrid
          players={state.players}
          selectedIds={selected}
          onSelect={handleSelect}
          disabledIds={identified.map((p) => p.id)}
          notes={notes}
          tone={tone}
          showRoles={state.showRoleBadges}
          babyWolfPlayerId={state.babyWolfPlayerId}
        />
      </Screen>
      <ActionBar>
        <Button
          tone={tone}
          disabled={!ready}
          icon={ready && ROLE_ICON[role]}
          onClick={() => onConfirm(selected)}>
          {ready && confirmLabel(names)}
          {!ready && count > 1 && `Pick ${count - selected.length} more`}
          {!ready && count === 1 && "Tap a player"}
        </Button>
      </ActionBar>
    </>
  )
}

type CloseEyesStepProps = ScreenProps & {
  role: NightRole
  title: string
  subtitle: string
  tone?: Tone
  muted?: boolean
}

// After a role's turn, its own screen: the game master tells them to close their eyes, then goes on
export function CloseEyesStep({
  state,
  dispatch,
  role,
  title,
  subtitle,
  tone = "moon",
  muted = false,
}: CloseEyesStepProps) {
  let buttonTone: Tone = "moon"
  if (muted) buttonTone = "mist"
  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON[role]}
          title={title}
          subtitle={subtitle}
          tone={tone}
          muted={muted}
          role={role}
        />
        <ScriptCard
          lines={[closeEyes(state, role)]}
          tone={tone}
        />
      </Screen>
      <ActionBar>
        <NextStepButton
          state={state}
          dispatch={dispatch}
          tone={buttonTone}
        />
      </ActionBar>
    </>
  )
}

type DeadRoleStepProps = ScreenProps & {
  role: NightRole
  opening: string[]
}

// A dead role is still called, so the table can't tell who died: eyes open, a pause, then eyes closed
export function DeadRoleStep({ state, dispatch, role, opening }: DeadRoleStepProps) {
  const name = roleName(role, state.roleNames)
  if (hasHadTurn(state)) {
    return (
      <CloseEyesStep
        state={state}
        dispatch={dispatch}
        role={role}
        title={name}
        subtitle={`The ${name} is dead.`}
        tone="mist"
        muted
      />
    )
  }
  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON[role]}
          title={name}
          subtitle={`The ${name} is dead.`}
          tone="mist"
          muted
          role={role}
        />
        <ScriptCard
          lines={[...opening, openEyes(state, role)]}
          tone="mist"
        />
        <Callout
          icon="mask"
          title="Pretend">
          Nobody will open their eyes. Wait a few seconds, as if the {name} were choosing, so nobody can tell
          they&apos;re gone.
        </Callout>
      </Screen>
      <ActionBar>
        <Button
          tone="mist"
          onClick={() => dispatch({ type: "CALL_DEAD_ROLE" })}>
          Continue
        </Button>
      </ActionBar>
    </>
  )
}
