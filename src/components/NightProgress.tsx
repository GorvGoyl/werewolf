import type { GameState, NightStep, RoleNames } from "../game/types"
import { ROLE_BADGE, roleName, rolePlural } from "../game/roles"
import { getNightSteps } from "../game/reducer"
import { cx } from "../lib/cx"

const STEP_ICON: Record<NightStep, string> = {
  night_courtesan: ROLE_BADGE.courtesan,
  night_baby_wolf: ROLE_BADGE.baby_wolf,
  night_wolves: ROLE_BADGE.wolf,
  night_wizard: ROLE_BADGE.wizard,
  night_seer: ROLE_BADGE.seer,
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

type Props = { state: GameState }

// The night's wake-up order, with the current step highlighted
export function NightProgress({ state }: Props) {
  const steps = getNightSteps(state)
  const phase = state.currentPhase.type
  let current = steps.indexOf(phase as NightStep)
  if (phase === "night_results") current = steps.length

  const items = [
    ...steps.map((step) => ({ key: step, icon: STEP_ICON[step], label: stepName(step, state.roleNames) })),
    { key: "dawn", icon: "🌅", label: "Dawn" },
  ]

  return (
    <ol
      aria-label="Night order"
      className="mx-auto flex max-w-md items-center px-4 pb-2.5">
      {items.map((item, index) => (
        <li
          key={item.key}
          className={cx("flex items-center", index > 0 && "flex-1")}>
          {index > 0 && (
            <span
              aria-hidden
              className={cx("mx-1 h-0.5 flex-1 rounded-full", index <= current && "bg-moon-500/70", index > current && "bg-white/10")}
            />
          )}
          <span
            title={item.label}
            aria-label={item.label}
            aria-current={ariaStep(index === current)}
            className={cx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[15px] transition-all",
              index === current && "scale-110 border-moon-400 bg-moon-500/25 shadow-[0_0_14px_rgba(139,124,246,0.55)]",
              index < current && "border-moon-500/40 bg-moon-500/10 opacity-60",
              index > current && "border-white/10 bg-night-800/60 opacity-50 grayscale",
            )}>
            {item.icon}
          </span>
        </li>
      ))}
    </ol>
  )
}
