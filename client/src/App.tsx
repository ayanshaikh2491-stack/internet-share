import { useState, useEffect, useCallback, useRef } from 'react'
import { TunnelClient } from './services/tunnel'
import type { ConnectionState, ServerMessage } from './services/tunnel'

// ─── Config ────────────────────────────────────────────────────────────────
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001'

// ─── Types ─────────────────────────────────────────────────────────────────
type Mode = 'home' | 'share' | 'receive'

interface AppState {
  mode: Mode
  connectionState: ConnectionState
  roomCode: string | null
  error: string | null
  duration: number
  peerRole: string | null
}

// ─── Animated Background ───────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ state }: { state: ConnectionState }) {
  const config = {
    disconnected: { label: 'Disconnected', color: 'bg-gray-500/80', dot: 'bg-gray-400' },
    connecting: { label: 'Connecting...', color: 'bg-yellow-500/80', dot: 'bg-yellow-400 animate-pulse' },
    connected: { label: 'Connected', color: 'bg-cyan-500/80', dot: 'bg-cyan-400' },
    paired: { label: 'Paired & Active', color: 'bg-emerald-500/80', dot: 'bg-emerald-400 animate-pulse' },
  }
  const { label, color, dot } = config[state]
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${color} text-white/90`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

// ─── Room Code Display ─────────────────────────────────────────────────────
function RoomCodeDisplay({ code }: { code: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
      <div className="relative flex items-center justify-center gap-3 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
        {code.split('').map((char, i) => (
          <span
            key={i}
            className="text-5xl sm:text-6xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Home Screen ───────────────────────────────────────────────────────────
function HomeScreen({ onSelect }: { onSelect: (mode: Mode) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-16">
        <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          Internet Share
        </h1>
        <p className="text-lg text-white/50 max-w-md mx-auto">
          Share your internet connection with anyone, anywhere. No installs needed.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Share Card */}
        <button
          onClick={() => onSelect('share')}
          className="group relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0M12.268 20.182a21.462 21.462 0 01-5.4-3.14m10.262 3.14a21.46 21.46 0 00-5.4-3.14" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Share Internet</h3>
            <p className="text-white/40">Create a room and share your connection</p>
          </div>
        </button>

        {/* Receive Card */}
        <button
          onClick={() => onSelect('receive')}
          className="group relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Get Internet</h3>
            <p className="text-white/40">Join a room to use shared internet</p>
          </div>
        </button>
      </div>
    </div>
  )
}

// ─── Share Screen ──────────────────────────────────────────────────────────
function ShareScreen({
  tunnel,
  state,
  onBack,
}: {
  tunnel: TunnelClient
  state: AppState
  onBack: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCreate = useCallback(() => {
    tunnel.createRoom()
  }, [tunnel])

  const handleCopy = useCallback(() => {
    if (state.roomCode) {
      navigator.clipboard.writeText(state.roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [state.roomCode])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className="text-center mb-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0M12.268 20.182a21.462 21.462 0 01-5.4-3.14m10.262 3.14a21.46 21.46 0 00-5.4-3.14" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">Share Your Internet</h2>
        <p className="text-white/40">Create a room and share the code</p>
      </div>

      <StatusBadge state={state.connectionState} />

      {!state.roomCode ? (
        <button
          onClick={handleCreate}
          className="mt-8 px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-lg hover:from-cyan-400 hover:to-blue-400 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/25 active:scale-[0.98]"
        >
          Create Room
        </button>
      ) : (
        <div className="w-full max-w-md mt-8 space-y-6">
          <div className="text-center">
            <p className="text-sm text-white/40 mb-3 uppercase tracking-wider">Share this code</p>
            <RoomCodeDisplay code={state.roomCode} />
          </div>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white/70 hover:text-white"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy Code
              </>
            )}
          </button>

          {state.connectionState === 'paired' && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-emerald-400 font-medium">Someone connected to your room!</p>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Receive Screen ────────────────────────────────────────────────────────
function ReceiveScreen({
  tunnel,
  state,
  onBack,
}: {
  tunnel: TunnelClient
  state: AppState
  onBack: () => void
}) {
  const [code, setCode] = useState('')

  const handleJoin = useCallback(() => {
    if (code.trim().length >= 4) {
      tunnel.joinRoom(code.trim().toUpperCase())
    }
  }, [tunnel, code])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className="text-center mb-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold mb-2">Get Internet</h2>
        <p className="text-white/40">Enter the room code to connect</p>
      </div>

      <StatusBadge state={state.connectionState} />

      <div className="w-full max-w-sm mt-8 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
            placeholder="ABCD"
            maxLength={4}
            className="w-full text-center text-4xl font-bold tracking-[0.5em] py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={code.length < 4}
          className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:from-purple-400 hover:to-pink-400 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/25 active:scale-[0.98]"
        >
          Connect
        </button>

        {state.error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-red-400 text-sm">{state.error}</p>
          </div>
        )}

        {state.connectionState === 'paired' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-emerald-400 font-medium">Connected! Internet is being relayed.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────
function App() {
  const [state, setState] = useState<AppState>({
    mode: 'home',
    connectionState: 'disconnected',
    roomCode: null,
    error: null,
    duration: 0,
    peerRole: null,
  })

  const tunnelRef = useRef<TunnelClient | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize tunnel
  useEffect(() => {
    const tunnel = new TunnelClient(SERVER_URL, {
      onMessage: (msg: ServerMessage) => {
        setState((prev) => {
          switch (msg.type) {
            case 'room_created':
              return { ...prev, roomCode: msg.roomCode, connectionState: 'connected' }
            case 'room_joined':
              return { ...prev, roomCode: msg.roomCode, connectionState: 'connected' }
            case 'peer_connected':
              if (timerRef.current) clearInterval(timerRef.current)
              timerRef.current = setInterval(() => {
                setState((s) => ({ ...s, duration: s.duration + 1 }))
              }, 1000)
              return { ...prev, connectionState: 'paired', peerRole: msg.role, error: null }
            case 'peer_disconnected':
              if (timerRef.current) clearInterval(timerRef.current)
              return { ...prev, connectionState: 'connected', peerRole: null }
            case 'room_left':
              if (timerRef.current) clearInterval(timerRef.current)
              return { ...prev, connectionState: 'disconnected', roomCode: null, peerRole: null }
            case 'error':
              return { ...prev, error: msg.reason }
            default:
              return prev
          }
        })
      },
      onStateChange: (connState: ConnectionState) => {
        setState((prev) => ({ ...prev, connectionState: connState }))
      },
    })

    tunnelRef.current = tunnel
    tunnel.connect()

    // Heartbeat
    const pingInterval = setInterval(() => {
      if (tunnel.getState() !== 'disconnected') {
        tunnel.ping()
      }
    }, 30000)

    return () => {
      tunnel.disconnect()
      clearInterval(pingInterval)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleModeSelect = useCallback((mode: Mode) => {
    setState((prev) => ({ ...prev, mode, error: null, roomCode: null, duration: 0 }))
  }, [])

  const handleBack = useCallback(() => {
    tunnelRef.current?.leaveRoom()
    setState((prev) => ({
      ...prev,
      mode: 'home',
      roomCode: null,
      error: null,
      duration: 0,
      peerRole: null,
    }))
  }, [])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Duration timer */}
        {state.duration > 0 && (
          <div className="fixed top-6 right-6 z-20 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            <span className="text-sm font-mono text-white/60">{formatDuration(state.duration)}</span>
          </div>
        )}

        {state.mode === 'home' && <HomeScreen onSelect={handleModeSelect} />}
        {state.mode === 'share' && tunnelRef.current && (
          <ShareScreen tunnel={tunnelRef.current} state={state} onBack={handleBack} />
        )}
        {state.mode === 'receive' && tunnelRef.current && (
          <ReceiveScreen tunnel={tunnelRef.current} state={state} onBack={handleBack} />
        )}
      </div>
    </div>
  )
}

export default App
