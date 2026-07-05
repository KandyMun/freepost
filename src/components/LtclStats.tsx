import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useLtclLevels, buildLeaderboard, type LtclLevel } from '../ltclLevels'
import { levelThumbnailUrl } from '../aredl'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-800/60 rounded-xl px-3 py-2.5 text-center">
      <p className="text-white text-lg font-semibold leading-tight">{value}</p>
      <p className="text-neutral-400 text-xs mt-1">{label}</p>
    </div>
  )
}

function HardestBanner({ hardest }: { hardest: LtclLevel }) {
  const { t } = useI18n()
  const [imgOk, setImgOk] = useState(false)
  useEffect(() => { setImgOk(false) }, [hardest.levelId])

  return (
    <div
      className={`relative rounded-xl px-4 py-3 mb-2 overflow-hidden border border-violet-500/30 ${
        imgOk ? '' : 'bg-gradient-to-r from-violet-600/25 to-fuchsia-600/10'
      }`}
    >
      <img
        src={levelThumbnailUrl(hardest.levelId)}
        alt=""
        aria-hidden="true"
        onLoad={() => setImgOk(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgOk ? 'opacity-100' : 'opacity-0'}`}
      />
      {imgOk && <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/40 to-transparent" />}
      <div className="relative">
        <p className="text-violet-200/90 text-[11px] font-semibold uppercase tracking-wider drop-shadow">
          {t.ltcl_lb_hardest}
        </p>
        <div className="flex items-baseline justify-between gap-3 mt-1">
          <span className="text-white text-xl font-bold truncate drop-shadow">{hardest.name}</span>
          {hardest.placement != null && (
            <span className="shrink-0 text-neutral-200 text-sm drop-shadow">#{hardest.placement}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// LTCL summary shown on a hub profile: leaderboard position, points, and hardest
// completed challenge, with a link through to the player's LTCL page. Stays quiet
// for users who have no LTCL completions.
export default function LtclStats({ username }: { username: string }) {
  const { t } = useI18n()
  const { levels, loaded } = useLtclLevels()
  const board = useMemo(() => buildLeaderboard(levels), [levels])

  if (!loaded) return null
  const idx = board.findIndex((e) => e.handle === username.toLowerCase())
  if (idx === -1) return null

  const entry = board[idx]
  const hardest = entry.completed.reduce<LtclLevel | null>(
    (best, l) => (best === null || (l.placement ?? 1e9) < (best.placement ?? 1e9) ? l : best),
    null,
  )

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-neutral-300 font-medium">{t.ltcl_stats_title}</h2>
        <Link
          to={`/ltcl/leaderboard/${entry.handle}`}
          className="text-violet-400 hover:text-violet-300 text-sm"
        >
          {t.ltcl_stats_view} →
        </Link>
      </div>

      {hardest && <HardestBanner hardest={hardest} />}

      <div className="grid grid-cols-2 gap-2">
        <Stat label={t.ltcl_lb_rank} value={`#${idx + 1}`} />
        <Stat label={t.ltcl_lb_points} value={String(entry.points)} />
      </div>
    </div>
  )
}
