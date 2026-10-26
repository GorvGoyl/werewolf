import type { PointerEvent, ReactNode } from "react"
import { useEffect, useRef } from "react"
import type { Player, Role } from "../game/types"
import { cx } from "../lib/cx"
import { haptic } from "../lib/haptics"
import type { IconName } from "./icons"
import { Icon, ROLE_ICON, isGlyph } from "./icons"

export type Tone = "moon" | "blood" | "sun" | "leaf" | "mist"

const PRIMARY_BUTTON: Record<Tone, string> = {
  moon: "bg-moon-500 text-white shadow-lg shadow-moon-500/25 active:bg-moon-600",
  blood: "bg-blood-500 text-white shadow-lg shadow-blood-500/25 active:bg-blood-600",
  sun: "bg-sun-400 text-night-950 shadow-lg shadow-sun-400/20 active:bg-sun-500",
  leaf: "bg-leaf-500 text-night-950 shadow-lg shadow-leaf-500/20 active:bg-leaf-600",
  mist: "bg-night-600 text-mist-100 active:bg-night-500",
}

const TEXT: Record<Tone, string> = {
  moon: "text-moon-300",
  blood: "text-blood-400",
  sun: "text-sun-300",
  leaf: "text-leaf-400",
  mist: "text-mist-300",
}

const SCRIPT_BORDER: Record<Tone, string> = {
  moon: "border-moon-500/70",
  blood: "border-blood-500/70",
  sun: "border-sun-400/70",
  leaf: "border-leaf-500/70",
  mist: "border-night-500",
}

const CALLOUT: Record<Tone, string> = {
  moon: "border-moon-500/30 bg-moon-500/10",
  blood: "border-blood-500/30 bg-blood-500/10",
  sun: "border-sun-400/30 bg-sun-400/10",
  leaf: "border-leaf-500/30 bg-leaf-500/10",
  mist: "border-white/10 bg-white/5",
}

const TILE: Record<Tone, string> = {
  moon: "bg-moon-500/15 ring-moon-400/25",
  blood: "bg-blood-500/15 ring-blood-400/25",
  sun: "bg-sun-400/15 ring-sun-400/25",
  leaf: "bg-leaf-500/15 ring-leaf-400/25",
  mist: "bg-white/5 ring-white/10",
}

// Wolves red, the Baby Wolf amber, village roles green, villagers plain
export const ROLE_TONE: Record<Role, Tone> = {
  queen_wolf: "blood",
  wolf: "blood",
  baby_wolf: "sun",
  courtesan: "leaf",
  wizard: "leaf",
  seer: "leaf",
  villager: "mist",
}

// A Baby Wolf who joined the pack is a wolf now, so red
export function playerTone(player: Player): Tone {
  if (player.role === null) return "mist"
  return ROLE_TONE[player.role]
}

export function toneText(tone: Tone): string {
  return TEXT[tone]
}

type ScreenProps = { children: ReactNode }

export function Screen({ children }: ScreenProps) {
  return <main className="mx-auto w-full max-w-md animate-rise px-4 pb-56 pt-5">{children}</main>
}

const TILE_SIZE = {
  sm: "size-10 rounded-xl",
  md: "size-12 rounded-2xl",
  lg: "size-16 rounded-[22px]",
  xl: "size-24 rounded-full",
}

const TILE_ICON = {
  sm: "size-7",
  md: "size-[34px]",
  lg: "size-12",
  xl: "size-[68px]",
}

type IconTileProps = { icon: IconName; tone?: Tone; size?: keyof typeof TILE_SIZE; muted?: boolean }

// A picture on a soft colored square: how the app marks roles, steps and results. Muted is grey, for the dead.
export function IconTile({ icon, tone = "mist", size = "md", muted = false }: IconTileProps) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center justify-center ring-1 ring-inset",
        TILE[tone],
        TILE_SIZE[size],
        muted && "grayscale",
      )}>
      <Icon
        name={icon}
        className={TILE_ICON[size]}
      />
    </span>
  )
}

type ScreenTitleProps = {
  eyebrow?: string
  icon?: IconName
  title: string
  subtitle?: ReactNode
  tone?: Tone
  muted?: boolean
}

export function ScreenTitle({ eyebrow, icon, title, subtitle, tone = "moon", muted = false }: ScreenTitleProps) {
  return (
    <header className="mb-5">
      <div className="flex items-center gap-3.5">
        {icon && (
          <IconTile
            icon={icon}
            tone={tone}
            size="lg"
            muted={muted}
          />
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div className={cx("text-[12px] font-bold uppercase tracking-[0.16em]", TEXT[tone])}>{eyebrow}</div>
          )}
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-mist-100">{title}</h1>
        </div>
      </div>
      {subtitle && <div className="mt-2.5 text-[16px] leading-snug text-mist-300">{subtitle}</div>}
    </header>
  )
}

type ScriptCardProps = {
  lines: string[]
  after?: string[]
  tone?: Tone
}

