import type { GameState, NightEvent, Player, Role } from "./types"
import { getRegularWolfCount, isWolf } from "./roles"
import { isBabyWolfBitten } from "./reducer"

export function getPlayer(state: GameState, id: string | null | undefined): Player | undefined {
  if (!id) return undefined
  return state.players.find((p) => p.id === id)
}

// The id, if that player is still alive
export function aliveId(state: GameState, id: string | null | undefined): string | null {
  if (!id) return null
  if (!getPlayer(state, id)?.isAlive) return null
  return id
}

export function playerName(state: GameState, id: string | null | undefined): string {
  return getPlayer(state, id)?.name ?? ""
}

export function findRole(state: GameState, role: Role): Player | undefined {
  return state.players.find((p) => p.role === role)
}

export function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.isAlive)
}

export function unidentifiedPlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.role === null)
}

export type WolvesStep = "queen" | "pack" | "attack"

// On Night 1 the GM first identifies the Queen Wolf, then the other wolves, then takes the kill
export function getWolvesStep(state: GameState): WolvesStep {
  const config = state.gameConfig
  if (config.hasQueenWolf && !findRole(state, "queen_wolf")) return "queen"
  if (getRegularWolfCount(config) > 0 && !findRole(state, "wolf")) return "pack"
  return "attack"
}

export function aliveWolves(state: GameState): Player[] {
  return state.players.filter((p) => p.isAlive && isWolf(p.role))
}

// The Baby Wolf joins the pack at the start of this night
export function babyWolfJoinsTonight(state: GameState): Player | undefined {
  if (state.babyWolfTransformNight !== state.currentNight) return undefined
  const baby = getPlayer(state, state.babyWolfPlayerId)
  if (!baby?.isAlive) return undefined
  return baby
}

export function wasBabyWolfBitten(state: GameState, night: NightEvent): boolean {
  return (
    state.babyWolfTransformNight === night.night + 1 &&
    !!state.babyWolfPlayerId &&
    night.wolfTarget === state.babyWolfPlayerId
  )
}

// The wolves' victim who was safe at the Courtesan's
export function protectedGuestOf(state: GameState, night: NightEvent): Player | undefined {
  if (!night.wolfTarget || night.wolfTarget !== night.courtesanGuest) return undefined
  return getPlayer(state, night.wolfTarget)
}

export function bittenBabyWolfOf(state: GameState, night: NightEvent): Player | undefined {
  if (!wasBabyWolfBitten(state, night)) return undefined
  return getPlayer(state, night.wolfTarget)
}

export function isBabyWolfBittenTonight(state: GameState): boolean {
  return isBabyWolfBitten(state.players, state.currentNightEvent)
}

export function eliminatedToday(state: GameState): Player[] {
  return state.dayEvents
    .filter((d) => d.day === state.currentDay && d.eliminated)
    .map((d) => getPlayer(state, d.eliminated))
    .filter((p): p is Player => !!p)
}

export function isGameRunning(state: GameState): boolean {
  const type = state.currentPhase.type
  return type !== "setup" && type !== "role_config" && type !== "game_over"
}
