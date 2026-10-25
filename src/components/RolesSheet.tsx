import type { GameAction, GameState } from "../game/types"
import { ROLE_EMOJI, getLineup, roleName } from "../game/roles"
import { getPlayer, playerName } from "../game/selectors"
import { RoleList } from "./RoleList"
import { SectionLabel, Sheet, Switch } from "./ui"

type Props = {
  state: GameState
  dispatch: (action: GameAction) => void
  onClose: () => void
}

type StatusItem = { icon: string; text: string }

function potionText(used: boolean): string {
  if (used) return "used"
  return "ready"
}

function babyWolfStatus(state: GameState): string | null {
  const baby = getPlayer(state, state.babyWolfPlayerId)
  if (!baby) return null
  const name = roleName("baby_wolf", state.roleNames)
  if (baby.role === "wolf") return `${name} ${baby.name} has joined the pack`
  if (state.babyWolfTransformNight) return `${name} ${baby.name} was bitten: joins the pack on night ${state.babyWolfTransformNight}`
  return `${name} ${baby.name} hasn't been bitten`
}

function statusItems(state: GameState): StatusItem[] {
  const rn = state.roleNames
  const config = state.gameConfig
  const items: StatusItem[] = []

  if (config.hasWizard) {
    items.push({
      icon: ROLE_EMOJI.wizard,
      text: `${roleName("wizard", rn)}: save potion ${potionText(state.wizardSavePotionUsed)}, kill potion ${potionText(state.wizardKillPotionUsed)}`,
    })
  }
  if (config.hasCourtesan && state.lastCourtesanGuest) {
    items.push({
      icon: ROLE_EMOJI.courtesan,
      text: `${roleName("courtesan", rn)}'s last guest: ${playerName(state, state.lastCourtesanGuest)}`,
    })
  }
  const baby = babyWolfStatus(state)
  if (config.hasBabyWolf && baby) items.push({ icon: ROLE_EMOJI.baby_wolf, text: baby })

  const checks = [...state.nightEvents, state.currentNightEvent]
  for (const night of checks) {
    if (!night.seerChecked) continue
    let verdict = "not a wolf"
    if (night.seerResult === "wolf") verdict = "wolf"
    items.push({
      icon: ROLE_EMOJI.seer,
      text: `Night ${night.night}: ${roleName("seer", rn)} saw ${playerName(state, night.seerChecked)} as ${verdict}`,
    })
  }
  return items
}

// Every player's role, for the game master's eyes only
export function RolesSheet({ state, dispatch, onClose }: Props) {
  const rn = state.roleNames
  const lineup = getLineup(state.gameConfig, state.players.length)
  const status = statusItems(state)

  return (
    <Sheet
      title="Roles"
      subtitle="Keep this screen to yourself 🤫"
      onClose={onClose}>
      <div className="flex flex-wrap gap-1.5">
        {lineup.map(({ role, count }) => (
          <span
            key={role}
            className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-night-800/80 px-2.5 text-[13px] font-semibold text-mist-200">
            <span aria-hidden>{ROLE_EMOJI[role]}</span>
            {roleName(role, rn)}
            {count > 1 && <span className="text-mist-400">×{count}</span>}
          </span>
        ))}
      </div>

      <RoleList state={state} />

      {status.length > 0 && (
        <>
          <SectionLabel>Game notes</SectionLabel>
          <ul className="space-y-1.5">
            {status.map((item) => (
              <li
                key={item.text}
                className="flex gap-2.5 rounded-2xl border border-white/5 bg-night-800/70 px-3.5 py-2.5 text-[14px] leading-snug text-mist-200">
                <span aria-hidden>{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionLabel>Display</SectionLabel>
      <Switch
        checked={state.showRoleBadges}
        onChange={(show) => dispatch({ type: "SET_SHOW_ROLE_BADGES", show })}
        label="Show role icons on player buttons"
        hint="Turn off if players might see your screen."
      />
    </Sheet>
  )
}
