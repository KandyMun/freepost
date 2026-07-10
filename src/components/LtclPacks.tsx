import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useAuth } from '../AuthContext'
import { useLtclLevels, LEGACY_AFTER, type LtclLevel } from '../ltclLevels'
import { useLtclPacks, packLevels, packCompletion, type LtclPack } from '../ltclPacks'
import { levelThumbnailUrl } from '../aredl'
import Spinner from './Spinner'

// Blurred backdrop of the selected pack's first level thumbnail. Mirrors the
// list page so the two tabs feel like one surface.
function PackBackdrop({ src }: { src: string }) {
  const [ok, setOk] = useState(false)
  useEffect(() => { setOk(false) }, [src])
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <img
        src={src}
        alt=""
        onLoad={() => setOk(true)}
        className={`w-full h-full object-cover scale-125 transition-opacity duration-500 ${ok ? 'opacity-60' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-neutral-950/50" />
    </div>
  )
}

// One row in the scrollable packs list: pack name, level count, and — for a
// signed-in player — how many of its levels they've beaten.
function PackRow({
  pack,
  levels,
  handle,
  active,
  onSelect,
}: {
  pack: LtclPack
  levels: LtclLevel[]
  handle: string
  active: boolean
  onSelect: () => void
}) {
  const { t } = useI18n()
  const total = packLevels(pack, levels).length
  const done = handle ? packCompletion(pack, levels, handle) : 0
  const complete = handle && total > 0 && done === total
  return (
    <button
      onClick={onSelect}
      className={`relative w-full h-14 shrink-0 flex items-center gap-3 text-left px-3 rounded-lg text-sm overflow-hidden transition-all ${
        pack.image
          ? active ? 'ring-2 ring-white' : 'hover:ring-2 hover:ring-white/50'
          : active ? 'bg-violet-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'
      }`}
    >
      {pack.image && (
        <>
          <img src={pack.image} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
          <span className="absolute inset-0 bg-black/60" aria-hidden="true" />
        </>
      )}
      <span className={`relative flex-1 min-w-0 truncate text-base font-semibold [text-shadow:_0_2px_8px_rgb(0_0_0_/_0.98),_0_0_6px_rgb(0_0_0_/_0.95)] ${pack.image ? 'text-white' : ''}`}>
        {pack.name}
      </span>
      <span
        className={`relative text-xs shrink-0 [text-shadow:_0_2px_8px_rgb(0_0_0_/_0.98),_0_0_6px_rgb(0_0_0_/_0.95)] ${
          pack.image
            ? complete ? 'text-emerald-300' : 'text-white'
            : complete ? 'text-emerald-400' : active ? 'text-white/80' : 'text-neutral-500'
        }`}
      >
        {handle ? `${done}/${total}` : t.pack_level_count(total)}
      </span>
    </button>
  )
}

// The selected pack's detail: header + the ordered list of its levels, each
// linking through to that level on the List tab.
function PackDetail({ pack, levels, handle }: { pack: LtclPack; levels: LtclLevel[]; handle: string }) {
  const { t } = useI18n()
  const items = packLevels(pack, levels)
  const done = handle ? packCompletion(pack, levels, handle) : 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="relative rounded-xl px-5 py-4 border border-neutral-800/60 overflow-hidden">
          {pack.image && (
            <img src={pack.image} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
          )}
          {/* Dark wash over the image so the title stays readable. */}
          {pack.image && (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, rgba(10,10,10,0.85), rgba(10,10,10,0.45))' }}
              aria-hidden="true"
            />
          )}
          <div className="relative">
            <h1 className="text-2xl font-bold text-white">{pack.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className={pack.image ? 'text-neutral-200' : 'text-neutral-400'}>
                {handle
                  ? t.pack_completed_count(done, items.length)
                  : t.pack_level_count(items.length)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {items.length === 0 ? (
          <p className="text-neutral-500 text-sm py-8 text-center">{t.pack_no_levels}</p>
        ) : (
          items.map((level) => {
            const rank = level.placement ?? 0
            const beaten =
              !!handle &&
              (level.verifier?.trim().toLowerCase() === handle ||
                level.records.some((r) => r.username?.trim().toLowerCase() === handle))
            return (
              <Link
                key={level.levelId}
                to={`/ltcl/list?level=${level.levelId}`}
                className="group relative flex items-center gap-3 px-3 py-4 rounded-lg overflow-hidden bg-neutral-950 ring-1 ring-neutral-800/60 hover:ring-violet-500/60 transition-all"
              >
                {/* Full-bleed level thumbnail with a dark scrim for legibility. */}
                <img
                  src={level.thumbnail || levelThumbnailUrl(level.levelId)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-70 transition-opacity"
                />
                <span
                  className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-neutral-950/80"
                  aria-hidden="true"
                />
                <span className="relative text-white/70 text-sm shrink-0 w-10 font-semibold">{rank > 0 ? `#${rank}` : '–'}</span>
                <span className="relative flex-1 min-w-0 flex items-center gap-2">
                  <span className="truncate font-semibold text-white drop-shadow">{level.name}</span>
                  {rank > LEGACY_AFTER && (
                    <span className="text-[10px] uppercase tracking-wide text-amber-300 border border-amber-400/50 bg-neutral-950/40 px-1.5 py-0.5 rounded-full shrink-0">
                      {t.ltcl_list_legacy}
                    </span>
                  )}
                </span>
                {beaten && <span className="relative text-emerald-400 text-sm shrink-0 drop-shadow" title={t.pack_beaten}>✓</span>}
                <span className="relative text-white/80 text-xs shrink-0 w-14 text-right drop-shadow">{level.points ?? 0} {t.pack_pts}</span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function LtclPacks() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const { levels, loaded: levelsLoaded } = useLtclLevels()
  const { packs, loaded: packsLoaded } = useLtclPacks()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const handle = (profile?.username ?? '').trim().toLowerCase()

  useEffect(() => {
    if (selectedId === null && packs.length > 0) setSelectedId(packs[0].id)
  }, [packs, selectedId])

  const q = search.toLowerCase().trim()
  const visible = useMemo(
    () => (q ? packs.filter((p) => p.name.toLowerCase().includes(q)) : packs),
    [packs, q],
  )
  const current = packs.find((p) => p.id === selectedId) ?? packs[0]
  const backdropLevel = current ? packLevels(current, levels)[0] : undefined
  const backdropSrc =
    current?.image ||
    (backdropLevel ? backdropLevel.thumbnail || levelThumbnailUrl(backdropLevel.levelId) : '')

  if (!levelsLoaded || !packsLoaded) return <div className="flex justify-center py-20"><Spinner /></div>

  if (packs.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-24 text-center">
        <span className="text-5xl mb-6" aria-hidden="true">📦</span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{t.ltcl_tab_packs}</h1>
        <p className="mt-4 text-neutral-400">{t.pack_empty}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {backdropSrc && <PackBackdrop src={backdropSrc} />}
      <div className="relative z-10 p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 items-start">
        {/* Left: scrollable single list of packs */}
        <div className="rounded-2xl border border-neutral-800/60 bg-neutral-900/30 backdrop-blur-[7px] p-3 flex flex-col gap-2 lg:max-h-[calc(100vh-6rem)]">
          <input
            type="text"
            placeholder={t.ltcl_list_search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shrink-0 bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
          />
          <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
            {visible.map((pack) => (
              <PackRow
                key={pack.id}
                pack={pack}
                levels={levels}
                handle={handle}
                active={current?.id === pack.id}
                onSelect={() => setSelectedId(pack.id)}
              />
            ))}
            {visible.length === 0 && (
              <p className="text-neutral-500 text-sm text-center py-6">{t.pack_none_found}</p>
            )}
          </div>
        </div>

        {/* Right: selected pack detail */}
        <div className="rounded-2xl border border-neutral-800/60 bg-neutral-900/30 backdrop-blur-[7px] p-5">
          {current ? (
            <PackDetail pack={current} levels={levels} handle={handle} />
          ) : (
            <p className="text-neutral-500 text-center py-20">{t.pack_empty}</p>
          )}
        </div>
      </div>
    </div>
  )
}
