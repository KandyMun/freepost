import { useState } from 'react'
import { useI18n } from '../i18n'
import { useLtclLevels } from '../ltclLevels'
import { useLtclPacks, packLevels, type LtclPack } from '../ltclPacks'
import { levelThumbnailUrl } from '../aredl'
import LtclPackEditor from './LtclPackEditor'
import Spinner from './Spinner'

// Pack management for the LTCL admin panel: create, edit and delete packs and
// choose which levels each one groups. Gated by manage_levels (list-admin).
export default function LtclAdminPacks() {
  const { t } = useI18n()
  const { levels, loaded: levelsLoaded } = useLtclLevels()
  const { packs, loaded: packsLoaded } = useLtclPacks()
  const [editing, setEditing] = useState<LtclPack | null>(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  if (!levelsLoaded || !packsLoaded) return <div className="flex justify-center py-20"><Spinner /></div>

  const q = search.toLowerCase().trim()
  const visible = q ? packs.filter((p) => p.name.toLowerCase().includes(q)) : packs

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setAdding(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + {t.pack_admin_add}
        </button>
        <input
          type="text"
          placeholder={t.ltcl_list_search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[10rem] bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
        />
      </div>

      <p className="text-neutral-500 text-sm">{t.pack_admin_count(visible.length)}</p>

      {visible.length === 0 ? (
        <p className="text-neutral-500 text-sm py-8 text-center">{q ? t.pack_none_found : t.pack_empty}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {visible.map((pack) => {
            const packLvls = packLevels(pack, levels)
            const count = packLvls.length
            const first = packLvls[0]
            const thumb = pack.image || (first ? first.thumbnail || levelThumbnailUrl(first.levelId) : '')
            return (
              <button
                key={pack.id}
                onClick={() => setEditing(pack)}
                className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm text-neutral-200 bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
              >
                {thumb ? (
                  <img src={thumb} alt="" className="w-12 h-8 object-cover rounded shrink-0 bg-neutral-950" />
                ) : (
                  <span className="w-12 h-8 rounded shrink-0 bg-neutral-800 flex items-center justify-center text-neutral-600" aria-hidden="true">📦</span>
                )}
                <span className="font-medium truncate flex-1 min-w-0">{pack.name}</span>
                <span className="text-neutral-500 text-xs shrink-0">
                  {t.pack_level_count(count)} · {t.ltcl_admin_edit}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {(adding || editing) && (
        <LtclPackEditor
          pack={adding ? null : editing}
          packs={packs}
          levels={levels}
          onClose={() => { setAdding(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
