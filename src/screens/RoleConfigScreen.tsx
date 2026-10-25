import { useState } from "react"
import type { GameConfig, Role } from "../game/types"
import {
  ROLE_EMOJI,
  clampConfig,
  getLineup,
  getMaxWolves,
  isConfigValid,
  roleName,
  rolePlural,
} from "../game/roles"
import { ActionBar, Button, Callout, Screen, ScreenTitle, SectionLabel } from "../components/ui"
import { cx } from "../lib/cx"
import type { ScreenProps } from "./props"

type OptionalRoleKey = "hasQueenWolf" | "hasBabyWolf" | "hasCourtesan" | "hasWizard" | "hasSeer"

const OPTIONAL_ROLES: Array<{ key: OptionalRoleKey; role: Role; blurb: string }> = [
  { key: "hasQueenWolf", role: "queen_wolf", blurb: "A wolf the Seer can't see. Counts as one of the wolves." },
  { key: "hasBabyWolf", role: "baby_wolf", blurb: "A villager who joins the pack if the wolves bite them." },
  { key: "hasCourtesan", role: "courtesan", blurb: "Invites a guest each night. Her guest is safe from wolves." },
  { key: "hasWizard", role: "wizard", blurb: "One save potion and one kill potion for the whole game." },
  { key: "hasSeer", role: "seer", blurb: "Checks one player each night: wolf or not." },
]

export function RoleConfigScreen({ state, dispatch }: ScreenProps) {
  const playerCount = state.players.length
  const [config, setConfig] = useState<GameConfig>(() => clampConfig(state.gameConfig, playerCount))
  const rn = state.roleNames

  const maxWolves = getMaxWolves(config, playerCount)
  const valid = isConfigValid(config, playerCount)
  const lineup = getLineup(config, playerCount)

  function changeWolves(delta: number) {
    setConfig((prev) => {
      const next = prev.wolfCount + delta
      if (next < 1 || next > getMaxWolves(prev, playerCount)) return prev
      return { ...prev, wolfCount: next }
    })
  }

  function toggle(key: OptionalRoleKey) {
    setConfig((prev) => clampConfig({ ...prev, [key]: !prev[key] }, playerCount))
  }

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`${playerCount} players`}
          emoji="🃏"
          title="Roles in this game"
          subtitle="Match the cards you're dealing."
        />

        <div className="flex items-center gap-3 rounded-2xl border border-blood-500/25 bg-blood-500/10 px-4 py-3.5">
          <span
            className="text-3xl"
            aria-hidden>
            🐺
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold text-mist-100">{rolePlural("wolf", rn)}</div>
            <div className="text-[13px] text-mist-400">
              {config.hasQueenWolf && `Including the ${roleName("queen_wolf", rn)}`}
              {!config.hasQueenWolf && `Up to ${maxWolves} with ${playerCount} players`}
            </div>
          </div>
          <Stepper
            value={config.wolfCount}
            canDecrease={config.wolfCount > 1}
            canIncrease={config.wolfCount < maxWolves}
            onChange={changeWolves}
          />
        </div>

        <SectionLabel>Special roles</SectionLabel>
        <div className="space-y-2">
          {OPTIONAL_ROLES.map((option) => (
            <RoleToggle
              key={option.key}
              emoji={ROLE_EMOJI[option.role]}
              name={roleName(option.role, rn)}
              blurb={option.blurb}
              enabled={config[option.key]}
              onToggle={() => toggle(option.key)}
            />
          ))}
        </div>

        <SectionLabel>Cards to deal</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {lineup.map(({ role, count }) => (
            <span
              key={role}
              className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-night-800/80 px-3 text-[14px] font-semibold text-mist-200">
              <span aria-hidden>{ROLE_EMOJI[role]}</span>
              {roleName(role, rn)}
              {count > 1 && <span className="text-mist-400">×{count}</span>}
            </span>
          ))}
        </div>

        {!valid && (
          <div className="mt-4">
            <Callout
              tone="blood"
              icon="⚠️"
              title="Not enough players for these roles">
              Turn off a role or lower the number of wolves.
            </Callout>
          </div>
        )}
      </Screen>

      <ActionBar>
        <Button
          disabled={!valid}
          onClick={() => dispatch({ type: "SET_GAME_CONFIG", config })}>
          🌙 Start Night 1
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "BACK_TO_SETUP" })}>
          ← Players
        </Button>
      </ActionBar>
    </>
  )
}

type StepperProps = {
  value: number
  canDecrease: boolean
  canIncrease: boolean
  onChange: (delta: number) => void
}

function Stepper({ value, canDecrease, canIncrease, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-1">
      <StepButton
        label="Fewer wolves"
        disabled={!canDecrease}
        onClick={() => onChange(-1)}>
        −
      </StepButton>
      <div className="w-9 text-center text-2xl font-bold tabular-nums text-mist-100">{value}</div>
      <StepButton
        label="More wolves"
        disabled={!canIncrease}
        onClick={() => onChange(1)}>
        +
      </StepButton>
    </div>
  )
}

type StepButtonProps = { label: string; disabled: boolean; onClick: () => void; children: string }

function StepButton({ label, disabled, onClick, children }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-xl bg-night-700 text-2xl font-semibold text-mist-100 active:bg-night-600 disabled:bg-night-800 disabled:text-mist-500">
      {children}
    </button>
  )
}

type RoleToggleProps = {
  emoji: string
  name: string
  blurb: string
  enabled: boolean
  onToggle: () => void
}

function RoleToggle({ emoji, name, blurb, enabled, onToggle }: RoleToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cx(
        "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors active:scale-[0.99]",
        enabled && "border-moon-500/50 bg-moon-500/10",
        !enabled && "border-white/5 bg-night-800/60",
      )}>
      <span
        aria-hidden
        className={cx("w-14 whitespace-nowrap text-center text-[22px] tracking-tighter", !enabled && "opacity-40 grayscale")}>
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx("block text-[15px] font-semibold", enabled && "text-mist-100", !enabled && "text-mist-400")}>
          {name}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-mist-400">{blurb}</span>
      </span>
      <span
        aria-hidden
        className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors", enabled && "bg-moon-500", !enabled && "bg-night-600")}>
        <span
          className={cx(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]",
            enabled && "left-6",
            !enabled && "left-1",
          )}
        />
      </span>
    </button>
  )
}
