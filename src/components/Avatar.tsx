import { useProfile } from '../userProfiles'

interface Props {
  username: string
  size?: number
  /** Pass a known photoURL to skip the lookup (e.g. the current user). */
  photoURL?: string
  className?: string
}

export default function Avatar({ username, size = 24, photoURL, className = '' }: Props) {
  const profile = useProfile(photoURL === undefined ? username : undefined)
  const url = photoURL ?? profile?.photoURL

  if (url) {
    return (
      <img
        src={url}
        alt={username}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      className={`rounded-full bg-neutral-700 flex items-center justify-center text-neutral-300 font-semibold shrink-0 ${className}`}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  )
}
