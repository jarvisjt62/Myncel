'use client';

// LiveChat Component - AI-powered assistance + Live chat support
// AI is independent and doesn't require a chat session
// Live chat creates a session only when user sends a message to support
import { useState, useEffect, useCallback } from 'react';
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

export default function LiveChat() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [mode, setMode] = useState<'ai' | 'live'>('ai'); // 'ai' for AI assistance, 'live' for live chat

  // Don't show live chat for system admins (ADMIN, SUPER_ADMIN). OWNER is organization owner - they should see chat.
  const isAdminRole = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const [isAdminPage, setIsAdminPage] = useState(false);
  
  // Check if we're on an admin page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdminPage(window.location.pathname.startsWith('/admin'));
    }
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
    
    const savedSessionId = localStorage.getItem('myncel_chat_session_id');
    if (savedSessionId) {
      // Check if session still exists
      fetch(`/api/chat/session`)
        .then(res => res.json())
        .then(data => {
          if (data.session) {
            setSessionId(data.session.id);
            const existingMessages = (data.session.messages || []).map((m: any) => ({
              ...m,
              senderType: m.senderType === 'SYSTEM' ? 'AI' : m.senderType,
            }));
            setMessages(existingMessages);
          }
        })
        .catch(() => {});
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    window.openMyncelChat = () => setIsOpen(true);

    return () => {
      delete window.openMyncelChat;
    };
  }, [status, isAdmin]);

  // Poll for new messages (only in live mode with a session)
  useEffect(() => {
    if (!sessionId || !isOpen || mode !== 'live') return;

    const pollMessages = async () => {
      try {
        // Get all messages for this session (don't use afterId to avoid temp ID issues)
        const url = `/api/chat/messages?sessionId=${sessionId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          // Find new ADMIN messages that aren't already in our state
          const currentIds = new Set(messages.map(m => m.id));
          const newAdminMessages = data.messages.filter(
            (m: Message) => m.senderType === 'ADMIN' && !currentIds.has(m.id)
          );

          if (newAdminMessages.length > 0) {
            setMessages(prev => {
              // Merge messages, avoiding duplicates
              const allMessages = [...prev];
              for (const msg of newAdminMessages) {
                if (!allMessages.some(m => m.id === msg.id)) {
                  allMessages.push(msg);
                }
              }
              // Sort by createdAt
              allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              return allMessages;
            });
            setHasNewMessage(true);

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New message from support', {
                body: newAdminMessages[newAdminMessages.length - 1].content.slice(0, 100),
                icon: '/logo.png',
              });
            }

            setTimeout(() => {
              const container = document.getElementById('chat-messages-container');
              if (container) {
                container.scrollTop = container.scrollHeight;
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId, isOpen, messages, mode]);

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
        const res = await fetch('/api/chat/session');
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
      {/* Chat Button - Fixed position on RIGHT side */}
      <button
        onClick={() => {
          setIsOpen(true);
          setHasNewMessage(false);
        }}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '100px',
          zIndex: 9999,
        }}
        className={`bg-[#635bff] text-white p-4 rounded-full shadow-lg hover:bg-[#4f46e5] transition-all hover:scale-105 ${isOpen ? 'hidden' : 'flex'} items-center justify-center group relative`}
        aria-label="Open live chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
        <span className="absolute right-full mr-3 bg-[#0a2540] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Chat with us
        </span>
      </button>

      {/* Chat Window - Fixed position on RIGHT side */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '100px',
            zIndex: 9999,
          }}
          className="w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-[#e6ebf1] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#635bff] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Myncel Support</h3>
                <p className="text-xs text-purple-200 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${mode === 'ai' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {mode === 'ai' ? 'AI Assistant' : 'Live Support'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mode === 'ai' && messages.length > 0 && (
                  <button
                    onClick={handleClearAiChat}
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                    title="Clear chat history"
                  >
                    Clear Chat
                  </button>
                )}
                {mode === 'live' && messages.length > 0 && (
                <button
                  onClick={handleEndChat}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  title="End chat session"
                >
                  End Chat
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex border-b border-[#e6ebf1]">
            <button
              onClick={switchToAiMode}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'ai' ? 'text-[#635bff] border-b-2 border-[#635bff]' : 'text-[#8898aa] hover:text-[#0a2540]'}`}
            >
              🤖 AI Assistant
            </button>
            <button
              onClick={switchToLiveChat}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'live' ? 'text-[#635bff] border-b-2 border-[#635bff]' : 'text-[#8898aa] hover:text-[#0a2540]'}`}
            >
              💬 Live Support
            </button>
          </div>

          {/* Messages */}
          <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] bg-[#f6f9fc]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-[#8898aa]">Connecting...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#f0f4ff] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                {mode === 'ai' ? (
                  <>
                    <h4 className="font-semibold text-[#0a2540] mb-2">Hi! I'm Myncel AI</h4>
                    <p className="text-sm text-[#425466] mb-4">Ask me anything about Myncel - I'm here to help!</p>
                    <div className="space-y-2">
                      {['How do I add a machine?', 'What are the pricing plans?', 'How do I invite my team?', 'How does predictive maintenance work?'].map(q => (
                        <button
                          key={q}
                          onClick={() => handleQuickQuestion(q)}
                          className="block w-full text-left px-3 py-2 bg-white border border-[#e6ebf1] rounded-lg text-sm text-[#425466] hover:border-[#635bff] hover:text-[#635bff] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold text-[#0a2540] mb-2">Live Support</h4>
                    <p className="text-sm text-[#425466] mb-4">Send a message and our support team will respond shortly.</p>
                    <p className="text-xs text-[#8898aa]">
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.senderType === 'USER' ? 'text-purple-200' : 'text-[#8898aa]'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
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
          <div className="p-4 border-t border-[#e6ebf1] bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={mode === 'ai' ? "Ask me anything about Myncel..." : "Type your message..."}
                className="flex-1 px-4 py-2.5 border border-[#e6ebf1] rounded-xl text-sm focus:outline-none focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/20"
                disabled={isSending || isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending || isLoading || isAiTyping}
                className="px-4 py-2.5 bg-[#635bff] text-white rounded-xl hover:bg-[#4f46e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-[#8898aa] mt-2 text-center">
              {mode === 'ai' ? '🤖 Powered by AI' : '💬 Support team will respond shortly'} • Or email <a href="mailto:support@myncel.com" className="text-[#635bff] hover:underline">support@myncel.com</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}