import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'

// The middle-of-bar navigation shown while inside freepost.
export default function FreepostNav() {
  const { t } = useI18n()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
    }`

  return (
    <>
      <NavLink to="/freepost" end className={navClass}>{t.nav_feed}</NavLink>
    </>
  )
}
