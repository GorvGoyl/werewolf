import { useState } from "react"
import type { GameConfig, Role } from "../game/types"
import {
  clampConfig,
  getLineup,
  getMaxWolves,
  isConfigValid,
  roleName,
  rolePlural,
} from "../game/roles"
import { Icon, ROLE_ICON } from "../components/icons"
import type { IconName } from "../components/icons"
import type { Tone } from "../components/ui"
import {
  ActionBar,
  Button,
  Callout,
  IconTile,
  ROLE_TONE,
  RoleChip,
  Screen,
  ScreenTitle,
  SectionLabel,
  SwitchTrack,
} from "../components/ui"
import { cx } from "../lib/cx"
import { haptic } from "../lib/haptics"
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
          icon="cards"
          title="Roles in this game"
          subtitle="Match the cards you're dealing."
        />

        <div className="flex items-center gap-3 rounded-2xl border border-blood-500/25 bg-blood-500/10 py-3 pl-3 pr-2.5">
          <IconTile
            icon={ROLE_ICON.wolf}
            tone="blood"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-semibold text-mist-100">{rolePlural("wolf", rn)}</div>
            <div className="text-[13px] leading-snug text-mist-400">
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
              role={option.role}
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
            <RoleChip
              key={role}
              role={role}
              label={roleName(role, rn)}
              count={count}
            />
          ))}
        </div>

        {!valid && (
          <div className="mt-4">
            <Callout
              tone="blood"
              icon="warning"
              title="Not enough players for these roles">
              Turn off a role or lower the number of wolves.
            </Callout>
          </div>
        )}
      </Screen>

      <ActionBar>
        <Button
          disabled={!valid}
          icon="moon"
          onClick={() => dispatch({ type: "SET_GAME_CONFIG", config })}>
          Start Night 1
        </Button>
        <Button
          variant="ghost"
          icon="arrowLeft"
          onClick={() => dispatch({ type: "BACK_TO_SETUP" })}>
          Players
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
        icon="minus"
        disabled={!canDecrease}
        onClick={() => onChange(-1)}
      />
      <div className="w-8 text-center text-[26px] font-bold tabular-nums text-mist-100">{value}</div>
      <StepButton
        label="More wolves"
        icon="plus"
        disabled={!canIncrease}
        onClick={() => onChange(1)}
      />
    </div>
  )
}

type StepButtonProps = { label: string; icon: IconName; disabled: boolean; onClick: () => void }

function StepButton({ label, icon, disabled, onClick }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        haptic()
        onClick()
      }}
      className="flex size-11 items-center justify-center rounded-xl bg-night-700 text-mist-100 active:scale-95 active:bg-night-600 disabled:bg-night-800 disabled:text-mist-500 disabled:active:scale-100">
      <Icon
        name={icon}
        className="size-5"
        strokeWidth={2.5}
      />
    </button>
  )
}

type RoleToggleProps = {
  role: Role
  name: string
  blurb: string
  enabled: boolean
  onToggle: () => void
}

function RoleToggle({ role, name, blurb, enabled, onToggle }: RoleToggleProps) {
  let tone: Tone = "mist"
  if (enabled) tone = ROLE_TONE[role]
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => {
        haptic()
        onToggle()
      }}
      className={cx(
        "flex min-h-[76px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors active:scale-[0.99]",
        enabled && "border-moon-500/50 bg-moon-500/10",
        !enabled && "border-white/5 bg-night-800/60",
      )}>
      <span className={cx("transition-[opacity,filter]", !enabled && "opacity-50 grayscale")}>
        <IconTile
          icon={ROLE_ICON[role]}
          tone={tone}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx("block text-[16px] font-semibold", enabled && "text-mist-100", !enabled && "text-mist-400")}>
          {name}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-mist-400">{blurb}</span>
      </span>
      <SwitchTrack on={enabled} />
    </button>
  )
}
