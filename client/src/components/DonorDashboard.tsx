import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Square, Users, Database, Clock, Copy, Shield, Wifi, AlertCircle } from 'lucide-react';
import type { ServerMessage } from '../services/tunnel';
import { getTunnel } from '../services/tunnel';
import type { UserProfile } from '../types';

interface DonorDashboardProps {
  user: UserProfile;
  onBack: () => void;
}

interface PeerInfo {
  sid: string;
  connectedAt: number;
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

export default function DonorDashboard({ user, onBack }: DonorDashboardProps) {
  const tunnel = getTunnel();
  const [isSharing, setIsSharing] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomPassword, setRoomPassword] = useState('');
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
  const [dataMBUsed, setDataMBUsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [showChars, setShowChars] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const animatedDataMB = useAnimatedCounter(dataMBUsed);
  const animatedDuration = useAnimatedCounter(duration);
  const animatedPeers = useAnimatedCounter(peers.size);

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

  // Staggered room code animation
  useEffect(() => {
    if (roomCode) {
      setShowChars(false);
      const timer = setTimeout(() => setShowChars(true), 100);
      return () => clearTimeout(timer);
    }
  }, [roomCode]);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!tunnel) return;

    const handler = (msg: ServerMessage) => {
      switch (msg.type) {
        case 'room_created':
          setRoomCode(msg.roomCode);
          setIsSharing(true);
          addLog(`Room created: ${msg.roomCode}`);
          break;

        case 'room_update':
          setDataMBUsed(msg.dataMBUsed || 0);
          setDuration(msg.duration || 0);
          break;

        case 'peer_joined': {
          const sid: string = msg.sid || `peer_${Date.now()}`;
          addLog(`Peer joined (${sid.slice(0, 8)}...)`);
          setPeers(prev => {
            const next = new Map(prev);
            next.set(sid, { sid, connectedAt: Date.now() });
            return next;
          });
          break;
        }

        case 'peer_left': {
          const sid: string = msg.sid;
          addLog(`Peer left (${sid?.slice(0, 8)}...)`);
          if (sid) {
            setPeers(prev => {
              const next = new Map(prev);
              next.delete(sid);
              return next;
            });
          }
          break;
        }

        case 'room_left':
          if (msg.closed || msg.reason) {
            addLog(`Room closed: ${msg.reason || 'unknown'}`);
            resetState();
          }
          break;

        case 'owner_disconnected':
          addLog(`Room ended: ${msg.reason || 'disconnected'}`);
          resetState();
          break;

        case 'fetch_url': {
          const fetchUrl: string = msg.url || '';
          const requestId: string = msg.requestId || '';
          addLog(`Fetch request: ${fetchUrl}`);

          fetch(fetchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
            signal: AbortSignal.timeout(15000),
          })
            .then(res => res.text())
            .then(html => {
              tunnel?.send('fetch_response', {
                url: fetchUrl,
                html,
                requestId,
                roomCode: msg.roomCode,
              });
              addLog(`Sent ${(html.length / 1024).toFixed(1)}KB for ${fetchUrl}`);
            })
            .catch(err => {
              const errorHtml = `<html><body style="font-family:system-ui;padding:3rem;background:#0f0f12;color:#fafafa;text-align:center"><h1 style="color:#ef4444">⚠ Error</h1><p>${err.message}</p><p style="opacity:0.5;font-size:0.85rem">${fetchUrl}</p></body></html>`;
              tunnel?.send('fetch_response', { url: fetchUrl, html: errorHtml, requestId, roomCode: msg.roomCode });
              addLog(`Fetch failed: ${err.message}`);
            });
          break;
        }

        case 'error':
          setError(msg.reason || 'Unknown error');
          addLog(`Error: ${msg.reason || 'Unknown'}`);
          break;
      }
    };

    tunnel.onMessage = handler;
    return () => {};
  }, [tunnel, addLog]);

  const resetState = () => {
    setIsSharing(false);
    setRoomCode(null);
    setShowChars(false);
    setPeers(new Map());
    setDataMBUsed(0);
    setDuration(0);
  };

  const startSharing = () => {
    if (!tunnel) return;
    setError(null);
    addLog('Creating room...');
    const config: { password?: string } = {};
    if (roomPassword.trim()) config.password = roomPassword.trim();
    tunnel.createRoom(config);
  };

  const stopSharing = () => {
    if (!tunnel) return;
    addLog('Closing room...');
    tunnel.leaveRoom();
    resetState();
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      addLog('Room code copied');
    }
  };

  // Progress bar calculations
  const maxDataMB = 100;
  const dataProgress = Math.min((dataMBUsed / maxDataMB) * 100, 100);
  const dataWarn = dataProgress >= 80;

  const maxDurationSec = 1800;
  const durationProgress = Math.min((duration / maxDurationSec) * 100, 100);
  const durationWarn = durationProgress >= 80;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.05) 0%, transparent 60%)',
      }} />

      <ConnectionBadge connected={isConnected} />

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 border-b border-[var(--hairline)] bg-[var(--canvas)]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              aria-label="Back to home"
              className="p-2 rounded-[var(--radius-md)] bg-[var(--canvas-elevated)] hover:bg-[var(--surface-hover)] transition-all border border-[var(--hairline)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--body)]" />
            </button>
            <div>
              <h1 className="text-base font-medium text-[var(--ink)]" style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.04em' }}>Share Internet</h1>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">{user.email}</p>
            </div>
          </div>
          {roomCode && (
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent-green)]" />
              <span className="text-sm tracking-[0.15em] text-[var(--primary)] font-mono">{roomCode}</span>
              <button onClick={copyRoomCode} className="p-1 rounded hover:bg-[var(--surface-hover)] transition" aria-label="Copy code">
                <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Error Alert */}
        {error && (
          <div role="alert" className="bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 rounded-[var(--radius-xl)] p-4 flex items-center gap-3 text-[var(--accent-red)] text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline shrink-0 hover:opacity-80">Dismiss</button>
          </div>
        )}

        {/* Room Code Display */}
        {isSharing && roomCode && (
          <div className="relative bg-[var(--canvas-elevated)] border border-[var(--primary)]/25 rounded-[var(--radius-xl)] p-6 sm:p-8 text-center overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)',
            }} />
            <p className="relative text-[11px] text-[var(--muted)] uppercase tracking-widest mb-4" style={{ letterSpacing: '0.15em' }}>Share this code</p>
            <div className="relative flex justify-center gap-2 sm:gap-3 mb-4">
              {roomCode.split('').map((char, i) => (
                <span
                  key={i}
                  className="inline-block text-5xl sm:text-6xl md:text-7xl font-mono font-bold text-[var(--primary)]"
                  style={{
                    textShadow: showChars ? '0 0 30px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.3)' : 'none',
                    opacity: showChars ? 1 : 0,
                    transform: showChars ? 'translateY(0)' : 'translateY(16px)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
            {roomPassword && (
              <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium" style={{
                background: 'rgba(236,72,153,0.1)',
                color: 'var(--accent-pink)',
                border: '1px solid rgba(236,72,153,0.2)',
              }}>
                <Shield className="w-3 h-3" /> Password protected
              </div>
            )}
          </div>
        )}

        {/* Control Card */}
        <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] p-5 sm:p-6">
          {!isSharing ? (
            <div className="space-y-4 max-w-sm mx-auto">
              {/* Password input */}
              <div className="relative">
                <input
                  value={roomPassword}
                  onChange={e => setRoomPassword(e.target.value)}
                  placeholder="Add room password (optional)"
                  type="password"
                  className="w-full text-center py-3 px-4 rounded-[var(--radius-xl)] bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 text-sm placeholder:text-[var(--muted-soft)] transition"
                />
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-soft)]" />
              </div>

              {/* Start button */}
              <button
                onClick={startSharing}
                disabled={!tunnel || !isConnected}
                className="w-full py-4 rounded-[var(--radius-xl)] text-white font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-r from-[var(--primary)] to-[var(--accent-cyan)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
                style={{ boxShadow: 'var(--shadow-glow-primary)' }}
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Start Sharing</span>
              </button>

              {!isConnected && (
                <div className="flex items-center justify-center gap-2 text-xs text-[var(--accent-amber)]">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Connecting to server...</span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={stopSharing}
              className="w-full max-w-sm mx-auto py-4 rounded-[var(--radius-xl)] text-white font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--accent-red), var(--accent-pink))',
                boxShadow: 'var(--shadow-glow-red)',
              }}
            >
              <Square className="w-5 h-5" />
              <span>Stop Sharing</span>
            </button>
          )}
        </div>

        {/* Stats with Progress Bars */}
        {isSharing && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Peers */}
            <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] p-4 sm:p-5 text-center">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-cyan)]/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-[var(--accent-cyan)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--ink)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {Math.round(animatedPeers)}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1 uppercase tracking-wider">Peers</p>
            </div>

            {/* Data */}
            <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] p-4 sm:p-5 text-center">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-3">
                <Database className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--ink)]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {animatedDataMB.toFixed(1)}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1">MB / {maxDataMB}</p>
              <div className="mt-3 h-1.5 rounded-full bg-[var(--hairline)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${dataProgress}%`,
                    background: dataWarn ? 'var(--accent-amber)' : 'var(--primary)',
                    boxShadow: dataWarn ? '0 0 8px rgba(245,158,11,0.4)' : '0 0 8px rgba(124,58,237,0.4)',
                  }}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] p-4 sm:p-5 text-center">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-green)]/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5 text-[var(--accent-green)]" />
              </div>
              <p className="text-xl font-bold text-[var(--ink)]" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem' }}>
                {formatDuration(Math.round(animatedDuration))}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-1">Duration</p>
              <div className="mt-3 h-1.5 rounded-full bg-[var(--hairline)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${durationProgress}%`,
                    background: durationWarn ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                    boxShadow: durationWarn ? '0 0 8px rgba(245,158,11,0.4)' : '0 0 8px rgba(6,182,212,0.4)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Connected Peers List */}
        {isSharing && (
          <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] p-5 sm:p-6">
            <h2 className="text-[11px] text-[var(--muted)] uppercase tracking-widest mb-4" style={{ letterSpacing: '0.1em' }}>
              Connected Peers ({peers.size})
            </h2>
            {peers.size === 0 ? (
              <div className="text-center py-8">
                <Wifi className="w-10 h-10 text-[var(--muted-soft)] mx-auto mb-3" />
                <p className="text-sm text-[var(--muted)]">Waiting for someone to join</p>
                <p className="text-xs text-[var(--muted-soft)] mt-1">Share your room code with them</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...peers.entries()].map(([sid, peer]) => (
                  <div key={sid} className="flex items-center justify-between py-2.5 px-3 rounded-[var(--radius-md)] bg-[var(--canvas)] border border-[var(--hairline)]">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" style={{ boxShadow: '0 0 6px var(--accent-green)' }} />
                      <span className="text-sm text-[var(--body)] font-mono">{sid.slice(0, 12)}...</span>
                    </div>
                    <span className="text-xs text-[var(--muted)] font-mono">
                      {Math.floor((Date.now() - peer.connectedAt) / 1000)}s
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Log */}
        <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[var(--radius-xl)] p-5 sm:p-6">
          <h2 className="text-[11px] text-[var(--muted)] uppercase tracking-widest mb-4" style={{ letterSpacing: '0.1em' }}>Activity Log</h2>
          <div className="bg-[var(--canvas)] rounded-[var(--radius-xl)] p-4 max-h-40 overflow-y-auto font-mono text-xs space-y-1.5 border border-[var(--hairline)]" role="log" aria-live="polite">
            {log.length === 0 ? (
              <p className="text-[var(--muted-soft)] italic text-center py-4">No activity yet</p>
            ) : (
              log.map((entry, i) => (
                <p key={i} className="text-[var(--muted)] leading-relaxed">{entry}</p>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
