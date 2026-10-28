import { useState } from "react"
import type { Death, GameState } from "../game/types"
import { roleName } from "../game/roles"
import { hasHadTurn } from "../game/reducer"
import { getPlayersInDanger } from "../game/deaths"
import { alivePlayers, findRole, playerName } from "../game/selectors"
import { causeText } from "../game/text"
import { killQuestion, noPotionsLine, openEyes, saveQuestion } from "../game/script"
import { ActionBar, Button, Instruction, Screen, ScreenTitle, ScriptCard } from "../components/ui"
import type { Tone } from "../components/ui"
import { PlayerGrid } from "../components/PlayerGrid"
import { Icon, ROLE_ICON } from "../components/icons"
import { asList, cx } from "../lib/cx"
import { haptic } from "../lib/haptics"
import { CloseEyesStep, DeadRoleStep, IdentifyStep, WakeStep, needsWake, nightEyebrow } from "./night"
import type { ScreenProps } from "./props"

// One potion at a time: the save potion's question, then the kill potion's, each on its own screen
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
        lines={[openEyes(state, "wizard")]}
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
      />
    )
  }

  if (needsWake(state)) {
    return (
      <WakeStep
        state={state}
        dispatch={dispatch}
        role="wizard"
        title={name}
        subtitle={`${wizard.name} wakes up.`}
      />
    )
  }

  if (hasHadTurn(state)) {
    return (
      <CloseEyesStep
        state={state}
        dispatch={dispatch}
        role="wizard"
        title={name}
        subtitle={potionsUsed(state, wizard.name)}
      />
    )
  }

  // A used-up potion isn't asked about
  if (state.currentNightEvent.wizardSaved === undefined && !state.wizardSavePotionUsed) {
    return (
      <SavePotion
        state={state}
        dispatch={dispatch}
      />
    )
  }
  if (!state.wizardKillPotionUsed) {
    return (
      <KillPotion
        state={state}
        dispatch={dispatch}
      />
    )
  }
  return (
    <NoPotions
      state={state}
      dispatch={dispatch}
    />
  )
}

// What the Wizard did tonight
function potionsUsed(state: GameState, who: string): string {
  const saved = playerName(state, state.currentNightEvent.wizardSaved)
  const poisoned = playerName(state, state.currentNightEvent.wizardKilled)
  if (saved && poisoned) return `${who} saved ${saved} and poisoned ${poisoned}.`
  if (saved) return `${who} saved ${saved}.`
  if (poisoned) return `${who} poisoned ${poisoned}.`
  return `${who} used no potion.`
}

type PotionTitleProps = { state: GameState; subtitle: string }

function PotionTitle({ state, subtitle }: PotionTitleProps) {
  return (
    <ScreenTitle
      eyebrow={nightEyebrow(state)}
      icon={ROLE_ICON.wizard}
      title={roleName("wizard", state.roleNames)}
      subtitle={subtitle}
      role="wizard"
    />
  )
}

function saveLabel(state: GameState, saveId: string | null, dying: number): string {
  if (saveId) return `Save ${playerName(state, saveId)}`
  if (dying === 0) return "Next"
  return "Don't save anyone"
}

function SavePotion({ state, dispatch }: ScreenProps) {
  const [saveId, setSaveId] = useState<string | null>(null)
  const wizard = findRole(state, "wizard")
  const danger = getPlayersInDanger(state.players, state.currentNightEvent)

  // Saving the attacked Courtesan also saves her guest
  const courtesan = findRole(state, "courtesan")
  const guestAtRisk = danger.find((d) => d.cause === "at_courtesan")

  let tone: Tone = "moon"
  if (saveId) tone = "leaf"

  return (
    <>
      <Screen>
        <PotionTitle
          state={state}
          subtitle={`${wizard?.name} decides on the save potion.`}
        />
        <ScriptCard lines={[saveQuestion(state, danger.length)]} />
        {danger.length > 0 && (
          <>
            <Instruction>Point at who&apos;s dying, then tap the answer</Instruction>
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
          </>
        )}
      </Screen>
      <ActionBar>
        <Button
          tone={tone}
          icon={saveId !== null && "heal"}
          onClick={() => dispatch({ type: "WIZARD_SAVE", playerId: saveId })}>
          {saveLabel(state, saveId, danger.length)}
        </Button>
      </ActionBar>
    </>
  )
}

function KillPotion({ state, dispatch }: ScreenProps) {
  const [killId, setKillId] = useState<string | null>(null)
  const wizard = findRole(state, "wizard")
  const targets = alivePlayers(state).filter((p) => p.id !== wizard?.id)

  // Tapping the same player again takes it back
  function toggle(id: string) {
    setKillId((current) => {
      if (current === id) return null
      return id
    })
  }

  let tone: Tone = "moon"
  if (killId) tone = "blood"

  return (
    <>
      <Screen>
        <PotionTitle
          state={state}
          subtitle={`${wizard?.name} decides on the kill potion.`}
        />
        <ScriptCard lines={[killQuestion(state)]} />
        <Instruction tone="blood">Tap who they point at, if anyone</Instruction>
        <PlayerGrid
          players={targets}
          selectedIds={asList(killId)}
          onSelect={toggle}
          tone="blood"
          showRoles={state.showRoleBadges}
          babyWolfPlayerId={state.babyWolfPlayerId}
        />
      </Screen>
      <ActionBar>
        <Button
          tone={tone}
          icon={killId !== null && "poison"}
          onClick={() => dispatch({ type: "WIZARD_KILL", playerId: killId })}>
          {killId && `Poison ${playerName(state, killId)}`}
          {!killId && "Don't poison anyone"}
        </Button>
      </ActionBar>
    </>
  )
}

// Both potions are used up, and the Wizard still hears so, like on any other night
function NoPotions({ state, dispatch }: ScreenProps) {
  const wizard = findRole(state, "wizard")
  return (
    <>
      <Screen>
        <PotionTitle
          state={state}
          subtitle={`${wizard?.name} has no potions left.`}
        />
        <ScriptCard lines={[noPotionsLine(state)]} />
      </Screen>
      <ActionBar>
        <Button onClick={() => dispatch({ type: "WIZARD_KILL", playerId: null })}>Next</Button>
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
