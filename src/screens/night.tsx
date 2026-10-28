import type { ReactNode } from "react"
import { useState } from "react"
import type { GameState, Role } from "../game/types"
import { STEP_ROLE, roleName, stepName } from "../game/roles"
import { getNightSteps, hasHadTurn, hasSaid } from "../game/reducer"
import type { AskedRole, NightRole } from "../game/script"
import { closeEyes, nightQuestion, nightfallLine, openEyes } from "../game/script"
import type { IconName } from "../components/icons"
import { ROLE_ICON } from "../components/icons"
import { ActionBar, Button, Callout, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import type { Tone } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import type { ScreenProps } from "./props"

// Every line the game master reads gets a screen of its own, and the game moves on once the table
// has done what it said: the night starts with everyone closing their eyes...
export function needsNightfall(state: GameState): boolean {
  const first = getNightSteps(state)[0] === state.currentPhase.type
  return first && !hasSaid(state, "nightfall") && !hasHadTurn(state)
}

// ...and from Night 2 on, each role's turn starts with "open your eyes". On Night 1 they open their
// eyes to be identified instead.
export function needsWake(state: GameState): boolean {
  return state.currentNight > 1 && !hasSaid(state, "wake") && !hasHadTurn(state)
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

// Night falls: everyone closes their eyes before the first role wakes up
export function NightfallStep({ state, dispatch }: ScreenProps) {
  const first = getNightSteps(state)[0]
  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon="moon"
          title="Night falls"
        />
        <ScriptCard lines={[nightfallLine(state)]} />
        <Instruction icon="timer">Wait until everyone&apos;s eyes are closed</Instruction>
      </Screen>
      <ActionBar>
        <Button
          icon={ROLE_ICON[STEP_ROLE[first]]}
          onClick={() => dispatch({ type: "SAID", cue: "nightfall" })}>
          Next: {stepName(first, state.roleNames)}
        </Button>
      </ActionBar>
    </>
  )
}

// When nobody will answer, the game master waits anyway, so the table can't tell
export function Pretend({ children }: { children: ReactNode }) {
  return (
    <Callout
      icon="mask"
      title="Pretend">
      {children}
    </Callout>
  )
}

type WakeStepProps = ScreenProps & {
  role: NightRole
  title: string
  subtitle: string
  tone?: Tone
  // A dead role, called anyway: nobody will open their eyes
  muted?: boolean
  // What to do before they're called, like tapping a new wolf's shoulder
  hint?: ReactNode
}

// A role opens their eyes, then the next screen asks them what they do
export function WakeStep({ state, dispatch, role, title, subtitle, tone = "moon", muted = false, hint }: WakeStepProps) {
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
        {hint}
        <ScriptCard
          lines={[openEyes(state, role)]}
          tone={tone}
        />
        {!muted && <Instruction icon="timer">Wait until their eyes are open</Instruction>}
        {muted && (
          <Pretend>
            Nobody will open their eyes. Wait a few seconds anyway, so the table can&apos;t tell the{" "}
            {roleName(role, state.roleNames)} is gone.
          </Pretend>
        )}
      </Screen>
      <ActionBar>
        <Button
          tone={tone}
          onClick={() => dispatch({ type: "SAID", cue: "wake" })}>
          Next
        </Button>
      </ActionBar>
    </>
  )
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
        {/* A dead role has nobody to wait for */}
        {!muted && <Instruction icon="timer">Wait until their eyes are closed</Instruction>}
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
  role: AskedRole
  // What the living role does after hearing their question, like "choosing a guest"
  busy: string
}

// A dead role is called with the same lines as a living one, so the table can't tell who died: eyes
// open, their question and a pause, then eyes closed, each on its own screen
export function DeadRoleStep({ state, dispatch, role, busy }: DeadRoleStepProps) {
  const name = roleName(role, state.roleNames)
  const subtitle = `The ${name} is dead.`
  if (needsWake(state)) {
    return (
      <WakeStep
        state={state}
        dispatch={dispatch}
        role={role}
        title={name}
        subtitle={subtitle}
        tone="mist"
        muted
      />
    )
  }
  if (hasHadTurn(state)) {
    return (
      <CloseEyesStep
        state={state}
        dispatch={dispatch}
        role={role}
        title={name}
        subtitle={subtitle}
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
          subtitle={subtitle}
          tone="mist"
          muted
          role={role}
        />
        <ScriptCard
          lines={[nightQuestion(state, role)]}
          tone="mist"
        />
        <Pretend>
          Nobody will answer. Wait a few seconds, as if the {name} were {busy}, so the table can&apos;t tell
          they&apos;re gone.
        </Pretend>
      </Screen>
      <ActionBar>
        <Button
          tone="mist"
          onClick={() => dispatch({ type: "CALL_DEAD_ROLE" })}>
          Next
        </Button>
      </ActionBar>
    </>
  )
}
