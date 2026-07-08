import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { useAuth } from '../AuthContext'
import { useFileDrop } from '../useFileDrop'
import {
  useLtclLevels,
  uploadLevelThumbnail,
  updateLevelThumbnail,
  LEGACY_AFTER,
  type LtclLevel,
} from '../ltclLevels'
import { useCan } from '../permissions'
import LtclLevelEditor from './LtclLevelEditor'
import Spinner from './Spinner'

// A single level row in the admin list. Split out from the parent so each row
// can own its own drag-and-drop state (useFileDrop is a hook — it can't be
// called once per item inside a .map()). Dropping an image directly onto the
// row uploads it and replaces the level's thumbnail immediately, without
// opening the full editor; dropping is only wired up for staff who can
// actually manage level metadata.
function LevelRow({
  level,
  rank,
  canManageLevels,
  onOpen,
}: {
  level: LtclLevel
  rank: number
  canManageLevels: boolean
  onOpen: () => void
}) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleDrop(file?: File) {
    if (!file || !user) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadLevelThumbnail(file, user.uid)
      await updateLevelThumbnail(level.levelId, url)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg === 'too-large' ? t.ltcl_edit_thumb_big : t.ltcl_edit_thumb_failed)
    } finally {
      setUploading(false)
    }
  }

  const { dragging, dropProps } = useFileDrop(handleDrop)
  const showThumbSlot = level.thumbnail || uploading

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={onOpen}
        {...(canManageLevels ? dropProps : {})}
        className={`w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg text-sm text-neutral-200 bg-neutral-800/50 hover:bg-neutral-800 transition-colors ${
          dragging ? 'ring-2 ring-violet-400 bg-violet-950/40' : ''
        }`}
      >
        <span className="truncate flex items-center gap-2 min-w-0">
          <span className="text-neutral-500 shrink-0">#{rank}</span>
          {showThumbSlot && (
            <span className="relative w-8 h-8 shrink-0">
              {level.thumbnail && (
                <img
                  src={level.thumbnail}
                  alt=""
                  className={`w-8 h-8 object-cover rounded transition-opacity ${uploading ? 'opacity-40' : ''}`}
                />
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                </span>
              )}
            </span>
          )}
          <span className="font-medium truncate">{level.name}</span>
          {rank > LEGACY_AFTER && (
            <span className="text-[10px] uppercase tracking-wide text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded-full shrink-0">
              {t.ltcl_list_legacy}
            </span>
          )}
        </span>
        <span className="text-neutral-500 text-xs shrink-0">
          {t.ltcl_admin_recs(level.records.length)} · {t.ltcl_admin_edit}
        </span>
      </button>
      {error && <p className="text-red-400 text-xs px-3">{error}</p>}
    </div>
  )
}

// Level management for the LTCL admin panel: add, edit, delete and reorder
// levels (and their records) via the shared level editor. Moderators with only
// manage_records get the records-only editor; the editor enforces that.
export default function LtclAdminLevels() {
  const { t } = useI18n()
  const canManageLevels = useCan('manage_levels')
  const { levels, loaded } = useLtclLevels()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<LtclLevel | null>(null)
  const [adding, setAdding] = useState(false)

  const ranked = useMemo(
    () => levels.map((level, i) => ({ level, rank: level.placement ?? i + 1 })),
    [levels],
  )
  const q = search.toLowerCase().trim()
  const visible = q ? ranked.filter((r) => r.level.name.toLowerCase().includes(q)) : ranked

  if (!loaded) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        {canManageLevels && (
          <button
            onClick={() => setAdding(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + {t.ltcl_admin_add}
          </button>
        )}
        <input
          type="text"
          placeholder={t.ltcl_list_search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[10rem] bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
        />
      </div>

      <p className="text-neutral-500 text-sm">{t.ltcl_admin_count(visible.length)}</p>

      <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
        {visible.map(({ level, rank }) => (
          <LevelRow
            key={level.levelId}
            level={level}
            rank={rank}
            canManageLevels={canManageLevels}
            onOpen={() => setEditing(level)}
          />
        ))}
      </div>

      {(adding || editing) && (
        <LtclLevelEditor
          level={adding ? null : editing}
          levels={levels}
          canManageLevels={canManageLevels}
          onClose={() => { setAdding(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
