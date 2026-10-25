import type { Player, Role } from "../game/types"
import { ROLE_BADGE } from "../game/roles"
import { cx } from "../lib/cx"
import type { Tone } from "./ui"
import { Avatar } from "./ui"

const SELECTED: Record<Tone, string> = {
  moon: "border-moon-400 bg-moon-500/20 ring-2 ring-moon-400/40",
  blood: "border-blood-400 bg-blood-500/20 ring-2 ring-blood-400/40",
  sun: "border-sun-400 bg-sun-400/15 ring-2 ring-sun-400/40",
  leaf: "border-leaf-400 bg-leaf-500/20 ring-2 ring-leaf-400/40",
  mist: "border-mist-300 bg-white/10 ring-2 ring-white/20",
}

const CHECK: Record<Tone, string> = {
  moon: "bg-moon-500 text-white",
  blood: "bg-blood-500 text-white",
  sun: "bg-sun-400 text-night-950",
  leaf: "bg-leaf-500 text-night-950",
  mist: "bg-mist-200 text-night-950",
}

type Props = {
  players: Player[]
  selectedIds: string[]
  onSelect: (id: string) => void
  tone?: Tone
  disabledIds?: string[]
  notes?: Record<string, string> // small line under a name, e.g. why it can't be picked
  showRoles?: boolean
  babyWolfPlayerId?: string | null
}

function badgeFor(player: Player, babyWolfPlayerId: string | null | undefined, showRoles: boolean): string | null {
  if (!showRoles) return null
  const role: Role | null = player.role
  if (!role || role === "villager") return null
  if (player.id === babyWolfPlayerId && role === "wolf") return `${ROLE_BADGE.baby_wolf}${ROLE_BADGE.wolf}`
  return ROLE_BADGE[role]
}

function tileClasses(selected: boolean, disabled: boolean, tone: Tone): string {
  if (disabled) return "border-transparent bg-night-800/50 text-mist-500"
  if (selected) return SELECTED[tone]
  return "border-white/5 bg-night-800/90 text-mist-100 active:bg-night-700"
}

export function PlayerGrid({
  players,
  selectedIds,
  onSelect,
  tone = "moon",
  disabledIds = [],
  notes = {},
  showRoles = true,
  babyWolfPlayerId,
}: Props) {
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="grid grid-cols-2 gap-2">
      {sorted.map((player) => (
        <PlayerTile
          key={player.id}
          player={player}
          selected={selectedIds.includes(player.id)}
          disabled={disabledIds.includes(player.id) || !player.isAlive}
          note={notes[player.id]}
          badge={badgeFor(player, babyWolfPlayerId, showRoles)}
          tone={tone}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

type TileProps = {
  player: Player
  selected: boolean
  disabled: boolean
  note?: string
  badge: string | null
  tone: Tone
  onSelect: (id: string) => void
}

function PlayerTile({ player, selected, disabled, note, badge, tone, onSelect }: TileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      data-player={player.name}
      onClick={() => onSelect(player.id)}
      className={cx(
        "relative flex min-h-[60px] items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition-[transform,background-color] duration-100 active:scale-[0.97] disabled:active:scale-100",
        tileClasses(selected, disabled, tone),
      )}>
      <span className={cx(disabled && "opacity-45")}>
        <Avatar name={player.name} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block truncate text-[15px] font-semibold leading-tight",
            !player.isAlive && "line-through decoration-2",
          )}>
          {player.name}
        </span>
        {note && <span className="mt-0.5 block truncate text-[11px] leading-tight text-mist-400">{note}</span>}
      </span>
      {!player.isAlive && (
        <span
          aria-label="dead"
          className="text-base">
          💀
        </span>
      )}
      {badge && player.isAlive && !selected && (
        <span
          aria-hidden
          className={cx("text-base leading-none", disabled && "opacity-60")}>
          {badge}
        </span>
      )}
      {selected && (
        <span
          aria-hidden
          className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", CHECK[tone])}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M5 12.5 10 17 19 7" />
          </svg>
        </span>
      )}
    </button>
  )
}
