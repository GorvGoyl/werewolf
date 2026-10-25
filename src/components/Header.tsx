import type { ReactNode } from "react"
import type { GameState } from "../game/types"
import { isNightStep } from "../game/reducer"
import { cx } from "../lib/cx"
import type { IconName } from "./icons"
import { Icon } from "./icons"
import type { Tone } from "./ui"
import { toneText } from "./ui"
import { NightProgress } from "./NightProgress"

type PhaseLabel = { icon: IconName; tone: Tone; text: string }

function phaseLabel(state: GameState): PhaseLabel {
  const phase = state.currentPhase
  if (phase.type === "setup") return { icon: "users", tone: "moon", text: "Players" }
  if (phase.type === "role_config") return { icon: "mask", tone: "moon", text: "Roles" }
  if (phase.type === "night_results") return { icon: "sunrise", tone: "sun", text: "Dawn" }
  if (phase.type === "day_vote") return { icon: "sun", tone: "sun", text: `Day ${state.currentDay}` }
  if (phase.type === "game_over" && phase.winner === "village") return { icon: "flag", tone: "leaf", text: "Game over" }
  if (phase.type === "game_over") return { icon: "flag", tone: "blood", text: "Game over" }
  return { icon: "moon", tone: "moon", text: `Night ${state.currentNight}` }
}

type Props = {
  state: GameState
  canUndo: boolean
  onUndo: () => void
  onOpenRoles: () => void
  onOpenHistory: () => void
  onOpenMenu: () => void
}

export function Header({ state, canUndo, onUndo, onOpenRoles, onOpenHistory, onOpenMenu }: Props) {
  const phase = state.currentPhase
  const inGame = phase.type !== "setup" && phase.type !== "role_config"
  const night = isNightStep(phase) || phase.type === "night_results"
  const label = phaseLabel(state)
  const phaseText = (
    <>
      <Icon
        name={label.icon}
        className={cx("size-[18px]", toneText(label.tone))}
      />
      <span className="truncate">{label.text}</span>
    </>
  )

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-white/5 bg-night-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-md items-center gap-1 px-2">
        <HeaderButton
          onClick={onUndo}
          disabled={!canUndo}
          label="Undo the last step">
          <Icon
            name="undo"
            className="size-5"
          />
          {/* On narrow phones the arrow alone leaves room for the phase */}
          <span className="max-[400px]:sr-only">Undo</span>
        </HeaderButton>
        <div className="flex min-w-0 flex-1 justify-center">
          {/* The phase opens the story so far, night by night and day by day */}
          {inGame && (
            <button
              type="button"
              onClick={onOpenHistory}
              aria-label={`${label.text}: see what happened so far`}
              aria-haspopup="dialog"
              className="flex h-11 min-w-0 items-center gap-1.5 rounded-full pl-3 pr-2 text-[15px] font-semibold text-mist-100 active:scale-[0.97] active:bg-white/10">
              {phaseText}
              <Icon
                name="chevronDown"
                className="size-4 text-mist-400"
                strokeWidth={2.5}
              />
            </button>
          )}
          {!inGame && (
            <div className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold text-mist-200">{phaseText}</div>
          )}
        </div>
        {inGame && (
          <HeaderButton
            onClick={onOpenRoles}
            label="See every player's role"
            highlight>
            <Icon
              name="mask"
              className="size-5"
            />
            Roles
          </HeaderButton>
        )}
        <HeaderButton
          onClick={onOpenMenu}
          label="Menu">
          <Icon
            name="dots"
            className="size-6"
          />
        </HeaderButton>
      </div>
      {night && <NightProgress state={state} />}
    </header>
  )
}

type HeaderButtonProps = {
  onClick: () => void
  disabled?: boolean
  label: string
  highlight?: boolean
  children: ReactNode
}

function HeaderButton({ onClick, disabled = false, label, highlight = false, children }: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cx(
        "flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-[15px] font-semibold active:scale-[0.97] disabled:opacity-35",
        highlight && "border border-moon-500/40 bg-moon-500/15 text-moon-300 active:bg-moon-500/25",
        !highlight && "text-mist-300 active:bg-white/10",
      )}>
      {children}
    </button>
  )
}
