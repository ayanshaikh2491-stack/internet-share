import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Square, Globe, ExternalLink, Shield, Wifi, AlertCircle, Loader2, Database } from 'lucide-react';
import type { ServerMessage } from '../services/tunnel';
import { getTunnel } from '../services/tunnel';

interface ReceiverJoinProps {
  onBack: () => void;
}

// Animated counter hook
function useAnimatedCounter(value: number, duration = 300) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(prev + (value - prev) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return display;
}

// Connection status badge
function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium" style={{
      background: connected ? 'rgba(16,185,129,0.1)' : 'rgba(113,113,122,0.1)',
      borderColor: connected ? 'rgba(16,185,129,0.3)' : 'rgba(113,113,122,0.2)',
      color: connected ? 'var(--accent-green)' : 'var(--muted)',
    }}>
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--accent-green)] animate-pulse' : 'bg-[var(--muted)]'}`} style={connected ? { boxShadow: '0 0 6px var(--accent-green)' } : {}} />
      {connected ? 'ONLINE' : 'OFFLINE'}
    </div>
  );
}

export default function ReceiverJoin({ onBack }: ReceiverJoinProps) {
  const tunnel = getTunnel();
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'code' | 'browse'>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [iframeHtml, setIframeHtml] = useState<string | null>(null);
  const [dataUsed, setDataUsed] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const animatedDataUsed = useAnimatedCounter(dataUsed);

  // Check connection status
  useEffect(() => {
    if (!tunnel) return;
    const checkConnection = () => {
      setIsConnected(tunnel.isConnected());
    };
    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [tunnel]);

  // Handle incoming messages
  useEffect(() => {
    if (!tunnel || step !== 'browse') return;

    const handler = (msg: ServerMessage) => {
      if (msg.type === 'fetch_response') {
        setIframeHtml(msg.html || '<p>No content received</p>');
        setIsFetching(false);
        const bytes = new Blob([msg.html || '']).size;
        setDataUsed(prev => prev + bytes);
      }
      if (msg.type === 'room_update') {
        setDataUsed(prev => Math.max(prev, (msg.dataMBUsed || 0) * 1024 * 1024));
      }
      if (msg.type === 'error') {
        setError(msg.reason || 'Error');
        setIsFetching(false);
      }
      if (msg.type === 'owner_disconnected') {
        setError('Donor disconnected — session ended');
        setStep('code');
        setIsFetching(false);
      }
      if (msg.type === 'room_left') {
        setStep('code');
        setIsFetching(false);
      }
    };

    tunnel.onMessage = handler;
    return () => {
      tunnel.onMessage = () => {};
    };
  }, [tunnel, step]);

  const joinRoom = useCallback(() => {
    if (!tunnel || !roomCode.trim()) return;
    setLoading(true);
    setError(null);

    tunnel.onMessage = (msg: ServerMessage) => {
      if (msg.type === 'room_joined') {
        setStep('browse');
        setLoading(false);
        setError(null);
      } else if (msg.type === 'error') {
        setError(msg.reason || 'Failed to join room');
        setLoading(false);
      }
    };

    tunnel.joinRoom(roomCode.trim().toUpperCase(), password || undefined);
  }, [tunnel, roomCode, password]);

  const fetchUrl = useCallback(() => {
    if (!tunnel || !url.trim()) return;
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    setUrl(cleanUrl);
    setIframeHtml(null);
    setIsFetching(true);
    setError(null);
    tunnel.send('fetch_url', { url: cleanUrl, roomCode: roomCode.toUpperCase() });
  }, [tunnel, url, roomCode]);

  const disconnect = useCallback(() => {
    tunnel?.leaveRoom();
    setStep('code');
    setIframeHtml(null);
    setDataUsed(0);
    setUrl('');
    setError(null);
  }, [tunnel]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isHttps = url.startsWith('https://');
  const canJoin = roomCode.trim().length === 4 && !loading;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 80% 0%, rgba(236,72,153,0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 100%, rgba(124,58,237,0.05) 0%, transparent 60%)',
      }} />

      <ConnectionBadge connected={isConnected} />

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-b border-[var(--hairline)] bg-[var(--canvas)]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              aria-label="Back to home"
              className="p-2 rounded-[var(--radius-md)] bg-[var(--canvas-elevated)] hover:bg-[var(--surface-hover)] transition-all border border-[var(--hairline)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)]/60"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--body)]" />
            </button>
            <h1 className="text-base font-medium text-[var(--ink)]" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em' }}>Join Network</h1>
          </div>
          {step === 'browse' && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs" style={{
                background: 'rgba(6,182,212,0.08)',
                borderColor: 'rgba(6,182,212,0.2)',
                color: 'var(--accent-cyan)',
              }}>
                <Database className="w-3 h-3" />
                <span>{formatBytes(animatedDataUsed)} used</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" style={{ boxShadow: '0 0 6px var(--accent-cyan)' }} />
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-10 py-6 sm:py-8">
        {/* Error Alert */}
        {error && (
          <div role="alert" className="bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-[var(--radius-xl)] p-4 flex items-center gap-3 text-[var(--accent-red)] text-sm mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline shrink-0 hover:opacity-80">Dismiss</button>
          </div>
        )}

        {step === 'code' ? (
          /* Room Code Entry */
          <div className="max-w-sm mx-auto mt-8 sm:mt-12 md:mt-20">
            <div className="relative bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] p-6 sm:p-8 text-center overflow-hidden">
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 0%, rgba(236,72,153,0.08) 0%, transparent 70%)',
              }} />

              {/* Icon */}
              <div className="relative w-16 h-16 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--accent-pink)]/20 to-[var(--primary)]/10 border border-[var(--accent-pink)]/20 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-[var(--accent-pink)]" />
              </div>

              <h2 className="relative text-xl font-medium text-[var(--ink)] mb-1" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.02em' }}>Enter Room Code</h2>
              <p className="relative text-sm text-[var(--muted)] mb-8">Ask the donor for their 4-character code</p>

              {/* Room Code Input */}
              <div className="relative mb-4">
                <input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                  onKeyDown={e => e.key === 'Enter' && canJoin && joinRoom()}
                  placeholder="X7K9"
                  maxLength={4}
                  autoFocus
                  className="w-full text-center text-4xl sm:text-5xl font-mono font-bold tracking-[0.2em] py-4 rounded-[var(--radius-xl)] bg-[var(--canvas)] border-2 border-[var(--hairline)] text-[var(--primary)] focus:outline-none focus:border-[var(--accent-pink)] focus:ring-4 focus:ring-[var(--accent-pink)]/10 transition-all placeholder:text-[var(--muted-soft)] placeholder:tracking-normal placeholder:text-lg"
                  style={{ textShadow: roomCode.length === 4 ? '0 0 20px rgba(124,58,237,0.4)' : 'none' }}
                />
                {roomCode.length === 4 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent-green)] flex items-center justify-center" style={{ boxShadow: '0 0 8px rgba(16,185,129,0.4)' }}>
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="relative mb-6">
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canJoin && joinRoom()}
                  placeholder="Password (if required)"
                  type="password"
                  className="w-full text-center py-3 px-4 rounded-[var(--radius-xl)] bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-pink)] focus:ring-2 focus:ring-[var(--accent-pink)]/20 text-sm placeholder:text-[var(--muted-soft)] transition"
                />
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-soft)]" />
              </div>

              {/* Join Button */}
              <button
                onClick={joinRoom}
                disabled={!canJoin}
                className="relative w-full py-4 rounded-[var(--radius-xl)] text-white font-medium flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all cursor-pointer bg-gradient-to-r from-[var(--accent-pink)] to-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)]/60"
                style={{ boxShadow: 'var(--shadow-glow-pink)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>Join Room</span>
                  </>
                )}
              </button>

              {!isConnected && (
                <div className="relative flex items-center justify-center gap-2 mt-4 text-xs text-[var(--accent-amber)]">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Connecting to server...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Browse Mode */
          <div className="space-y-4">
            {/* URL Bar */}
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-1 flex items-center gap-2 sm:gap-3 bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex items-center gap-1.5 shrink-0">
                  {isHttps && url ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-green)]" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.4)' }} />
                  ) : (
                    <Globe className="w-5 h-5 text-[var(--accent-pink)]" />
                  )}
                </div>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchUrl()}
                  placeholder="Enter URL (e.g., google.com)"
                  className="flex-1 bg-transparent text-[var(--ink)] text-sm focus:outline-none placeholder:text-[var(--muted-soft)] min-w-0"
                />
                <button
                  onClick={fetchUrl}
                  disabled={!url.trim() || isFetching}
                  className="px-4 py-2 rounded-[var(--radius-md)] text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-all cursor-pointer bg-gradient-to-r from-[var(--accent-pink)] to-[var(--primary)] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-pink)]/60 flex items-center gap-2"
                >
                  {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  <span className="hidden sm:inline">Go</span>
                </button>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2.5 sm:py-3 rounded-[var(--radius-xl)] text-sm font-medium bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/25 hover:bg-[var(--accent-red)]/20 transition-all cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-red)]/60"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            {iframeHtml ? (
              <div className="relative bg-[var(--canvas-elevated)] rounded-[var(--radius-xl)] overflow-hidden border border-[var(--hairline)]" style={{ height: 'calc(100vh - 240px)' }}>
                {/* Loading overlay */}
                {isFetching && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--canvas)]/80 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[var(--accent-pink)] animate-spin" />
                      <p className="text-sm text-[var(--muted)]">Loading content...</p>
                    </div>
                  </div>
                )}
                <iframe
                  srcDoc={iframeHtml}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  title="Browsed content"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="relative bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] flex flex-col items-center justify-center px-4 text-center overflow-hidden"
                style={{ height: 'calc(100vh - 240px)' }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'radial-gradient(circle at 50% 40%, rgba(236,72,153,0.04) 0%, transparent 60%)',
                }} />
                <div className="relative">
                  <div className="w-20 h-20 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--accent-pink)]/10 to-[var(--primary)]/5 border border-[var(--accent-pink)]/10 flex items-center justify-center mx-auto mb-5">
                    <Globe className="w-10 h-10 text-[var(--muted-soft)]" />
                  </div>
                  <p className="text-base text-[var(--body)] font-medium">Connected to donor</p>
                  <p className="text-sm text-[var(--muted)] mt-1">Enter a URL above to start browsing</p>
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs" style={{
                    background: 'rgba(124,58,237,0.06)',
                    borderColor: 'rgba(124,58,237,0.15)',
                    color: 'var(--primary)',
                  }}>
                    <Shield className="w-3 h-3" />
                    Room: <span className="font-mono font-bold tracking-wider">{roomCode}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
