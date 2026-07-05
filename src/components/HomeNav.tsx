import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'

// Middle-of-bar navigation for hub-level pages (home, about, changelog).
export default function HomeNav() {
  const { t } = useI18n()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${isActive ? 'text-white' : 'text-neutral-400 hover:text-white'}`

  return (
    <>
      <NavLink to="/about" className={navClass}>{t.nav_about}</NavLink>
      <NavLink to="/changelog" className={navClass}>{t.nav_changelog}</NavLink>
    </>
  )
}
