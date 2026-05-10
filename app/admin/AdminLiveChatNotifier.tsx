'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ChatSessionSummary {
  id: string
  userName: string | null
  userEmail: string | null
  lastMessage: string | null
  latestMessageId?: string | null
  latestMessageSenderType?: 'USER' | 'ADMIN' | 'SYSTEM' | null
  unreadCount: number
}

function playNotificationTone() {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextCtor) return

    const audioContext = new AudioContextCtor()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12)
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.36)
  } catch {
    // Browsers can block audio before user interaction. The visual/browser notification still works.
  }
}

export default function AdminLiveChatNotifier() {
  const pathname = usePathname()
  const [totalUnread, setTotalUnread] = useState(0)
  const [latestUnreadSession, setLatestUnreadSession] = useState<ChatSessionSummary | null>(null)
  const [dismissedMessageId, setDismissedMessageId] = useState<string | null>(null)
  const notifiedMessageIds = useRef<Set<string>>(new Set())
  const originalTitle = useRef<string>('Admin Dashboard — Myncel')
  const isOnChatPage = pathname?.startsWith('/admin/chat')

  const shouldShowToast = useMemo(() => {
    if (!latestUnreadSession || totalUnread <= 0) return false
    if (latestUnreadSession.latestMessageId && latestUnreadSession.latestMessageId === dismissedMessageId) return false
    return true
  }, [dismissedMessageId, latestUnreadSession, totalUnread])

  useEffect(() => {
    originalTitle.current = document.title || 'Admin Dashboard — Myncel'

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const pollUnreadChats = async () => {
      try {
        const res = await fetch('/api/admin/chat?status=OPEN&status=IN_PROGRESS', {
          cache: 'no-store',
        })

        if (!res.ok || cancelled) return

        const data = await res.json()
        const sessions: ChatSessionSummary[] = data.sessions || []
        const unreadSessions = sessions.filter(
          (s) => s.unreadCount > 0 && s.latestMessageSenderType === 'USER'
        )
        const nextTotalUnread = data.counts?.totalUnread ?? unreadSessions.reduce((sum, s) => sum + s.unreadCount, 0)
        const newestUnread = unreadSessions[0] || null

        setTotalUnread(nextTotalUnread)
        setLatestUnreadSession(newestUnread)

        if (newestUnread?.latestMessageId && !notifiedMessageIds.current.has(newestUnread.latestMessageId)) {
          notifiedMessageIds.current.add(newestUnread.latestMessageId)

          if (!isOnChatPage) {
            playNotificationTone()
          }

          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              const notification = new Notification('New Myncel live chat message', {
                body: `${newestUnread.userName || 'Guest'}: ${newestUnread.lastMessage || 'sent a message'}`,
                icon: '/logo.png',
                tag: `myncel-live-chat-${newestUnread.latestMessageId}`,
              })

              notification.onclick = () => {
                window.focus()
                window.location.href = '/admin/chat'
              }
            } else if (Notification.permission === 'default') {
              Notification.requestPermission().catch(() => {})
            }
          }
        }
      } catch (error) {
        console.error('Error polling admin live chat notifications:', error)
      }
    }

    pollUnreadChats()
    const interval = window.setInterval(pollUnreadChats, 5000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [isOnChatPage])

  useEffect(() => {
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) New live chat message${totalUnread === 1 ? '' : 's'} — Myncel Admin`
    } else {
      document.title = originalTitle.current
    }

    return () => {
      document.title = originalTitle.current
    }
  }, [totalUnread])

  if (!shouldShowToast) return null

  return (
    <div className="fixed top-20 right-4 z-[10000] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-red-400/40 bg-red-50 text-red-950 shadow-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
            💬
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              {totalUnread} unread live chat message{totalUnread === 1 ? '' : 's'}
            </p>
            <p className="text-sm mt-1 line-clamp-2">
              <span className="font-semibold">{latestUnreadSession?.userName || 'Guest'}:</span>{' '}
              {latestUnreadSession?.lastMessage || 'sent a new message'}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                href="/admin/chat"
                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Open live chat
              </Link>
              <button
                type="button"
                onClick={() => setDismissedMessageId(latestUnreadSession?.latestMessageId || null)}
                className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-100"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss live chat notification"
            onClick={() => setDismissedMessageId(latestUnreadSession?.latestMessageId || null)}
            className="text-red-600 hover:text-red-800 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
