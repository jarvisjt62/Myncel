'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ChatSession {
  id: string
  userName: string | null
  userEmail: string | null
  subject: string | null
  status: string
  updatedAt: Date
  createdAt: Date
  lastMessage: string | null
  messageCount: number
  unreadCount: number
}

interface Message {
  id: string
  content: string
  senderType: 'USER' | 'ADMIN' | 'SYSTEM'
  senderName: string | null
  createdAt: string
  isRead: boolean
}

interface AdminChatClientProps {
  initialSessions: ChatSession[]
}

export default function AdminChatClient({ initialSessions }: AdminChatClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)

  // Poll for new sessions
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/chat?status=OPEN&status=IN_PROGRESS')
        if (res.ok) {
          const data = await res.json()
          setSessions(data.sessions)
          
          // Play notification sound for new sessions with unread messages
          const hasNewUnread = data.sessions.some(
            (s: ChatSession) => s.unreadCount > 0 && s.id !== selectedSession?.id
          )
          if (hasNewUnread) {
            // Request notification permission
            if (Notification.permission !== 'granted') {
              Notification.requestPermission()
            } else {
              const unreadSession = data.sessions.find((s: ChatSession) => s.unreadCount > 0)
              if (unreadSession) {
                new Notification('New Chat Message', {
                  body: `${unreadSession.userName || 'User'} sent a message`,
                  icon: '/logo.png',
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling sessions:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedSession])

  // Poll for new messages in selected session
  useEffect(() => {
    if (!selectedSession) return

    const interval = setInterval(async () => {
      try {
        const url = `/api/chat/messages?sessionId=${selectedSession.id}${lastMessageId ? `&afterId=${lastMessageId}` : ''}`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (data.messages.length > 0) {
            setMessages(prev => {
              const newMsgs = [...prev, ...data.messages]
              return newMsgs.filter((msg, index, self) =>
                index === self.findIndex(m => m.id === msg.id)
              )
            })
            setLastMessageId(data.messages[data.messages.length - 1].id)
            
            // Scroll to bottom
            setTimeout(() => {
              const container = document.getElementById('messages-container')
              if (container) {
                container.scrollTop = container.scrollHeight
              }
            }, 100)
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [selectedSession, lastMessageId])

  // Load messages when session is selected
  const loadSession = async (session: ChatSession) => {
    setSelectedSession(session)
    setIsLoading(true)
    setMessages([])
    setLastMessageId(null)

    try {
      const res = await fetch(`/api/admin/chat/${session.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.session.messages)
        if (data.session.messages.length > 0) {
          setLastMessageId(data.session.messages[data.session.messages.length - 1].id)
        }
        // Update unread count
        setSessions(prev =>
          prev.map(s => s.id === session.id ? { ...s, unreadCount: 0 } : s)
        )
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession || isSending) return

    setIsSending(true)
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          content: newMessage.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setLastMessageId(data.message.id)
        setNewMessage('')
        
        // Update session status
        setSessions(prev =>
          prev.map(s => s.id === selectedSession.id ? { ...s, status: 'IN_PROGRESS' } : s)
        )

        setTimeout(() => {
          const container = document.getElementById('messages-container')
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const closeSession = async () => {
    if (!selectedSession) return

    try {
      const res = await fetch(`/api/admin/chat/${selectedSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      })

      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== selectedSession.id))
        setSelectedSession(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error closing session:', error)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Sessions List */}
      <div className="bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1e2d4a]">
          <h2 className="text-white font-semibold">Active Chats ({sessions.length})</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100%-52px)]">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-[#8892a4]">
              <p>No active chats</p>
              <p className="text-xs mt-1">Waiting for customers...</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session)}
                className={`p-4 border-b border-[#1e2d4a] cursor-pointer hover:bg-[#1e2d4a]/50 transition-colors ${
                  selectedSession?.id === session.id ? 'bg-[#1e2d4a]' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">
                        {session.userName || 'Guest'}
                      </span>
                      {session.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {session.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[#8892a4] text-xs truncate">
                      {session.userEmail || 'No email'}
                    </p>
                    {session.lastMessage && (
                      <p className="text-[#635bff] text-sm truncate mt-1">
                        {session.lastMessage}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      session.status === 'OPEN' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {session.status}
                    </span>
                    <p className="text-[#8892a4] text-xs mt-1">
                      {formatDate(session.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-[#0d1426] border border-[#1e2d4a] rounded-xl overflow-hidden flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-[#1e2d4a] flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">{selectedSession.userName || 'Guest'}</h3>
                <p className="text-[#8892a4] text-xs">{selectedSession.userEmail || 'No email'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  selectedSession.status === 'OPEN' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {selectedSession.status}
                </span>
                <button
                  onClick={closeSession}
                  className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  Close Chat
                </button>
              </div>
            </div>

            {/* Messages */}
            <div id="messages-container" className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-[#8892a4]">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-[#8892a4]">No messages yet</div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${
                      msg.senderType === 'ADMIN'
                        ? 'bg-[#635bff] text-white'
                        : msg.senderType === 'SYSTEM'
                        ? 'bg-[#1e2d4a] text-[#8892a4]'
                        : 'bg-[#1e2d4a] text-white'
                    } rounded-lg px-4 py-2`}>
                      {msg.senderType !== 'ADMIN' && msg.senderName && (
                        <p className="text-xs text-[#635bff] mb-1">{msg.senderName}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">{formatDate(msg.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#1e2d4a]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-[#1e2d4a] border border-[#2d3d5a] rounded-lg px-4 py-2 text-white placeholder-[#8892a4] focus:outline-none focus:border-[#635bff]"
                  disabled={isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="px-4 py-2 bg-[#635bff] text-white rounded-lg hover:bg-[#5248e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[#8892a4]">
              <p className="text-4xl mb-2">💬</p>
              <p>Select a chat to start responding</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}