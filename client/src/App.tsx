import { useState, useEffect, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import { TunnelClient } from './services/tunnel'
import type { ConnectionState, ServerMessage, RoomConfig, RoomUpdate } from './services/tunnel'

// ─── Config ────────────────────────────────────────────────────────────────
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001'

// ─── Types ─────────────────────────────────────────────────────────────────
type Mode = 'home' | 'share' | 'receive'

interface AppState {
  mode: Mode
  connectionState: ConnectionState
  roomCode: string | null
  roomConfig: RoomConfig
  roomUpdate: RoomUpdate | null
  error: string | null
  duration: number
  peerRole: string | null
}

// ─── Design Tokens (from DESIGN.md) ────────────────────────────────────────
const tokens = {
  canvas: '#0f0f12',
  canvasElevated: '#18181b',
  surfaceDark: '#1c1c1f',
  surfaceHover: '#222225',
  hairline: '#27272a',
  primary: '#7c3aed',
  primaryHover: '#8b5cf6',
  accentCyan: '#06b6d4',
  accentGreen: '#10b981',
  accentPink: '#ec4899',
  accentRed: '#ef4444',
  accentAmber: '#f59e0b',
  ink: '#fafafa',
  body: '#a1a1aa',
  muted: '#71717a',
  mutedSoft: '#52525b',
  primaryGlow: 'rgba(124,58,237,0.3)',
  cyanGlow: 'rgba(6,182,212,0.3)',
  greenGlow: 'rgba(16,185,129,0.25)',
}

// ─── Helper Components ─────────────────────────────────────────────────────

function IconArrowLeft() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function IconWifi() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0M12.268 20.182a21.462 21.462 0 01-5.4-3.14m10.262 3.14a21.46 21.46 0 00-5.4-3.14" />
    </svg>
  )
}

