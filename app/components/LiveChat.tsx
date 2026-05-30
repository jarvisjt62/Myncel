'use client';

// LiveChat Component - AI-powered assistance + Live chat support
// AI is independent and doesn't require a chat session
// Live chat creates a session only when user sends a message to support
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  senderType: 'USER' | 'ADMIN' | 'SYSTEM' | 'AI';
  senderName: string | null;
  createdAt: string;
  isRead: boolean;
}

// Extend Window interface to include our custom function
declare global {
  interface Window {
    openMyncelChat?: () => void;
  }
}

/**
 * Tiny inline-markdown renderer for AI chat replies.
 *
 * The AI returns plain text that frequently contains:
 *   - **bold**
 *   - *italic*
 *   - [link text](https://url)
 *   - bullet lists ("- item" or "* item")
 *   - numbered lists ("1. item")
 *   - paragraph breaks (blank lines)
 *
 * Previously we rendered this with a single <p>{content}</p> + whitespace-pre-wrap,
 * which left raw `**` and `[text](url)` visible in the chat bubble. That looked
 * unprofessional, especially on mobile where the link in particular wrapped
 * onto multiple lines as ugly raw markdown.
 *
 * This renderer is intentionally minimal — no full markdown engine, no
 * external dependency, no dangerouslySetInnerHTML. It walks the text and
 * emits React nodes. URLs are rendered as <a target="_blank" rel="noopener">.
 * Anything we don't recognize falls through as plain text, so it's safe.
 */
