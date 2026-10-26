import type { ReactNode } from "react"
import { useId } from "react"
import type { Player, Role } from "../game/types"
import { cx } from "../lib/cx"
import type { ArtName } from "./art"
import { ART } from "./art"

// Small controls stay plain outlines in the text color; everything with a meaning is a full-color picture (art.tsx)
const GLYPHS = {
  check: <path d="m5 12.5 5 5 9-10.5" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14m-7-7h14" />,
  minus: <path d="M5 12h14" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  replay: <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5m0-5v5h5" />,
  play: (
    <path
      fill="currentColor"
      d="M7.5 4.9v14.2a1 1 0 0 0 1.5.9l11-7.1a1.1 1.1 0 0 0 0-1.8L9 4a1 1 0 0 0-1.5.9Z"
    />
  ),
  pause: (
    <path
      fill="currentColor"
      d="M7 4.5h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Zm8 0h2a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
    />
  ),
  dots: (
    <path
      fill="currentColor"
      stroke="none"
      d="M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"
    />
  ),
} satisfies Record<string, ReactNode>

type GlyphName = keyof typeof GLYPHS

export type IconName = GlyphName | ArtName

export function isGlyph(name: IconName): name is GlyphName {
  return name in GLYPHS
}

type Props = { name: IconName; className?: string; strokeWidth?: number }

// Decorative: the text next to it, or the button's label, says what it means
export function Icon({ name, className, strokeWidth = 2 }: Props) {
  const uid = useId().replace(/[^\w-]/g, "")
  if (isGlyph(name)) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={cx("shrink-0", className)}>
        {GLYPHS[name]}
      </svg>
    )
  }
  const ids = { id: (key: string) => `i${uid}${key}`, url: (key: string) => `url(#i${uid}${key})` }
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      aria-hidden
      className={cx("shrink-0", className)}>
      {ART[name](ids)}
    </svg>
  )
}

export const ROLE_ICON: Record<Role, IconName> = {
  courtesan: "courtesan",
  queen_wolf: "queenWolf",
  wolf: "wolf",
  baby_wolf: "babyWolf",
  wizard: "wizard",
  seer: "seer",
  villager: "villager",
}

// The Baby Wolf keeps their pup picture after joining the pack
export function playerIcon(player: Player, babyWolfPlayerId: string | null): IconName {
  if (player.role === null) return "question"
  if (player.id === babyWolfPlayerId) return ROLE_ICON.baby_wolf
  return ROLE_ICON[player.role]
}
