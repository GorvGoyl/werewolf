import { useEffect, useState } from "react"
import type { RoleNames } from "./game/types"
import { readGuideCards } from "./game/storage"
import { HowToPlay } from "./components/HowToPlay"
import { IconTile } from "./components/ui"

// What the cards are called, from the link. A link opened while the page is open only changes the #.
function useGuideCards(): RoleNames {
  const [roleNames, setRoleNames] = useState(() => readGuideCards(window.location.hash))
  useEffect(() => {
    const update = () => setRoleNames(readGuideCards(window.location.hash))
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  return roleNames
}

// How to play on a page of its own, for the players to read before game night (see guideLink).
// It never reads or saves a game on the phone that opens it.
export function HowToPlayPage() {
  const roleNames = useGuideCards()
  return (
    <div className="min-h-dvh">
      <div className="sky sky-night" />
      <main className="pt-safe mx-auto w-full max-w-md animate-rise px-4 pb-12">
        <header className="flex flex-col items-center pb-8 pt-10 text-center">
          <img
            src="/favicon.svg"
            alt=""
            width="64"
            height="64"
            className="size-16"
          />
          <div className="mt-4 text-[12px] font-bold uppercase tracking-[0.16em] text-moon-300">Werewolf</div>
          <h1 className="text-[34px] font-extrabold leading-tight tracking-tight text-mist-100">How to play</h1>
          <p className="mt-1 text-[16px] leading-snug text-mist-300">Everything you need for your first game</p>
        </header>

        <HowToPlay roleNames={roleNames} />

        <div className="mt-10 rounded-3xl border border-moon-500/30 bg-moon-500/10 p-5">
          <div className="flex items-center gap-3.5">
            <IconTile
              icon="gameMaster"
              tone="moon"
            />
            <h2 className="text-[19px] font-bold leading-tight text-mist-100">Game master tonight?</h2>
          </div>
          <p className="mt-3 text-[15px] leading-snug text-mist-300">
            This app tells you what to say, one line at a time. It keeps track of every card, works out who dies and
            times the day.
          </p>
          <a
            href="/"
            className="mt-4 flex min-h-[60px] w-full items-center justify-center rounded-2xl bg-moon-500 px-5 text-[17px] font-semibold text-white shadow-lg shadow-moon-500/25 active:scale-[0.98] active:bg-moon-600">
            Open Werewolf GM
          </a>
        </div>
      </main>
    </div>
  )
}
