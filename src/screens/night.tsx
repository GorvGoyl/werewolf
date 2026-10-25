import type { ReactNode } from "react"
import { useState } from "react"
import type { GameState, Role } from "../game/types"
import { ROLE_EMOJI, roleName } from "../game/roles"
import { getNightSteps } from "../game/reducer"
import { ActionBar, Button, Callout, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import type { Tone } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import type { ScreenProps } from "./props"

export const NIGHTFALL = "Night falls. Everyone, close your eyes."

// Lines that open the night, on the first screen the GM sees
export function nightfall(state: GameState, firstScreenOfStep: boolean): string[] {
  const first = getNightSteps(state)[0] === state.currentPhase.type
  if (first && firstScreenOfStep) return [NIGHTFALL]
  return []
}

export function isLastNightStep(state: GameState): boolean {
  const steps = getNightSteps(state)
  return steps[steps.length - 1] === state.currentPhase.type
}

export function nightEyebrow(state: GameState): string {
  return `Night ${state.currentNight}`
}

// "Ana", "Ana and Ben", "Ana, Ben and Cleo"
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("")
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

type IdentifyStepProps = ScreenProps & {
  role: Role
  title: string
  lines: string[]
  after?: string[]
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
  after,
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
          emoji={ROLE_EMOJI[role]}
          title={title}
          tone={tone}
        />
        <ScriptCard
          lines={lines}
          after={after}
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
          onClick={() => onConfirm(selected)}>
          {ready && confirmLabel(names)}
          {!ready && count > 1 && `Pick ${count - selected.length} more`}
          {!ready && count === 1 && "Tap a player"}
        </Button>
      </ActionBar>
    </>
  )
}

type DeadRoleStepProps = ScreenProps & {
  role: Role
  opening: string[]
}

// A dead role is still called, so the table can't tell who died
export function DeadRoleStep({ state, dispatch, role, opening }: DeadRoleStepProps) {
  const name = roleName(role, state.roleNames)
  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          emoji={ROLE_EMOJI[role]}
          title={name}
          subtitle={`The ${name} is dead.`}
          tone="mist"
        />
        <ScriptCard
          lines={[...opening, `${name}, open your eyes.`]}
          after={[`${name}, close your eyes.`]}
          tone="mist"
        />
        <Callout
          icon="🤫"
          title="Pretend">
          Call the {name} anyway and wait a few seconds, so nobody can tell they're gone.
        </Callout>
      </Screen>
      <ActionBar>
        <Button
          tone="mist"
          onClick={() => dispatch({ type: "SKIP_TO_NEXT_PHASE" })}>
          Continue
        </Button>
      </ActionBar>
    </>
  )
}
