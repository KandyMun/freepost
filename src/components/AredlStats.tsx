import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { fetchAredlStats, levelThumbnailUrl, type AredlStats as Stats, type AredlHardest } from '../aredl'
import Spinner from './Spinner'

type State =
  | { kind: 'loading' }
  | { kind: 'none' }
  | { kind: 'error' }
  | { kind: 'loaded'; stats: Stats }

const fmt = (n: number) => n.toLocaleString('en-US')
const fmtPts = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const rankOf = (n: number | null) => (n ? `#${fmt(n)}` : '—')

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-800/60 rounded-xl px-3 py-2.5 text-center">
      <p className="text-white text-lg font-semibold leading-tight">{value}</p>
      <p className="text-neutral-400 text-xs mt-1">{label}</p>
    </div>
  )
}

// One rank scope (Global or Country) with its points and demons placements.
function RankBlock({
  title,
  pointsRank,
  demonsRank,
  pointsLabel,
  demonsLabel,
}: {
  title: string
  pointsRank: number | null
  demonsRank: number | null
  pointsLabel: string
  demonsLabel: string
}) {
  return (
    <div className="bg-neutral-800/60 rounded-xl px-3 py-2.5">
      <p className="text-neutral-400 text-xs mb-1.5">{title}</p>
      <div className="flex justify-between text-sm">
        <span className="text-neutral-500">{pointsLabel}</span>
        <span className="text-white font-medium">{rankOf(pointsRank)}</span>
      </div>
      <div className="flex justify-between text-sm mt-0.5">
        <span className="text-neutral-500">{demonsLabel}</span>
        <span className="text-white font-medium">{rankOf(demonsRank)}</span>
      </div>
    </div>
  )
}

// Prominent hardest-demon banner, using the level's thumbnail as the background
// when one exists (falls back to the violet gradient if it fails to load).
function HardestBanner({ hardest }: { hardest: AredlHardest | null }) {
  const { t } = useI18n()
  const [imgOk, setImgOk] = useState(false)
  const levelId = hardest?.levelId

  useEffect(() => {
    setImgOk(false) // reset when the level changes
  }, [levelId])

  return (
    <div
      className={`relative rounded-xl px-4 py-3 mb-2 overflow-hidden border border-violet-500/30 ${
        imgOk ? '' : 'bg-gradient-to-r from-violet-600/25 to-fuchsia-600/10'
      }`}
    >
      {levelId !== undefined && (
        <img
          src={levelThumbnailUrl(levelId)}
          alt=""
          aria-hidden="true"
          onLoad={() => setImgOk(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgOk ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {imgOk && (
        // Legibility scrim behind the text on the left; fades out so the rest of
        // the thumbnail stays visible.
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/40 to-transparent" />
      )}
      <div className="relative">
        <p className="text-violet-200/90 text-[11px] font-semibold uppercase tracking-wider drop-shadow">
          {t.aredl_hardest}
        </p>
        {hardest ? (
          <div className="flex items-baseline justify-between gap-3 mt-1">
            <span className="text-white text-xl font-bold truncate drop-shadow">{hardest.name}</span>
            <span className="shrink-0 text-neutral-200 text-sm drop-shadow">
              #{hardest.position} · {fmtPts(hardest.points)} pts
            </span>
          </div>
        ) : (
          <p className="text-neutral-500 text-sm italic mt-1">{t.aredl_no_records}</p>
        )}
      </div>
    </div>
  )
}

export default function AredlStats({
  username,
  discordId,
}: {
  username: string
  discordId?: string
}) {
  const { t } = useI18n()
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let active = true
    setState({ kind: 'loading' })
    fetchAredlStats(username, discordId)
      .then((stats) => {
        if (!active) return
        setState(stats ? { kind: 'loaded', stats } : { kind: 'none' })
      })
      .catch(() => active && setState({ kind: 'error' }))
    return () => {
      active = false
    }
  }, [username, discordId])

  // Stay quiet unless there's something to show: no card for users without an
  // AREDL account or on a transient error.
  if (state.kind === 'none' || state.kind === 'error') return null

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-neutral-300 font-medium">{t.aredl_title}</h2>
        {state.kind === 'loaded' && (
          <a
            href={state.stats.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 text-sm"
          >
            {t.aredl_view} ↗
          </a>
        )}
      </div>

      {state.kind === 'loading' ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : (
        <>
          <HardestBanner hardest={state.stats.hardest} />

          <div className="grid grid-cols-2 gap-2">
            <Stat label={t.aredl_points} value={fmtPts(state.stats.totalPoints)} />
            <Stat label={t.aredl_extremes} value={fmt(state.stats.extremes)} />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <RankBlock
              title={t.aredl_global}
              pointsRank={state.stats.rank}
              demonsRank={state.stats.extremesRank}
              pointsLabel={t.aredl_rank_points}
              demonsLabel={t.aredl_rank_demons}
            />
            <RankBlock
              title={t.aredl_country}
              pointsRank={state.stats.countryRank}
              demonsRank={state.stats.countryExtremesRank}
              pointsLabel={t.aredl_rank_points}
              demonsLabel={t.aredl_rank_demons}
            />
          </div>
        </>
      )}
    </div>
  )
}