// What the game master reads out loud, big enough to read in a dark room
export function ScriptCard({ lines, after = [], tone = "moon" }: ScriptCardProps) {
  return (
    <section
      aria-label="Say out loud"
      className={cx("mb-5 rounded-2xl border-l-4 bg-night-800/80 px-4 py-4 shadow-sm", SCRIPT_BORDER[tone])}>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-mist-400">
        <Icon
          name="megaphone"
          className="size-[18px]"
        />
        Say
      </div>
      <div className="space-y-2">
        {lines.map((line) => (
          <p
            key={line}
            className="font-script text-[20px] italic leading-snug text-mist-100">
            “{line}”
          </p>
        ))}
      </div>
      {after.length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-2.5">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-mist-400">Then</div>
          {after.map((line) => (
            <p
              key={line}
              className="font-script text-[17px] italic leading-snug text-mist-300">
              “{line}”
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

type InstructionProps = { children: ReactNode; tone?: Tone }

// What the game master should tap
export function Instruction({ children, tone = "sun" }: InstructionProps) {
  return (
    <p className={cx("mb-3 flex items-center gap-2 text-[16px] font-semibold", TEXT[tone])}>
      <Icon
        name="tap"
        className="size-6"
      />
      <span>{children}</span>
    </p>
  )
}

type CalloutProps = {
  tone?: Tone
  icon?: IconName
  title?: ReactNode
  children?: ReactNode
}

export function Callout({ tone = "mist", icon, title, children }: CalloutProps) {
  return (
    <div className={cx("mb-3 flex gap-3 rounded-2xl border px-4 py-3.5", CALLOUT[tone])}>
      {icon && (
        <Icon
          name={icon}
          className="-my-0.5 size-8"
        />
      )}
      <div className="min-w-0 flex-1">
        {title && <div className={cx("text-[15px] font-semibold leading-snug", TEXT[tone])}>{title}</div>}
        {children && <div className={cx("text-[14px] leading-snug text-mist-300", !!title && "mt-1")}>{children}</div>}
      </div>
    </div>
  )
}

type ActionBarProps = { children: ReactNode }

// Thumb-reachable buttons pinned to the bottom of the screen
export function ActionBar({ children }: ActionBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-night-950 from-60% to-transparent pt-10">
      <div className="pb-safe pointer-events-auto mx-auto flex w-full max-w-md flex-col gap-1.5 px-4">{children}</div>
    </div>
  )
}

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: Tone
  variant?: "primary" | "secondary" | "ghost"
  icon?: IconName | false
  className?: string
  type?: "button" | "submit"
}

function buttonClasses(variant: ButtonProps["variant"], tone: Tone, disabled: boolean): string {
  if (variant === "ghost") return "min-h-12 text-[16px] text-mist-300 active:bg-white/5 active:text-mist-100"
  if (variant === "secondary") {
    return "min-h-[60px] border border-white/10 bg-night-800/90 text-[17px] text-mist-200 active:bg-night-700"
  }
  if (disabled) return "min-h-[60px] bg-night-700 text-[17px] text-mist-500"
  return cx("min-h-[60px] text-[17px]", PRIMARY_BUTTON[tone])
}

export function Button({
  children,
  onClick,
  disabled = false,
  tone = "moon",
  variant = "primary",
  icon,
  className,
  type = "button",
}: ButtonProps) {
  function handleClick() {
    if (variant === "primary") haptic(15)
    onClick?.()
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={cx(
        "flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-center font-semibold leading-tight transition-[transform,background-color] duration-100 active:scale-[0.98] disabled:active:scale-100",
        buttonClasses(variant, tone, disabled),
        className,
      )}>
      {icon && <ButtonIcon name={icon} />}
      {children}
    </button>
  )
}

// A picture sits on a dark disc so it shows on every button color; a plain glyph takes the text color
function ButtonIcon({ name }: { name: IconName }) {
  if (isGlyph(name)) {
    return (
      <Icon
        name={name}
        className="size-[22px]"
      />
    )
  }
  return (
    <span className="-my-1 -ml-1.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-night-950/30">
      <Icon
        name={name}
        className="size-7"
      />
    </span>
  )
}

type TextButtonProps = { icon: IconName; onClick: () => void; tone?: Tone; children: ReactNode }

// A small action beside a section label, with a full-size touch area
export function TextButton({ icon, onClick, tone = "mist", children }: TextButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "-my-2.5 flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold active:bg-white/5",
        TEXT[tone],
      )}>
      <Icon
        name={icon}
        className="size-[18px]"
      />
      {children}
    </button>
  )
}

const AVATAR_COLORS = ["#7c6cf6", "#e0557a", "#22b07d", "#e39b2d", "#3c9be0", "#b45ad6", "#d9673a", "#3fb0b0"]

function avatarColor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

type AvatarProps = { name: string; size?: "sm" | "md" | "lg" }

const AVATAR_SIZE = {
  sm: "size-8 text-[14px]",
  md: "size-10 text-[17px]",
  lg: "size-16 text-[26px]",
}

export function Avatar({ name, size = "md" }: AvatarProps) {
  const color = avatarColor(name)
  return (
    <span
      aria-hidden
      className={cx("flex shrink-0 items-center justify-center rounded-full font-bold text-white", AVATAR_SIZE[size])}
      style={{ backgroundColor: `${color}cc`, boxShadow: `inset 0 0 0 1px ${color}` }}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

type SectionLabelProps = { children: ReactNode; icon?: IconName; action?: ReactNode }

export function SectionLabel({ children, icon, action }: SectionLabelProps) {
  return (
    <div className="mb-2.5 mt-6 flex min-h-6 items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-mist-400">
        {icon && (
          <Icon
            name={icon}
            className="size-[22px]"
          />
        )}
        {children}
      </div>
      {action && <div className="-mr-3 flex items-center">{action}</div>}
    </div>
  )
}

type RoleChipProps = { role: Role; label: string; count?: number }

// A role and how many cards of it are in play
export function RoleChip({ role, label, count = 1 }: RoleChipProps) {
  return (
    <span className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-night-800/80 pl-1.5 pr-3.5 text-[14px] font-semibold text-mist-200">
      <Icon
        name={ROLE_ICON[role]}
        className="size-8"
      />
      {label}
      {count > 1 && <span className="text-mist-400">×{count}</span>}
    </span>
  )
}

type SwitchTrackProps = { on: boolean }

export function SwitchTrack({ on }: SwitchTrackProps) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative h-8 w-[52px] shrink-0 rounded-full transition-colors",
        on && "bg-moon-500",
        !on && "bg-night-600",
      )}>
      <span
        className={cx(
          "absolute left-1 top-1 size-6 rounded-full bg-white shadow transition-transform",
          on && "translate-x-5",
        )}
      />
    </span>
  )
}

