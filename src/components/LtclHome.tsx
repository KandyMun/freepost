import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useDisplayName } from './AuthorLink'
import crownIcon from '/crown.svg'
import userGearIcon from '/user-gear.svg'
import codeIcon from '/code.svg'
import userShieldIcon from '/user-shield.svg'
import userLockIcon from '/user-lock.svg'

// LTCL landing page: welcome blurb, a level changelog and the list staff.
// The changelog and staff are placeholder data for now — edit the arrays below
// (or wire them to Firestore later) as the list fills in.

type ChangeEntry = { level: string; text: string }
type ChangeDay = { date: string; entries: ChangeEntry[] }

// Newest first. `text` is the placement note shown after the level name.
const CHANGELOG: ChangeDay[] = [
  {
    date: '2026-07-04',
    entries: [
      { level: 'Placeholder Challenge', text: 'was placed at #1 to start the list.' },
    ],
  },
]

type StaffGroup = { label: { en: string; lt: string }; icon: string; members: string[] }

const STAFF: StaffGroup[] = [
  { label: { en: 'Owners', lt: 'Savininkai' }, icon: crownIcon, members: [] },
  { label: { en: 'Admins', lt: 'Administratoriai' }, icon: userGearIcon, members: [] },
  { label: { en: 'Developers', lt: 'Programuotojai' }, icon: codeIcon, members: ['kandymangd'] },
  { label: { en: 'Moderators', lt: 'Moderatoriai' }, icon: userShieldIcon, members: [] },
  { label: { en: 'Helpers', lt: 'Pagalbininkai' }, icon: userLockIcon, members: [] },
]

// One staff chip: shows the member's chosen display name (falling back to their
// handle) and the role icon, linking to their hub profile.
function StaffChip({ handle, icon }: { handle: string; icon: string }) {
  const name = useDisplayName(handle)
  return (
    <Link
      to={`/u/${handle}`}
      className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm px-3 py-1 rounded-lg transition-colors"
    >
      <img src={icon} alt="" aria-hidden="true" className="w-3.5 h-3.5 opacity-80" />
      {name}
    </Link>
  )
}

export default function LtclHome() {
  const { t, locale } = useI18n()

  return (
    <div className="px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left / main column */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Welcome */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {t.ltcl_welcome_title}
          </h1>
          <p className="mt-3 text-sm text-neutral-400 max-w-xl mx-auto">{t.ltcl_welcome_desc}</p>
          <p className="mt-3 text-sm text-neutral-400 max-w-xl mx-auto">
            <span className="font-semibold text-neutral-200">{t.ltcl_disclaimer_label}</span>{' '}
            {t.ltcl_disclaimer}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/ltcl/list"
              className="inline-block bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {t.ltcl_view_list}
            </Link>
            <Link
              to="/ltcl/rules"
              className="inline-block bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {t.ltcl_tab_rules}
            </Link>
          </div>
        </section>

        {/* Changelog */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <h2 className="text-lg font-bold text-white mb-4">{t.ltcl_changelog_title}</h2>
          <div className="flex flex-col gap-5">
            {CHANGELOG.map((day) => (
              <div key={day.date}>
                <p className="text-violet-400 font-semibold text-sm mb-1.5">{day.date}</p>
                <ul className="flex flex-col gap-1.5">
                  {day.entries.map((e, i) => (
                    <li key={i} className="text-sm text-neutral-400">
                      <span className="text-white font-medium">{e.level}</span> {e.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right column: staff */}
      <aside className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
        <h2 className="text-lg font-bold text-white text-center mb-4">{t.ltcl_staff_title}</h2>
        <div className="flex flex-col gap-4">
          {STAFF.filter((g) => g.members.length > 0).map((group) => (
            <div key={group.label.en} className="text-center">
              <p className="text-neutral-300 font-semibold text-sm mb-2">{group.label[locale]}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {group.members.map((m) => (
                  <StaffChip key={m} handle={m} icon={group.icon} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
