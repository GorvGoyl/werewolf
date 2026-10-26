import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { getAudioContext, playEnd, playWarning } from "../lib/sound"
import { cx } from "../lib/cx"
import { haptic } from "../lib/haptics"
import type { IconName } from "../components/icons"
import { Icon } from "../components/icons"

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
    // The phone buzzes too, for when its sound is off
    if (!warnedRef.current && left <= Math.floor(totalRef.current * 0.2)) {
      warnedRef.current = true
      const ctx = getAudioContext()
      if (ctx && left > 0) playWarning(ctx)
      if (left > 0) haptic(200)
    }
    if (left <= 0) {
      stopTicking()
      setStatus("done")
      const ctx = getAudioContext()
      if (ctx) playEnd(ctx)
      haptic([300, 150, 300, 150, 300])
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
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/5 bg-night-800/80 py-3 pl-4 pr-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-mist-100">
            <Icon
              name="timer"
              className="size-6"
            />
            Discussion timer
          </div>
          <div className="mt-2 flex items-center gap-1">
            <MinuteButton
              label="One minute less"
              icon="minus"
              disabled={minutes <= 1}
              onClick={() => onMinutesChange(minutes - 1)}
            />
            <span className="w-16 text-center text-[16px] font-semibold tabular-nums text-mist-100">{minutes} min</span>
            <MinuteButton
              label="One minute more"
              icon="plus"
              disabled={minutes >= 15}
              onClick={() => onMinutesChange(minutes + 1)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic(15)
            start()
          }}
          className="flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-sun-400 pl-4 pr-5 text-[17px] font-bold text-night-950 active:scale-[0.97] active:bg-sun-500">
          <Icon
            name="play"
            className="size-5"
          />
          Start
        </button>
      </div>
    )
  }

  const progress = 1 - remaining / Math.max(1, totalRef.current)
  const warning = status === "running" && progress >= 0.8
  const done = status === "done"

  // Pinned under the header, so it stays in sight while you scroll to the players
  return (
    <div
      className={cx(
        "sticky top-[calc(env(safe-area-inset-top)+4rem)] z-10 mb-5 overflow-hidden rounded-2xl border bg-night-850 shadow-lg shadow-black/50",
        done && "border-blood-500/50",
        warning && "border-sun-400/40",
        !done && !warning && "border-white/10",
      )}>
      <div
        className={cx("flex items-center gap-2 py-3 pl-4 pr-3", done && "bg-blood-500/15", warning && "bg-sun-400/10")}>
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
              "text-[44px] font-bold leading-none tabular-nums",
              done && "text-blood-400",
              warning && "text-sun-300",
              !done && !warning && "text-mist-100",
            )}>
            {formatTime(remaining)}
          </div>
        </div>
        {status === "running" && (
          <TimerButton
            icon="pause"
            onClick={pause}>
            Pause
          </TimerButton>
        )}
        {status === "paused" && (
          <TimerButton
            icon="play"
            onClick={resume}>
            Resume
          </TimerButton>
        )}
        <TimerButton
          icon="replay"
          onClick={reset}>
          Reset
        </TimerButton>
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

type MinuteButtonProps = { label: string; icon: IconName; disabled: boolean; onClick: () => void }

function MinuteButton({ label, icon, disabled, onClick }: MinuteButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-xl bg-night-700 text-mist-100 active:scale-95 active:bg-night-600 disabled:text-mist-500 disabled:active:scale-100">
      <Icon
        name={icon}
        className="size-5"
        strokeWidth={2.5}
      />
    </button>
  )
}

type TimerButtonProps = { icon: IconName; onClick: () => void; children: ReactNode }

function TimerButton({ icon, onClick, children }: TimerButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic()
        onClick()
      }}
      className="flex h-14 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-night-800 px-2 text-[12px] font-semibold text-mist-200 active:scale-95 active:bg-night-700">
      <Icon
        name={icon}
        className="size-5"
      />
      {children}
    </button>
  )
}