function IconDownload() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function IconData() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ─── Animated Background ───────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400/30 rounded-full shadow-[0_0_60px_30px_rgba(124,58,237,0.15)]" />
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ state }: { state: ConnectionState }) {
  const config = {
    disconnected: { label: 'OFFLINE', color: `bg-[#27272a] text-[#52525b]`, dot: 'bg-[#52525b]' },
    connecting: { label: 'CONNECTING', color: `bg-[#27272a] text-[#a1a1aa]`, dot: `bg-cyan-400 animate-pulse` },
    connected: { label: 'LOBBY', color: `bg-purple-500/10 text-purple-400`, dot: `bg-purple-400` },
    paired: { label: 'ACTIVE', color: `bg-emerald-500/10 text-emerald-400`, dot: `bg-emerald-400 animate-pulse` },
  }
  const { label, color, dot } = config[state]
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[1px] uppercase ${color}`}>
      <span className={`w-[6px] h-[6px] rounded-full ${dot}`} />
      {label}
    </span>
  )
}

// ─── Room Code Display ─────────────────────────────────────────────────────
function RoomCodeDisplay({ code }: { code: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
      <div className="relative flex items-center justify-center gap-2 sm:gap-3 p-6 sm:p-8 bg-[#18181b] border border-[#27272a] rounded-2xl">
        {code.split('').map((char, i) => (
          <span
            key={i}
            className="font-['JetBrains_Mono'] text-4xl sm:text-5xl font-bold text-purple-300"
            style={{
              textShadow: `0 0 20px rgba(124,58,237,0.3)`,
              animation: `slideUp 300ms ease ${i * 80}ms both`,
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── QR Code ───────────────────────────────────────────────────────────────
function QRCodeDisplay({ code, url }: { code: string; url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: { dark: '#7c3aed', light: '#00000000' },
    }).then(setDataUrl)
  }, [url])

  if (!dataUrl) return null

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
        <img src={dataUrl} alt={`QR: ${code}`} className="w-32 h-32 sm:w-36 sm:h-36" />
      </div>
      <p className="text-[11px] text-[#52525b] tracking-[1px] uppercase">Scan to join</p>
    </div>
  )
}

// ─── Share Button ──────────────────────────────────────────────────────────
function ShareButton({ code, url }: { code: string; url: string }) {
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Internet Share', text: `Join my room ${code}`, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }, [code, url])

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#222225] hover:bg-[#27272a] border border-[#27272a] transition-all text-[#a1a1aa] hover:text-[#fafafa] text-[13px] font-medium"
    >
      <IconShare />
      <span>Share Link</span>
    </button>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Room Settings Modal ───────────────────────────────────────────────────
function RoomSettingsModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (settings: RoomConfig) => void
}) {
  const [password, setPassword] = useState('')
  const [maxDataMB, setMaxDataMB] = useState('')
  const [maxTimeMinutes, setMaxTimeMinutes] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [hasDataLimit, setHasDataLimit] = useState(false)
  const [hasTimeLimit, setHasTimeLimit] = useState(false)

  useEffect(() => {
    if (!open) {
      setPassword('')
      setMaxDataMB('')
      setMaxTimeMinutes('')
      setHasPassword(false)
      setHasDataLimit(false)
      setHasTimeLimit(false)
    }
  }, [open])

  const handleConfirm = () => {
    onConfirm({
      password: hasPassword && password ? password : null,
      maxDataMB: hasDataLimit && maxDataMB ? parseFloat(maxDataMB) : null,
      maxTimeMinutes: hasTimeLimit && maxTimeMinutes ? parseInt(maxTimeMinutes) : null,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[20px] font-semibold text-[#fafafa] mb-1">Room Settings</h2>
        <p className="text-[13px] text-[#71717a] mb-6">Customize your room before creating</p>

        {/* Password */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={hasPassword}
              onChange={(e) => setHasPassword(e.target.checked)}
              className="w-4 h-4 rounded border-[#27272a] bg-[#1c1c1f] text-purple-500 focus:ring-purple-500/20"
            />
            <span className="text-[13px] font-medium text-[#e4e4e7]">Password protect</span>
          </label>
          {hasPassword && (
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-xl text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all"
            />
          )}
        </div>

        {/* Data Limit */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={hasDataLimit}
              onChange={(e) => setHasDataLimit(e.target.checked)}
              className="w-4 h-4 rounded border-[#27272a] bg-[#1c1c1f] text-purple-500 focus:ring-purple-500/20"
            />
            <span className="text-[13px] font-medium text-[#e4e4e7]">Data limit</span>
          </label>
          {hasDataLimit && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxDataMB}
                onChange={(e) => setMaxDataMB(e.target.value)}
                placeholder="100"
                min={1}
                className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-xl text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all"
              />
              <span className="text-[13px] text-[#71717a] whitespace-nowrap">MB</span>
            </div>
          )}
        </div>

        {/* Time Limit */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={hasTimeLimit}
              onChange={(e) => setHasTimeLimit(e.target.checked)}
              className="w-4 h-4 rounded border-[#27272a] bg-[#1c1c1f] text-purple-500 focus:ring-purple-500/20"
            />
            <span className="text-[13px] font-medium text-[#e4e4e7]">Time limit</span>
          </label>
          {hasTimeLimit && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxTimeMinutes}
                onChange={(e) => setMaxTimeMinutes(e.target.value)}
                placeholder="30"
                min={1}
                className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-xl text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all"
              />
              <span className="text-[13px] text-[#71717a] whitespace-nowrap">minutes</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#1c1c1f] hover:bg-[#222225] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-all text-[13px] font-semibold tracking-[0.5px] uppercase"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all text-[13px] font-semibold tracking-[0.5px] uppercase shadow-[0_0_20px_rgba(124,58,237,0.15)]"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Home Screen ───────────────────────────────────────────────────────────
function HomeScreen({ onSelect }: { onSelect: (mode: Mode) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-12 h-1 bg-purple-500/30 rounded-full" />
          <span className="text-[11px] text-[#52525b] tracking-[2px] font-semibold uppercase">P2P Relay</span>
          <div className="w-12 h-1 bg-purple-500/30 rounded-full" />
        </div>
        <h1 className="font-['Orbitron'] text-4xl sm:text-5xl font-bold text-[#fafafa] tracking-[2px] uppercase mb-3">
          Share<span className="text-purple-400">Net</span>
        </h1>
        <p className="text-[14px] text-[#71717a] max-w-xs mx-auto">
          Share your internet with anyone. Create a room, share the code, connect.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {/* Share Card */}
        <button
          onClick={() => onSelect('share')}
          className="group relative overflow-hidden p-8 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-purple-500/30 transition-all duration-250 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <div className="text-purple-400"><IconWifi /></div>
            </div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">Share</h3>
            <p className="text-[12px] text-[#71717a]">Create a room, get a code</p>
          </div>
        </button>

        {/* Receive Card */}
        <button
          onClick={() => onSelect('receive')}
          className="group relative overflow-hidden p-8 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-pink-500/30 transition-all duration-250 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <div className="text-pink-400"><IconDownload /></div>
            </div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">Join</h3>
            <p className="text-[12px] text-[#71717a]">Enter a code, get internet</p>
          </div>
        </button>
      </div>

      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#18181b] border border-[#27272a]">
          <span className="w-[6px] h-[6px] rounded-full animate-pulse" style={{ backgroundColor: tokens.primary, boxShadow: `0 0 8px ${tokens.primary}` }} />
          <span className="text-[11px] text-[#52525b] tracking-[1px] uppercase font-semibold">End-to-end encrypted relay</span>
        </div>
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
  const [showSettings, setShowSettings] = useState(true)

  const shareUrl = state.roomCode
    ? `${window.location.origin}${window.location.pathname}?join=${state.roomCode}`
    : ''

  const handleCreateWithSettings = useCallback(
    (settings: RoomConfig) => {
      tunnel.createRoom(settings)
      setShowSettings(false)
    },
    [tunnel]
  )

  const handleCreateSimple = useCallback(() => {
    tunnel.createRoom()
    setShowSettings(false)
  }, [tunnel])

  const handleCopy = useCallback(() => {
    if (state.roomCode) {
      navigator.clipboard.writeText(state.roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [state.roomCode])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-xl bg-[#18181b] hover:bg-[#222225] border border-[#27272a] transition-colors text-[#71717a] hover:text-[#fafafa]"
      >
        <IconArrowLeft />
      </button>

      {/* Show settings modal when not yet created */}
      <RoomSettingsModal
        open={showSettings && !state.roomCode}
        onClose={() => setShowSettings(false)}
        onConfirm={handleCreateWithSettings}
      />

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <div className="text-purple-400"><IconWifi /></div>
        </div>
        <h2 className="font-['Orbitron'] text-[24px] font-semibold text-[#fafafa] tracking-[1px] mb-1">
          Share
        </h2>
        <p className="text-[13px] text-[#71717a]">Create a room and share the code</p>
      </div>

      <StatusBadge state={state.connectionState} />

      {/* Room config summary */}
      {state.roomConfig && state.roomCode && (
        <div className="flex gap-3 mt-4">
          {state.roomConfig.password && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-semibold tracking-[0.5px]">
              <IconLock /> Password
            </span>
          )}
          {state.roomConfig.maxDataMB && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-semibold tracking-[0.5px]">
              <IconData /> {state.roomConfig.maxDataMB}MB
            </span>
          )}
          {state.roomConfig.maxTimeMinutes && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold tracking-[0.5px]">
              <IconClock /> {state.roomConfig.maxTimeMinutes}min
            </span>
          )}
        </div>
      )}

      {!state.roomCode ? (
        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={handleCreateSimple}
            className="px-12 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[14px] tracking-[1px] uppercase transition-all hover:shadow-[0_0_25px_rgba(124,58,237,0.25)] active:scale-[0.98]"
          >
            Quick Create
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-8 py-3 rounded-xl bg-[#222225] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-[12px] font-semibold tracking-[0.5px] uppercase transition-all"
          >
            Custom Setup
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md mt-6 space-y-5">
          <div className="text-center">
            <p className="text-[11px] text-[#52525b] mb-3 tracking-[2px] uppercase font-semibold">Room Code</p>
            <RoomCodeDisplay code={state.roomCode} />
          </div>

          <div className="flex flex-col items-center gap-4">
            <QRCodeDisplay code={state.roomCode} url={shareUrl} />
            <ShareButton code={state.roomCode} url={shareUrl} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#222225] hover:bg-[#27272a] border border-[#27272a] transition-colors text-[#a1a1aa] hover:text-[#fafafa] text-[13px] font-medium"
            >
              {copied ? <span className="text-emerald-400 flex items-center gap-2"><IconCheck /> Copied!</span> : <span className="flex items-center gap-2"><IconCopy /> Copy Code</span>}
            </button>

            <button
              onClick={onBack}
              className="px-5 py-3 rounded-xl text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#222225] transition-all border border-transparent hover:border-[#27272a] text-[13px] font-medium"
            >
              Leave
            </button>
          </div>

          {/* Room stats */}
          {state.connectionState === 'paired' && state.roomUpdate && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                <p className="text-emerald-400 text-[13px] font-semibold tracking-[0.5px]">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
                  Someone connected!
                </p>
                <p className="text-emerald-400/50 text-[12px] mt-1">Data is being relayed</p>
              </div>
              <RoomStatsPanel update={state.roomUpdate} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Room Stats Panel ──────────────────────────────────────────────────────
function RoomStatsPanel({ update }: { update: RoomUpdate }) {
  const dataPct = update.maxDataMB
    ? Math.min(100, Math.round((update.dataMBUsed / update.maxDataMB) * 100))
    : 0
  const timePct = update.maxTimeMinutes
    ? Math.min(100, Math.round((update.duration / (update.maxTimeMinutes * 60)) * 100))
    : 0

  const isNearDataLimit = update.maxDataMB && dataPct >= 80
  const isNearTimeLimit = update.maxTimeMinutes && timePct >= 80

  return (
    <div className="p-4 rounded-xl bg-[#18181b] border border-[#27272a] space-y-3">
      <p className="text-[11px] text-[#52525b] tracking-[1px] uppercase font-semibold">Session Stats</p>

      {/* Data Used */}
      <div>
        <div className="flex justify-between text-[12px] mb-1">
          <span className="text-[#a1a1aa]">Data</span>
          <span className={`${isNearDataLimit ? 'text-amber-400' : 'text-[#e4e4e7]'} font-mono`}>
            {update.dataMBUsed.toFixed(2)} MB
            {update.maxDataMB ? ` / ${update.maxDataMB} MB` : ''}
          </span>
        </div>
        {update.maxDataMB && (
          <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isNearDataLimit ? 'bg-amber-500' : 'bg-purple-500'}`}
              style={{ width: `${dataPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Duration */}
      <div>
        <div className="flex justify-between text-[12px] mb-1">
          <span className="text-[#a1a1aa]">Time</span>
          <span className={`${isNearTimeLimit ? 'text-amber-400' : 'text-[#e4e4e7]'} font-mono`}>
            {formatDuration(update.duration)}
            {update.maxTimeMinutes ? ` / ${update.maxTimeMinutes}:00` : ''}
          </span>
        </div>
        {update.maxTimeMinutes && (
          <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isNearTimeLimit ? 'bg-amber-500' : 'bg-cyan-500'}`}
              style={{ width: `${timePct}%` }}
            />
          </div>
        )}
      </div>
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
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Auto-fill room code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinCode = params.get('join')
    if (joinCode && joinCode.length >= 4) {
      const c = joinCode.toUpperCase().slice(0, 4)
      setCode(c)
      setTimeout(() => tunnel.joinRoom(c), 500)
    }
  }, [tunnel])

  const handleJoin = useCallback(() => {
    if (code.trim().length >= 4) {
      tunnel.joinRoom(code.trim().toUpperCase(), password || undefined)
    }
  }, [tunnel, code, password])

  // Detect when server asks for password
  useEffect(() => {
    // This is handled by the main App error handler which sets error
    // We check if the last error is 'Password required'
    if (state.error === 'Password required') {
      setShowPassword(true)
    }
  }, [state.error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-xl bg-[#18181b] hover:bg-[#222225] border border-[#27272a] transition-colors text-[#71717a] hover:text-[#fafafa]"
      >
        <IconArrowLeft />
      </button>

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <div className="text-pink-400"><IconDownload /></div>
        </div>
        <h2 className="font-['Orbitron'] text-[24px] font-semibold text-[#fafafa] tracking-[1px] mb-1">
          Join
        </h2>
        <p className="text-[13px] text-[#71717a]">Enter the room code to connect</p>
      </div>

      <StatusBadge state={state.connectionState} />

      <div className="w-full max-w-sm mt-8 space-y-4">
        {/* Room Code Input */}
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
            placeholder="ABCD"
            maxLength={4}
            className="w-full text-center font-['JetBrains_Mono'] text-4xl font-bold tracking-[12px] py-5 bg-[#1c1c1f] border border-[#27272a] rounded-2xl text-[#fafafa] placeholder:text-[#333336] focus:outline-none focus:border-purple-500 focus:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {/* Password input (shown when room has password) */}
        {showPassword && (
          <div>
            <label className="text-[11px] text-[#71717a] tracking-[1px] uppercase font-semibold mb-2 block">
              This room is password protected
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-xl text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>
        )}

        {/* Room Config Info */}
        {state.roomConfig && state.connectionState !== 'paired' && (
          <div className="flex flex-wrap gap-2 justify-center">
            {state.roomConfig.password && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-semibold">
                <IconLock /> Password
              </span>
            )}
            {state.roomConfig.maxDataMB && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-semibold">
                <IconData /> {state.roomConfig.maxDataMB}MB limit
              </span>
            )}
            {state.roomConfig.maxTimeMinutes && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold">
                <IconClock /> {state.roomConfig.maxTimeMinutes}min limit
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={code.length < 4}
          className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-[14px] tracking-[1px] uppercase disabled:opacity-20 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 transition-all hover:shadow-[0_0_25px_rgba(124,58,237,0.2)] active:scale-[0.98]"
        >
          Connect
        </button>

        {state.error && (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-center">
            <p className="text-red-400 text-[13px]">{state.error}</p>
          </div>
        )}

        {state.connectionState === 'paired' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
              <p className="text-emerald-400 text-[13px] font-semibold tracking-[0.5px]">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
                Connected! Internet is being relayed.
              </p>
            </div>
            {state.roomUpdate && <RoomStatsPanel update={state.roomUpdate} />}
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
    roomConfig: {},
    roomUpdate: null,
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
              return {
                ...prev,
                roomCode: msg.roomCode,
                roomConfig: msg.config || {},
                connectionState: 'connected',
                error: null,
              }
            case 'room_joined':
              return {
                ...prev,
                roomCode: msg.roomCode,
                roomConfig: msg.config || {},
                connectionState: 'connected',
                error: null,
              }
            case 'peer_connected':
              if (timerRef.current) clearInterval(timerRef.current)
              timerRef.current = setInterval(() => {
                setState((s) => ({ ...s, duration: s.duration + 1 }))
              }, 1000)
              return {
                ...prev,
                connectionState: 'paired',
                peerRole: msg.role,
                roomConfig: {
                  ...prev.roomConfig,
                  maxDataMB: msg.maxDataMB ?? prev.roomConfig.maxDataMB,
                  maxTimeMinutes: msg.maxTimeMinutes ?? prev.roomConfig.maxTimeMinutes,
                },
                error: null,
              }
            case 'room_update':
              return { ...prev, roomUpdate: msg as unknown as RoomUpdate }
            case 'peer_disconnected':
              if (timerRef.current) clearInterval(timerRef.current)
              return { ...prev, connectionState: 'connected', peerRole: null, roomUpdate: null }
            case 'room_left':
              if (timerRef.current) clearInterval(timerRef.current)
              return {
                ...prev,
                connectionState: 'disconnected',
                roomCode: null,
                roomConfig: {},
                roomUpdate: null,
                peerRole: null,
                duration: 0,
              }
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
    setState((prev) => ({
      ...prev,
      mode,
      error: null,
      roomCode: null,
      roomConfig: {},
      roomUpdate: null,
      duration: 0,
    }))
  }, [])

  const handleBack = useCallback(() => {
    tunnelRef.current?.leaveRoom()
    setState((prev) => ({
      ...prev,
      mode: 'home',
      roomCode: null,
      roomConfig: {},
      roomUpdate: null,
      error: null,
      duration: 0,
      peerRole: null,
    }))
  }, [])

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: tokens.canvas }}>
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Status header */}
        {state.connectionState !== 'disconnected' && (
          <div className="fixed top-4 right-4 z-20 flex items-center gap-3">
            <StatusBadge state={state.connectionState} />
            {state.duration > 0 && (
              <span className="font-['JetBrains_Mono'] text-[12px] text-[#52525b] px-3 py-1.5 rounded-full bg-[#18181b] border border-[#27272a]">
                {formatDuration(state.duration)}
              </span>
            )}
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
