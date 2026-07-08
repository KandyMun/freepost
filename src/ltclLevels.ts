import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'

// Placements past this are "Legacy" and worth 0 points.
export const LEGACY_AFTER = 100

// Custom level thumbnail upload cap.
export const LEVEL_THUMB_MAX = 2 * 1024 * 1024 // 2 MB

// Validate + upload a custom level thumbnail to Storage; returns the URL.
export async function uploadLevelThumbnail(file: File, uid: string): Promise<string> {
  if (file.size > LEVEL_THUMB_MAX) throw new Error('too-large')
  if (!file.type.startsWith('image/')) throw new Error('type')
  const path = `level-thumbnails/${uid}/${Date.now()}_${file.name}`
  const r = ref(storage, path)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

// Point value for a placement (1-based). Legacy positions score 0.
// Curve: 250 * exp(ln(0.04) * (x-1)/99) → #1 = 250, #100 = 10.
export function pointsForPlacement(x: number): number {
  if (x > LEGACY_AFTER) return 0
  return Math.round(250 * Math.exp(Math.log(0.04) * (x - 1) / 99) * 100) / 100
}

// Pull the 11-char YouTube id out of a watch/share/embed URL (null if none).
export function extractYoutubeId(url: string): string | null {
  if (!url) return null
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/embed\/([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

// The LTCL classic level list, stored in Firestore (`levels` collection, doc id
// = GD level id). Seed/import with scripts/seed-levels.mjs. Records store the
// completer's Discord username; the UI resolves it to their chosen display name.

export interface LtclRecord {
  username: string
  enjoyment: number | null
  video?: string | null
}

export interface LtclLevel {
  levelId: number
  name: string
  publisher: string
  creators: string[]
  verifier: string
  songId: number | null // Newgrounds song ID (used when not a NONG)
  songLink?: string | null // external download URL (used when it is a NONG)
  isNong: boolean
  password?: string | null
  verificationUrl?: string | null
  youtubeId?: string | null
  placement: number | null
  points: number | null
  thumbnail?: string | null // custom thumbnail image URL (overrides the auto one)
  records: LtclRecord[]
}

// Average of a level's record enjoyments, ignoring unrated ones (null when none).
export function averageEnjoyment(level: LtclLevel): number | null {
  const rated = level.records.filter((r) => typeof r.enjoyment === 'number')
  if (rated.length === 0) return null
  return rated.reduce((a, r) => a + (r.enjoyment as number), 0) / rated.length
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LbEntry {
  handle: string // lowercased username, used for profile links + display-name lookup
  points: number
  completed: LtclLevel[]
  created: LtclLevel[]
  verified: LtclLevel[]
}

// Aggregate players from the level data. Points come from completed challenges
// (records); created/verified are tracked separately. Sorted by points desc.
export function buildLeaderboard(levels: LtclLevel[]): LbEntry[] {
  const map = new Map<string, LbEntry>()
  const get = (name: string) => {
    const key = name.trim().toLowerCase()
    let e = map.get(key)
    if (!e) { e = { handle: key, points: 0, completed: [], created: [], verified: [] }; map.set(key, e) }
    return e
  }
  for (const lv of levels) {
    for (const r of lv.records) if (r.username?.trim()) get(r.username).completed.push(lv)
    for (const c of lv.creators) if (c?.trim()) get(c).created.push(lv)
    if (lv.verifier?.trim()) get(lv.verifier).verified.push(lv)
  }
  const byName = (a: LtclLevel, b: LtclLevel) => a.name.localeCompare(b.name)
  for (const e of map.values()) {
    e.points = Math.round(e.completed.reduce((a, l) => a + (l.points ?? 0), 0) * 100) / 100
    // Displayed alphabetically; "hardest" is derived by placement separately.
    e.completed.sort(byName)
    e.created.sort(byName)
    e.verified.sort(byName)
  }
  return [...map.values()].sort((a, b) => b.points - a.points || a.handle.localeCompare(b.handle))
}

// Placement first (nulls last, i.e. unranked at the bottom), then name.
function byPlacement(a: LtclLevel, b: LtclLevel): number {
  const ap = a.placement ?? Number.POSITIVE_INFINITY
  const bp = b.placement ?? Number.POSITIVE_INFINITY
  if (ap !== bp) return ap - bp
  return a.name.localeCompare(b.name)
}

export function useLtclLevels() {
  const [levels, setLevels] = useState<LtclLevel[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    return onSnapshot(collection(db, 'levels'), (snap) => {
      const list = snap.docs.map((d) => d.data() as LtclLevel)
      list.sort(byPlacement)
      setLevels(list)
      setLoaded(true)
    })
  }, [])

  return { levels, loaded }
}

// ─── Admin writes ────────────────────────────────────────────────────────────

// Create or overwrite a single level. Does not touch other levels' placements —
// use reorderTo for that. youtubeId is derived from the verification url.
export async function saveLevel(level: LtclLevel): Promise<void> {
  const clean: LtclLevel = {
    ...level,
    youtubeId: extractYoutubeId(level.verificationUrl ?? ''),
  }
  await setDoc(doc(db, 'levels', String(level.levelId)), clean)
}

// Renumber a full ordered list (placement 1..N) and recompute points, writing
// only the docs whose placement or points actually changed.
async function persistOrder(ordered: LtclLevel[], prev: LtclLevel[]): Promise<void> {
  const prevById = new Map(prev.map((l) => [l.levelId, l]))
  const batch = writeBatch(db)
  let changed = 0
  ordered.forEach((level, i) => {
    const placement = i + 1
    const points = pointsForPlacement(placement)
    const before = prevById.get(level.levelId)
    if (!before || before.placement !== placement || before.points !== points) {
      batch.set(doc(db, 'levels', String(level.levelId)), { placement, points }, { merge: true })
      changed++
    }
  })
  if (changed > 0) await batch.commit()
}

// Move a level to a new 1-based placement, shifting everything else and
// recomputing points across the affected range.
export async function reorderTo(current: LtclLevel[], levelId: number, target: number): Promise<void> {
  const sorted = [...current].sort(byPlacement)
  const moving = sorted.find((l) => l.levelId === levelId)
  if (!moving) return
  const without = sorted.filter((l) => l.levelId !== levelId)
  const idx = Math.max(0, Math.min(without.length, target - 1))
  without.splice(idx, 0, moving)
  await persistOrder(without, current)
}

// Delete a level, then close the gap so placements stay contiguous.
export async function deleteLevel(current: LtclLevel[], levelId: number): Promise<void> {
  await deleteDoc(doc(db, 'levels', String(levelId)))
  const remaining = [...current].filter((l) => l.levelId !== levelId).sort(byPlacement)
  await persistOrder(remaining, current)
}

// Add a new level at a given placement (default: end of the list), shifting the
// rest down and recomputing points.
export async function addLevelAt(current: LtclLevel[], level: LtclLevel, target?: number): Promise<void> {
  await saveLevel(level)
  const sorted = [...current].sort(byPlacement)
  const t = target ?? sorted.length + 1
  const idx = Math.max(0, Math.min(sorted.length, t - 1))
  sorted.splice(idx, 0, level)
  await persistOrder(sorted, current)
}
