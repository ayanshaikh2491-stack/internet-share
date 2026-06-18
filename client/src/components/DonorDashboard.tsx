import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Square, Users, Database, Clock, Globe, Radio, Copy } from 'lucide-react';
import type { ServerMessage } from '../services/tunnel';
import { getTunnel } from '../services/tunnel';
import type { UserProfile } from '../types';

interface DonorDashboardProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onBack: () => void;
}

interface PeerInfo {
  sid: string;
  connectedAt: number;
}

export default function DonorDashboard({ onBack }: DonorDashboardProps) {
  const tunnel = getTunnel();
  const [isSharing, setIsSharing] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomPassword, setRoomPassword] = useState('');
  const [peers, setPeers] = useState<Map<string, PeerInfo>>(new Map());
  const [dataMBUsed, setDataMBUsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fetchRequests, setFetchRequests] = useState<Array<{ url: string; requestId: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

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
          setFetchRequests(prev => [...prev.slice(-19), { url: fetchUrl, requestId }]);

          // Actually fetch the URL the receiver wants to browse
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
              addLog(`Sent ${html.length} bytes for ${fetchUrl}`);
            })
            .catch(err => {
              const errorHtml = `<html><body style="font-family:sans-serif;padding:2rem;background:#1a1a2e;color:#eee"><h1>Error Fetching URL</h1><p>${err.message}</p><p><small>URL: ${fetchUrl}</small></p></body></html>`;
              tunnel?.send('fetch_response', {
                url: fetchUrl,
                html: errorHtml,
                requestId,
                roomCode: msg.roomCode,
              });
              addLog(`Fetch failed: ${fetchUrl} - ${err.message}`);
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

    return () => {
      // Do not clean up shared tunnel
    };
  }, [tunnel, addLog]);

  const resetState = () => {
    setIsSharing(false);
    setRoomCode(null);
    setPeers(new Map());
    setDataMBUsed(0);
    setDuration(0);
  };

  const startSharing = () => {
    if (!tunnel) return;
    setError(null);
    addLog('Creating room...');
    const config: any = {};
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

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-[#7c3aed]/30 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-[#06b6d4]" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl" style={{ fontFamily: "'Orbitron', sans-serif", color: '#7c3aed', letterSpacing: '0.1em' }}>
                DONOR NODE
              </h1>
              <p className="text-xs text-gray-400">Internet Sharing Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {roomCode && (
              <div className="bg-[#7c3aed]/20 border border-[#7c3aed]/40 rounded-lg px-4 py-2 text-center">
                <p className="text-[10px] uppercase tracking-widest text-gray-400">Room Code</p>
                <p className="text-xl tracking-[0.2em] flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Orbitron', sans-serif", color: '#06b6d4' }}>
                  {roomCode}
                  <button onClick={() => navigator.clipboard.writeText(roomCode)}
                    className="p-1 hover:bg-white/10 rounded transition-all" title="Copy code">
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </p>
                {roomPassword && <p className="text-[10px] text-[#ec4899] mt-1">🔒 Password protected</p>}
              </div>
            )}
            <div
              className={`w-3 h-3 rounded-full ${
                isSharing
                  ? 'bg-[#06b6d4] animate-pulse'
                  : 'bg-gray-600'
              }`}
              style={isSharing ? { boxShadow: '0 0 10px #06b6d4' } : {}}
            />
          </div>
        </div>
      </header>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="underline text-xs">Dismiss</button>
          </div>
        )}

        {/* ─── Control + Stats ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Card */}
          <div className="bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-xl p-6">
            <h2 className="text-sm mb-4 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", color: '#7c3aed' }}>
              CONTROL
            </h2>
            {!isSharing ? (
              <div className="space-y-3">
                <input
                  value={roomPassword}
                  onChange={e => setRoomPassword(e.target.value)}
                  placeholder="Room password (optional)"
                  type="password"
                  className="w-full text-center py-3 rounded-xl bg-[#0f0f12] border border-white/10 text-white focus:outline-none focus:border-[#7c3aed] text-sm"
                />
                <button
                  onClick={startSharing}
                  disabled={!tunnel}
                  className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)',
                  }}
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Start Sharing</span>
                </button>
                {!tunnel && (
                  <p className="text-xs text-red-400 mt-3 text-center">Not connected to relay server</p>
                )}
              </div>
            ) : (
              <button
                onClick={stopSharing}
                className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #e11d48)',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                }}
              >
                <Square className="w-5 h-5 fill-white" />
                <span>Stop Sharing</span>
              </button>
            )}
            {!tunnel && (
              <p className="text-xs text-red-400 mt-3 text-center">Not connected to relay server</p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-4">
            <div className="bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-xl p-6">
              <div className="flex items-center gap-2 text-[#06b6d4] mb-3">
                <Users className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  Peers
                </span>
              </div>
              <p className="text-3xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {peers.size}
              </p>
            </div>
            <div className="bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-xl p-6">
              <div className="flex items-center gap-2 text-[#7c3aed] mb-3">
                <Database className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  Data Used
                </span>
              </div>
              <p className="text-3xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {dataMBUsed.toFixed(1)} <span className="text-sm text-gray-400">MB</span>
              </p>
            </div>
            <div className="bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-xl p-6">
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  Duration
                </span>
              </div>
              <p className="text-3xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {formatDuration(duration)}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Peers + Fetch Log ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peers */}
          <div className="bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-xl p-6">
            <h2 className="text-sm mb-4 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", color: '#06b6d4' }}>
              <Users className="w-4 h-4 inline mr-2" />
              CONNECTED PEERS
            </h2>
            {peers.size === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Radio className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Waiting for receivers to join...</p>
                <p className="text-xs text-gray-600 mt-1">Share your room code above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {[...peers.entries()].map(([sid, peer]) => (
                  <div
                    key={sid}
                    className="bg-[#0f0f12] rounded-lg p-3 flex items-center justify-between border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse"
                        style={{ boxShadow: '0 0 6px #06b6d4' }}
                      />
                      <span className="text-sm font-mono text-gray-300">
                        {sid.slice(0, 12)}...
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.floor((Date.now() - peer.connectedAt) / 1000)}s ago
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fetch Requests */}
          <div className="bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-xl p-6">
            <h2 className="text-sm mb-4 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", color: '#06b6d4' }}>
              <Globe className="w-4 h-4 inline mr-2" />
              URL FETCHES
            </h2>
            {fetchRequests.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No URL requests yet</p>
                <p className="text-xs text-gray-600 mt-1">Receivers will request URLs here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {fetchRequests.map((req, i) => (
                  <div
                    key={`${req.requestId}-${i}`}
                    className="bg-[#0f0f12] rounded-lg p-3 border border-white/5"
                  >
                    <p className="text-sm text-[#06b6d4] truncate" title={req.url}>
                      {req.url}
                    </p>
                    <p className="text-xs text-gray-600 font-mono mt-1">
                      {req.requestId.slice(0, 24)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Activity Log ────────────────────────────────────── */}
        <div className="bg-[#1a1a2e] border border-[#7c3aed]/20 rounded-xl p-6">
          <h2 className="text-sm mb-4 tracking-wider text-gray-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            ACTIVITY LOG
          </h2>
          <div className="bg-[#0f0f12] rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs space-y-1 border border-white/5">
            {log.length === 0 ? (
              <p className="text-gray-600 italic">No activity yet. Start sharing to begin.</p>
            ) : (
              log.map((entry, i) => (
                <p key={i} className="text-gray-400 leading-relaxed">
                  {entry}
                </p>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
