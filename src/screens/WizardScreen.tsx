import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import type { Death, GameState } from "../game/types"
import { roleName } from "../game/roles"
import { getPlayersInDanger } from "../game/deaths"
import { alivePlayers, findRole, playerName } from "../game/selectors"
import { causeText } from "../game/text"
import {
  ActionBar,
  Avatar,
  Button,
  Instruction,
  Screen,
  ScreenTitle,
  ScriptCard,
  SectionLabel,
} from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { Icon, ROLE_ICON } from "../components/icons"
import { asList, cx } from "../lib/cx"
import { haptic } from "../lib/haptics"
import { DeadRoleStep, IdentifyStep, nightEyebrow } from "./night"
import type { ScreenProps } from "./props"

export function WizardScreen({ state, dispatch }: ScreenProps) {
  const name = roleName("wizard", state.roleNames)
  const wizard = findRole(state, "wizard")

  if (!wizard) {
    return (
      <IdentifyStep
        key="identify-wizard"
        state={state}
        dispatch={dispatch}
        role="wizard"
        title={name}
        lines={[`${name}, open your eyes.`]}
        instruction="Tap the player who opened their eyes"
        confirmLabel={([who]) => `${who} is the ${name}`}
        onConfirm={([id]) => dispatch({ type: "ASSIGN_ROLE", playerId: id, role: "wizard" })}
      />
    )
  }

  // Died on an earlier night. One dying tonight is still alive here and gets a last-breath potion.
  if (!wizard.isAlive) {
    return (
      <DeadRoleStep
        state={state}
        dispatch={dispatch}
        role="wizard"
        opening={[]}
      />
    )
  }

  return (
    <WizardPotions
      state={state}
      dispatch={dispatch}
    />
  )
}

function wizardLines(state: GameState, danger: Death[]): string[] {
  const name = roleName("wizard", state.roleNames)
  const lines: string[] = []
  // On Night 1 the Wizard already opened their eyes to be identified
  if (state.currentNight > 1) lines.push(`${name}, open your eyes.`)
  if (!state.wizardSavePotionUsed) {
    if (danger.length === 0) lines.push("Nobody is dying tonight.")
    if (danger.length === 1) lines.push("This person is dying tonight. Do you want to save them?")
    if (danger.length > 1) lines.push("These people are dying tonight. Do you want to save one of them?")
  }
  if (!state.wizardKillPotionUsed) lines.push("Do you want to use your kill potion on anyone?")
  if (lines.length === 0) lines.push(`${name}, you have no potions left.`)
  return lines
}

function potionsLeft(name: string | undefined, canSave: boolean, canKill: boolean): string {
  if (!canSave && !canKill) return `${name} has no potions left.`
  return `${name} can use a potion.`
}

function confirmLabel(state: GameState, saveId: string | null, killId: string | null): string {
  const parts: string[] = []
  if (saveId) parts.push(`Save ${playerName(state, saveId)}`)
  if (killId) parts.push(`Kill ${playerName(state, killId)}`)
  if (parts.length === 0) return "No potion tonight"
  return parts.join(" · ")
}

