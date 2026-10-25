import type { GameConfig, Player, Role, RoleNames } from "./types"

export type Team = "wolves" | "village" | "wildcard"

export const ROLE_ORDER: Role[] = ["queen_wolf", "wolf", "baby_wolf", "courtesan", "wizard", "seer", "villager"]

// Full icon, used in titles and lists
export const ROLE_EMOJI: Record<Role, string> = {
  courtesan: "🌹",
  queen_wolf: "👑🐺",
  wolf: "🐺",
  baby_wolf: "🐺👶",
  wizard: "🧙",
  seer: "👁️",
  villager: "😇",
}

// Single-emoji icon, used as a badge on player buttons
export const ROLE_BADGE: Record<Role, string> = {
  courtesan: "🌹",
  queen_wolf: "👑",
  wolf: "🐺",
  baby_wolf: "👶",
  wizard: "🧙",
  seer: "👁️",
  villager: "😇",
}

export const DEFAULT_ROLE_NAMES: Record<Role, string> = {
  courtesan: "Courtesan",
  queen_wolf: "Queen Wolf",
  wolf: "Wolf",
  baby_wolf: "Baby Wolf",
  wizard: "Wizard",
  seer: "Seer",
  villager: "Villager",
}

export function roleName(role: Role | null, overrides?: RoleNames): string {
  if (!role) return DEFAULT_ROLE_NAMES.villager
  return overrides?.[role]?.trim() || DEFAULT_ROLE_NAMES[role]
}

export function pluralize(name: string): string {
  if (/wolf$/i.test(name)) return name.replace(/f$/, "ves").replace(/F$/, "VES")
  if (/(s|x|z|ch|sh)$/i.test(name)) return `${name}es`
  if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`
  return `${name}s`
}

export function rolePlural(role: Role, overrides?: RoleNames): string {
  return pluralize(roleName(role, overrides))
}

export function isWolf(role: Role | null): boolean {
  return role === "wolf" || role === "queen_wolf"
}

// The Queen Wolf and an untransformed Baby Wolf look innocent to the Seer
export function seerSees(role: Role | null): "wolf" | "not_wolf" {
  if (role === "wolf") return "wolf"
  return "not_wolf"
}

export function teamOf(player: Player, babyWolfPlayerId: string | null): Team {
  if (isWolf(player.role)) return "wolves"
  if (player.id === babyWolfPlayerId || player.role === "baby_wolf") return "wildcard"
  return "village"
}

export function getRegularWolfCount(config: GameConfig): number {
  return config.wolfCount - (config.hasQueenWolf ? 1 : 0)
}

export function getSpecialRoleCount(config: GameConfig): number {
  return (
    (config.hasBabyWolf ? 1 : 0) + (config.hasCourtesan ? 1 : 0) + (config.hasWizard ? 1 : 0) + (config.hasSeer ? 1 : 0)
  )
}

export function getMaxWolves(config: GameConfig, playerCount: number): number {
  return Math.min(Math.floor((playerCount - 1) / 2), playerCount - getSpecialRoleCount(config))
}

export function getVillagerCount(config: GameConfig, playerCount: number): number {
  return playerCount - config.wolfCount - getSpecialRoleCount(config)
}

export function isConfigValid(config: GameConfig, playerCount: number): boolean {
  if (config.wolfCount < 1) return false
  if (config.wolfCount > getMaxWolves(config, playerCount)) return false
  return getVillagerCount(config, playerCount) >= 0
}

// Fits a saved setup to the number of players
export function clampConfig(config: GameConfig, playerCount: number): GameConfig {
  const max = getMaxWolves(config, playerCount)
  const wolfCount = Math.max(1, Math.min(config.wolfCount, max))
  return { ...config, wolfCount }
}

// How many of each role are in play
export function getLineup(config: GameConfig, playerCount: number): Array<{ role: Role; count: number }> {
  const lineup: Array<{ role: Role; count: number }> = []
  if (config.hasQueenWolf) lineup.push({ role: "queen_wolf", count: 1 })
  const regular = getRegularWolfCount(config)
  if (regular > 0) lineup.push({ role: "wolf", count: regular })
  if (config.hasBabyWolf) lineup.push({ role: "baby_wolf", count: 1 })
  if (config.hasCourtesan) lineup.push({ role: "courtesan", count: 1 })
  if (config.hasWizard) lineup.push({ role: "wizard", count: 1 })
  if (config.hasSeer) lineup.push({ role: "seer", count: 1 })
  const villagers = getVillagerCount(config, playerCount)
  if (villagers > 0) lineup.push({ role: "villager", count: villagers })
  return lineup
}
