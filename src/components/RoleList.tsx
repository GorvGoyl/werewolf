import type { GameState, Player } from "../game/types"
import { ROLE_ORDER, isWolf, roleName } from "../game/roles"
import { cx } from "../lib/cx"
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

function RoleRow({ state, player }: RoleRowProps) {
  const death = deathLabel(state, player.id)
  const tone = playerTone(player)
  return (
    <div
      className={cx(
        "flex min-h-16 items-center gap-3 rounded-2xl border border-white/5 bg-night-800/80 px-3 py-2.5",
        !player.isAlive && "opacity-55",
      )}>
      <Avatar name={player.name} />
      <div className="min-w-0 flex-1">
        <div
          className={cx(
            "truncate text-[16px] font-semibold text-mist-100",
            !player.isAlive && "line-through decoration-2",
          )}>
          {player.name}
        </div>
        <div className="truncate text-[14px]">
          <span className={cx("font-medium", toneText(tone))}>{roleLabel(state, player)}</span>
          {death && <span className="text-mist-400"> · {death}</span>}
        </div>
      </div>
      <IconTile
        icon={playerIcon(player, state.babyWolfPlayerId)}
        tone={tone}
        size="sm"
      />
    </div>
  )
}
