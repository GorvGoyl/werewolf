import { useEffect, useRef, useState } from "react"
import { getAudioContext, playEnd, playWarning } from "../lib/sound"
import { cx } from "../lib/cx"

type Status = "idle" | "running" | "paused" | "done"

type Props = {
  minutes: number
  onMinutesChange: (minutes: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function statusText(status: Status, warning: boolean): string {
  if (status === "done") return "Time's up!"
  if (status === "paused") return "Paused"
  if (warning) return "Hurry up!"
  return "Discussion"
}

export function DayTimer({ minutes, onMinutesChange }: Props) {
  const [status, setStatus] = useState<Status>("idle")
  const [remaining, setRemaining] = useState(minutes * 60)
  const endAtRef = useRef(0)
  const totalRef = useRef(minutes * 60)
  const warnedRef = useRef(false)
  const intervalRef = useRef<number | null>(null)

  function stopTicking() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    intervalRef.current = null
  }

  // Counts against the clock, so it stays right even if the phone throttles timers
  function tick() {
    const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
    setRemaining(left)
    if (!warnedRef.current && left <= Math.floor(totalRef.current * 0.2)) {
      warnedRef.current = true
      const ctx = getAudioContext()
      if (ctx && left > 0) playWarning(ctx)
    }
    if (left <= 0) {
      stopTicking()
      setStatus("done")
      const ctx = getAudioContext()
      if (ctx) playEnd(ctx)
    }
  }

  function startTicking() {
    stopTicking()
    intervalRef.current = window.setInterval(tick, 250)
  }

  function start() {
    const total = minutes * 60
    totalRef.current = total
    endAtRef.current = Date.now() + total * 1000
    warnedRef.current = false
    getAudioContext()
    setRemaining(total)
    setStatus("running")
    startTicking()
  }

  function pause() {
    stopTicking()
    setRemaining(Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000)))
    setStatus("paused")
  }

  function resume() {
    endAtRef.current = Date.now() + remaining * 1000
    getAudioContext()
    setStatus("running")
    startTicking()
  }

  function reset() {
    stopTicking()
    setStatus("idle")
    setRemaining(minutes * 60)
  }

  // Stop the interval when the screen goes away
  useEffect(() => stopTicking, [])

  if (status === "idle") {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-night-800/80 px-3.5 py-3">
        <span
          className="text-xl"
          aria-hidden>
          ⏱️
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-mist-100">Discussion timer</div>
          <div className="flex items-center gap-1 pt-1">
            <MinuteButton
              label="One minute less"
              disabled={minutes <= 1}
              onClick={() => onMinutesChange(minutes - 1)}>
              −
            </MinuteButton>
            <span className="w-14 text-center text-[15px] font-semibold tabular-nums text-mist-200">{minutes} min</span>
            <MinuteButton
              label="One minute more"
              disabled={minutes >= 15}
              onClick={() => onMinutesChange(minutes + 1)}>
              +
            </MinuteButton>
          </div>
        </div>
        <button
          type="button"
          onClick={start}
          className="h-11 rounded-xl bg-sun-400 px-5 text-[15px] font-bold text-night-950 active:bg-sun-500">
          Start
        </button>
      </div>
    )
  }

  const progress = 1 - remaining / Math.max(1, totalRef.current)
  const warning = status === "running" && progress >= 0.8
  const done = status === "done"

  return (
    <div
      className={cx(
        "mb-4 overflow-hidden rounded-2xl border",
        done && "border-blood-500/50 bg-blood-500/15",
        warning && "border-sun-400/40 bg-sun-400/10",
        !done && !warning && "border-white/5 bg-night-800/80",
      )}>
      <div className="flex items-center gap-3 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div
            className={cx(
              "text-[12px] font-semibold uppercase tracking-[0.14em]",
              done && "text-blood-400",
              warning && "text-sun-300",
              !done && !warning && "text-mist-400",
            )}>
            {statusText(status, warning)}
          </div>
          <div
            className={cx(
              "text-[40px] font-bold leading-none tabular-nums",
              done && "text-blood-400",
              warning && "text-sun-300",
              !done && !warning && "text-mist-100",
            )}>
            {formatTime(remaining)}
          </div>
        </div>
        {status === "running" && <TimerButton onClick={pause}>Pause</TimerButton>}
        {status === "paused" && <TimerButton onClick={resume}>Resume</TimerButton>}
        <TimerButton onClick={reset}>Reset</TimerButton>
      </div>
      <div className="h-1.5 bg-white/5">
        <div
          className={cx(
            "h-full transition-[width] duration-300",
            done && "bg-blood-500",
            warning && "bg-sun-400",
            !done && !warning && "bg-moon-500",
          )}
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
    </div>
  )
}

type MinuteButtonProps = { label: string; disabled: boolean; onClick: () => void; children: string }

function MinuteButton({ label, disabled, onClick, children }: MinuteButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-night-700 text-lg font-semibold text-mist-100 active:bg-night-600 disabled:text-mist-500">
      {children}
    </button>
  )
}

type TimerButtonProps = { onClick: () => void; children: string }

function TimerButton({ onClick, children }: TimerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 rounded-xl border border-white/10 bg-night-800 px-3.5 text-[14px] font-semibold text-mist-200 active:bg-night-700">
      {children}
    </button>
  )
}