function renderInlineMarkdown(text: string): ReactNode {
  // Split into paragraphs on blank lines.
  const blocks = text.split(/\n{2,}/);
  return blocks.map((block, blockIdx) => {
    const lines = block.split('\n');
    const isBulletList = lines.every(l => /^\s*[-*]\s+/.test(l));
    const isNumberedList = lines.every(l => /^\s*\d+\.\s+/.test(l));

    if (isBulletList && lines.length > 1) {
      return (
        <ul key={blockIdx} className="list-disc pl-5 my-1 space-y-0.5">
          {lines.map((line, i) => (
            <li key={i}>{renderInlineSegments(line.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }
    if (isNumberedList && lines.length > 1) {
      return (
        <ol key={blockIdx} className="list-decimal pl-5 my-1 space-y-0.5">
          {lines.map((line, i) => (
            <li key={i}>{renderInlineSegments(line.replace(/^\s*\d+\.\s+/, ''))}</li>
          ))}
        </ol>
      );
    }

    // Plain paragraph — preserve single line breaks via <br/>.
    return (
      <p key={blockIdx} className={blockIdx > 0 ? 'mt-2' : ''}>
        {lines.map((line, i) => (
          <span key={i}>
            {renderInlineSegments(line)}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

/**
 * Render inline markdown segments inside a single line:
 *   **bold**, *italic*, [text](url), and bare https:// URLs.
 * Returns an array of React nodes.
 */
function renderInlineSegments(line: string): ReactNode[] {
  // Single regex with alternation: link | bold | italic | bare-url
  const pattern = /(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(https?:\/\/[^\s)]+)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = pattern.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [full, link, bold, italic, bareUrl] = m;
    if (link) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(link);
      if (linkMatch) {
        out.push(
          <a
            key={`l${key++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#635bff] underline underline-offset-2 hover:text-[#4f46e5] break-words"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        out.push(full);
      }
    } else if (bold) {
      out.push(<strong key={`b${key++}`} className="font-semibold">{bold.slice(2, -2)}</strong>);
    } else if (italic) {
      out.push(<em key={`i${key++}`}>{italic.slice(1, -1)}</em>);
    } else if (bareUrl) {
      out.push(
        <a
          key={`u${key++}`}
          href={bareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#635bff] underline underline-offset-2 hover:text-[#4f46e5] break-words"
        >
          {bareUrl}
        </a>
      );
    }
    last = m.index + full.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export default function LiveChat() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [unreadAdminCount, setUnreadAdminCount] = useState(0);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const notifiedAdminMessageIds = useRef<Set<string>>(new Set());
  const originalTitle = useRef<string>('Myncel');
  const [mode, setMode] = useState<'ai' | 'live'>('ai'); // 'ai' for AI assistance, 'live' for live chat
  // (Removed) chatButtonVisible state — the Support tab now opens the chat
  // window directly, so we no longer need an intermediate "circular FAB" state.

  // Don't show live chat for system admins (ADMIN, SUPER_ADMIN). OWNER is organization owner - they should see chat.
  const isAdminRole = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const [isAdminPage, setIsAdminPage] = useState(false);
  
  // Check if we're on an admin page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdminPage(window.location.pathname.startsWith('/admin'));
    }
  }, []);

  // Listen for global "open support chat" requests dispatched from elsewhere
  // in the app (e.g. the Support nav item in the mobile sidebar). This lets
  // any component open the chat without holding a React ref to LiveChat.
  // Usage:  window.dispatchEvent(new Event('myncel:open-support'));
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      setIsOpen(true);
      setHasNewMessage(false);
    };
    window.addEventListener('myncel:open-support', handler);
    return () => window.removeEventListener('myncel:open-support', handler);
  }, []);

  const isAdmin = isAdminRole || isAdminPage;


  // Initialize live chat session (only when switching to live mode)
  const initLiveSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.session) {
        setSessionId(data.session.id);
        // Load existing messages from the session
        const existingMessages = (data.session.messages || []).map((m: any) => ({
          ...m,
          senderType: m.senderType === 'SYSTEM' ? 'AI' : m.senderType,
        }));
        setMessages(existingMessages);
        localStorage.setItem('myncel_chat_session_id', data.session.id);
      }
    } catch (error) {
      console.error('Error initializing chat session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load session on mount if previously saved
  useEffect(() => {
    // Only run if authenticated and not admin
    if (isAdmin) return;
    
    originalTitle.current = document.title || 'Myncel';

    const savedSessionId = localStorage.getItem('myncel_chat_session_id');
    if (savedSessionId) {
      // Check if session still exists. Include the saved ID so guest chats can be restored too.
      fetch(`/api/chat/session?sessionId=${savedSessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.session) {
            setSessionId(data.session.id);
            const existingMessages = (data.session.messages || []).map((m: any) => ({
              ...m,
              senderType: m.senderType === 'SYSTEM' ? 'AI' : m.senderType,
            }));
            setMessages(existingMessages);
            existingMessages.forEach((m: Message) => {
              if (m.senderType === 'ADMIN') notifiedAdminMessageIds.current.add(m.id);
            });
          }
        })
        .catch(() => {});
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    window.openMyncelChat = () => { setIsOpen(true); };

    return () => {
      delete window.openMyncelChat;
    };
  }, [status, isAdmin]);

  // Poll for new support replies whenever a live session exists.
  // This continues while the widget is minimized so users/guests still see the red dot,
  // browser title change, and browser notification when support replies.
  useEffect(() => {
    if (!sessionId || mode !== 'live') return;

    let cancelled = false;

    const pollMessages = async () => {
      try {
        const url = `/api/chat/messages?sessionId=${sessionId}`;
        const res = await fetch(url);
        if (!res.ok || cancelled) return;

        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          const currentIds = new Set(messages.map(m => m.id));
          const newAdminMessages = data.messages.filter(
            (m: Message) => m.senderType === 'ADMIN' && !currentIds.has(m.id)
          );

          if (newAdminMessages.length > 0) {
            setMessages(prev => {
              const allMessages = [...prev];
              for (const msg of newAdminMessages) {
                if (!allMessages.some(m => m.id === msg.id)) {
                  allMessages.push(msg);
                }
              }
              allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              return allMessages;
            });

            const unseenAdminMessages = newAdminMessages.filter((msg: Message) => !notifiedAdminMessageIds.current.has(msg.id));
            unseenAdminMessages.forEach((msg: Message) => notifiedAdminMessageIds.current.add(msg.id));

            if (!isOpen && unseenAdminMessages.length > 0) {
              setHasNewMessage(true);
              setUnreadAdminCount(prev => prev + unseenAdminMessages.length);

              const latest = unseenAdminMessages[unseenAdminMessages.length - 1];

              if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                  const notification = new Notification('New message from Myncel Support', {
                    body: latest.content.slice(0, 100),
                    icon: '/logo.png',
                    tag: `myncel-support-${latest.id}`,
                      });

                  notification.onclick = () => {
                    window.focus();
                    setMode('live');
                    setIsOpen(true);
                    setHasNewMessage(false);
          setUnreadAdminCount(0);
                    setUnreadAdminCount(0);
                  };
                } else if (Notification.permission === 'default') {
                  Notification.requestPermission().catch(() => {});
                }
              }
            }

            setTimeout(() => {
              const container = document.getElementById('chat-messages-container');
              if (container && isOpen) {
                container.scrollTop = container.scrollHeight;
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    pollMessages();
    const interval = setInterval(pollMessages, isOpen ? 3000 : 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, isOpen, messages, mode]);

  useEffect(() => {
    if (unreadAdminCount > 0) {
      document.title = `(${unreadAdminCount}) New support message${unreadAdminCount === 1 ? '' : 's'} — Myncel`;
    } else {
      document.title = originalTitle.current;
    }

    return () => {
      document.title = originalTitle.current;
    };
  }, [unreadAdminCount]);

  // Get AI response - INDEPENDENT, no session required
  const getAiResponse = async (question: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<string> => {
    try {
      const res = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();
      return data.response || "I'm here to help! Please let me know what you need assistance with.";
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "I'm here to help! A support agent will respond shortly. In the meantime, feel free to ask more questions.";
    }
  };

  // Track 👍/👎 votes per AI message (so user can't vote twice and we can swap UI)
  const [aiFeedback, setAiFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const submitAiFeedback = async (msg: Message, rating: 'up' | 'down') => {
    if (aiFeedback[msg.id]) return; // already voted
    // Optimistic update
    setAiFeedback(prev => ({ ...prev, [msg.id]: rating }));

    // Find the immediately preceding user question (for context)
    const idx = messages.findIndex(m => m.id === msg.id);
    let question = '';
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].senderType === 'USER') {
        question = messages[i].content;
        break;
      }
    }

    try {
      await fetch('/api/chat/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          question,
          answer: msg.content,
          messageId: msg.id,
        }),
      });
    } catch (err) {
      // Silent — feedback is best-effort
      console.error('Feedback submit failed:', err);
    }
  };

  // Handle sending message
  const handleSend = async () => {
    const content = message.trim();
    if (!content || isSending || isAiTyping) return;

    setIsSending(true);
    setMessage('');

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      senderType: 'USER',
      senderName: session?.user?.name || 'You',
      createdAt: new Date().toISOString(),
      isRead: true,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      if (mode === 'ai') {
        // AI MODE - Get AI response directly (no session needed)
        setIsAiTyping(true);
        
        setTimeout(async () => {
          // Build conversation history for context (last 10 messages)
            const conversationHistory = messages.slice(-10).map(m => ({
              role: m.senderType === 'USER' ? 'user' as const : 'assistant' as const,
              content: m.content
            }));
            
            const aiResponse = await getAiResponse(content, conversationHistory);
          setIsAiTyping(false);
          
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            content: aiResponse,
            senderType: 'AI',
            senderName: 'Myncel AI',
            createdAt: new Date().toISOString(),
            isRead: true,
          };
          setMessages(prev => [...prev, aiMessage]);

          setTimeout(() => {
            const container = document.getElementById('chat-messages-container');
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
          }, 100);
        }, 500);
      } else {
        // LIVE MODE - Send to chat session
        if (!sessionId) {
          // Create session first
          const sessionRes = await fetch('/api/chat/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const sessionData = await sessionRes.json();
          if (sessionData.session) {
            setSessionId(sessionData.session.id);
            localStorage.setItem('myncel_chat_session_id', sessionData.session.id);
            
            // Now send the message
            const sendRes = await fetch('/api/chat/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: sessionData.session.id,
                content,
              }),
            });
            
            if (sendRes.ok) {
              const sendData = await sendRes.json();
              // Replace the temp message with the real one
              setMessages(prev => prev.map(m => m.id === userMessage.id ? sendData.message : m));
            }
          }
        } else {
          // Send to existing session
          const res = await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              content,
            }),
          });
          
          if (res.ok) {
            const data = await res.json();
            setMessages(prev => prev.map(m => m.id === userMessage.id ? data.message : m));
          }
        }

        // Add system message that support will respond
        setTimeout(() => {
          const supportMessage: Message = {
            id: `support-${Date.now()}`,
            content: "Your message has been sent to our support team. An agent will respond shortly.",
            senderType: 'SYSTEM',
            senderName: 'System',
            createdAt: new Date().toISOString(),
            isRead: true,
          };
          setMessages(prev => [...prev, supportMessage]);
        }, 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the user message if failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setTimeout(() => {
        const container = document.getElementById('chat-messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  };

  // Handle quick question click - populate input field
  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  const switchToLiveChat = async () => {
    setMode('live');
    // Don't create a session yet - wait for user to send a message
    // Just load existing session if available
    if (sessionId) {
      // Already have a session, just switch mode
      return;
    }
    // Check for saved session
    const savedSessionId = localStorage.getItem('myncel_chat_session_id');
    if (savedSessionId) {
      try {
        const res = await fetch(`/api/chat/session?sessionId=${savedSessionId}`);
        const data = await res.json();
        if (data.session) {
          setSessionId(data.session.id);
          const existingMessages = (data.session.messages || []).map((m: any) => ({
            ...m,
            senderType: m.senderType === 'SYSTEM' ? 'AI' : m.senderType,
          }));
          setMessages(existingMessages);
        }
      } catch (e) {
        // Ignore errors, session will be created when user sends message
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setUnreadAdminCount(0);
    }
  }, [isOpen]);

  // Switch back to AI mode
  const switchToAiMode = () => {
    setMode('ai');
    // Keep messages when switching back to AI mode so user can see history
  };


  // End chat session - clear messages and session
  const handleEndChat = async () => {
    if (sessionId) {
      try {
        await fetch('/api/chat/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, status: 'CLOSED' }),
        });
      } catch (e) {
        console.error('Error closing session:', e);
      }
    }
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('myncel_chat_session_id');
    setMode('ai');
  };

  
    // Clear AI chat history
    const handleClearAiChat = () => {
      setMessages([]);
    };

    const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Don't render for admins (they have dedicated chat page)
  if (isAdmin) {
    return null;
  }

  return (
    <>
      {/* Support Tab — small rectangular edge tab on the right side of the
          screen. Tapping it opens the chat window directly. When the chat
          window is closed/minimized this tab re-appears (we never show a
          separate circular FAB).

          Visibility: DESKTOP ONLY (lg+). On mobile / tablet the floating
          edge tab is hidden because it overlaps page content (especially
          inside the dashboard with its own sidebar). Mobile users open
          the same chat via the dedicated "Support" item in the dashboard
          sidebar (see UserSidebar.tsx — it dispatches the
          'myncel:open-support' window event that this component listens
          for above). */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setHasNewMessage(false);
          }}
          className={`hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-[9998] bg-[#635bff] text-white py-3 px-2 rounded-l-lg shadow-md hover:bg-[#4f46e5] transition-all hover:pl-2.5 ${hasNewMessage ? 'animate-pulse' : ''}`}
          aria-label="Show support chat"
        >
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[10px] font-medium leading-tight" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              Support
            </span>
          </div>
          {hasNewMessage && (
            <span className="absolute -top-1 -left-1 min-w-4 h-4 px-0.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center">
              {unreadAdminCount > 0 ? unreadAdminCount : '!'}
            </span>
          )}
        </button>
      )}

      {/* (Removed) Circular floating chat button.
          Earlier the Support tab acted as a "reveal" that exposed a separate
          circular FAB, and that FAB was what opened the chat window. Users
          found the post-close circular icon visually disruptive, so the
          Support tab now opens the chat directly and is the ONLY launcher. */}

      {/* Chat Window
          ============
          Layout strategy:
          - On small screens (<sm, ~640px) the widget anchors to the bottom
            and is allowed to grow up to ~85% of the dynamic viewport. We use
            `top-3` + `bottom-3` so it claims the full vertical space available
            in landscape mode (where the previous `max-h-560` left the panel
            so short that only ~3 message lines were visible).
          - On sm+ we keep the existing floating-card behavior anchored to
            the bottom-right corner, but raise the height ceiling so longer
            AI replies don't get clipped.
          - inset-x positioning + max-w- caps prevents the panel from going
            edge-to-edge on tablets / large phones held in landscape, which
            looks unprofessional. */}
      {isOpen && (
        <div
          className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-[#e6ebf1] flex flex-col overflow-hidden
                     left-3 right-3 top-3 bottom-3 max-w-full
                     sm:left-auto sm:top-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:max-w-[380px] sm:max-h-[min(640px,calc(100dvh-140px))]"
        >
          {/* Header */}
          <div className="bg-[#635bff] text-white px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">Myncel Support</h3>
                <p className="text-[11px] sm:text-xs text-purple-200 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${mode === 'ai' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {mode === 'ai' ? 'AI Assistant' : 'Live Support'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {mode === 'ai' && messages.length > 0 && (
                  <button
                    onClick={handleClearAiChat}
                    className="text-[11px] sm:text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                )}
                {mode === 'live' && messages.length > 0 && (
                <button
                  onClick={handleEndChat}
                  className="text-[11px] sm:text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  title="End chat session"
                >
                  End
                </button>
              )}
              {/* Minimize button — desktop only.
                  On mobile it's redundant with Close (both call setIsOpen(false))
                  and just crowded the header. */}
              <button
                onClick={() => setIsOpen(false)}
                className="hidden sm:flex w-8 h-8 rounded-full hover:bg-white/20 items-center justify-center transition-colors"
                aria-label="Minimize chat"
                title="Minimize"
              >
                <span className="text-xl leading-none font-semibold -mt-1">−</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setHasNewMessage(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close chat"
                title="Close"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex border-b border-[#e6ebf1] flex-shrink-0">
            <button
              onClick={switchToAiMode}
              className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${mode === 'ai' ? 'text-[#635bff] border-b-2 border-[#635bff]' : 'text-[#8898aa] hover:text-[#0a2540]'}`}
            >
              🤖 AI Assistant
            </button>
            <button
              onClick={switchToLiveChat}
              className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${mode === 'live' ? 'text-[#635bff] border-b-2 border-[#635bff]' : 'text-[#8898aa] hover:text-[#0a2540]'}`}
            >
              💬 Live Support
            </button>
          </div>

          {/* Messages */}
          <div id="chat-messages-container" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-[160px] bg-[#f6f9fc]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#8898aa]">Connecting...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-4 sm:py-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#f0f4ff] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                {mode === 'ai' ? (
                  <>
                    <h4 className="font-semibold text-[#0a2540] mb-1 sm:mb-2 text-sm sm:text-base">Hi! I&apos;m Myncel AI</h4>
                    <p className="text-xs sm:text-sm text-[#425466] mb-3 sm:mb-4">Ask me anything about Myncel</p>
                    <div className="space-y-1.5 sm:space-y-2">
                      {['How do I add a machine?', 'What are the pricing plans?', 'How do I invite my team?', 'How does predictive maintenance work?'].map(q => (
                        <button
                          key={q}
                          onClick={() => handleQuickQuestion(q)}
                          className="block w-full text-left px-3 py-1.5 sm:py-2 bg-white border border-[#e6ebf1] rounded-lg text-xs sm:text-sm text-[#425466] hover:border-[#635bff] hover:text-[#635bff] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold text-[#0a2540] mb-1 sm:mb-2 text-sm sm:text-base">Live Support</h4>
                    <p className="text-xs sm:text-sm text-[#425466] mb-3 sm:mb-4">Send a message and our support team will respond shortly.</p>
                    <p className="text-[11px] sm:text-xs text-[#8898aa]">
                      💡 Tip: Switch to AI Assistant for instant answers!
                    </p>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    msg.senderType === 'USER'
                      ? 'bg-[#635bff] text-white'
                      : msg.senderType === 'AI'
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-[#0a2540] border border-purple-200'
                      : msg.senderType === 'SYSTEM'
                      ? 'bg-gray-100 text-[#425466] border border-gray-200'
                      : 'bg-white border border-[#e6ebf1]'
                  } rounded-2xl px-4 py-2.5 shadow-sm`}>
                    {msg.senderName && msg.senderType !== 'USER' && (
                      <p className={`text-xs font-medium mb-1 ${
                        msg.senderType === 'AI' ? 'text-[#635bff]' : 
                        msg.senderType === 'SYSTEM' ? 'text-[#8898aa]' : 'text-[#635bff]'
                      }`}>{msg.senderName}</p>
                    )}
                    {msg.senderType === 'USER' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    ) : (
                      <div className="text-sm leading-relaxed break-words space-y-1">
                        {renderInlineMarkdown(msg.content)}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${msg.senderType === 'USER' ? 'text-purple-200' : 'text-[#8898aa]'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                    {msg.senderType === 'AI' && !msg.id.startsWith('greeting') && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-100">
                        {aiFeedback[msg.id] ? (
                          <span className="text-xs text-[#635bff] font-medium">
                            {aiFeedback[msg.id] === 'up' ? '👍 Thanks for the feedback!' : '👎 Thanks — we\'ll improve this.'}
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-[#8898aa]">Was this helpful?</span>
                            <button
                              onClick={() => submitAiFeedback(msg, 'up')}
                              className="text-base hover:scale-125 transition-transform"
                              aria-label="Helpful"
                              title="Helpful"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => submitAiFeedback(msg, 'down')}
                              className="text-base hover:scale-125 transition-transform"
                              aria-label="Not helpful"
                              title="Not helpful"
                            >
                              👎
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#635bff] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#635bff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#635bff] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2.5 sm:p-4 border-t border-[#e6ebf1] bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={mode === 'ai' ? "Ask me anything about Myncel..." : "Type your message..."}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-[#e6ebf1] rounded-xl text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                disabled={isSending || isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending || isLoading || isAiTyping}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#635bff] text-white rounded-xl hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-[#8898aa] mt-1.5 sm:mt-2 text-center">
              {mode === 'ai' ? '🤖 Powered by AI' : '💬 Support team will respond shortly'} • <a href="mailto:support@myncel.com" className="text-[#635bff] hover:underline">support@myncel.com</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}