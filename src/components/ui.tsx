import type { ReactNode } from "react"
import { cx } from "../lib/cx"

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

export function toneText(tone: Tone): string {
  return TEXT[tone]
}

type ScreenProps = { children: ReactNode }

export function Screen({ children }: ScreenProps) {
  return <main className="mx-auto w-full max-w-md animate-rise px-4 pb-52 pt-4">{children}</main>
}

type ScreenTitleProps = {
  eyebrow?: string
  emoji?: string
  title: string
  subtitle?: ReactNode
  tone?: Tone
}

export function ScreenTitle({ eyebrow, emoji, title, subtitle, tone = "moon" }: ScreenTitleProps) {
  return (
    <header className="mb-4">
      {eyebrow && (
        <div className={cx("text-[11px] font-semibold uppercase tracking-[0.18em]", TEXT[tone])}>{eyebrow}</div>
      )}
      <h1 className="mt-1 flex items-center gap-2 text-[26px] font-bold leading-tight tracking-tight text-mist-100">
        {emoji && <span aria-hidden>{emoji}</span>}
        <span>{title}</span>
      </h1>
      {subtitle && <div className="mt-1 text-[15px] leading-snug text-mist-300">{subtitle}</div>}
    </header>
  )
}

type ScriptCardProps = {
  lines: string[]
  after?: string[]
  tone?: Tone
}

// What the game master reads out loud
export function ScriptCard({ lines, after = [], tone = "moon" }: ScriptCardProps) {
  return (
    <section
      aria-label="Say out loud"
      className={cx("mb-4 rounded-2xl border-l-4 bg-night-800/80 px-4 py-3.5 shadow-sm", SCRIPT_BORDER[tone])}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-mist-400">
        <SpeakerIcon />
        Say
      </div>
      <div className="space-y-1.5">
        {lines.map((line) => (
          <p
            key={line}
            className="font-script text-[18px] italic leading-snug text-mist-100">
            “{line}”
          </p>
        ))}
      </div>
      {after.length > 0 && (
        <div className="mt-2.5 border-t border-white/5 pt-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-mist-500">Then</div>
          {after.map((line) => (
            <p
              key={line}
              className="font-script text-[16px] italic leading-snug text-mist-300">
              “{line}”
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

function SpeakerIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a10 10 0 0 1 0 14" />
    </svg>
  )
}

type InstructionProps = { children: ReactNode; tone?: Tone }

// What the game master should tap
export function Instruction({ children, tone = "sun" }: InstructionProps) {
  return (
    <p className={cx("mb-3 flex items-center gap-2 text-[15px] font-semibold", TEXT[tone])}>
      <span aria-hidden>👆</span>
      <span>{children}</span>
    </p>
  )
}

type CalloutProps = {
  tone?: Tone
  icon?: string
  title?: ReactNode
  children?: ReactNode
}

export function Callout({ tone = "mist", icon, title, children }: CalloutProps) {
  return (
    <div className={cx("mb-3 flex gap-3 rounded-2xl border px-3.5 py-3", CALLOUT[tone])}>
      {icon && (
        <div
          className="pt-0.5 text-lg leading-none"
          aria-hidden>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {title && <div className={cx("text-sm font-semibold", TEXT[tone])}>{title}</div>}
        {children && <div className="mt-0.5 text-[13px] leading-snug text-mist-300">{children}</div>}
      </div>
    </div>
  )
}

type ActionBarProps = { children: ReactNode }

// Thumb-reachable buttons pinned to the bottom of the screen
export function ActionBar({ children }: ActionBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-night-950 from-55% to-transparent pt-10">
      <div className="pb-safe pointer-events-auto mx-auto flex w-full max-w-md flex-col gap-2 px-4">{children}</div>
    </div>
  )
}

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  tone?: Tone
  variant?: "primary" | "secondary" | "ghost"
  className?: string
  type?: "button" | "submit"
}

function buttonClasses(variant: ButtonProps["variant"], tone: Tone, disabled: boolean): string {
  if (variant === "ghost") return "text-mist-300 active:text-mist-100 active:bg-white/5"
  if (variant === "secondary") return "border border-white/10 bg-night-800/90 text-mist-200 active:bg-night-700"
  if (disabled) return "bg-night-700 text-mist-500"
  return PRIMARY_BUTTON[tone]
}

export function Button({
  children,
  onClick,
  disabled = false,
  tone = "moon",
  variant = "primary",
  className,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-[16px] font-semibold transition-[transform,background-color] duration-100 active:scale-[0.98] disabled:active:scale-100",
        buttonClasses(variant, tone, disabled),
        className,
      )}>
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
  sm: "h-7 w-7 text-[13px]",
  md: "h-9 w-9 text-[15px]",
  lg: "h-12 w-12 text-[20px]",
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

type SectionLabelProps = { children: ReactNode; action?: ReactNode }

export function SectionLabel({ children, action }: SectionLabelProps) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist-400">{children}</div>
      {action}
    </div>
  )
}

type SwitchProps = { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; hint?: ReactNode }

export function Switch({ checked, onChange, label, hint }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-night-800/80 px-4 py-3 text-left active:bg-night-700">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-mist-100">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-mist-400">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked && "bg-moon-500",
          !checked && "bg-night-600",
        )}>
        <span
          className={cx(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left]",
            checked && "left-6",
            !checked && "left-1",
          )}
        />
      </span>
    </button>
  )
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
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-40 flex animate-fade flex-col bg-night-950">
      <div className="pt-safe border-b border-white/5">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-mist-100">{title}</h2>
            {subtitle && <div className="text-[13px] text-mist-400">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-night-800 px-4 text-sm font-semibold text-mist-200 active:bg-night-700">
            {closeLabel}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-md animate-rise px-4 pb-10 pt-4">{children}</div>
      </div>
      {footer && (
        <div className="pb-safe border-t border-white/5 bg-night-950">
          <div className="mx-auto flex w-full max-w-md gap-2 px-4 pt-3">{footer}</div>
        </div>
      )}
    </div>
  )
}

type StatProps = { value: number; label: string; tone: Tone }

export function Stat({ value, label, tone }: StatProps) {
  return (
    <div className="flex-1 text-center">
      <div className={cx("text-2xl font-bold tabular-nums", TEXT[tone])}>{value}</div>
      <div className="text-[12px] text-mist-400">{label}</div>
    </div>
  )
}
