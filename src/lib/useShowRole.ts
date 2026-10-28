import { createContext, useContext } from "react"
import type { Role } from "../game/types"

// A switch on the role's card, for turning the role on or off while choosing the roles
export type RoleChoice = { on: boolean; onToggle: () => void }

export type ShowRole = (role: Role, choice?: RoleChoice) => void

// Opens a role's card over whatever is on screen, so tapping any role says what it does
export const ShowRoleContext = createContext<ShowRole>(() => {})

export function useShowRole(): ShowRole {
  return useContext(ShowRoleContext)
}
