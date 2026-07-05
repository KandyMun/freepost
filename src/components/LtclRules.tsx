import { useState } from 'react'
import { useI18n } from '../i18n'
import { useCan } from '../permissions'
import { useLtclRules, setLtclRules, DEFAULT_LTCL_RULES } from '../useLtclRules'

// Render the rules text: lines ending in ":" are section headings, the rest are
// individual rules shown as a list under the most recent heading.
function RulesView({ text }: { text: string }) {
  const blocks: { heading: string; items: string[] }[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.endsWith(':')) {
      blocks.push({ heading: line, items: [] })
    } else if (blocks.length) {
      blocks[blocks.length - 1].items.push(line)
    } else {
      blocks.push({ heading: '', items: [line] })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b, i) => (
        <section key={i}>
          {b.heading && <h2 className="text-lg font-bold text-white mb-3">{b.heading}</h2>}
          <ul className="flex flex-col gap-2 list-disc pl-5">
            {b.items.map((it, j) => (
              <li key={j} className="text-sm text-neutral-300 leading-relaxed">{it}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default function LtclRules() {
  const { t } = useI18n()
  const isAdmin = useCan('edit_rules')
  const { rules } = useLtclRules()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setDraft(rules)
    setEditing(true)
  }

  async function save() {
    setSaving(true)
    try {
      await setLtclRules(draft.trim() || DEFAULT_LTCL_RULES)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">{t.ltcl_tab_rules}</h1>
          {isAdmin && !editing && (
            <button
              onClick={startEdit}
              className="shrink-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              {t.ltcl_rules_edit}
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={22}
              className="w-full bg-neutral-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 resize-y leading-relaxed"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setEditing(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {saving ? t.profile_saving : t.profile_save}
              </button>
            </div>
          </div>
        ) : (
          <RulesView text={rules} />
        )}
      </div>
    </div>
  )
}
