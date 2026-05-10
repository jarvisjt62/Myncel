'use client';

import { useState, useEffect, useRef } from 'react';

type SessionInfo = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  roomName: string;
  inviteToken: string;
  inviteExpiresAt: string | null;
  organization: { name: string } | null;
  machine: { id: string; name: string; model?: string | null; imageUrl?: string | null; status?: string } | null;
  workOrder: { id: string; woNumber: string; title: string } | null;
  hostedBy: string;
  notes: string | null;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function RemoteSupportJoinClient({
  session,
  expired,
  ended,
}: {
  session: SessionInfo;
  expired: boolean;
  ended: boolean;
}) {
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState('');
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  // Clean up Jitsi on unmount
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
        setVideoReady(false);
      }
    };
  }, []);

  async function handleJoin() {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    setError('');
    setVideoReady(false);
    setJoining(true);
    try {
      // Register participant
      const res = await fetch(`/api/remote-support/${session.id}/participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim(), inviteToken: session.inviteToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to join session.');
        setJoining(false);
        return;
      }
      setJoined(true);
    } catch {
      setError('Network error. Please try again.');
      setJoining(false);
    }
  }

  // Load Jitsi after joining
  useEffect(() => {
    if (!joined) return;
    // Wait for container to mount
    const timer = setTimeout(() => {
      loadJitsi();
    }, 300);
    return () => clearTimeout(timer);
  }, [joined]);

  function loadJitsi() {
    if (!jitsiContainerRef.current) return;

    // Load Jitsi script if not already loaded
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => initJitsi();
      script.onerror = () => {
        setVideoReady(false);
        setError('Failed to load video provider. Please try refreshing.');
      };
      document.head.appendChild(script);
    } else {
      initJitsi();
    }
  }

  function initJitsi() {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return;

    const domain = 'meet.jit.si';
    const options = {
      roomName: session.roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: name,
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableWelcomePage: false,
        enableClosePage: false,
        subject: session.title,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DEFAULT_BACKGROUND: '#1a1a2e',
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop',
          'fullscreen', 'fodeviceselection', 'hangup', 'chat',
          'raisehand', 'tileview', 'select-background', 'mute-everyone',
        ],
      },
    };

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      setVideoReady(true);
      setJoining(false);

      apiRef.current.addEventListeners({
        readyToClose: () => {
          if (apiRef.current) {
            try { apiRef.current.dispose(); } catch {}
            apiRef.current = null;
          }
          setVideoReady(false);
          setJoined(false);
        },
      });
    } catch (e) {
      setVideoReady(false);
      setError('Failed to initialize video room. Please try refreshing.');
    }
  }

  // ── Expired state ──────────────────────────────────────────────────────────
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f0f1a' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-white mb-2">Invite Link Expired</h1>
          <p className="text-gray-400 mb-6">
            This invite link for <span className="text-white font-semibold">"{session.title}"</span> has expired.
            Please contact your support representative for a new link.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
            <span>🏢</span> {session.organization?.name || 'Myncel Support'}
          </div>
        </div>
      </div>
    );
  }

  // ── Ended/Cancelled state ──────────────────────────────────────────────────
  if (ended) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f0f1a' }}>
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-2">Session Ended</h1>
          <p className="text-gray-400 mb-6">
            The support session <span className="text-white font-semibold">"{session.title}"</span> has ended.
            Thank you for using Myncel Remote Support.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
            <span>🏢</span> {session.organization?.name || 'Myncel Support'}
          </div>
        </div>
      </div>
    );
  }

  // ── Video room (joined) ────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0f0f1a' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">{session.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-emerald-400" style={{ background: 'rgba(16,185,129,0.15)' }}>
              Live
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {session.organization && <span>🏢 {session.organization.name}</span>}
            {session.machine && <span>🔧 {session.machine.name}</span>}
            <span>Hosted by {session.hostedBy}</span>
          </div>
        </div>

        {/* Jitsi container */}
        <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div ref={jitsiContainerRef} className="absolute inset-0" />
          {!videoReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white">
                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-400">Connecting to video room…</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-sm font-medium text-red-400" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  }

  // ── Join form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f0f1a' }}>
      <div className="max-w-lg w-full">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#635bff] flex items-center justify-center text-white font-bold text-lg">M</div>
            <span className="text-white font-bold text-xl">Myncel</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Remote Support Session</h1>
          <p className="text-gray-400 text-sm">You've been invited to join a live support session</p>
        </div>

        {/* Session card */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{session.title}</h2>
              {session.description && <p className="text-sm text-gray-400 mt-0.5">{session.description}</p>}
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold text-emerald-400 flex-shrink-0 ml-3" style={{ background: 'rgba(16,185,129,0.15)' }}>
              {session.status === 'ACTIVE' ? '● Live' : 'Scheduled'}
            </span>
          </div>

          <div className="space-y-2">
            {session.organization && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-gray-500">🏢</span>
                <span>{session.organization.name}</span>
              </div>
            )}
            {session.machine && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-gray-500">🔧</span>
                <span>{session.machine.name}{session.machine.model ? ` · ${session.machine.model}` : ''}</span>
              </div>
            )}
            {session.workOrder && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-gray-500">📋</span>
                <span>{session.workOrder.woNumber} · {session.workOrder.title}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-gray-500">👤</span>
              <span>Hosted by <span className="text-white font-medium">{session.hostedBy}</span></span>
            </div>
          </div>

          {session.notes && (
            <div className="mt-3 p-3 rounded-xl text-sm text-gray-300" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide block mb-1">Session Notes</span>
              {session.notes}
            </div>
          )}
        </div>

        {/* Name form */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Enter your name to join</h3>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && !joining && handleJoin()}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-400 mb-3 flex items-center gap-1.5">
              <span>⚠️</span> {error}
            </p>
          )}
          <button
            onClick={handleJoin}
            disabled={joining || !name.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: joining || !name.trim() ? 'rgba(99,91,255,0.4)' : '#635bff',
              color: '#fff',
            }}
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Joining…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                📹 Join Video Session
              </span>
            )}
          </button>
        </div>

        {/* Security note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            🔒 This is a secure session. Video is provided by Jitsi Meet.
            {session.inviteExpiresAt && (
              <> · Invite expires {new Date(session.inviteExpiresAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}