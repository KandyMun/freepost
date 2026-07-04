import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export interface PublicProfile {
  uid: string
  username: string
  photoURL?: string
  about?: string
}

// Module-level cache so the feed doesn't refetch the same author repeatedly.
const cache = new Map<string, Promise<PublicProfile | null>>()

export function fetchProfileByUsername(username: string): Promise<PublicProfile | null> {
  const key = username.toLowerCase().trim()
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const snap = await getDocs(query(collection(db, 'users'), where('username', '==', key)))
        const d = snap.docs[0]
        return d ? ({ uid: d.id, ...d.data() } as PublicProfile) : null
      })().catch(() => null),
    )
  }
  return cache.get(key)!
}

// Call after a profile edit so the cached copy reflects the new avatar/about.
export function invalidateProfile(username: string) {
  cache.delete(username.toLowerCase().trim())
}

export function useProfile(username?: string): PublicProfile | null {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  useEffect(() => {
    if (!username) {
      setProfile(null)
      return
    }
    let active = true
    fetchProfileByUsername(username).then((p) => {
      if (active) setProfile(p)
    })
    return () => {
      active = false
    }
  }, [username])
  return profile
}
