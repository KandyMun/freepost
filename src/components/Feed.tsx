import { useEffect, useRef, useState } from 'react'
import {
  collection, query, orderBy, getDocs, deleteDoc, doc,
  limit, startAfter, type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { type Post } from '../types'
import { useIsAdmin } from '../useIsAdmin'
import PostModal from './PostModal'
import LikeBar from './LikeBar'

const PAGE_SIZE = 15

type SortMode = 'chronological' | 'likes'

interface Props {
  onPostModalChange?: (open: boolean) => void
  frozen?: boolean
}

export default function Feed({ onPostModalChange, frozen }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selected, setSelected] = useState<Post | null>(null)
  const [sort, setSort] = useState<SortMode>('chronological')
  const [search, setSearch] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isAdmin = useIsAdmin()

  async function fetchPage(after: QueryDocumentSnapshot | null, sortMode: SortMode) {
    const order = sortMode === 'likes'
      ? orderBy('likeCount', 'desc')
      : orderBy('createdAt', 'desc')
    const q = after
      ? query(collection(db, 'posts'), order, startAfter(after), limit(PAGE_SIZE))
      : query(collection(db, 'posts'), order, limit(PAGE_SIZE))
    const snap = await getDocs(q)
    const newPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post))
    setPosts((prev) => after ? [...prev, ...newPosts] : newPosts)
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null)
    setHasMore(snap.docs.length === PAGE_SIZE)
  }

  useEffect(() => {
    setLoading(true)
    setPosts([])
    setLastDoc(null)
    setHasMore(true)
    fetchPage(null, sort).then(() => setLoading(false))
  }, [sort])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setLoadingMore(true)
        fetchPage(lastDoc, sort).finally(() => setLoadingMore(false))
      }
    }, { rootMargin: '200px' })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, lastDoc])

  function openPost(post: Post) {
    setSelected(post)
    onPostModalChange?.(true)
  }

  function closePost() {
    setSelected(null)
    onPostModalChange?.(false)
  }

  async function handleDelete(post: Post) {
    setDeleting(true)
    await deleteDoc(doc(db, 'posts', post.id))
    if (post.storagePath) {
      try { await deleteObject(ref(storage, post.storagePath)) } catch { /* ignore */ }
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id))
    setConfirmId(null)
    setDeleting(false)
  }

  const sorted = search.trim()
    ? posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase().trim()))
    : posts

  if (loading) return <div className="text-neutral-500 text-center py-20">Loading…</div>
  if (posts.length === 0) return <div className="text-neutral-500 text-center py-20">No posts yet. Be the first!</div>

  return (
    <>
    <div className="px-4 pt-4">
      <input
        type="text"
        placeholder="Search by title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-neutral-800 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-neutral-500"
      />
    </div>
    <div className="flex items-center gap-2 px-4 pt-3">
      <span className="text-neutral-500 text-sm">Sort:</span>
      <button
        onClick={() => setSort('chronological')}
        className={`text-sm px-3 py-1 rounded-lg transition-colors ${sort === 'chronological' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
      >
        New
      </button>
      <button
        onClick={() => setSort('likes')}
        className={`text-sm px-3 py-1 rounded-lg transition-colors ${sort === 'likes' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
      >
        Top
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {sorted.map((post) => (
        <div
          key={post.id}
          className="bg-neutral-900 rounded-2xl overflow-hidden shadow-lg cursor-pointer"
          onClick={() => openPost(post)}
        >
          <div className="relative">
            {post.isVideo ? (
              <video src={post.imageUrl} className="w-full object-cover" muted loop autoPlay playsInline />
            ) : (
              <img src={post.imageUrl} alt={post.title} className="w-full object-cover" loading="lazy" />
            )}
            {post.isVideo && (
              <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">▶ video</span>
            )}
          </div>
          <div className="p-4">
            <p className="text-neutral-500 text-xs mb-1">
              {post.authorEmail.replace('@freepost.local', '')}
              {' • '}
              {(() => {
                const d = new Date(post.createdAt)
                const date = d.toISOString().slice(0, 10)
                const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
                return `${date} ${time}`
              })()}
            </p>
            <h3 className="text-white font-semibold text-base">{post.title}</h3>
            {post.description && <p className="text-neutral-400 text-sm mt-1">{post.description}</p>}
            <div className="flex items-center gap-3 mt-3">
              <LikeBar post={post} frozen={frozen} />
              <span className="text-neutral-500 text-sm">💬 {post.commentCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-end mt-1">
              {isAdmin && (
                confirmId === post.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-neutral-400 hover:text-white text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmId(post.id) }}
                    className="text-red-400 hover:text-red-300 text-xs transition-colors"
                  >
                    Delete
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
    <div ref={sentinelRef} className="py-4 text-center">
      {loadingMore && <span className="text-neutral-500 text-sm">Loading…</span>}
      {!hasMore && posts.length > 0 && <span className="text-neutral-700 text-sm">No more posts</span>}
    </div>
    {selected && <PostModal post={selected} onClose={closePost} frozen={frozen} />}
    </>
  )
}
