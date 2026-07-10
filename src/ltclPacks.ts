import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import type { LtclLevel } from './ltclLevels'

// LTCL packs: named groups of levels stored in Firestore (`packs` collection,
// doc id = auto-generated). A level may belong to any number of packs — or none
// — and packs are independent of list placement. List admins manage them in the
// admin panel; everyone else browses them on the Packs tab. A pack must hold at
// least MIN_PACK_LEVELS levels (enforced in the editor and in firestore.rules).

export const MIN_PACK_LEVELS = 3

// Pack background image upload cap.
export const PACK_IMAGE_MAX = 2 * 1024 * 1024 // 2 MB

export interface LtclPack {
  id: string
  name: string
  image?: string | null // optional background image URL for the pack header
  levelIds: number[] // GD level ids grouped in this pack
  order: number // sort key for the packs list (ascending)
}

// Validate + upload a custom pack background image to Storage; returns the URL.
export async function uploadPackImage(file: File, uid: string): Promise<string> {
  if (file.size > PACK_IMAGE_MAX) throw new Error('too-large')
  if (!file.type.startsWith('image/')) throw new Error('type')
  const path = `pack-images/${uid}/${Date.now()}_${file.name}`
  const r = ref(storage, path)
  await uploadBytes(r, file)
  return getDownloadURL(r)
}

// Generate a fresh Firestore document id for a new pack.
export function newPackId(): string {
  return doc(collection(db, 'packs')).id
}

// Resolve a pack's level ids to full level objects, dropping any ids that no
// longer exist on the list. Always sorted hardest-first (by placement ascending,
// unranked levels last) so packs stay ordered by difficulty automatically as
// list placements change — no manual ordering is stored.
export function packLevels(pack: LtclPack, levels: LtclLevel[]): LtclLevel[] {
  const byId = new Map(levels.map((l) => [l.levelId, l]))
  return pack.levelIds
    .map((id) => byId.get(id))
    .filter((l): l is LtclLevel => !!l)
    .sort((a, b) => (a.placement ?? Number.POSITIVE_INFINITY) - (b.placement ?? Number.POSITIVE_INFINITY))
}

// Total point value of a pack: the sum of its levels' point values.
// NOTE: kept for future use — pack scoring isn't wired into the UI or the
// leaderboard yet (how packs should award points is still undecided).
export function packPoints(pack: LtclPack, levels: LtclLevel[]): number {
  const sum = packLevels(pack, levels).reduce((a, l) => a + (l.points ?? 0), 0)
  return Math.round(sum * 100) / 100
}

// How many of a pack's levels a given player (by handle — a trimmed, lowercased
// name) has beaten, counting both records and verifications.
export function packCompletion(pack: LtclPack, levels: LtclLevel[], handle: string): number {
  const h = handle.trim().toLowerCase()
  if (!h) return 0
  return packLevels(pack, levels).filter(
    (l) =>
      l.verifier?.trim().toLowerCase() === h ||
      l.records.some((r) => r.username?.trim().toLowerCase() === h),
  ).length
}

// Packs are shown alphabetically by name (case-insensitive).
function byName(a: LtclPack, b: LtclPack): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
}

export function useLtclPacks() {
  const [packs, setPacks] = useState<LtclPack[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    return onSnapshot(collection(db, 'packs'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LtclPack, 'id'>) }))
      list.sort(byName)
      setPacks(list)
      setLoaded(true)
    })
  }, [])

  return { packs, loaded }
}

// ─── Admin writes ────────────────────────────────────────────────────────────

// Create or overwrite a pack. The doc id is the pack's id; every other field is
// stored as-is (levelIds deduped, order coerced to a number).
export async function savePack(pack: LtclPack): Promise<void> {
  const clean = {
    name: pack.name.trim(),
    image: pack.image?.trim() ? pack.image.trim() : null,
    levelIds: [...new Set(pack.levelIds)],
    order: Number.isFinite(pack.order) ? pack.order : 0,
  }
  await setDoc(doc(db, 'packs', pack.id), clean)
}

export async function deletePack(id: string): Promise<void> {
  await deleteDoc(doc(db, 'packs', id))
}
