import { useState, useEffect, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import { TunnelClient } from './services/tunnel'
import type { ConnectionState, ServerMessage, RoomConfig, RoomUpdate } from './services/tunnel'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001'

type Mode = 'home' | 'create' | 'join'

interface AppState {
  mode: Mode
  connectionState: ConnectionState
  roomCode: string | null
  roomConfig: RoomConfig
  roomUpdate: RoomUpdate | null
  error: string | null
  duration: number
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icons = {
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  Wifi: () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0M12.268 20.182a21.462 21.462 0 01-5.4-3.14m10.262 3.14a21.46 21.46 0 00-5.4-3.14" />
    </svg>
  ),
  Key: () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  Data: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Share: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  ),
}

// ─── Background ─────────────────────────────────────────────────────────────
function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full shadow-[0_0_60px_30px_rgba(124,58,237,0.12)]" />
    </div>
  )
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ state }: { state: ConnectionState }) {
  const cfg = {
    disconnected: { label: 'OFFLINE', cls: 'bg-[#27272a] text-[#52525b]', dot: 'bg-[#52525b]' },
    connecting: { label: 'CONNECTING', cls: 'bg-[#27272a] text-[#a1a1aa]', dot: 'bg-cyan-400 animate-pulse' },
    connected: { label: 'IN LOBBY', cls: 'bg-purple-500/10 text-purple-400', dot: 'bg-purple-400' },
    paired: { label: 'CONNECTED', cls: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
  }
  const { label, cls, dot } = cfg[state]
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[1px] uppercase ${cls}`}>
      <span className={`w-[6px] h-[6px] rounded-full ${dot}`} />
      {label}
    </span>
  )
}

// ─── Room Code ──────────────────────────────────────────────────────────────
function RoomCode({ code }: { code: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-purple-500/8 rounded-2xl blur-2xl" />
      <div className="relative flex items-center justify-center gap-2 sm:gap-3 px-8 py-6 sm:px-10 sm:py-7 rounded-2xl border border-[#27272a] bg-[#18181b] shadow-[0_0_30px_rgba(124,58,237,0.08)]">
        {code.split('').map((ch, i) => (
          <span
            key={i}
            className="font-['JetBrains_Mono'] text-4xl sm:text-5xl font-bold text-purple-300"
            style={{
              textShadow: '0 0 20px rgba(124,58,237,0.3)',
              animation: `slideUp 300ms ease ${i * 80}ms both`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── QR ─────────────────────────────────────────────────────────────────────
function QRPanel({ code, url }: { code: string; url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    QRCode.toDataURL(url, { width: 240, margin: 2, color: { dark: '#7c3aed', light: '#00000000' } }).then(setDataUrl)
  }, [url])
  if (!dataUrl) return null
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a]">
        <img src={dataUrl} alt={`QR:${code}`} className="w-28 h-28 sm:w-32 sm:h-32" />
      </div>
      <p className="text-[10px] text-[#52525b] tracking-[1px] uppercase font-semibold">Scan to join</p>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDur(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Settings Modal ─────────────────────────────────────────────────────────
function SettingsModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (s: RoomConfig) => void }) {
  const [pw, setPw] = useState('')
  const [dataMb, setDataMb] = useState('')
  const [timeMin, setTimeMin] = useState('')
  const [hasPw, setHasPw] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [hasTime, setHasTime] = useState(false)

  useEffect(() => {
    if (!open) { setPw(''); setDataMb(''); setTimeMin(''); setHasPw(false); setHasData(false); setHasTime(false) }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-[24px] p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
        <h2 className="font-['Orbitron'] text-[18px] font-semibold text-[#fafafa] tracking-[0.5px] mb-1">Room Setup</h2>
        <p className="text-[12px] text-[#71717a] mb-6">Customise your room before creating</p>

        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasPw} onChange={e => setHasPw(e.target.checked)} className="accent-purple-500 w-4 h-4 rounded border-[#27272a] bg-[#1c1c1f]" />
            <span className="text-[13px] font-medium text-[#e4e4e7]">Password protect</span>
          </label>
          {hasPw && (
            <input type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter room password"
              className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-[12px] text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 transition-all" />
          )}
        </div>

        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasData} onChange={e => setHasData(e.target.checked)} className="accent-purple-500 w-4 h-4 rounded border-[#27272a] bg-[#1c1c1f]" />
            <span className="text-[13px] font-medium text-[#e4e4e7]">Data limit</span>
          </label>
          {hasData && (
            <div className="flex items-center gap-2">
              <input type="number" value={dataMb} onChange={e => setDataMb(e.target.value)} placeholder="100" min={1}
                className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-[12px] text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 transition-all" />
              <span className="text-[12px] text-[#71717a]">MB</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasTime} onChange={e => setHasTime(e.target.checked)} className="accent-purple-500 w-4 h-4 rounded border-[#27272a] bg-[#1c1c1f]" />
            <span className="text-[13px] font-medium text-[#e4e4e7]">Time limit</span>
          </label>
          {hasTime && (
            <div className="flex items-center gap-2">
              <input type="number" value={timeMin} onChange={e => setTimeMin(e.target.value)} placeholder="30" min={1}
                className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-[12px] text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 transition-all" />
              <span className="text-[12px] text-[#71717a]">min</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-[12px] bg-[#1c1c1f] hover:bg-[#222225] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] transition-all text-[12px] font-semibold tracking-[0.5px] uppercase">Cancel</button>
          <button onClick={() => onConfirm({ password: hasPw && pw ? pw : null, maxDataMB: hasData && dataMb ? parseFloat(dataMb) : null, maxTimeMinutes: hasTime && timeMin ? parseInt(timeMin) : null })}
            className="flex-1 py-3 rounded-[12px] bg-purple-600 hover:bg-purple-500 text-white transition-all text-[12px] font-semibold tracking-[0.5px] uppercase shadow-[0_0_20px_rgba(124,58,237,0.15)]">Create Room</button>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Panel ────────────────────────────────────────────────────────────
function StatsPanel({ update }: { update: RoomUpdate }) {
  const dp = update.maxDataMB ? Math.min(100, Math.round((update.dataMBUsed / update.maxDataMB) * 100)) : -1
  const tp = update.maxTimeMinutes ? Math.min(100, Math.round((update.duration / (update.maxTimeMinutes * 60)) * 100)) : -1
  return (
    <div className="p-4 rounded-[12px] bg-[#18181b] border border-[#27272a] space-y-3 w-full">
      <p className="font-['Orbitron'] text-[10px] text-[#52525b] tracking-[2px] uppercase font-semibold">Session Stats</p>
      {dp >= 0 && (
        <>
          <div className="flex justify-between text-[12px] mb-1"><span className="text-[#a1a1aa]">Data</span><span className={`font-['JetBrains_Mono'] ${dp >= 80 ? 'text-amber-400' : 'text-[#e4e4e7]'}`}>{update.dataMBUsed.toFixed(1)} / {update.maxDataMB} MB</span></div>
          <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden"><div className={`h-full rounded-full transition-all duration-300 ${dp >= 80 ? 'bg-amber-500' : 'bg-purple-500'}`} style={{ width: `${dp}%` }} /></div>
        </>
      )}
      {tp >= 0 && (
        <>
          <div className="flex justify-between text-[12px] mb-1"><span className="text-[#a1a1aa]">Time</span><span className={`font-['JetBrains_Mono'] ${tp >= 80 ? 'text-amber-400' : 'text-[#e4e4e7]'}`}>{fmtDur(update.duration)} / {fmtDur(update.maxTimeMinutes! * 60)}</span></div>
          <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden"><div className={`h-full rounded-full transition-all duration-300 ${tp >= 80 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${tp}%` }} /></div>
        </>
      )}
    </div>
  )
}

// ─── Share Button ───────────────────────────────────────────────────────────
function ShareBtn({ code, url }: { code: string; url: string }) {
  const handle = useCallback(async () => {
    if (navigator.share) await navigator.share({ title: 'Internet Share', text: `Join my room ${code}`, url })
    else await navigator.clipboard.writeText(url)
  }, [code, url])
  return (
    <button onClick={handle} className="flex items-center justify-center gap-2 py-3 px-6 rounded-[12px] bg-[#222225] hover:bg-[#27272a] border border-[#27272a] transition-all text-[#a1a1aa] hover:text-[#fafafa] text-[13px] font-medium">
      <Icons.Share /> <span>Share Link</span>
    </button>
  )
}

// ─── Home Screen ────────────────────────────────────────────────────────────
function Home({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-10 h-[2px] bg-purple-500/30" />
          <span className="text-[10px] text-[#52525b] tracking-[3px] font-semibold uppercase">P2P Relay</span>
          <div className="w-10 h-[2px] bg-purple-500/30" />
        </div>
        <h1 className="font-['Orbitron'] text-4xl sm:text-5xl font-bold text-[#fafafa] tracking-[3px] uppercase mb-3">
          Share<span className="text-purple-400">Net</span>
        </h1>
        <p className="text-[13px] text-[#71717a] max-w-xs mx-auto">Host a room, share the code, anyone can join.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <button onClick={() => onSelect('create')}
          className="group relative overflow-hidden p-8 rounded-[24px] bg-[#18181b] border border-[#27272a] hover:border-purple-500/30 transition-all duration-250 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center">
            <div className="w-14 h-14 mb-4 rounded-[12px] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400"><Icons.Wifi /></div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">Host Room</h3>
            <p className="text-[12px] text-[#71717a]">Create and share a code</p>
          </div>
        </button>

        <button onClick={() => onSelect('join')}
          className="group relative overflow-hidden p-8 rounded-[24px] bg-[#18181b] border border-[#27272a] hover:border-cyan-500/30 transition-all duration-250 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center">
            <div className="w-14 h-14 mb-4 rounded-[12px] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><Icons.Key /></div>
            <h3 className="text-[18px] font-semibold text-[#fafafa] mb-1">Join Room</h3>
            <p className="text-[12px] text-[#71717a]">Enter a code to connect</p>
          </div>
        </button>
      </div>

      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#18181b] border border-[#27272a]">
          <span className="w-[6px] h-[6px] rounded-full animate-pulse bg-purple-500 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
          <span className="text-[10px] text-[#52525b] tracking-[1px] uppercase font-semibold">Peer-to-peer relay</span>
        </div>
      </div>
    </div>
  )
}

// ─── Create Room Screen ─────────────────────────────────────────────────────
function CreateScreen({ tunnel, state, onBack }: { tunnel: TunnelClient; state: AppState; onBack: () => void }) {
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const joinUrl = state.roomCode ? `${window.location.origin}${window.location.pathname}?join=${state.roomCode}` : ''

  const handleCreate = useCallback((s: RoomConfig) => { tunnel.createRoom(s); setShowSettings(false) }, [tunnel])
  const handleQuick = useCallback(() => { tunnel.createRoom(); setShowSettings(false) }, [tunnel])
  const handleCopy = useCallback(() => {
    if (state.roomCode) { navigator.clipboard.writeText(state.roomCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }, [state.roomCode])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <button onClick={onBack} className="absolute top-6 left-6 p-2 rounded-[12px] bg-[#18181b] hover:bg-[#222225] border border-[#27272a] transition-colors text-[#71717a] hover:text-[#fafafa]"><Icons.ArrowLeft /></button>

      <SettingsModal open={showSettings && !state.roomCode} onClose={() => setShowSettings(false)} onConfirm={handleCreate} />

      {!state.roomCode ? (
        <>
          <div className="w-14 h-14 mb-5 rounded-[12px] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400"><Icons.Wifi /></div>
          <h2 className="font-['Orbitron'] text-[22px] font-semibold text-[#fafafa] tracking-[1px] mb-1">Host Room</h2>
          <p className="text-[12px] text-[#71717a] mb-8">Create a room and share the code</p>
          <StatusBadge state={state.connectionState} />
          <div className="flex flex-col gap-3 mt-10 w-full max-w-xs">
            <button onClick={handleQuick} className="w-full py-4 rounded-[12px] bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[13px] tracking-[1px] uppercase transition-all hover:shadow-[0_0_25px_rgba(124,58,237,0.25)] active:scale-[0.98]">Quick Start</button>
            <button onClick={() => setShowSettings(true)} className="w-full py-3.5 rounded-[12px] bg-[#222225] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] text-[12px] font-semibold tracking-[0.5px] uppercase transition-all">Custom Setup</button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[10px] text-[#52525b] mb-4 tracking-[2px] uppercase font-semibold">Room Code</p>
          <RoomCode code={state.roomCode} />

          {/* Config badges */}
          {state.roomCode && state.roomConfig && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {state.roomConfig.password && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold tracking-[0.5px] uppercase"><Icons.Lock /> Password</span>}
              {state.roomConfig.maxDataMB && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-semibold tracking-[0.5px] uppercase"><Icons.Data /> {state.roomConfig.maxDataMB}MB</span>}
              {state.roomConfig.maxTimeMinutes && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold tracking-[0.5px] uppercase"><Icons.Clock /> {state.roomConfig.maxTimeMinutes}min</span>}
            </div>
          )}

          <div className="flex flex-col items-center gap-4 mt-6">
            <QRPanel code={state.roomCode} url={joinUrl} />
            <ShareBtn code={state.roomCode} url={joinUrl} />
          </div>

          <div className="flex gap-3 mt-6 w-full max-w-xs">
            <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] bg-[#222225] hover:bg-[#27272a] border border-[#27272a] transition-colors text-[#a1a1aa] hover:text-[#fafafa] text-[13px] font-medium">
              {copied ? <span className="text-emerald-400 flex items-center gap-2"><Icons.Check /> Copied!</span> : <span className="flex items-center gap-2"><Icons.Copy /> Copy Code</span>}
            </button>
            <button onClick={onBack} className="px-5 py-3 rounded-[12px] text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#222225] transition-all border border-transparent hover:border-[#27272a] text-[13px] font-medium">Leave</button>
          </div>

          {/* Waiting status */}
          {state.connectionState === 'connected' && state.roomCode && !state.roomUpdate && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-[12px] text-[#71717a] mt-1">Waiting for someone to join...</p>
            </div>
          )}

          {state.connectionState === 'paired' && state.roomUpdate && (
            <div className="mt-6 w-full max-w-sm space-y-4">
              <div className="p-4 rounded-[12px] bg-emerald-500/5 border border-emerald-500/15 text-center">
                <p className="text-emerald-400 text-[13px] font-semibold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected!
                </p>
              </div>
              <StatsPanel update={state.roomUpdate} />
            </div>
          )}

          {state.error && (
            <div className="mt-6 w-full max-w-sm p-4 rounded-[12px] bg-red-500/5 border border-red-500/15 text-center">
              <p className="text-red-400 text-[12px]">{state.error}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Join Room Screen ───────────────────────────────────────────────────────
function JoinScreen({ tunnel, state, onBack }: { tunnel: TunnelClient; state: AppState; onBack: () => void }) {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const jc = p.get('join')
    if (jc && jc.length >= 4) { const c = jc.toUpperCase().slice(0, 4); setCode(c); setTimeout(() => tunnel.joinRoom(c), 500) }
  }, [tunnel])

  useEffect(() => {
    if (state.error === 'Password required') setShowPw(true)
  }, [state.error])

  const handleJoin = useCallback(() => {
    if (code.trim().length >= 4) tunnel.joinRoom(code.trim().toUpperCase(), password || undefined)
  }, [tunnel, code, password])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <button onClick={onBack} className="absolute top-6 left-6 p-2 rounded-[12px] bg-[#18181b] hover:bg-[#222225] border border-[#27272a] transition-colors text-[#71717a] hover:text-[#fafafa]"><Icons.ArrowLeft /></button>

      <div className="w-14 h-14 mb-5 rounded-[12px] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400"><Icons.Key /></div>
      <h2 className="font-['Orbitron'] text-[22px] font-semibold text-[#fafafa] tracking-[1px] mb-1">Join Room</h2>
      <p className="text-[12px] text-[#71717a] mb-8">Enter the room code to connect</p>
      <StatusBadge state={state.connectionState} />

      <div className="w-full max-w-sm mt-6 space-y-4">
        <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
          placeholder="ABCD" maxLength={4}
          className="w-full text-center font-['JetBrains_Mono'] text-4xl font-bold tracking-[12px] py-5 bg-[#1c1c1f] border border-[#27272a] rounded-[16px] text-[#fafafa] placeholder:text-[#333336] focus:outline-none focus:border-purple-500 transition-all"
          onKeyDown={e => e.key === 'Enter' && handleJoin()} />

        {showPw && (
          <div>
            <p className="text-[10px] text-[#71717a] tracking-[1px] uppercase font-semibold mb-2">This room is password protected</p>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter room password"
              className="w-full px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-[12px] text-[14px] text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:border-purple-500 transition-all"
              onKeyDown={e => e.key === 'Enter' && handleJoin()} />
          </div>
        )}

        <button onClick={handleJoin} disabled={code.length < 4}
          className="w-full py-4 rounded-[16px] bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-[13px] tracking-[1px] uppercase disabled:opacity-20 disabled:cursor-not-allowed hover:from-purple-500 hover:to-cyan-500 transition-all active:scale-[0.98]">
          Connect
        </button>

        {state.error && (
          <div className="p-4 rounded-[12px] bg-red-500/5 border border-red-500/15 text-center">
            <p className="text-red-400 text-[12px]">{state.error}</p>
          </div>
        )}

        {state.connectionState === 'paired' && state.roomUpdate && (
          <div className="space-y-4">
            <div className="p-4 rounded-[12px] bg-emerald-500/5 border border-emerald-500/15 text-center">
              <p className="text-emerald-400 text-[13px] font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected!
              </p>
            </div>
            <StatsPanel update={state.roomUpdate} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [state, setState] = useState<AppState>({ mode: 'home', connectionState: 'disconnected', roomCode: null, roomConfig: {}, roomUpdate: null, error: null, duration: 0 })
  const tunnelRef = useRef<TunnelClient | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const tunnel = new TunnelClient(SERVER_URL, {
      onMessage: (msg: ServerMessage) => {
        setState(prev => {
          switch (msg.type) {
            case 'room_created':
              return { ...prev, roomCode: msg.roomCode, roomConfig: msg.config || {}, connectionState: 'connected', duration: 0, error: null }
            case 'room_joined':
              return { ...prev, roomCode: msg.roomCode, roomConfig: msg.config || {}, connectionState: 'connected', duration: 0, error: null }
            case 'peer_connected':
              if (timerRef.current) clearInterval(timerRef.current)
              timerRef.current = setInterval(() => setState(s => ({ ...s, duration: s.duration + 1 })), 1000)
              return { ...prev, connectionState: 'paired', error: null }
            case 'room_update':
              return { ...prev, roomUpdate: msg as unknown as RoomUpdate }
            case 'peer_disconnected':
              if (timerRef.current) clearInterval(timerRef.current)
              return { ...prev, connectionState: 'connected', roomUpdate: null }
            case 'room_left':
              if (timerRef.current) clearInterval(timerRef.current)
              return { ...prev, connectionState: 'disconnected', roomCode: null, roomConfig: {}, roomUpdate: null, duration: 0 }
            case 'error':
              return { ...prev, error: msg.reason }
            default:
              return prev
          }
        })
      },
      onStateChange: (cs: ConnectionState) => setState(prev => ({ ...prev, connectionState: cs })),
    })
    tunnelRef.current = tunnel
    tunnel.connect()
    const pi = setInterval(() => { if (tunnel.getState() !== 'disconnected') tunnel.ping() }, 30000)
    return () => { tunnel.disconnect(); clearInterval(pi); if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const handleSelect = useCallback((m: Mode) => {
    setState(prev => ({ ...prev, mode: m, error: null, roomCode: null, roomConfig: {}, roomUpdate: null, duration: 0 }))
  }, [])

  const handleBack = useCallback(() => {
    tunnelRef.current?.leaveRoom()
    setState(prev => ({ ...prev, mode: 'home', roomCode: null, roomConfig: {}, roomUpdate: null, error: null, duration: 0 }))
  }, [])

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#0f0f12' }}>
      <AnimatedBg />
      <div className="relative z-10">
        {state.connectionState !== 'disconnected' && (
          <div className="fixed top-4 right-4 z-20 flex items-center gap-3">
            <StatusBadge state={state.connectionState} />
            {state.duration > 0 && (
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#52525b] px-3 py-1.5 rounded-full bg-[#18181b] border border-[#27272a]">{fmtDur(state.duration)}</span>
            )}
          </div>
        )}
        {state.mode === 'home' && <Home onSelect={handleSelect} />}
        {state.mode === 'create' && tunnelRef.current && <CreateScreen tunnel={tunnelRef.current} state={state} onBack={handleBack} />}
        {state.mode === 'join' && tunnelRef.current && <JoinScreen tunnel={tunnelRef.current} state={state} onBack={handleBack} />}
      </div>
    </div>
  )
}

export default App
