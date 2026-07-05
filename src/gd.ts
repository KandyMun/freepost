// Geometry Dash stats for a user's profile.
//
// The owner links their GD account by saving a `gdUsername` on their users/{uid}
// doc; when it's unset we fall back to trying their Discord handle as the GD
// name, shown only on an exact match. Lookups use the GDBrowser API
// (CORS-open, callable straight from the browser) — boomlings.com itself
// can't be reached from browsers or from cloud datacenter IPs, so GDBrowser
// acts as the community-run gateway.

const API = 'https://gdbrowser.com/api/profile'

export interface GdStats {
  username: string
  accountId: string
  stars: number
  moons: number
  demons: number
  secretCoins: number
  userCoins: number
  diamonds: number
  creatorPoints: number
  // Global leaderboard position (by stars); null when unranked.
  rank: number | null
  // The Discord handle the player listed on their GD profile (2.2 social
  // link), if any. Used to verify auto-guessed matches.
  discord: string | null
}

// GD usernames: 1–20 chars, letters/digits/spaces.
export const GD_USERNAME_RE = /^[A-Za-z0-9 ]{1,20}$/

interface GdBrowserProfile {
  username: string
  accountID: string
  stars: number
  moons: number
  demons: number
  coins: number // secret coins
  userCoins: number
  diamonds: number
  cp: number // creator points
  rank: number // global leaderboard position; 0 = unranked
  discord: string | null
}

// Cache successful lookups (including genuine "no such user" nulls) per GD
// username so revisiting a profile doesn't refetch. Errors are not cached.
const resolved = new Map<string, GdStats | null>()
const inflight = new Map<string, Promise<GdStats | null>>()

const norm = (s: string) => s.toLowerCase().trim()

// Compare a GD profile's discord social field against a Discord username.
// Players type their handle in various shapes ("@name", legacy "name#1234"),
// so strip decorations before comparing.
export function discordMatches(gdDiscord: string | null, discordUsername: string): boolean {
  if (!gdDiscord) return false
  const clean = (s: string) => norm(s).replace(/^@/, '').replace(/#\d+$/, '')
  return clean(gdDiscord) === clean(discordUsername)
}

export function fetchGdStats(gdUsername: string): Promise<GdStats | null> {
  const key = norm(gdUsername)
  if (resolved.has(key)) return Promise.resolve(resolved.get(key)!)
  if (inflight.has(key)) return inflight.get(key)!

  const p = (async () => {
    try {
      let res: Response
      try {
        res = await fetch(`${API}/${encodeURIComponent(gdUsername.trim())}`)
      } catch {
        throw new Error('network error — GDBrowser is unreachable')
      }
      // GDBrowser answers "-1" (with a non-2xx status) when no user matches.
      const text = await res.text()
      if (text.trim() === '-1' || res.status === 404) {
        resolved.set(key, null)
        return null
      }
      if (!res.ok) throw new Error(`GDBrowser responded ${res.status}`)
      const d = JSON.parse(text) as GdBrowserProfile
      const stats: GdStats = {
        username: d.username,
        accountId: String(d.accountID),
        stars: d.stars ?? 0,
        moons: d.moons ?? 0,
        demons: d.demons ?? 0,
        secretCoins: d.coins ?? 0,
        userCoins: d.userCoins ?? 0,
        diamonds: d.diamonds ?? 0,
        creatorPoints: d.cp ?? 0,
        rank: d.rank ? d.rank : null,
        discord: d.discord ?? null,
      }
      resolved.set(key, stats)
      return stats
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

export interface GdResolved {
  stats: GdStats
  // True when the match was guessed rather than set by the profile owner.
  auto: boolean
  // True when the GD profile's own discord field confirms the guess.
  verified: boolean
}

// Best-effort Discord → GD resolution for profiles with no gdUsername set:
// try the Discord handle as the GD name. GD name searches return a single
// closest match, so we only accept it when the returned username equals the
// handle exactly (case-insensitive) — anything fuzzier stays hidden. A match
// counts as verified when the GD profile lists a matching discord handle.
export async function resolveGdStats(discordUsername: string): Promise<GdResolved | null> {
  const name = discordUsername.trim()
  // Discord handles with characters GD names can't contain (dots,
  // underscores…) can never match exactly — skip the request.
  if (!GD_USERNAME_RE.test(name)) return null

  const stats = await fetchGdStats(name)
  if (!stats || norm(stats.username) !== norm(name)) return null
  return {
    stats,
    auto: true,
    verified: discordMatches(stats.discord, discordUsername),
  }
}