type SwitchProps = { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; hint?: ReactNode }

export function Switch({ checked, onChange, label, hint }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        haptic()
        onChange(!checked)
      }}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-white/5 bg-night-800/80 px-4 py-3 text-left active:bg-night-700">
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-mist-100">{label}</span>
        {hint && <span className="mt-0.5 block text-[14px] leading-snug text-mist-400">{hint}</span>}
      </span>
      <SwitchTrack on={checked} />
    </button>
  )
}

// Escape closes a panel, for people on a computer
function useEscape(onClose: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])
}

type SheetProps = {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  closeLabel?: string
  children: ReactNode
  footer?: ReactNode
}

// A full-screen panel on top of the game
export function Sheet({ title, subtitle, onClose, closeLabel = "Close", children, footer }: SheetProps) {
  useEscape(onClose)
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-40 flex animate-sheet flex-col bg-night-950">
      <div className="pt-safe border-b border-white/5">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 py-3 pl-4 pr-3">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-tight tracking-tight text-mist-100">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[14px] text-mist-400">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-night-800 text-mist-200 ring-1 ring-inset ring-white/10 active:bg-night-700">
            <Icon
              name="x"
              className="size-5"
            />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-md px-4 pb-10 pt-4">{children}</div>
      </div>
      {footer && (
        <div className="pb-safe border-t border-white/5 bg-night-950">
          <div className="mx-auto flex w-full max-w-md gap-2 px-4 pt-3">{footer}</div>
        </div>
      )}
    </div>
  )
}

type BottomSheetProps = { label: string; onClose: () => void; children: ReactNode }

// A panel that slides up within thumb reach. Tap outside it or drag it down to close.
export function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; offset: number } | null>(null)
  useEscape(onClose)

  function move(offset: number) {
    const panel = panelRef.current
    if (!panel) return
    panel.style.transition = "none"
    panel.style.transform = `translateY(${offset}px)`
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const offset = Math.max(0, event.clientY - drag.startY)
    // A finger that barely moved is still tapping a button
    if (drag.offset === 0 && offset < 8) return
    if (drag.offset === 0) event.currentTarget.setPointerCapture(event.pointerId)
    drag.offset = offset
    move(offset)
  }

  function handlePointerUp() {
    const drag = dragRef.current
    const panel = panelRef.current
    dragRef.current = null
    if (!drag || !panel || drag.offset === 0) return
    panel.style.transition = ""
    if (drag.offset < panel.offsetHeight / 4) {
      panel.style.transform = ""
      return
    }
    panel.style.transform = "translateY(100%)"
    window.setTimeout(onClose, 180)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade cursor-default touch-none bg-black/60"
      />
      <div
        ref={panelRef}
        onPointerDown={(event) => (dragRef.current = { startY: event.clientY, offset: 0 })}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="pb-safe relative mx-auto w-full max-w-md animate-sheet-up touch-none rounded-t-[28px] border-t border-white/10 bg-night-850 px-3 pt-2.5 shadow-2xl shadow-black transition-transform duration-200">
        <div
          aria-hidden
          className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/20"
        />
        {children}
      </div>
    </div>
  )
}

type StatProps = { value: number; label: string; tone: Tone; icon: IconName }

export function Stat({ value, label, tone, icon }: StatProps) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className={cx("flex items-center gap-2 text-[26px] font-bold tabular-nums", TEXT[tone])}>
        <Icon
          name={icon}
          className="size-7"
        />
        {value}
      </div>
      <div className="text-[13px] text-mist-400">{label}</div>
    </div>
  )
}
