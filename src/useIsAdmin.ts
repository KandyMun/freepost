import { useAuth } from './AuthContext'
import { SUPER_ROLES } from './permissions'

// Site-wide admin: the hardcoded super-admin, or anyone with a super role
// (currently `administrator`). Used for freepost moderation, the users page,
// site freeze, etc.
export function useIsAdmin() {
  const { user, profile } = useAuth()
  if (user?.uid === import.meta.env.VITE_ADMIN_UID) return true
  return (profile?.roles ?? []).some((r) => SUPER_ROLES.includes(r))
}
