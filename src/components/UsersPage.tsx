import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../AuthContext'
import { useI18n } from '../i18n'
import { useSiteConfig, setSiteFrozen } from '../useSiteConfig'
import { useCan } from '../permissions'
import { ROLES, getRole } from '../roles'
import { useBadges, createBadge, deleteBadge, toggleUserBadge, uploadBadgeAsset } from '../badges'
import BadgePill from './BadgePill'
import Spinner from './Spinner'

interface UserRecord {
  id: string
  username: string
  displayName?: string
  createdAt: number
  banned: boolean
  roles?: string[]
  badges?: string[]
}

export default function UsersPage() {
  const { user } = useAuth()
  const { t, locale } = useI18n()
  const { frozen } = useSiteConfig()
  const canAssignRoles = useCan('assign_roles')
  const { badges } = useBadges()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rolesFor, setRolesFor] = useState<string | null>(null)
  const [badgesFor, setBadgesFor] = useState<string | null>(null)
  const [newBadge, setNewBadge] = useState({ name: '', icon: '', color: '', background: '', hideName: false, date: '' })
  const [creatingBadge, setCreatingBadge] = useState(false)
  const [badgeUploading, setBadgeUploading] = useState<'icon' | 'background' | null>(null)
  const [badgeError, setBadgeError] = useState('')

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

  async function handleBadgeUpload(kind: 'icon' | 'background', file: File | undefined) {
    if (!file || !user) return
    setBadgeError('')
    setBadgeUploading(kind)
    try {
      const url = await uploadBadgeAsset(file, kind === 'icon' ? 'icons' : 'backgrounds', user.uid)
      setNewBadge((s) => ({ ...s, [kind]: url }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setBadgeError(msg === 'too-large'
        ? (kind === 'icon' ? t.users_badge_icon_big : t.users_badge_bg_big)
        : t.users_badge_upload_failed)
    } finally {
      setBadgeUploading(null)
    }
  }

  async function handleCreateBadge() {
    if (!newBadge.name.trim()) return
    setCreatingBadge(true)
    try {
      await createBadge({
        name: newBadge.name.trim(),
        icon: newBadge.icon.trim(),
        color: newBadge.color.trim() || undefined,
        background: newBadge.background.trim() || undefined,
        hideName: newBadge.hideName || undefined,
        date: newBadge.date || undefined,
      })
      setNewBadge({ name: '', icon: '', color: '', background: '', hideName: false, date: '' })
      setBadgeError('')
    } finally {
      setCreatingBadge(false)
    }
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
      {canAssignRoles && (
        <div className="bg-neutral-900 rounded-2xl px-4 py-3 flex flex-col gap-3">
          <p className="text-white font-medium text-sm">{t.users_badges_title}</p>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b.id} className="inline-flex items-center gap-1">
                  <BadgePill badge={b} />
                  <button
                    onClick={() => deleteBadge(b.id)}
                    className="text-neutral-500 hover:text-red-400 text-xs"
                    aria-label="delete badge"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={newBadge.name}
              onChange={(e) => setNewBadge((s) => ({ ...s, name: e.target.value }))}
              placeholder={t.users_badge_name}
              className="flex-1 min-w-[8rem] bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
            />
            <input
              value={/^https?:\/\//.test(newBadge.icon) ? '' : newBadge.icon}
              onChange={(e) => setNewBadge((s) => ({ ...s, icon: e.target.value }))}
              placeholder={t.users_badge_icon}
              className="w-36 bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
            />
            <input
              type="color"
              value={newBadge.color || '#a78bfa'}
              onChange={(e) => setNewBadge((s) => ({ ...s, color: e.target.value }))}
              title={t.users_badge_color}
              className="w-9 h-9 bg-neutral-800 rounded-lg cursor-pointer shrink-0"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-2 rounded-lg cursor-pointer">
              {badgeUploading === 'icon' ? t.profile_uploading : t.users_badge_icon_upload}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { handleBadgeUpload('icon', e.target.files?.[0]); e.target.value = '' }} />
            </label>
            {/^https?:\/\//.test(newBadge.icon) && (
              <button onClick={() => setNewBadge((s) => ({ ...s, icon: '' }))} className="text-xs text-neutral-400 hover:text-red-400" title={t.users_badge_remove_icon}>✕ {t.users_badge_icon_upload}</button>
            )}
            <label className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-2 rounded-lg cursor-pointer">
              {badgeUploading === 'background' ? t.profile_uploading : t.users_badge_bg_upload}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { handleBadgeUpload('background', e.target.files?.[0]); e.target.value = '' }} />
            </label>
            {newBadge.background && (
              <button onClick={() => setNewBadge((s) => ({ ...s, background: '' }))} className="text-xs text-neutral-400 hover:text-red-400" title={t.users_badge_remove_bg}>✕ {t.users_badge_bg_upload}</button>
            )}
            <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
              <input type="checkbox" checked={newBadge.hideName} onChange={(e) => setNewBadge((s) => ({ ...s, hideName: e.target.checked }))} className="accent-violet-500" />
              {t.users_badge_hide_name}
            </label>
            <input
              type="date"
              value={newBadge.date}
              onChange={(e) => setNewBadge((s) => ({ ...s, date: e.target.value }))}
              title={t.users_badge_date}
              className="bg-neutral-800 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-violet-500"
            />
            {(newBadge.name || newBadge.icon || newBadge.background) && (
              <span className="ml-1"><BadgePill badge={{ id: 'preview', name: newBadge.name || '—', icon: newBadge.icon, color: newBadge.color || undefined, background: newBadge.background || undefined, hideName: newBadge.hideName, date: newBadge.date || undefined }} /></span>
            )}
            <button
              onClick={handleCreateBadge}
              disabled={creatingBadge || !newBadge.name.trim()}
              className="ml-auto bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              {t.users_badge_create}
            </button>
          </div>
          <p className="text-neutral-600 text-xs">{t.users_badge_hint}</p>
          {badgeError && <p className="text-red-400 text-xs">{badgeError}</p>}
        </div>
      )}
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
              <p className={`font-medium flex items-center gap-1.5 ${u.banned ? 'text-neutral-500 line-through' : 'text-white'}`}>
                <span>{u.displayName || u.username}</span>
                {u.roles?.map((id) => {
                  const r = getRole(id)
                  return r ? <span key={id} title={r.label[locale]} className="text-base leading-none">{r.icon}</span> : null
                })}
                {u.id === user?.uid && <span className="text-neutral-600 text-xs ml-1">{t.users_you}</span>}
              </p>
              {u.displayName && u.displayName !== u.username && (
                <p className="text-neutral-500 text-xs">@{u.username}</p>
              )}
              <p className="text-neutral-600 text-xs mt-0.5">
                {t.users_joined(new Date(u.createdAt).toISOString().slice(0, 10))}
              </p>
              {u.badges && u.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {u.badges.map((id) => {
                    const b = badges.find((x) => x.id === id)
                    return b ? <BadgePill key={id} badge={b} /> : null
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canAssignRoles && (
                <button
                  onClick={() => { setRolesFor((cur) => (cur === u.id ? null : u.id)); setBadgesFor(null) }}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    rolesFor === u.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {t.users_roles}
                </button>
              )}
              {canAssignRoles && (
                <button
                  onClick={() => { setBadgesFor((cur) => (cur === u.id ? null : u.id)); setRolesFor(null) }}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    badgesFor === u.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {t.users_badges}
                </button>
              )}
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
          {canAssignRoles && rolesFor === u.id && (
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
          {canAssignRoles && badgesFor === u.id && (
            <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-wrap gap-2">
              {badges.length === 0 ? (
                <p className="text-neutral-500 text-xs">{t.users_badges_none}</p>
              ) : (
                badges.map((b) => {
                  const active = u.badges?.includes(b.id) ?? false
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleUserBadge(u.id, b.id, active)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
                        active ? 'border-violet-500 bg-violet-600/20 text-white' : 'border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{b.icon && <span>{/^https?:\/\//.test(b.icon) ? '🖼️' : b.icon}</span>}{b.name}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
