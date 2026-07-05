#!/usr/bin/env node
/**
 * Seed the LTCL level list into Firestore from the raw per-level JSON files.
 *
 * Cleans the messy source data into a consistent shape, then writes each level
 * to the `levels` collection with the GD level id as the document id.
 *
 * Usage:
 *   node scripts/seed-levels.mjs <rawDir> --dry     # write cleaned-levels.json, no DB writes
 *   node scripts/seed-levels.mjs <rawDir>           # write to Firestore
 *
 * Cleaning rules:
 *   - `author`            -> publisher
 *   - `NONG: data/NONGS/<songId>.mp3` -> { songId, isNong: true }; else songId null
 *   - `verification`      -> youtubeId extracted + kept as url (tracking params stripped)
 *   - records: { user -> username, enjoyment (number|null), link -> video|null }
 *   - non-numeric enjoyment (e.g. "Kūrėjas") -> null
 *   - duplicate GD id 111280953: keep oppression_update, drop oppression
 *   - placement/points left null; set later once the ranked order is provided
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const dry = args.includes('--dry')
const rawDir = resolve(args.find((a) => !a.startsWith('--')) ?? join(__dirname, 'level-data'))

// Files to skip entirely (superseded duplicates).
const SKIP_FILES = new Set(['oppression.json'])

function youtubeId(url) {
  if (!url) return null
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/embed\/([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function cleanEnjoyment(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function songFromNong(nong) {
  if (!nong) return { songId: null, isNong: false }
  const m = String(nong).match(/(\d+)/)
  return { songId: m ? Number(m[1]) : null, isNong: true }
}

function cleanLevel(raw) {
  const { songId, isNong } = songFromNong(raw.NONG)
  const url = (raw.verification || '').trim()
  return {
    levelId: raw.id,
    name: (raw.name || '').trim(),
    publisher: (raw.author || '').trim(),
    creators: Array.isArray(raw.creators) ? raw.creators.map((c) => String(c).trim()).filter(Boolean) : [],
    verifier: (raw.verifier || '').trim(),
    songId,
    isNong,
    password: raw.password ? String(raw.password) : null,
    verificationUrl: url || null,
    youtubeId: youtubeId(url),
    placement: null, // set once the ranked order is provided
    points: null, // auto-assigned from placement later
    records: (raw.records || [])
      .filter((r) => r && r.user)
      .map((r) => ({
        username: String(r.user).trim(),
        enjoyment: cleanEnjoyment(r.enjoyment),
        video: r.link ? String(r.link).trim() : null,
      })),
  }
}

function loadAll() {
  const files = readdirSync(rawDir).filter((f) => f.endsWith('.json') && f !== 'serviceAccountKey.json')
  const levels = []
  for (const f of files) {
    if (SKIP_FILES.has(f)) continue
    let raw
    try {
      raw = JSON.parse(readFileSync(join(rawDir, f), 'utf8'))
    } catch (e) {
      console.error(`⚠️  skip ${f}: ${e.message}`)
      continue
    }
    if (typeof raw.id !== 'number') {
      console.error(`⚠️  skip ${f}: missing numeric id`)
      continue
    }
    levels.push(cleanLevel(raw))
  }
  return levels
}

async function main() {
  const levels = loadAll()
  levels.sort((a, b) => a.name.localeCompare(b.name))

  const withEnj = levels.filter((l) => l.records.some((r) => r.enjoyment !== null)).length
  const nongs = levels.filter((l) => l.isNong).length
  const noVid = levels.filter((l) => !l.youtubeId).length
  console.log(`Cleaned ${levels.length} levels — ${nongs} NONG, ${withEnj} with enjoyment ratings, ${noVid} missing a video id.`)

  if (dry) {
    const out = join(__dirname, 'cleaned-levels.json')
    writeFileSync(out, JSON.stringify(levels, null, 2))
    console.log(`Dry run — wrote ${out}`)
    return
  }

  const admin = (await import('firebase-admin')).default
  const keyPath = resolve(__dirname, 'serviceAccountKey.json')
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  const db = admin.firestore()

  let batch = db.batch()
  let n = 0
  for (const level of levels) {
    batch.set(db.collection('levels').doc(String(level.levelId)), level, { merge: true })
    if (++n % 400 === 0) {
      await batch.commit()
      batch = db.batch()
    }
  }
  await batch.commit()
  console.log(`✅  Seeded ${levels.length} levels into Firestore.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
