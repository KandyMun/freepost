import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { useI18n } from '../i18n'
import { useSiteConfig, setSiteFrozen } from '../useSiteConfig'
import { ROLES, getRole } from '../roles'
import Spinner from './Spinner'

interface UserRecord {
  id: string
  username: string
  displayName?: string
  createdAt: number
  banned: boolean
  roles?: string[]
}

export default function UsersPage() {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const { frozen } = useSiteConfig()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rolesFor, setRolesFor] = useState<string | null>(null)

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as UserRecord))
          .sort((a, b) => a.username.localeCompare(b.username)),
      )
      setLoading(false)
    })
  }, [])

  async function toggleBan(u: UserRecord) {
    await updateDoc(doc(db, 'users', u.id), { banned: !u.banned })
  }

  async function toggleRole(uid: string, roleId: string, active: boolean) {
    await updateDoc(doc(db, 'users', uid), {
      roles: active ? arrayRemove(roleId) : arrayUnion(roleId),
    })
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  const q = search.toLowerCase().trim()
  const filtered = q
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.displayName ?? '').toLowerCase().includes(q),
      )
    : users

  return (
    <div className="p-4 flex flex-col gap-3 max-w-2xl mx-auto">
      <div className={`rounded-2xl px-4 py-3 flex items-center justify-between ${frozen ? 'bg-red-950/50 border border-red-800' : 'bg-neutral-900'}`}>
        <div>
          <p className="text-white font-medium text-sm">{frozen ? t.users_site_frozen : t.users_site_active}</p>
          <p className="text-neutral-500 text-xs mt-0.5">{frozen ? t.users_frozen_desc : t.users_active_desc}</p>
        </div>
        <button
          onClick={() => setSiteFrozen(!frozen)}
          className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${frozen ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
        >
          {frozen ? t.users_unfreeze : t.users_freeze}
        </button>
      </div>
      <input
        type="text"
        placeholder={t.users_search_placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-neutral-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
      />
      <p className="text-neutral-500 text-sm">{t.users_count(filtered.length)}</p>
      {filtered.map((u) => (
        <div key={u.id} className="bg-neutral-900 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className={`font-medium ${u.banned ? 'text-neutral-500 line-through' : 'text-white'}`}>
                {u.displayName || u.username}
                {u.id === user?.uid && <span className="text-neutral-600 text-xs ml-2">{t.users_you}</span>}
              </p>
              {u.displayName && u.displayName !== u.username && (
                <p className="text-neutral-500 text-xs">@{u.username}</p>
              )}
              <p className="text-neutral-600 text-xs mt-0.5">
                {t.users_joined(new Date(u.createdAt).toISOString().slice(0, 10))}
              </p>
              {u.roles && u.roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {u.roles.map((id) => {
                    const r = getRole(id)
                    if (!r) return null
                    return (
                      <span key={id} className={`text-xs px-2 py-0.5 rounded-full border ${r.badge}`}>
                        {r.label[locale]}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setRolesFor((cur) => (cur === u.id ? null : u.id))}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  rolesFor === u.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                {t.users_roles}
              </button>
              {u.id !== user?.uid && u.id !== import.meta.env.VITE_ADMIN_UID && (
                <button
                  onClick={() => toggleBan(u)}
                  className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                    u.banned
                      ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {u.banned ? t.users_unban : t.users_ban}
                </button>
              )}
            </div>
          </div>
          {rolesFor === u.id && (
            <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const active = u.roles?.includes(r.id) ?? false
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleRole(u.id, r.id, active)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      active ? r.badge : 'border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}{r.label[locale]}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
