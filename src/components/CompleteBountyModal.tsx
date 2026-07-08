import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useI18n } from '../i18n'
import { markBountyCompleted, type Bounty } from '../bounties'

interface Props {
  bounty: Bounty
  onClose: () => void
}

// Bounty-board-manager-only: confirms the reward was actually paid out
// externally and records who completed the level.
export default function CompleteBountyModal({ bounty, onClose }: Props) {
  const { user, profile } = useAuth()
  const { t } = useI18n()
  const [completedBy, setCompletedBy] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!completedBy.trim()) {
      setError(t.bounty_complete_err_username)
      return
    }
    setError('')
    setLoading(true)
    try {
      const confirmedByUsername = profile?.username ?? user.email?.split('@')[0] ?? ''
      await markBountyCompleted(bounty.id, completedBy, note, confirmedByUsername)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.bounty_form_err_generic)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">{t.bounty_complete_title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-neutral-400 text-sm">{t.bounty_complete_desc}</p>

          <div className="bg-neutral-800/60 rounded-lg px-4 py-2.5 text-sm text-neutral-300">
            <span className="text-neutral-500">{bounty.levelName}</span>
            {' — '}
            <span className="text-amber-300 font-medium">€{bounty.amount}</span>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-neutral-400">{t.bounty_complete_username}</span>
            <input
              type="text"
              placeholder={t.bounty_complete_username_placeholder}
              value={completedBy}
              onChange={(e) => setCompletedBy(e.target.value)}
              required
              className="bg-neutral-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-neutral-400">{t.bounty_complete_note}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="bg-neutral-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500 resize-none"
            />
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !completedBy.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? t.bounty_form_saving : t.bounty_complete_submit}
          </button>
        </form>
      </div>
    </div>
  )
}
