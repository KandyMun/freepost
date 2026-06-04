import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

interface SiteConfig {
  frozen: boolean
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>({ frozen: false })

  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'site'), (snap) => {
      if (snap.exists()) setConfig(snap.data() as SiteConfig)
    })
  }, [])

  return config
}

export async function setSiteFrozen(frozen: boolean) {
  await setDoc(doc(db, 'config', 'site'), { frozen }, { merge: true })
}
