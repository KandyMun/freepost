import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from './i18n'

// The browser tab always starts with the hub name; the current section is
// appended so e.g. the LTCL pages read "GDLT Hub - LTCL". Driven off the first
// path segment, so every sub-page of a section keeps the same title.
const BASE = 'GDLT Hub'

// Set document.title from the active route. Called once in Layout, which wraps
// every page, so it stays in sync as the user navigates.
export function usePageTitle(): void {
  const { t } = useI18n()
  const { pathname } = useLocation()

  useEffect(() => {
    const segs = pathname.split('/').filter(Boolean)
    const seg = segs[0] ?? ''
    let label = ''
    switch (seg) {
      case '':
        label = '' // hub home — just "GDLT Hub"
        break
      case 'freepost':
        label = 'freepost'
        break
      case 'ltcl':
        label = 'LTCL'
        break
      case 'achievements':
        label = t.achievements_title
        break
      case 'bounty-board':
        label = t.bounty_board_title
        break
      case 'user-search':
        label = t.user_search_title
        break
      case 'about':
        label = t.about_title
        break
      case 'changelog':
        label = t.changelog_title
        break
      case 'admin':
        label = t.admin_title
        break
      case 'u':
        // Profile pages: show the handle being viewed.
        label = segs[1] ? decodeURIComponent(segs[1]) : t.nav_profile
        break
      default:
        label = ''
    }
    document.title = label ? `${BASE} - ${label}` : BASE
  }, [pathname, t])
}
