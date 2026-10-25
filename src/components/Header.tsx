import type { ReactNode } from "react"
import { useState } from "react"
import type { GameState } from "../game/types"
import { isNightStep } from "../game/reducer"
import { cx } from "../lib/cx"
import { NightProgress } from "./NightProgress"

function phaseLabel(state: GameState): string {
  const phase = state.currentPhase
  if (phase.type === "setup") return "Players"
  if (phase.type === "role_config") return "Roles"
  if (phase.type === "night_results") return `🌅 Dawn · Night ${state.currentNight}`
  if (phase.type === "day_vote") return `☀️ Day ${state.currentDay}`
  if (phase.type === "game_over") return "🏁 Game over"
  return `🌙 Night ${state.currentNight}`
}

type Props = {
  state: GameState
  canUndo: boolean
  onUndo: () => void
  onOpenRoles: () => void
  onOpenRules: () => void
  onOpenRoleNames: () => void
  onNewGame: () => void
  onCopyState: () => void
}

export function Header({
  state,
  canUndo,
  onUndo,
  onOpenRoles,
  onOpenRules,
  onOpenRoleNames,
  onNewGame,
  onCopyState,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const phase = state.currentPhase
  const inGame = phase.type !== "setup" && phase.type !== "role_config"
  const night = isNightStep(phase) || phase.type === "night_results"

  function choose(action: () => void) {
    setMenuOpen(false)
    action()
  }

  // The menu lives outside <header>: its backdrop blur would trap fixed-position children
  return (
    <>
      <header className="pt-safe sticky top-0 z-30 border-b border-white/5 bg-night-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-md items-center gap-1.5 px-2.5">
          <HeaderButton
            onClick={onUndo}
            disabled={!canUndo}
            label="Undo the last step">
            <UndoIcon />
            Undo
          </HeaderButton>
          <div className="min-w-0 flex-1 truncate text-center text-[14px] font-semibold text-mist-200">
            {phaseLabel(state)}
          </div>
          {inGame && (
            <HeaderButton
              onClick={onOpenRoles}
              label="See every player's role"
              highlight>
              <span aria-hidden>👥</span>
              Roles
            </HeaderButton>
          )}
          <HeaderButton
            onClick={() => setMenuOpen(!menuOpen)}
            label="Menu">
            <MenuIcon />
          </HeaderButton>
        </div>
        {night && <NightProgress state={state} />}
      </header>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-40 mx-auto flex max-w-md justify-end px-2.5">
            <div className="w-64 animate-pop overflow-hidden rounded-2xl border border-white/10 bg-night-800 py-1.5 shadow-2xl shadow-black/50">
              <MenuItem
                icon="📖"
                onClick={() => choose(onOpenRules)}>
                How to play
              </MenuItem>
              <MenuItem
                icon="✏️"
                onClick={() => choose(onOpenRoleNames)}>
                Rename roles
              </MenuItem>
              {inGame && (
                <MenuItem
                  icon="👥"
                  onClick={() => choose(onOpenRoles)}>
                  Everyone&apos;s roles
                </MenuItem>
              )}
              <div className="my-1.5 border-t border-white/5" />
              <MenuItem
                icon="✨"
                hint="Same players, new roles"
                onClick={() => choose(onNewGame)}>
                New game
              </MenuItem>
              <div className="my-1.5 border-t border-white/5" />
              <MenuItem
                icon="📋"
                hint="For bug reports"
                onClick={() => choose(onCopyState)}>
                Copy game data
              </MenuItem>
            </div>
          </div>
        </>
      )}
    </>
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
        "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold active:scale-[0.97] disabled:opacity-35",
        highlight && "border border-moon-500/40 bg-moon-500/15 text-moon-300 active:bg-moon-500/25",
        !highlight && "text-mist-300 active:bg-white/10",
      )}>
      {children}
    </button>
  )
}

type MenuItemProps = { icon: string; hint?: string; onClick: () => void; children: ReactNode }

function MenuItem({ icon, hint, onClick, children }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-white/5">
      <span
        className="w-6 text-center text-lg"
        aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-mist-100">{children}</span>
        {hint && <span className="block text-[12px] text-mist-400">{hint}</span>}
      </span>
    </button>
  )
}

function UndoIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden>
      <circle
        cx="5"
        cy="12"
        r="2"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
      />
      <circle
        cx="19"
        cy="12"
        r="2"
      />
    </svg>
  )
}
