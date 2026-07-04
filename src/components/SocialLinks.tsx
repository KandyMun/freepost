import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useI18n } from '../i18n'
import { invalidateProfile } from '../userProfiles'
import {
  EDITABLE_PLATFORMS,
  normalizeUrl,
  CUSTOM_ICON,
  MAX_CUSTOM_LINKS,
  MAX_CUSTOM_LABEL,
  type CustomLink,
} from '../socials'

// Small brand-glyph icon (0 0 24 24 viewBox), inherits color from its parent.
function SocialIcon({ path, size = 20 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

// Read-only row of clickable brand icons shown under the username.
export function SocialLinksRow({
  socials,
  customLinks,
}: {
  socials?: Record<string, string>
  customLinks?: CustomLink[]
}) {
  const entries = EDITABLE_PLATFORMS.filter((p) => socials?.[p.id]).map((p) => ({
    key: p.id,
    label: p.label,
    hex: p.hex,
    path: p.path,
    url: socials![p.id],
  }))
  const customs = (customLinks ?? []).map((c, i) => ({
    key: `custom-${i}`,
    label: c.label,
    hex: '#a78bfa',
    path: CUSTOM_ICON,
    url: c.url,
  }))
  const all = [...entries, ...customs]
  if (all.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-3">
      {all.map((item) => (
        <a
          key={item.key}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={item.label}
          aria-label={item.label}
          className="social-icon"
          style={{ ['--brand' as string]: item.hex }}
        >
          <SocialIcon path={item.path} size={22} />
        </a>
      ))}
    </div>
  )
}

// Owner-only editor. Persists to users/{uid}.socials and .customLinks.
export function SocialLinksEditor({
  uid,
  username,
  initialSocials,
  initialCustom,
  onSaved,
}: {
  uid: string
  username: string
  initialSocials?: Record<string, string>
  initialCustom?: CustomLink[]
  onSaved: (socials: Record<string, string>, customLinks: CustomLink[]) => void
}) {
  const { t } = useI18n()
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const p of EDITABLE_PLATFORMS) init[p.id] = initialSocials?.[p.id] ?? ''
    return init
  })
  const [custom, setCustom] = useState<CustomLink[]>(() => initialCustom ?? [])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setField(id: string, value: string) {
    setFields((f) => ({ ...f, [id]: value }))
  }

  function setCustomAt(i: number, patch: Partial<CustomLink>) {
    setCustom((c) => c.map((item, idx) => (idx === i ? { ...item, ...patch } : item)))
  }

  function addCustom() {
    if (custom.length >= MAX_CUSTOM_LINKS) return
    setCustom((c) => [...c, { label: '', url: '' }])
  }

  function removeCustom(i: number) {
    setCustom((c) => c.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    setError('')
    // Validate + normalize fixed-platform URLs.
    const socials: Record<string, string> = {}
    for (const p of EDITABLE_PLATFORMS) {
      const raw = fields[p.id]?.trim()
      if (!raw) continue
      const url = normalizeUrl(raw)
      if (!url) {
        setError(t.profile_links_err_url(p.label))
        return
      }
      socials[p.id] = url
    }
    // Validate + normalize custom links (both label and url required).
    const customLinks: CustomLink[] = []
    for (const c of custom) {
      const label = c.label.trim()
      const rawUrl = c.url.trim()
      if (!label && !rawUrl) continue // skip fully-empty rows
      if (!label || !rawUrl) {
        setError(t.profile_links_err_incomplete)
        return
      }
      const url = normalizeUrl(rawUrl)
      if (!url) {
        setError(t.profile_links_err_url(label))
        return
      }
      customLinks.push({ label: label.slice(0, MAX_CUSTOM_LABEL), url })
    }

    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', uid), { socials, customLinks })
      invalidateProfile(username)
      onSaved(socials, customLinks)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {EDITABLE_PLATFORMS.map((p) => (
        <label key={p.id} className="flex items-center gap-3">
          <span
            className="social-icon shrink-0"
            style={{ ['--brand' as string]: p.hex, color: fields[p.id] ? p.hex : undefined }}
            title={p.label}
          >
            <SocialIcon path={p.path} size={20} />
          </span>
          <input
            type="url"
            inputMode="url"
            value={fields[p.id]}
            onChange={(e) => setField(p.id, e.target.value)}
            placeholder={p.placeholder}
            className="flex-1 bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-600"
          />
        </label>
      ))}

      <div className="border-t border-neutral-800 pt-3 mt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-400 text-sm">{t.profile_links_custom_title}</span>
          <button
            type="button"
            onClick={addCustom}
            disabled={custom.length >= MAX_CUSTOM_LINKS}
            className="text-violet-400 hover:text-violet-300 disabled:opacity-40 text-sm"
          >
            {t.profile_links_add}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {custom.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="social-icon shrink-0" style={{ ['--brand' as string]: '#a78bfa' }}>
                <SocialIcon path={CUSTOM_ICON} size={20} />
              </span>
              <input
                value={c.label}
                onChange={(e) => setCustomAt(i, { label: e.target.value.slice(0, MAX_CUSTOM_LABEL) })}
                placeholder={t.profile_links_custom_label}
                className="w-1/3 bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-600"
              />
              <input
                type="url"
                inputMode="url"
                value={c.url}
                onChange={(e) => setCustomAt(i, { url: e.target.value })}
                placeholder="https://…"
                className="flex-1 bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-600"
              />
              <button
                type="button"
                onClick={() => removeCustom(i)}
                className="text-neutral-500 hover:text-red-400 text-lg leading-none px-1"
                aria-label={t.delete}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {error ? (
          <span className="text-red-400 text-xs">{error}</span>
        ) : (
          <span className="text-neutral-600 text-xs">{t.profile_links_hint}</span>
        )}
        <div className="flex items-center gap-3">
          {saved && <span className="text-emerald-400 text-xs">{t.profile_saved}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {saving ? t.profile_saving : t.profile_save}
          </button>
        </div>
      </div>
    </div>
  )
}
