import type { GameState, NightStep, RoleNames } from "../game/types"
import { roleName, rolePlural } from "../game/roles"
import { getNightSteps } from "../game/reducer"
import { cx } from "../lib/cx"
import type { IconName } from "./icons"
import { Icon, ROLE_ICON } from "./icons"

const STEP_ICON: Record<NightStep, IconName> = {
  night_courtesan: ROLE_ICON.courtesan,
  night_baby_wolf: ROLE_ICON.baby_wolf,
  night_wolves: ROLE_ICON.wolf,
  night_wizard: ROLE_ICON.wizard,
  night_seer: ROLE_ICON.seer,
}

const GLOW = {
  moon: "border-moon-400 bg-moon-500/30 shadow-[0_0_14px_rgba(139,124,246,0.55)]",
  blood: "border-blood-400 bg-blood-500/30 shadow-[0_0_14px_rgba(244,63,94,0.5)]",
  sun: "border-sun-400 bg-sun-400/25 shadow-[0_0_14px_rgba(251,191,36,0.45)]",
}

// The step being played glows in its role's color
const STEP_GLOW: Record<NightStep, string> = {
  night_courtesan: GLOW.moon,
  night_baby_wolf: GLOW.sun,
  night_wolves: GLOW.blood,
  night_wizard: GLOW.moon,
  night_seer: GLOW.moon,
}

function stepName(step: NightStep, rn: RoleNames): string {
  if (step === "night_courtesan") return roleName("courtesan", rn)
  if (step === "night_baby_wolf") return roleName("baby_wolf", rn)
  if (step === "night_wolves") return rolePlural("wolf", rn)
  if (step === "night_wizard") return roleName("wizard", rn)
  return roleName("seer", rn)
}

function ariaStep(isCurrent: boolean): "step" | undefined {
  if (isCurrent) return "step"
  return undefined
}

type Item = { key: string; icon: IconName; label: string; glow: string }

type Props = { state: GameState }

// The night's wake-up order: done steps faded, the current one glowing, the rest in grey
export function NightProgress({ state }: Props) {
  const steps = getNightSteps(state)
  const phase = state.currentPhase.type
  let current = steps.indexOf(phase as NightStep)
  if (phase === "night_results") current = steps.length

  const items: Item[] = [
    ...steps.map((step) => ({
      key: step,
      icon: STEP_ICON[step],
      label: stepName(step, state.roleNames),
      glow: STEP_GLOW[step],
    })),
    { key: "dawn", icon: "sunrise", label: "Dawn", glow: GLOW.sun },
  ]

  return (
    <ol
      aria-label="Night order"
      className="mx-auto flex max-w-md items-center px-4 pb-3 pt-0.5">
      {items.map((item, index) => (
        <li
          key={item.key}
          className={cx("flex items-center", index > 0 && "flex-1")}>
          {index > 0 && (
            <span
              aria-hidden
              className={cx(
                "mx-1 h-0.5 flex-1 rounded-full",
                index <= current && "bg-moon-500/70",
                index > current && "bg-white/10",
              )}
            />
          )}
          <span
            title={item.label}
            aria-label={item.label}
            aria-current={ariaStep(index === current)}
            className={cx(
              "flex size-10 shrink-0 items-center justify-center rounded-full border transition-all",
              index === current && cx("scale-110", item.glow),
              index < current && "border-moon-500/40 bg-moon-500/10 opacity-60",
              index > current && "border-white/10 bg-night-800/60 opacity-40 grayscale",
            )}>
            <Icon
              name={item.icon}
              className="size-[30px]"
            />
          </span>
        </li>
      ))}
    </ol>
  )
}
