import { Link } from 'react-router-dom'
import { useProfile } from '../userProfiles'
import Avatar from './Avatar'

// Resolve a user's chosen display name from their immutable handle.
// Falls back to the handle itself while the profile loads or if unset.
export function useDisplayName(handle: string): string {
  const profile = useProfile(handle)
  return profile?.displayName || handle
}

// Plain text display name for a handle (used where there's no avatar/link).
export function AuthorName({ handle }: { handle: string }) {
  return <>{useDisplayName(handle)}</>
}

// Avatar + display name, linking to the profile by its (immutable) handle.
// Routing and lookups stay keyed on `handle`; only the shown text is the
// user's chosen display name.
export function AuthorLink({
  handle,
  avatarSize = 20,
  stopPropagation = false,
  className = 'flex items-center gap-1.5 hover:text-violet-400',
}: {
  handle: string
  avatarSize?: number
  stopPropagation?: boolean
  className?: string
}) {
  const name = useDisplayName(handle)
  return (
    <Link
      to={`/u/${handle}`}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      className={className}
    >
      <Avatar username={handle} size={avatarSize} />
      <span className="hover:underline">{name}</span>
    </Link>
  )
}
