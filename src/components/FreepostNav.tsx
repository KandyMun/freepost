import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useIsAdmin } from '../useIsAdmin'

// The middle-of-bar navigation shown while inside freepost.
export default function FreepostNav() {
  const { t } = useI18n()
  const isAdmin = useIsAdmin()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${isActive ? 'text-white' : 'text-neutral-400 hover:text-white'}`

  return (
    <>
      <NavLink to="/freepost" end className={navClass}>{t.nav_feed}</NavLink>
      {isAdmin && <NavLink to="/freepost/users" className={navClass}>{t.nav_users}</NavLink>}
    </>
  )
}
