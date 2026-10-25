import type { ReactNode } from "react"
import type { Player, Role } from "../game/types"
import { cx } from "../lib/cx"

// Drawn for this app on a 24px grid: 2px outlines plus a soft fill on the main shape, so they read on dark screens
const TINT = { fill: "currentColor", fillOpacity: 0.2 }
const SOLID = { fill: "currentColor", stroke: "none" }

const ICONS = {
  // Roles
  wolf: (
    <>
      <path
        {...TINT}
        d="M8.5 7.5 5 2.5 3.5 9.5 2 12.5l3 .5 3.5 4.5L12 22l3.5-4.5L19 13l3-.5-1.5-3L19 2.5l-3.5 5Z"
      />
      <path d="m7.5 10.5 2.5 1m6.5-1-2.5 1" />
      <path
        {...SOLID}
        d="M10.6 18.4h2.8L12 20.2Z"
      />
    </>
  ),
  crown: (
    <>
      <path
        {...TINT}
        d="M4.5 17.5 3 7.5l5 4 4-7 4 7 5-4-1.5 10Z"
      />
      <path d="M5 21h14" />
    </>
  ),
  paw: (
    <>
      <path
        {...TINT}
        d="M12 12c-2.9 0-5.6 3.5-5.6 6 0 1.7 1.2 2.7 2.7 2.7 1.2 0 1.8-.6 2.9-.6s1.7.6 2.9.6c1.5 0 2.7-1 2.7-2.7 0-2.5-2.7-6-5.6-6Z"
      />
      <ellipse
        {...SOLID}
        cx="4.6"
        cy="10.6"
        rx="2"
        ry="2.5"
        transform="rotate(-20 4.6 10.6)"
      />
      <ellipse
        {...SOLID}
        cx="9"
        cy="5.6"
        rx="2.1"
        ry="2.7"
        transform="rotate(-8 9 5.6)"
      />
      <ellipse
        {...SOLID}
        cx="15"
        cy="5.6"
        rx="2.1"
        ry="2.7"
        transform="rotate(8 15 5.6)"
      />
      <ellipse
        {...SOLID}
        cx="19.4"
        cy="10.6"
        rx="2"
        ry="2.5"
        transform="rotate(20 19.4 10.6)"
      />
    </>
  ),
  rose: (
    <>
      <path
        {...TINT}
        d="M12 13.2c-3 0-5.3-2.4-5.3-5.4S9 2.5 12 2.5s5.3 2.3 5.3 5.3-2.3 5.4-5.3 5.4Z"
      />
      <path d="M12.3 8.8c-.9 0-1.5-.6-1.5-1.3 0-.9.8-1.6 1.7-1.6 1.4 0 2.3 1.1 2.3 2.4 0 1.8-1.4 3.1-3.2 3.1-1.9 0-3.4-1.5-3.4-3.5M12 13.2v8.3" />
      <path
        {...TINT}
        d="M12 18c-.6-2.1-2.5-3.3-4.8-3.1.4 2.2 2.3 3.4 4.8 3.1Zm0 1.6c.6-2.1 2.5-3.3 4.8-3.1-.4 2.2-2.3 3.4-4.8 3.1Z"
      />
    </>
  ),
  hat: (
    <>
      <ellipse
        {...TINT}
        cx="12"
        cy="18"
        rx="9.5"
        ry="2.8"
      />
      <path
        {...TINT}
        d="M7 17.2 10.8 5.6c.7-2.2 3.2-3.2 5.6-2.1-1.6.8-2.4 2-2.1 3.7l2.7 10"
      />
      <path
        {...SOLID}
        d="m12.4 9 .55 1.3 1.3.55-1.3.55-.55 1.3-.55-1.3-1.3-.55 1.3-.55Z"
      />
    </>
  ),
  eye: (
    <>
      <path
        {...TINT}
        d="M2 12c2.7-4.6 6.1-7 10-7s7.3 2.4 10 7c-2.7 4.6-6.1 7-10 7S4.7 16.6 2 12Z"
      />
      <circle
        cx="12"
        cy="12"
        r="3.3"
      />
      <circle
        {...SOLID}
        cx="12"
        cy="12"
        r="1.4"
      />
    </>
  ),
  person: (
    <>
      <circle
        {...TINT}
        cx="12"
        cy="7.5"
        r="4"
      />
      <path
        {...TINT}
        d="M4.5 21c0-4.3 3.4-7.5 7.5-7.5s7.5 3.2 7.5 7.5Z"
      />
    </>
  ),
  users: (
    <>
      <circle
        {...TINT}
        cx="9"
        cy="8"
        r="3.6"
      />
      <path
        {...TINT}
        d="M2.5 20.5c0-3.9 2.9-6.5 6.5-6.5s6.5 2.6 6.5 6.5Z"
      />
      <path d="M15 4.6a3.6 3.6 0 0 1 0 6.8m2.8 3.2c2.2.9 3.7 3 3.7 5.9" />
    </>
  ),

  // Phases of the game
  moon: (
    <path
      {...TINT}
      d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a7 7 0 0 0 11.3 11.3Z"
    />
  ),
  sunrise: (
    <>
      <path
        {...TINT}
        d="M6.5 18a5.5 5.5 0 0 1 11 0Z"
      />
      <path d="M2.5 18h19M5 21.5h14M12 4.5v3m-7.3 3.2 1.5 1.5m13.1-1.5-1.5 1.5" />
    </>
  ),
  sun: (
    <>
      <circle
        {...TINT}
        cx="12"
        cy="12"
        r="4.2"
      />
      <path d="M12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.3 5.3l1.4 1.4m10.6 10.6 1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  vote: (
    <>
      <path
        {...TINT}
        d="M8.5 11V3.8a.8.8 0 0 1 .8-.8h5.4a.8.8 0 0 1 .8.8V11"
      />
      <path d="m10.3 7.4 1.2 1.2 2.3-2.4" />
      <path
        {...TINT}
        d="M3.5 11h17v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z"
      />
    </>
  ),
  flag: (
    <>
      <path d="M5 21.5V3" />
      <path
        {...TINT}
        d="M5 4h13l-3 4.5 3 4.5H5"
      />
    </>
  ),
  trophy: (
    <>
      <path
        {...TINT}
        d="M7 3.5h10v5.5a5 5 0 0 1-10 0Z"
      />
      <path d="M7 5.5H4.5a3 3 0 0 0 3 4.5m9.5-4.5h2.5a3 3 0 0 1-3 4.5M12 14v4m-4 3h8m-6.5-3h5" />
    </>
  ),

  // Life and death
  skull: (
    <>
      <path
        {...TINT}
        d="M12 2.5c-4.7 0-8 3.2-8 7.6 0 2.6 1.1 4.3 3 5.4v3.5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.5c1.9-1.1 3-2.8 3-5.4 0-4.4-3.3-7.6-8-7.6Z"
      />
      <circle
        {...SOLID}
        cx="8.7"
        cy="11"
        r="2"
      />
      <circle
        {...SOLID}
        cx="15.3"
        cy="11"
        r="2"
      />
      <path d="M10.5 21v-2.5m3 2.5v-2.5" />
    </>
  ),
  heart: (
    <path
      {...TINT}
      d="M12 20.5S3 15.2 3 9.2A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9 2.2c0 6-9 11.3-9 11.3Z"
    />
  ),
  heal: (
    <>
      <path
        {...TINT}
        d="M12 20.5S3 15.2 3 9.2A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9 2.2c0 6-9 11.3-9 11.3Z"
      />
      <path d="M12 10v5.5m-2.75-2.75h5.5" />
    </>
  ),
  poison: (
    <>
      <path
        {...TINT}
        d="M10.5 3v5.2L5.6 17.3A2.5 2.5 0 0 0 7.8 21h8.4a2.5 2.5 0 0 0 2.2-3.7l-4.9-9.1V3"
      />
      <path d="M9.5 3h5m-6.9 11.5h8.8" />
    </>
  ),
  shield: (
    <>
      <path
        {...TINT}
        d="M12 21.5c-4.6-1.6-8-4.6-8-9.8V5.5l8-3 8 3v6.2c0 5.2-3.4 8.2-8 9.8Z"
      />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),

  // Everything else
  mask: (
    <path
      {...TINT}
      fillRule="evenodd"
      d="M2.5 8.5c0-1.6 1.3-2.5 2.8-2.5 2.6 0 4.2 1.5 6.7 1.5S16.1 6 18.7 6c1.5 0 2.8.9 2.8 2.5 0 4.6-2.6 7.5-5.5 7.5-2.2 0-3-2-4-2s-1.8 2-4 2c-2.9 0-5.5-2.9-5.5-7.5ZM5.6 10.6c1.2-1.2 3-1.2 4.2 0-1.2 1.2-3 1.2-4.2 0Zm8.6 0c1.2-1.2 3-1.2 4.2 0-1.2 1.2-3 1.2-4.2 0Z"
    />
  ),
  eyeOff: (
    <>
      <path
        {...TINT}
        d="M2 12c2.7-4.6 6.1-7 10-7s7.3 2.4 10 7c-2.7 4.6-6.1 7-10 7S4.7 16.6 2 12Z"
      />
      <path d="m3.5 3.5 17 17" />
    </>
  ),
  speaker: (
    <>
      <path
        {...TINT}
        d="M11 5 6 9H2.5v6H6l5 4Z"
      />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
    </>
  ),
  tap: (
    <path
      {...TINT}
      d="M9.5 11.5V4.8a1.6 1.6 0 0 1 3.2 0v5.7m0-.7a1.6 1.6 0 0 1 3.2 0v1m0-.3a1.6 1.6 0 0 1 3.2 0v4c0 3.5-2.5 6-6 6h-1c-2.2 0-3.4-.8-4.6-2.5l-2.9-4a1.6 1.6 0 0 1 2.6-1.9l1.3 1.7"
    />
  ),
  timer: (
    <>
      <circle
        {...TINT}
        cx="12"
        cy="13.5"
        r="7.5"
      />
      <path d="M12 13.5v-4m-2.5-7h5M12 2.5V6m6.2.3 1.5-1.5" />
    </>
  ),
  play: (
    <path
      {...TINT}
      d="M7.5 4.9v14.2a1 1 0 0 0 1.5.9l11-7.1a1.1 1.1 0 0 0 0-1.8L9 4a1 1 0 0 0-1.5.9Z"
    />
  ),
  pause: (
    <>
      <rect
        {...TINT}
        x="6"
        y="4.5"
        width="4"
        height="15"
        rx="1"
      />
      <rect
        {...TINT}
        x="14"
        y="4.5"
        width="4"
        height="15"
        rx="1"
      />
    </>
  ),
  replay: <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5m0-5v5h5" />,
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  book: (
    <>
      <path
        {...TINT}
        d="M12 6.5C10 5 7.5 4.5 3 4.5v14c4.5 0 7 .5 9 2 2-1.5 4.5-2 9-2v-14c-4.5 0-7 .5-9 2Z"
      />
      <path d="M12 6.5v14" />
    </>
  ),
  pencil: (
    <>
      <path
        {...TINT}
        d="M16.3 3.7a2.3 2.3 0 0 1 3.3 3.3L8 18.6l-4.5 1.2 1.2-4.5Z"
      />
      <path d="m14.2 5.8 3.3 3.3" />
    </>
  ),
  install: <path d="M12 3v11.5M7.5 10l4.5 4.5 4.5-4.5M4 15.5v3A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-3" />,
  phone: (
    <>
      <rect
        {...TINT}
        x="6"
        y="2.5"
        width="12"
        height="19"
        rx="2.5"
      />
      <path d="M10.5 18.5h3" />
    </>
  ),
  wifiOff: (
    <path d="M12 19.5h.01M8.6 16a5 5 0 0 1 6.8 0M5.2 12.6a10 10 0 0 1 3.5-2.2m6.6 0a10 10 0 0 1 3.5 2.2M2 9.1a15 15 0 0 1 4.3-2.8M11 4.6a15 15 0 0 1 11 4.5M3 3l18 18" />
  ),
  copy: (
    <>
      <rect
        {...TINT}
        x="9"
        y="9"
        width="12"
        height="12"
        rx="2"
      />
      <path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
    </>
  ),
  trash: (
    <>
      <path
        {...TINT}
        d="m6 6.5.9 13.1a1.5 1.5 0 0 0 1.5 1.4h7.2a1.5 1.5 0 0 0 1.5-1.4L18 6.5"
      />
      <path d="M4 6.5h16M9.5 6.5v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M10 11v5.5m4-5.5v5.5" />
    </>
  ),
  warning: (
    <>
      <path
        {...TINT}
        d="M10.3 3.9 2.4 17.6a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      />
      <path d="M12 9v4.5m0 3.5h.01" />
    </>
  ),
  ban: (
    <>
      <circle
        {...TINT}
        cx="12"
        cy="12"
        r="9"
      />
      <path d="m5.6 5.6 12.8 12.8" />
    </>
  ),
  checkCircle: (
    <>
      <circle
        {...TINT}
        cx="12"
        cy="12"
        r="9"
      />
      <path d="m8 12.5 2.8 2.8 5.4-5.6" />
    </>
  ),
  question: (
    <>
      <circle
        {...TINT}
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.4-2.6 4M12 17.5h.01" />
    </>
  ),
  check: <path d="m5 12.5 5 5 9-10.5" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14m-7-7h14" />,
  minus: <path d="M5 12h14" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  dots: (
    <>
      <circle
        {...SOLID}
        cx="5"
        cy="12"
        r="2"
      />
      <circle
        {...SOLID}
        cx="12"
        cy="12"
        r="2"
      />
      <circle
        {...SOLID}
        cx="19"
        cy="12"
        r="2"
      />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICONS

type Props = { name: IconName; className?: string; strokeWidth?: number }

// Decorative: the text next to it, or the button's label, says what it means
export function Icon({ name, className, strokeWidth = 2 }: Props) {
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
      {ICONS[name]}
    </svg>
  )
}

export const ROLE_ICON: Record<Role, IconName> = {
  courtesan: "rose",
  queen_wolf: "crown",
  wolf: "wolf",
  baby_wolf: "paw",
  wizard: "hat",
  seer: "eye",
  villager: "person",
}

// The Baby Wolf keeps their paw after joining the pack
export function playerIcon(player: Player, babyWolfPlayerId: string | null): IconName {
  if (player.role === null) return "question"
  if (player.id === babyWolfPlayerId) return ROLE_ICON.baby_wolf
  return ROLE_ICON[player.role]
}
