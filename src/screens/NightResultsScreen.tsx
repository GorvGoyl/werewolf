import type { Death, GameState } from "../game/types"
import { roleName } from "../game/roles"
import { checkWinCondition, hasSaid } from "../game/reducer"
import {
  aliveWolves,
  alivePlayers,
  bittenBabyWolfOf,
  getPlayer,
  protectedGuestOf,
} from "../game/selectors"
import { causeText } from "../game/text"
import { dawnLine, deathsLine } from "../game/script"
import {
  ActionBar,
  Avatar,
  Button,
  Callout,
  IconTile,
  Instruction,
  Screen,
  ScreenTitle,
  ScriptCard,
  SectionLabel,
  Stat,
  playerTone,
} from "../components/ui"
import { ROLE_ICON, playerIcon } from "../components/icons"
import { cardRole } from "../components/RoleList"
import { useShowRole } from "../lib/useShowRole"
import type { ScreenProps } from "./props"

function deathsTitle(count: number): string {
  if (count === 0) return "Nobody died"
  if (count === 1) return "1 death"
  return `${count} deaths`
}

export function NightResultsScreen({ state, dispatch }: ScreenProps) {
  const rn = state.roleNames
  const night = state.nightEvents[state.nightEvents.length - 1]
  const deaths = night?.deaths ?? []

  if (!night) return null

  // Everyone opens their eyes before hearing who died
  if (!hasSaid(state, "dawn")) {
    return (
      <DawnWake
        state={state}
        dispatch={dispatch}
      />
    )
  }

  const protectedGuest = protectedGuestOf(state, night)
  const saved = getPlayer(state, night.wizardSaved)
  const bitten = bittenBabyWolfOf(state, night)
  const hasSecrets = protectedGuest || saved || bitten
  const won = checkWinCondition(state.players) !== null

  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`Night ${state.currentNight} is over`}
          icon="sunrise"
          title={deathsTitle(deaths.length)}
          tone="sun"
        />
        <ScriptCard
          lines={[deathsLine(state, deaths)]}
          tone="sun"
        />

        {deaths.length > 0 && (
          <div className="space-y-2">
            {deaths.map((death) => (
              <DeathCard
                key={death.playerId}
                state={state}
                death={death}
              />
            ))}
          </div>
        )}

        {hasSecrets && <SectionLabel icon="secret">Only you know</SectionLabel>}
        {protectedGuest && (
          <Callout
            tone="moon"
            icon={ROLE_ICON.courtesan}
            title={`${protectedGuest.name} was safe at the ${roleName("courtesan", rn)}'s`}>
            The wolves attacked them, but nobody died.
          </Callout>
        )}
        {saved && (
          <Callout
            tone="leaf"
            icon="heal"
            title={`The ${roleName("wizard", rn)} saved ${saved.name}`}>
            The save potion is now used up.
          </Callout>
        )}
        {bitten && (
          <Callout
            tone="sun"
            icon={ROLE_ICON.baby_wolf}
            title={`${bitten.name} was bitten`}>
            The {roleName("baby_wolf", rn)} survives and joins the pack next night.
          </Callout>
        )}

        <div className="mt-5 flex rounded-2xl border border-white/5 bg-night-800/70 py-3.5">
          <Stat
            value={alivePlayers(state).length}
            label="Alive"
            tone="leaf"
            icon="heart"
          />
          <Stat
            value={state.players.length - alivePlayers(state).length}
            label="Dead"
            tone="blood"
            icon="skull"
          />
          <Stat
            value={aliveWolves(state).length}
            label="Wolves left"
            tone="sun"
            icon={ROLE_ICON.wolf}
          />
        </div>
      </Screen>
      <ActionBar>
        {/* A night that ended the game goes on to the winner */}
        {won && (
          <Button
            tone="sun"
            icon="trophy"
            onClick={() => dispatch({ type: "START_DAY" })}>
            See who won
          </Button>
        )}
        {!won && (
          <Button
            tone="sun"
            icon="sun"
            onClick={() => dispatch({ type: "START_DAY" })}>
            Start Day {state.currentNight}
          </Button>
        )}
      </ActionBar>
    </>
  )
}

function DawnWake({ state, dispatch }: ScreenProps) {
  return (
    <>
      <Screen>
        <ScreenTitle
          eyebrow={`Night ${state.currentNight} is over`}
          icon="sunrise"
          title="Dawn"
          tone="sun"
        />
        <ScriptCard
          lines={[dawnLine(state)]}
          tone="sun"
        />
        <Instruction icon="timer">Wait until everyone&apos;s eyes are open</Instruction>
      </Screen>
      <ActionBar>
        <Button
          tone="sun"
          onClick={() => dispatch({ type: "SAID", cue: "dawn" })}>
          Next
        </Button>
      </ActionBar>
    </>
  )
}

type DeathCardProps = { state: GameState; death: Death }

function DeathCard({ state, death }: DeathCardProps) {
  const showRole = useShowRole()
  const player = getPlayer(state, death.playerId)
  if (!player) return null
  // Everyone has a card by dawn
  const role = cardRole(state, player) ?? "villager"
  return (
    <div className="flex min-h-[72px] animate-pop items-center gap-3 rounded-2xl border border-blood-500/25 bg-blood-500/10 px-3.5 py-3">
      <Avatar name={player.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px] font-semibold text-mist-100">{player.name}</div>
        <div className="text-[14px] leading-snug text-blood-300">{causeText(death.cause, state.roleNames)}</div>
      </div>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => showRole(role)}
        className="-my-1.5 -mr-1.5 flex max-w-24 shrink-0 flex-col items-center gap-1 rounded-xl p-1.5 text-center active:bg-white/10">
        <IconTile
          icon={playerIcon(player, state.babyWolfPlayerId)}
          tone={playerTone(player)}
          size="sm"
        />
        <span className="text-[12px] leading-tight text-mist-400">{roleName(player.role, state.roleNames)}</span>
      </button>
    </div>
  )
}
