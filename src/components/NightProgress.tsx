import type { GameState, NightStep, Role } from "../game/types"
import { STEP_ROLE, stepName } from "../game/roles"
import { getNightSteps } from "../game/reducer"
import { cx } from "../lib/cx"
import { useShowRole } from "../lib/useShowRole"
import type { IconName } from "./icons"
import { Icon, ROLE_ICON } from "./icons"

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

type StepState = "done" | "current" | "next"

function stepState(index: number, current: number): StepState {
  if (index < current) return "done"
  if (index === current) return "current"
  return "next"
}

function ariaStep(state: StepState): "step" | undefined {
  if (state === "current") return "step"
  return undefined
}

type Item = { key: string; icon: IconName; label: string; glow: string; role?: Role }

type Props = { state: GameState }

// The night's wake-up order: done steps faded, the current one glowing, the rest in grey.
// Tapping a role says what it does.
export function NightProgress({ state }: Props) {
  const steps = getNightSteps(state)
  const phase = state.currentPhase.type
  let current = steps.indexOf(phase as NightStep)
  if (phase === "night_results") current = steps.length

  const items: Item[] = [
    ...steps.map((step) => ({
      key: step,
      icon: ROLE_ICON[STEP_ROLE[step]],
      label: stepName(step, state.roleNames),
      glow: STEP_GLOW[step],
      role: STEP_ROLE[step],
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
          <StepIcon
            item={item}
            state={stepState(index, current)}
          />
        </li>
      ))}
    </ol>
  )
}

type StepIconProps = { item: Item; state: StepState }

function StepIcon({ item, state }: StepIconProps) {
  const showRole = useShowRole()
  const role = item.role
  const className = cx(
    "flex size-10 shrink-0 items-center justify-center rounded-full border transition-all",
    state === "current" && cx("scale-110", item.glow),
    state === "done" && "border-moon-500/40 bg-moon-500/10 opacity-60",
    state === "next" && "border-white/10 bg-night-800/60 opacity-40 grayscale",
  )
  const icon = (
    <Icon
      name={item.icon}
      className="size-[30px]"
    />
  )
  if (!role) {
    return (
      <span
        title={item.label}
        aria-label={item.label}
        aria-current={ariaStep(state)}
        className={className}>
        {icon}
      </span>
    )
  }
  // The touch area reaches past the circle, to a full fingertip
  return (
    <button
      type="button"
      title={item.label}
      aria-label={`${item.label}: what they do`}
      aria-haspopup="dialog"
      aria-current={ariaStep(state)}
      onClick={() => showRole(role)}
      className={cx(className, "relative after:absolute after:-inset-1 active:brightness-125")}>
      {icon}
    </button>
  )
}
