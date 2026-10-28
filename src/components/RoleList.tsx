import type { GameState, Player, Role } from "../game/types"
import { ROLE_ORDER, isWolf, roleName } from "../game/roles"
import { cx } from "../lib/cx"
import { useShowRole } from "../lib/useShowRole"
import { playerIcon } from "./icons"
import { Avatar, IconTile, SectionLabel, playerTone, toneText } from "./ui"

type GroupKey = "wolves" | "village" | "villagers" | "unknown"

type Group = { key: GroupKey; title: string; players: Player[] }

function byRoleThenName(a: Player, b: Player): number {
  const order = ROLE_ORDER.indexOf(a.role ?? "villager") - ROLE_ORDER.indexOf(b.role ?? "villager")
  if (order !== 0) return order
  return a.name.localeCompare(b.name)
}

export function groupPlayers(state: GameState): Group[] {
  const players = [...state.players].sort(byRoleThenName)
  const groups: Group[] = [
    { key: "wolves", title: "Wolf pack", players: players.filter((p) => isWolf(p.role)) },
    {
      key: "village",
      title: "Village roles",
      players: players.filter((p) => p.role !== null && p.role !== "villager" && !isWolf(p.role)),
    },
    { key: "villagers", title: "Villagers", players: players.filter((p) => p.role === "villager") },
    { key: "unknown", title: "Not identified yet", players: players.filter((p) => p.role === null) },
  ]
  return groups.filter((g) => g.players.length > 0)
}

export function deathLabel(state: GameState, playerId: string): string | null {
  for (const night of state.nightEvents) {
    if (night.deaths.some((d) => d.playerId === playerId)) return `Died night ${night.night}`
  }
  for (const day of state.dayEvents) {
    if (day.eliminated === playerId) return `Voted out day ${day.day}`
  }
  return null
}

// The role whose card explains this player. A Baby Wolf who joined the pack keeps the Baby Wolf's.
export function cardRole(state: GameState, player: Player): Role | null {
  if (player.id === state.babyWolfPlayerId) return "baby_wolf"
  return player.role
}

export function roleLabel(state: GameState, player: Player): string {
  const rn = state.roleNames
  if (player.role === null) return "?"
  if (player.id === state.babyWolfPlayerId && player.role === "wolf") {
    return `${roleName("baby_wolf", rn)} → ${roleName("wolf", rn)}`
  }
  return roleName(player.role, rn)
}

type Props = { state: GameState }

export function RoleList({ state }: Props) {
  return (
    <div>
      {groupPlayers(state).map((group) => (
        <section key={group.key}>
          <SectionLabel>
            {group.title} · {group.players.length}
          </SectionLabel>
          <div className="space-y-2">
            {group.players.map((player) => (
              <RoleRow
                key={player.id}
                state={state}
                player={player}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

type RoleRowProps = { state: GameState; player: Player }

// Tapping a player whose role is known opens that role's card
function RoleRow({ state, player }: RoleRowProps) {
  const showRole = useShowRole()
  const death = deathLabel(state, player.id)
  const tone = playerTone(player)
  const role = cardRole(state, player)
  const className = cx(
    "flex min-h-16 w-full items-center gap-3 rounded-2xl border border-white/5 bg-night-800/80 px-3 py-2.5 text-left",
    !player.isAlive && "opacity-55 grayscale",
  )
  const content = (
    <>
      <Avatar name={player.name} />
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block truncate text-[16px] font-semibold text-mist-100",
            !player.isAlive && "line-through decoration-2",
          )}>
          {player.name}
        </span>
        <span className="block truncate text-[14px]">
          <span className={cx("font-medium", toneText(tone))}>{roleLabel(state, player)}</span>
          {death && <span className="text-mist-400"> · {death}</span>}
        </span>
      </span>
      <IconTile
        icon={playerIcon(player, state.babyWolfPlayerId)}
        tone={tone}
        size="sm"
      />
    </>
  )
  if (!role) return <div className={className}>{content}</div>
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => showRole(role)}
      className={cx(className, "active:bg-night-700")}>
      {content}
    </button>
  )
}
