import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from '../i18n'
import Avatar from './Avatar'

interface UserRecord {
  id: string
  username: string
  displayName?: string
  photoURL?: string
}

// Hub-wide user search page, opened from the card on the home page (/search).
export default function UserSearch() {
  const { t } = useI18n()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserRecord)))
    })
  }, [])

  const q = search.toLowerCase().trim()
  const results = (q
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.displayName ?? '').toLowerCase().includes(q),
      )
    : users
  ).sort((a, b) => a.username.localeCompare(b.username))

  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <input
        type="text"
        placeholder={t.user_search_placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
        className="bg-neutral-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500 text-base"
      />

      {q && results.length === 0 && (
        <p className="text-neutral-500 text-center py-8">{t.user_search_none(search)}</p>
      )}

      {results.map((u) => (
        <Link
          key={u.id}
          to={`/u/${u.username}`}
          className="bg-neutral-900 rounded-2xl flex gap-3 items-center p-3 hover:bg-neutral-800 transition-colors"
        >
          <Avatar username={u.username} photoURL={u.photoURL ?? ''} size={44} />
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{u.displayName || u.username}</p>
            {u.displayName && u.displayName !== u.username && (
              <p className="text-neutral-500 text-xs truncate">@{u.username}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
