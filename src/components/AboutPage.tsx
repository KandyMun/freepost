import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import Avatar from './Avatar'

// People to credit. Add entries here — name, a role label, and an optional
// `handle` to link them to their freepost profile (/freepost/u/{handle}).
type Credit = { name: string; role: string; handle?: string }

function useCredits(): Credit[] {
  const { t } = useI18n()
  return [
    { name: 'KandyMan', role: t.about_credit_dev, handle: 'kandymangd' },
    { name: 'Elevens', role: t.about_credit_icon },
    { name: 'taiga', role: t.about_credit_ideas, handle: 'tajjga' },
  ]
}

export default function AboutPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'about' | 'credits'>('about')
  const credits = useCredits()

  const tabClass = (active: boolean) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-4">{t.about_title}</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('about')} className={tabClass(tab === 'about')}>{t.about_tab_about}</button>
        <button onClick={() => setTab('credits')} className={tabClass(tab === 'credits')}>{t.about_tab_credits}</button>
      </div>

      {tab === 'about' ? (
        <p className="text-neutral-300 leading-relaxed whitespace-pre-line">{t.about_body}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {credits.map((c) => (
            <div key={c.name} className="flex items-center justify-between gap-3 bg-neutral-900 rounded-xl px-4 py-3">
              {c.handle ? (
                <Link to={`/freepost/u/${c.handle}`} className="flex items-center gap-3 min-w-0 group">
                  <Avatar username={c.handle} size={40} />
                  <p className="text-white font-medium truncate group-hover:text-violet-300 transition-colors">
                    {c.name}
                    <span className="text-neutral-500 text-xs font-normal ml-2">@{c.handle}</span>
                  </p>
                </Link>
              ) : (
                <span className="text-white font-medium truncate min-w-0">{c.name}</span>
              )}
              <span className="text-neutral-400 text-sm shrink-0">{c.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
