import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Square, Globe, ExternalLink } from 'lucide-react';
import type { ServerMessage } from '../services/tunnel';
import { getTunnel } from '../services/tunnel';

interface ReceiverJoinProps {
  onBack: () => void;
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
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev.slice(-19), msg]);
  }, []);

  // Handle incoming messages
  useEffect(() => {
    if (!tunnel || step !== 'browse') return;

    const handler = (msg: ServerMessage) => {
      if (msg.type === 'fetch_response') {
        setIframeHtml(msg.html || '<p>No content received</p>');
        const bytes = new Blob([msg.html || '']).size;
        setDataUsed(prev => prev + bytes);
        addLog(`Received ${(bytes / 1024).toFixed(1)}KB from ${msg.url}`);
      }
      if (msg.type === 'room_update') {
        setDataUsed(prev => Math.max(prev, (msg.dataMBUsed || 0) * 1024 * 1024));
      }
      if (msg.type === 'error') {
        setError(msg.reason || 'Error');
        addLog(`Error: ${msg.reason}`);
      }
      if (msg.type === 'owner_disconnected') {
        setError('Donor disconnected');
        setStep('code');
        addLog('Donor disconnected');
      }
      if (msg.type === 'room_left') {
        setStep('code');
        addLog('Left room');
      }
    };

    tunnel.onMessage = handler;
    return () => {};
  }, [tunnel, step]);

  const joinRoom = () => {
    if (!tunnel || !roomCode.trim()) return;
    setLoading(true);
    setError(null);
    addLog(`Joining room ${roomCode.toUpperCase()}...`);
    
    tunnel.onMessage = (msg: ServerMessage) => {
      if (msg.type === 'room_joined') {
        addLog(`Joined room ${roomCode.toUpperCase()}!`);
        setStep('browse');
        setLoading(false);
      } else if (msg.type === 'error') {
        setError(msg.reason || 'Failed to join');
        setLoading(false);
        addLog(`Error: ${msg.reason}`);
      }
    };
    
    tunnel.joinRoom(roomCode, password || undefined);
  };

  const fetchUrl = () => {
    if (!tunnel || !url.trim()) return;
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    setUrl(cleanUrl);
    setIframeHtml(null);
    addLog(`Requesting: ${cleanUrl}`);
    tunnel.send('fetch_url', { url: cleanUrl, roomCode: roomCode.toUpperCase() });
  };

  const disconnect = () => {
    tunnel?.leaveRoom();
    setStep('code');
    setIframeHtml(null);
    setDataUsed(0);
    addLog('Disconnected');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── Header ─── */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-[#ec4899]/30 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10">
              <ArrowLeft className="w-5 h-5 text-[#ec4899]" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl" style={{ fontFamily: "'Orbitron', sans-serif", color: '#ec4899', letterSpacing: '0.1em' }}>
                RECEIVER
              </h1>
              <p className="text-xs text-gray-400">Browse using shared internet</p>
            </div>
          </div>
          {step === 'browse' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{formatBytes(dataUsed)} used</span>
              <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" style={{ boxShadow: '0 0 6px #06b6d4' }} />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-6 flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="underline text-xs">Dismiss</button>
          </div>
        )}

        {step === 'code' ? (
          /* ─── Room Code Input ─── */
          <div className="max-w-md mx-auto mt-16">
            <div className="bg-[#1a1a2e] border border-[#ec4899]/20 rounded-2xl p-8 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-[#ec4899]" />
              <h2 className="text-xl mb-2" style={{ fontFamily: "'Orbitron', sans-serif", color: '#ec4899' }}>
                JOIN A ROOM
              </h2>
              <p className="text-sm text-gray-400 mb-8">Enter the room code from your donor</p>

              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="X7K9"
                maxLength={4}
                className="w-full text-center text-3xl tracking-[0.3em] py-4 rounded-xl bg-[#0f0f12] border border-[#ec4899]/30 text-white focus:outline-none focus:border-[#ec4899] mb-4"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              />

              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password (optional)"
                type="password"
                className="w-full text-center py-3 rounded-xl bg-[#0f0f12] border border-white/10 text-white focus:outline-none focus:border-[#ec4899] mb-6 text-sm"
              />

              <button
                onClick={joinRoom}
                disabled={loading || !roomCode.trim()}
                className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
                  boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)',
                }}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                <span>{loading ? 'Joining...' : 'Join Room'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ─── Browse Mode ─── */
          <div className="space-y-4">
            {/* URL Bar */}
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-3 bg-[#1a1a2e] border border-[#ec4899]/20 rounded-xl px-4 py-3">
                <Globe className="w-5 h-5 text-[#ec4899] shrink-0" />
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchUrl()}
                  placeholder="Enter URL to browse (e.g., google.com)"
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                />
                <button onClick={fetchUrl} disabled={!url.trim()}
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: '#ec4899' }}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <button onClick={disconnect}
                className="px-4 py-3 rounded-xl text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            {iframeHtml ? (
              <div className="bg-white rounded-xl overflow-hidden border border-[#ec4899]/20" style={{ height: 'calc(100vh - 280px)' }}>
                <iframe
                  srcDoc={iframeHtml}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  title="Browsed content"
                />
              </div>
            ) : (
              <div className="bg-[#1a1a2e] border border-[#ec4899]/20 rounded-xl p-12 text-center" style={{ height: 'calc(100vh - 280px)' }}>
                <Globe className="w-16 h-16 mx-auto mb-4 text-[#ec4899] opacity-50" />
                <h3 className="text-lg mb-2" style={{ fontFamily: "'Orbitron', sans-serif", color: '#ec4899' }}>
                  INTERNET SHARED
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Connected to donor. Enter a URL above to start browsing!
                </p>
                <p className="text-xs text-gray-600">
                  Room: <span className="text-[#06b6d4] font-mono">{roomCode}</span>
                </p>
              </div>
            )}

            {/* Activity Log */}
            {log.length > 0 && (
              <div className="bg-[#1a1a2e] border border-white/5 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Activity</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {log.map((entry, i) => (
                    <p key={i} className="text-xs text-gray-400 font-mono">{entry}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
