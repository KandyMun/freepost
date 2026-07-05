import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'

// The middle-of-bar navigation shown while inside LTCL.
export default function LtclNav() {
  const { t } = useI18n()

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${isActive ? 'text-white' : 'text-neutral-400 hover:text-white'}`

  return (
    <>
      <NavLink to="/ltcl" end className={navClass}>{t.ltcl_tab_home}</NavLink>
      <NavLink to="/ltcl/rules" className={navClass}>{t.ltcl_tab_rules}</NavLink>
      <NavLink to="/ltcl/list" className={navClass}>{t.ltcl_tab_list}</NavLink>
      <NavLink to="/ltcl/leaderboard" className={navClass}>{t.ltcl_tab_leaderboard}</NavLink>
      <NavLink to="/ltcl/roulette" className={navClass}>{t.ltcl_tab_roulette}</NavLink>
      <NavLink to="/ltcl/packs" className={navClass}>{t.ltcl_tab_packs}</NavLink>
    </>
  )
}
