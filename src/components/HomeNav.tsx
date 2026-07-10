import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'

// Middle-of-bar navigation for hub-level pages (home, about, changelog).
export default function HomeNav() {
  const { t } = useI18n()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
    }`

  return (
    <>
      <NavLink to="/about" className={navClass}>{t.nav_about}</NavLink>
      <NavLink to="/changelog" className={navClass}>{t.nav_changelog}</NavLink>
    </>
  )
}
