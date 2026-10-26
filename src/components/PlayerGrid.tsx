import type { Player } from "../game/types"
import { cx } from "../lib/cx"
import { haptic } from "../lib/haptics"
import type { IconName } from "./icons"
import { Icon, playerIcon } from "./icons"
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

// Villagers get no badge, so the special roles stand out
function badgeFor(player: Player, babyWolfPlayerId: string | null | undefined, showRoles: boolean): IconName | null {
  if (!showRoles) return null
  if (!player.role || player.role === "villager") return null
  return playerIcon(player, babyWolfPlayerId ?? null)
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
  badge: IconName | null
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
      onClick={() => {
        haptic()
        onSelect(player.id)
      }}
      className={cx(
        "relative flex min-h-16 items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition-[transform,background-color] duration-100 active:scale-[0.97] disabled:active:scale-100",
        tileClasses(selected, disabled, tone),
      )}>
      <span className={cx(disabled && "opacity-45")}>
        <Avatar name={player.name} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block truncate text-[16px] font-semibold leading-tight",
            !player.isAlive && "line-through decoration-2",
          )}>
          {player.name}
        </span>
        {note && <span className="mt-0.5 block truncate text-[12px] leading-tight text-mist-400">{note}</span>}
      </span>
      {!player.isAlive && (
        <span
          role="img"
          aria-label="dead">
          <Icon
            name="skull"
            className="size-7"
          />
        </span>
      )}
      {badge && player.isAlive && !selected && (
        <Icon
          name={badge}
          className={cx("size-8", disabled && "opacity-60")}
        />
      )}
      {selected && (
        <span
          aria-hidden
          className={cx("flex size-7 shrink-0 items-center justify-center rounded-full", CHECK[tone])}>
          <Icon
            name="check"
            className="size-4"
            strokeWidth={3.5}
          />
        </span>
      )}
    </button>
  )
}