function WizardPotions({ state, dispatch }: ScreenProps) {
  const [saveId, setSaveId] = useState<string | null>(null)
  const [killing, setKilling] = useState(false)
  const [killId, setKillId] = useState<string | null>(null)
  const killGridRef = useRef<HTMLDivElement>(null)

  // The players to poison open below the fold, so bring them into view
  useEffect(() => {
    if (killing) killGridRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [killing])

  const rn = state.roleNames
  const name = roleName("wizard", rn)
  const wizard = findRole(state, "wizard")
  const danger = getPlayersInDanger(state.players, state.currentNightEvent)
  const canSave = !state.wizardSavePotionUsed
  const canKill = !state.wizardKillPotionUsed

  // Saving the attacked Courtesan also saves her guest
  const courtesan = findRole(state, "courtesan")
  const guestAtRisk = danger.find((d) => d.cause === "at_courtesan")

  function toggleKilling() {
    if (killing) setKillId(null)
    setKilling(!killing)
  }

  const killTargets = alivePlayers(state).filter((p) => p.id !== wizard?.id)
  const waitingForKill = killing && !killId

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={nightEyebrow(state)}
          icon={ROLE_ICON.wizard}
          title={name}
          subtitle={potionsLeft(wizard?.name, canSave, canKill)}
        />
        <ScriptCard
          lines={wizardLines(state, danger)}
          after={[`${name}, close your eyes.`]}
        />

        <SectionLabel icon="skull">Dying tonight</SectionLabel>
        {danger.length === 0 && <EmptyNote>Nobody. The attack kills no one tonight.</EmptyNote>}
        {danger.length > 0 && (
          <div className="space-y-2">
            {danger.map((d) => (
              <DangerRow
                key={d.playerId}
                name={playerName(state, d.playerId)}
                cause={causeText(d.cause, rn)}
              />
            ))}
          </div>
        )}

        <SectionLabel icon="heal">Save potion</SectionLabel>
        {!canSave && <EmptyNote>Already used.</EmptyNote>}
        {canSave && danger.length === 0 && <EmptyNote>Nobody to save tonight.</EmptyNote>}
        {canSave && danger.length > 0 && (
          <div className="grid gap-2">
            {danger.map((d) => (
              <Choice
                key={d.playerId}
                selected={saveId === d.playerId}
                tone="leaf"
                onClick={() => setSaveId(d.playerId)}
                title={`Save ${playerName(state, d.playerId)}`}
                detail={saveDetail(state, d, courtesan?.id, guestAtRisk)}
              />
            ))}
            <Choice
              selected={saveId === null}
              tone="mist"
              onClick={() => setSaveId(null)}
              title="Don't save anyone"
            />
          </div>
        )}

        <SectionLabel icon="poison">Kill potion</SectionLabel>
        {!canKill && <EmptyNote>Already used.</EmptyNote>}
        {canKill && (
          <Choice
            selected={killing}
            tone="blood"
            onClick={toggleKilling}
            title="Use the kill potion"
            detail="Then tap who they point at"
          />
        )}
        {canKill && killing && (
          <div
            ref={killGridRef}
            className="mt-3 scroll-mb-44 scroll-mt-36">
            <Instruction tone="blood">Tap who the {name} wants to kill</Instruction>
            <PlayerGrid
              players={killTargets}
              selectedIds={asList(killId)}
              onSelect={setKillId}
              tone="blood"
              showRoles={state.showRoleBadges}
              babyWolfPlayerId={state.babyWolfPlayerId}
            />
          </div>
        )}
      </Screen>
      <ActionBar>
        <Button
          disabled={waitingForKill}
          icon={!waitingForKill && ROLE_ICON.wizard}
          onClick={() => dispatch({ type: "WIZARD_DECIDE", saveId, killId })}>
          {waitingForKill && "Tap who to kill"}
          {!waitingForKill && confirmLabel(state, saveId, killId)}
        </Button>
      </ActionBar>
    </>
  )
}

function saveDetail(
  state: GameState,
  death: Death,
  courtesanId: string | undefined,
  guestAtRisk: Death | undefined,
): string {
  const cause = causeText(death.cause, state.roleNames)
  if (death.playerId === courtesanId && death.cause === "wolves" && guestAtRisk) {
    return `${cause} · also saves ${playerName(state, guestAtRisk.playerId)}`
  }
  return cause
}

type DangerRowProps = { name: string; cause: string }

function DangerRow({ name, cause }: DangerRowProps) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-blood-500/25 bg-blood-500/10 px-3 py-2.5">
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-semibold text-mist-100">{name}</div>
        <div className="text-[14px] leading-snug text-blood-300">{cause}</div>
      </div>
      <Icon
        name="skull"
        className="size-8"
      />
    </div>
  )
}

type ChoiceProps = {
  selected: boolean
  tone: "leaf" | "blood" | "mist"
  onClick: () => void
  title: string
  detail?: string
}

const CHOICE_SELECTED = {
  leaf: "border-leaf-400 bg-leaf-500/15 ring-2 ring-leaf-400/30",
  blood: "border-blood-400 bg-blood-500/15 ring-2 ring-blood-400/30",
  mist: "border-mist-400 bg-white/10 ring-2 ring-white/15",
}

const CHOICE_DOT = {
  leaf: "border-leaf-400 bg-leaf-400",
  blood: "border-blood-400 bg-blood-400",
  mist: "border-mist-300 bg-mist-300",
}

function Choice({ selected, tone, onClick, title, detail }: ChoiceProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        haptic()
        onClick()
      }}
      className={cx(
        "flex min-h-16 w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left active:scale-[0.99]",
        selected && CHOICE_SELECTED[tone],
        !selected && "border-white/5 bg-night-800/80 active:bg-night-700",
      )}>
      <span
        aria-hidden
        className={cx(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-night-950",
          selected && CHOICE_DOT[tone],
          !selected && "border-night-500",
        )}>
        {selected && (
          <Icon
            name="check"
            className="size-3.5"
            strokeWidth={4}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-mist-100">{title}</span>
        {detail && <span className="block text-[14px] leading-snug text-mist-400">{detail}</span>}
      </span>
    </button>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-night-800/50 px-4 py-3.5 text-[15px] text-mist-400">{children}</div>
}
