#!/usr/bin/env node
/**
 * Set each level's `placement` in Firestore from the ranked order file
 * (_list.json, hardest first). Any level not in that file is appended after it,
 * in the order listed in APPEND below. Placement is 1-based; positions > 100 are
 * treated as legacy by the UI. Points are left untouched (assigned separately).
 *
 * Usage:
 *   node scripts/set-placements.mjs <orderJson> <rawDir> [--dry]
 */

import admin from 'firebase-admin'
import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname, join, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const dry = args.includes('--dry')
const [orderPath, rawDir] = args.filter((a) => !a.startsWith('--'))

// Levels not present in the order file, appended to the tail (legacy) in order.
const APPEND = [
  'lidl_xoxo',
  'evil_spike_yard',
  'redemption',
  'insane_simas',
  'mr_beas',
  'dr_nefario_clear',
  'crazy_challenge',
]

const order = JSON.parse(readFileSync(resolve(orderPath), 'utf8'))

// slug -> level id, from the raw per-level filenames.
const slug2id = {}
for (const f of readdirSync(resolve(rawDir))) {
  if (!f.endsWith('.json') || f === 'serviceAccountKey.json') continue
  const slug = basename(f, '.json')
  try {
    slug2id[slug] = JSON.parse(readFileSync(join(rawDir, f), 'utf8')).id
  } catch { /* ignore */ }
}

const full = [...order, ...APPEND.filter((s) => !order.includes(s))]
const updates = []
for (let i = 0; i < full.length; i++) {
  const slug = full[i]
  const id = slug2id[slug]
  if (!id) { console.error(`⚠️  no id for slug ${slug}`); continue }
  updates.push({ id: String(id), slug, placement: i + 1 })
}

console.log(`Placements: ${updates.length} levels (1–${updates.length}); legacy = 101+.`)
console.log('First 3:', updates.slice(0, 3).map((u) => `#${u.placement} ${u.slug}`).join(', '))
console.log('Legacy tail:', updates.slice(-3).map((u) => `#${u.placement} ${u.slug}`).join(', '))

if (dry) { console.log('Dry run — no writes.'); process.exit(0) }

const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, 'serviceAccountKey.json'), 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

let batch = db.batch()
let n = 0
for (const u of updates) {
  batch.set(db.collection('levels').doc(u.id), { placement: u.placement }, { merge: true })
  if (++n % 400 === 0) { await batch.commit(); batch = db.batch() }
}
await batch.commit()
console.log(`✅  Set placement on ${updates.length} levels.`)
process.exit(0)
