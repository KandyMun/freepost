import type { Badge } from '../badges'

// Renders a badge's icon (emoji or image/gif) — reused wherever a badge appears.
export function BadgeIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  if (/^https?:\/\//.test(icon)) {
    return <img src={icon} alt="" aria-hidden="true" style={{ width: size, height: size }} className="inline-block rounded-sm object-cover" />
  }
  return <span aria-hidden="true">{icon}</span>
}

// A cosmetic badge. With a background it renders as a fixed 86×40 banner;
// otherwise as an auto-width pill. Hovering shows the name (+ date for events).
export default function BadgePill({ badge }: { badge: Badge }) {
  const hasBg = !!badge.background
  const showName = !badge.hideName

  const inner = (
    <span
      className={`relative inline-flex items-center justify-center gap-1.5 overflow-hidden border ${
        hasBg
          ? 'w-[86px] h-[40px] rounded-md'
          : 'text-xs px-2.5 py-0.5 rounded-full bg-neutral-800/70'
      }`}
      style={{ borderColor: badge.color ? `${badge.color}66` : undefined }}
    >
      {hasBg && (
        <>
          <img src={badge.background} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute inset-0 bg-black/45" aria-hidden="true" />
        </>
      )}
      <span
        className="relative inline-flex items-center gap-1.5 text-xs"
        style={{ color: badge.color || (hasBg ? '#fff' : undefined) }}
      >
        {badge.icon && <BadgeIcon icon={badge.icon} />}
        {showName && <span className={badge.color || hasBg ? '' : 'text-neutral-200'}>{badge.name}</span>}
      </span>
    </span>
  )

  return (
    <span className="relative inline-flex group align-middle" aria-label={badge.name}>
      {inner}
      {/* Hover tooltip: name, plus the event date when set. */}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 z-30 hidden group-hover:flex flex-col items-center whitespace-nowrap rounded-md bg-neutral-950 border border-neutral-700 px-2 py-1 shadow-lg">
        <span className="text-xs text-white">{badge.name}</span>
        {badge.date && <span className="text-[11px] text-neutral-400">{badge.date}</span>}
      </span>
    </span>
  )
}
