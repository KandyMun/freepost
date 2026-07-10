import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { useAuth } from '../AuthContext'
import { useFileDrop } from '../useFileDrop'
import { type LtclLevel } from '../ltclLevels'
import { savePack, deletePack, newPackId, uploadPackImage, MIN_PACK_LEVELS, type LtclPack } from '../ltclPacks'
import { levelThumbnailUrl } from '../aredl'

interface Props {
  pack: LtclPack | null // null = creating a new pack
  packs: LtclPack[] // existing packs, for default ordering
  levels: LtclLevel[] // full level list, for the picker
  onClose: () => void
}

export default function LtclPackEditor({ pack, packs, levels, onClose }: Props) {
  const { t } = useI18n()
  const { user } = useAuth()
  const isNew = pack === null

  const [name, setName] = useState(pack?.name ?? '')
  const [image, setImage] = useState(pack?.image ?? '')
  const [imageUploading, setImageUploading] = useState(false)
  const [levelIds, setLevelIds] = useState<number[]>(pack?.levelIds ?? [])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  async function handleImageUpload(file: File | undefined) {
    if (!file || !user) return
    setError('')
    setImageUploading(true)
    try {
      setImage(await uploadPackImage(file, user.uid))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg === 'too-large' ? t.pack_edit_image_big : t.pack_edit_image_failed)
    } finally {
      setImageUploading(false)
    }
  }

  const { dragging: imageDragging, dropProps: imageDropProps } = useFileDrop(handleImageUpload)

  const byId = useMemo(() => new Map(levels.map((l) => [l.levelId, l])), [levels])
  // Shown hardest-first (placement ascending, unranked last) — the order is
  // derived automatically from list placement, not stored or hand-arranged.
  const selected = useMemo(
    () =>
      levelIds
        .map((id) => byId.get(id))
        .filter((l): l is LtclLevel => !!l)
        .sort((a, b) => (a.placement ?? Number.POSITIVE_INFINITY) - (b.placement ?? Number.POSITIVE_INFINITY)),
    [levelIds, byId],
  )

  const q = search.toLowerCase().trim()
  const results = useMemo(() => {
    if (!q) return []
    return levels
      .filter((l) => !levelIds.includes(l.levelId))
      .filter((l) => l.name.toLowerCase().includes(q) || String(l.levelId).includes(q))
      .slice(0, 8)
  }, [levels, levelIds, q])

  function add(id: number) {
    setLevelIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    setSearch('')
  }
  function remove(id: number) {
    setLevelIds((ids) => ids.filter((x) => x !== id))
  }

  async function handleSave() {
    setError('')
    if (!name.trim()) return setError(t.pack_edit_name_required)
    // Reject a name already used by another pack (case/whitespace-insensitive).
    const key = name.trim().toLowerCase()
    if (packs.some((p) => p.id !== pack?.id && p.name.trim().toLowerCase() === key)) {
      return setError(t.pack_edit_name_taken)
    }
    if (levelIds.length < MIN_PACK_LEVELS) return setError(t.pack_edit_min_levels(MIN_PACK_LEVELS))

    const next: LtclPack = {
      id: pack?.id ?? newPackId(),
      name: name.trim(),
      image: image.trim() || null,
      levelIds,
      order: pack?.order ?? (packs.length ? Math.max(...packs.map((p) => p.order)) + 1 : 0),
    }
    setSaving(true)
    try {
      await savePack(next)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!pack) return
    setDeleting(true)
    try {
      await deletePack(pack.id)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
      setDeleting(false)
    }
  }

  const inputCls =
    'w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500'
  const labelCls = 'text-xs font-semibold uppercase tracking-wide text-neutral-400'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-neutral-900 flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">
            {isNew ? t.pack_edit_add_title : t.pack_edit_edit_title}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>{t.pack_edit_name}</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.pack_edit_name} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelCls}>{t.pack_edit_image}</label>
            <div className="flex items-center gap-3" {...imageDropProps}>
              {image && (
                <img
                  src={image}
                  alt=""
                  className={`w-28 h-16 object-cover rounded-md border transition-colors ${imageDragging ? 'border-violet-400' : 'border-neutral-700'}`}
                />
              )}
              <label className={`text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors ${imageDragging ? 'bg-violet-800/60 ring-2 ring-violet-400 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'}`}>
                {imageUploading ? t.profile_uploading : imageDragging ? t.new_post_drop_hint : t.pack_edit_image_upload}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { handleImageUpload(e.target.files?.[0]); e.target.value = '' }} />
              </label>
              {image && (
                <button onClick={() => setImage('')} className="text-xs text-neutral-400 hover:text-red-400">
                  ✕ {t.pack_edit_image_remove}
                </button>
              )}
            </div>
            <p className="text-neutral-600 text-xs">{t.pack_edit_image_hint}</p>
          </div>

          {/* Level picker */}
          <div className="flex flex-col gap-2 border-t border-neutral-800 pt-4">
            <div className="flex items-center justify-between">
              <label className={labelCls}>{t.pack_edit_levels}</label>
              <span className={`text-xs ${selected.length < MIN_PACK_LEVELS ? 'text-amber-400' : 'text-neutral-500'}`}>
                {t.pack_edit_selected_count(selected.length, MIN_PACK_LEVELS)}
              </span>
            </div>

            <div className="relative">
              <input
                className={inputCls}
                placeholder={t.pack_edit_search_levels}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {results.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                  {results.map((l) => (
                    <button
                      key={l.levelId}
                      type="button"
                      onClick={() => add(l.levelId)}
                      className="flex items-center gap-2 w-full text-left text-sm px-3 py-1.5 text-neutral-200 hover:bg-neutral-800"
                    >
                      <span className="text-neutral-500 shrink-0">{l.placement != null ? `#${l.placement}` : '–'}</span>
                      <span className="truncate">{l.name}</span>
                      <span className="text-neutral-600 text-xs ml-auto shrink-0">{l.levelId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected.length === 0 ? (
              <p className="text-neutral-600 text-sm py-2">{t.pack_edit_empty}</p>
            ) : (
              <div className="flex flex-col gap-1">
                {selected.map((l) => (
                  <div key={l.levelId} className="flex items-center gap-2 bg-neutral-800/60 rounded-lg px-2 py-1.5">
                    <img src={l.thumbnail || levelThumbnailUrl(l.levelId)} alt="" className="w-10 h-6 object-cover rounded shrink-0 bg-neutral-950" />
                    <span className="text-neutral-500 text-xs shrink-0 w-8">{l.placement != null ? `#${l.placement}` : '–'}</span>
                    <span className="truncate text-sm text-neutral-200 flex-1 min-w-0">{l.name}</span>
                    <button onClick={() => remove(l.levelId)} className="text-neutral-500 hover:text-red-400 px-1" aria-label="remove">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-neutral-900 flex items-center justify-between gap-3 p-5 border-t border-neutral-800">
          <div>
            {!isNew &&
              (confirmDelete ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  {t.pack_edit_confirm_delete}
                </button>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="text-red-400 hover:text-red-300 text-sm font-medium">
                  {t.pack_edit_delete}
                </button>
              ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 text-sm">{t.cancel}</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
            >
              {saving ? t.profile_saving : t.profile_save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
