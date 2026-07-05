// AREDL (All Rated Extreme Demons List) stats for a user's profile.
// Users on freepost are keyed by their Discord id (the users/{uid} doc id), and
// AREDL stores each account's discord_id + a username linked to the Discord name,
// so we can resolve an AREDL account from a freepost profile with no extra setup.
//
// Flow: search /api/users by the Discord username, match on discord_id (falling
// back to an exact username match), then GET /api/aredl/profile/{id} for stats.

const API = 'https://api.aredl.net/v2/api'

// The API returns all point values as integers scaled by 10 (i.e. 3928 = 392.8).
const POINTS_SCALE = 10

export interface AredlHardest {
  name: string
  position: number // 1-indexed list placement (1 = hardest in the world)
  points: number
  levelId: number
}

export interface AredlStats {
  aredlId: string
  username: string
  globalName: string
  rank: number | null // global leaderboard rank (by total points)
  extremesRank: number | null // global rank by count of extremes
  countryRank: number | null // country rank (by total points)
  countryExtremesRank: number | null // country rank by count of extremes
  totalPoints: number // total points, including packs
  extremes: number // count of extreme demons completed
  packsCompleted: number
  hardest: AredlHardest | null
  profileUrl: string
}

interface AredlUser {
  id: string
  username: string
  global_name: string
  discord_id: string | null
}

// Cache successful lookups (including genuine "no account" nulls) per Discord
// username so revisiting a profile doesn't refetch. Errors are not cached.
const resolved = new Map<string, AredlStats | null>()
const inflight = new Map<string, Promise<AredlStats | null>>()

const norm = (s: string) => s.toLowerCase().trim()

export function profileUrlFor(username: string): string {
  return `https://aredl.net/profile/user/${encodeURIComponent(username)}`
}

// Level preview from the community "Level Thumbnails" service (levelthumbs.prevter.me),
// keyed by the in-game level id. `/small` is a lighter (~280KB) variant. Not every
// level has one, so callers should handle image load failure. CORS is open.
export function levelThumbnailUrl(levelId: number): string {
  return `https://levelthumbs.prevter.me/thumbnail/${levelId}/small`
}

async function findUser(username: string, discordId?: string): Promise<AredlUser | null> {
  const res = await fetch(
    `${API}/users?name_filter=${encodeURIComponent(username)}&per_page=100`,
  )
  if (!res.ok) throw new Error(`AREDL user search failed (${res.status})`)
  const body = (await res.json()) as { data?: AredlUser[] }
  const list = body.data ?? []
  // Prefer an exact Discord id match (bulletproof against username collisions),
  // then fall back to an exact username match.
  if (discordId) {
    const byId = list.find((u) => u.discord_id === discordId)
    if (byId) return byId
  }
  const key = norm(username)
  return list.find((u) => norm(u.username) === key) ?? null
}

async function fetchProfile(aredlId: string): Promise<AredlStats | null> {
  const res = await fetch(`${API}/aredl/profile/${aredlId}`)
  if (!res.ok) throw new Error(`AREDL profile fetch failed (${res.status})`)
  const p = (await res.json()) as {
    id: string
    username: string
    global_name: string
    rank?: {
      rank: number
      extremes_rank: number
      country_rank: number
      country_extremes_rank: number
      total_points: number
      pack_points: number
      extremes: number
    } | null
    packs?: unknown[]
    records?: { level?: { name: string; position: number; points: number; level_id: number } }[]
  }

  const rank = p.rank ?? null
  const totalPoints = (rank?.total_points ?? 0) / POINTS_SCALE

  // Hardest = the completed level with the lowest (best) list position.
  let hardest: AredlHardest | null = null
  for (const r of p.records ?? []) {
    const lv = r.level
    if (!lv) continue
    if (!hardest || lv.position < hardest.position) {
      hardest = {
        name: lv.name,
        position: lv.position,
        points: lv.points / POINTS_SCALE,
        levelId: lv.level_id,
      }
    }
  }

  return {
    aredlId: p.id,
    username: p.username,
    globalName: p.global_name,
    rank: rank?.rank ?? null,
    extremesRank: rank?.extremes_rank ?? null,
    countryRank: rank?.country_rank ?? null,
    countryExtremesRank: rank?.country_extremes_rank ?? null,
    totalPoints,
    extremes: rank?.extremes ?? 0,
    packsCompleted: p.packs?.length ?? 0,
    hardest,
    profileUrl: profileUrlFor(p.username),
  }
}

export function fetchAredlStats(
  discordUsername: string,
  discordId?: string,
): Promise<AredlStats | null> {
  const key = norm(discordUsername)
  if (resolved.has(key)) return Promise.resolve(resolved.get(key)!)
  if (inflight.has(key)) return inflight.get(key)!

  const p = (async () => {
    try {
      const user = await findUser(discordUsername, discordId)
      const stats = user ? await fetchProfile(user.id) : null
      resolved.set(key, stats) // cache success (incl. genuine "no account" null)
      return stats
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}
