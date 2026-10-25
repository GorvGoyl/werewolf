import type { ReactNode } from "react"
import { useState } from "react"
import type { Platform } from "../lib/install"
import { dismissInstallHint, isInstallHintDismissed, useInstallState } from "../lib/install"
import type { IconName } from "./icons"
import { Icon } from "./icons"
import { Button, IconTile, Sheet } from "./ui"

type Step = { text: ReactNode }

function steps(platform: Platform): Step[] {
  if (platform === "firefox-android") {
    return [
      { text: <>Tap Firefox&apos;s menu button <Key>⋮</Key> (top or bottom of the screen).</> },
      {
        text: (
          <>
            Tap <Key>Install</Key>. Some versions call it <Key>Add app to Home screen</Key>.
          </>
        ),
      },
      { text: <>Confirm with <Key>Add</Key>.</> },
    ]
  }
  if (platform === "ios") {
    return [
      { text: <>Tap the Share button (a square with an arrow).</> },
      { text: <>Scroll down and tap <Key>Add to Home Screen</Key>.</> },
      { text: <>Tap <Key>Add</Key>.</> },
    ]
  }
  if (platform === "android") {
    return [
      { text: <>Open your browser&apos;s menu <Key>⋮</Key>.</> },
      { text: <>Tap <Key>Install app</Key> or <Key>Add to Home screen</Key>.</> },
    ]
  }
  return [
    { text: <>Open this page in Chrome or Edge.</> },
    { text: <>Click the install icon at the right end of the address bar.</> },
    { text: <>Firefox and Safari on computers can&apos;t install web apps.</> },
  ]
}

function Key({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-md border border-white/15 bg-night-700 px-1.5 py-0.5 font-semibold text-mist-100">
      {children}
    </span>
  )
}

const BENEFITS: Array<{ icon: IconName; text: string }> = [
  { icon: "phone", text: "Opens full screen, like any app" },
  { icon: "wifiOff", text: "Works without internet once installed" },
  { icon: "users", text: "Keeps the same saved names and game" },
]

type SheetProps = { onClose: () => void; onInstall: () => void }

// How to install when the browser has no install dialog of its own (Firefox, Safari)
export function InstallSheet({ onClose, onInstall }: SheetProps) {
  const { canPrompt, platform, installed } = useInstallState()
  return (
    <Sheet
      title="Install the app"
      subtitle="Werewolf GM on your home screen"
      onClose={onClose}>
      <ul className="mb-5 space-y-3 text-[16px] text-mist-200">
        {BENEFITS.map((benefit) => (
          <li
            key={benefit.text}
            className="flex items-center gap-3">
            <IconTile
              icon={benefit.icon}
              tone="moon"
              size="sm"
            />
            {benefit.text}
          </li>
        ))}
      </ul>

      {installed && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-leaf-500/30 bg-leaf-500/10 px-4 py-3.5 text-[16px] font-semibold text-leaf-400">
          <Icon
            name="checkCircle"
            className="size-5"
          />
          Installed. Open it from your home screen.
        </div>
      )}
      {!installed && canPrompt && (
        <Button
          icon="install"
          onClick={onInstall}>
          Install now
        </Button>
      )}
      {!installed && !canPrompt && (
        <ol className="space-y-3">
          {steps(platform).map((step, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl border border-white/5 bg-night-800/80 px-4 py-3 text-[16px] leading-relaxed text-mist-200">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-moon-500/25 text-[14px] font-bold text-moon-300">
                {i + 1}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  )
}

type BannerProps = { onInstall: () => void }

// A one-time nudge on the players screen; the menu always has "Install app" too
export function InstallBanner({ onInstall }: BannerProps) {
  const { installed, canPrompt, platform } = useInstallState()
  const [dismissed, setDismissed] = useState(isInstallHintDismissed)

  if (installed || dismissed) return null
  if (!canPrompt && platform === "desktop") return null

  function dismiss() {
    dismissInstallHint()
    setDismissed(true)
  }

  return (
    <div className="mb-5 flex animate-pop items-center gap-3 rounded-2xl border border-moon-500/30 bg-moon-500/10 py-2.5 pl-3 pr-1">
      <IconTile
        icon="install"
        tone="moon"
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-mist-100">Install the app</div>
        <div className="text-[13px] leading-snug text-mist-300">Home screen icon, works offline</div>
      </div>
      <button
        type="button"
        onClick={onInstall}
        className="h-11 shrink-0 rounded-xl bg-moon-500 px-4 text-[15px] font-bold text-white active:bg-moon-600">
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide install suggestion"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-mist-400 active:bg-white/5">
        <Icon
          name="x"
          className="size-5"
        />
      </button>
    </div>
  )
}
