import type { GameState, Player } from "../game/types"
import { ROLE_EMOJI, ROLE_ORDER, isWolf, roleName } from "../game/roles"
import { cx } from "../lib/cx"
import { Avatar, SectionLabel } from "./ui"

type GroupKey = "wolves" | "village" | "villagers" | "unknown"

type Group = { key: GroupKey; title: string; players: Player[] }

const ROLE_TEXT: Record<GroupKey, string> = {
  wolves: "text-blood-400",
  village: "text-leaf-400",
  villagers: "text-mist-300",
  unknown: "text-mist-400",
}

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

function roleLabel(state: GameState, player: Player): string {
  const rn = state.roleNames
  if (player.role === null) return "?"
  if (player.id === state.babyWolfPlayerId && player.role === "wolf") {
    return `${roleName("baby_wolf", rn)} → ${roleName("wolf", rn)}`
  }
  return roleName(player.role, rn)
}

function roleEmoji(state: GameState, player: Player): string {
  if (player.role === null) return "❔"
  if (player.id === state.babyWolfPlayerId) return ROLE_EMOJI.baby_wolf
  return ROLE_EMOJI[player.role]
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
          <div className="space-y-1.5">
            {group.players.map((player) => (
              <RoleRow
                key={player.id}
                state={state}
                player={player}
                tone={group.key}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

type RoleRowProps = { state: GameState; player: Player; tone: GroupKey }

function RoleRow({ state, player, tone }: RoleRowProps) {
  const death = deathLabel(state, player.id)
  const babyNotBitten = player.role === "baby_wolf"
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-2xl border border-white/5 bg-night-800/80 px-3 py-2.5",
        !player.isAlive && "opacity-55",
      )}>
      <Avatar name={player.name} />
      <div className="min-w-0 flex-1">
        <div
          className={cx(
            "truncate text-[15px] font-semibold text-mist-100",
            !player.isAlive && "line-through decoration-2",
          )}>
          {player.name}
        </div>
        <div className={cx("truncate text-[13px] font-medium", ROLE_TEXT[tone], babyNotBitten && "text-sun-300")}>
          {roleLabel(state, player)}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span
          className="whitespace-nowrap text-xl leading-none tracking-tighter"
          aria-hidden>
          {roleEmoji(state, player)}
        </span>
        {death && <span className="mt-1 text-[11px] text-mist-400">💀 {death}</span>}
      </div>
    </div>
  )
}
