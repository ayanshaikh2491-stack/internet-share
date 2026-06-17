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
  peerRole: string | null
}

// ─── Stripe Design System (popular-web-designs template) ─────────────────────
const S = {
  purple: '#533afd',
  purpleHover: '#4434d4',
  purpleLight: '#b9b9f9',
  navy: '#061b31',
  label: '#273951',
  body: '#64748d',
  white: '#ffffff',
  border: '#e5edf5',
  shadow: 'rgba(50,50,93,0.25)',
  shadowBlack: 'rgba(0,0,0,0.1)',
  green: '#15be53',
  greenBg: 'rgba(21,190,83,0.2)',
  greenText: '#108c3d',
  greenBorder: 'rgba(21,190,83,0.4)',
  ruby: '#ea2261',
  magenta: '#f96bee',
  darkSection: '#1c1e54',
  darkNavy: '#0d253d',
  radius: '4px',
  radiusCard: '6px',
  radiusLarge: '8px',
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
)
const IconWifi = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0M12.268 20.182" />
  </svg>
)
const IconKey = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
)
const IconLock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)
const IconCopy = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
)
const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)
const IconData = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
)
const IconClock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)









// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtDur = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ state }: { state: ConnectionState }) => {
  const cfg = {
    disconnected: { label: 'OFFLINE', cls: 'bg-[#f6f9fc] text-[#64748d] border border-[#e5edf5]', dot: 'bg-[#64748d]' },
    connecting: { label: 'CONNECTING', cls: 'bg-white text-[#533afd] border border-[#b9b9f9]', dot: 'bg-[#533afd] animate-pulse' },
    connected: { label: 'IN LOBBY', cls: 'bg-white text-[#4434d4] border border-[#b9b9f9]', dot: 'bg-[#4434d4]' },
    paired: { label: 'CONNECTED', cls: 'bg-white border border-[rgba(21,190,83,0.4)] text-[#108c3d]', dot: 'bg-[#108c3d] animate-pulse' },
  }
  const { label, cls, dot } = cfg[state]
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-medium tracking-normal ${cls}`}>
      <span className={`w-[6px] h-[6px] rounded-[1px] ${dot}`} />
      {label}
    </span>
  )
}

// ─── QR ─────────────────────────────────────────────────────────────────────
const QRPanel = ({ code, url }: { code: string; url: string }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    QRCode.toDataURL(url, { width: 240, margin: 2, color: { dark: '#533afd', light: '#ffffff00' } }).then(setDataUrl)
  }, [url])
  if (!dataUrl) return null
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-2 rounded border border-[#e5edf5]" style={{ boxShadow: 'rgba(50,50,93,0.25) 0px 14px 28px -12px, rgba(0,0,0,0.1) 0px 8px 18px -8px' }}>
        <img src={dataUrl} alt={`QR:${code}`} className="w-28 h-28" />
      </div>
      <p className="text-[10px] text-[#64748d] font-medium tracking-normal">Scan to join</p>
    </div>
  )
}

// ─── Room Code Display ──────────────────────────────────────────────────────
const RoomCode = ({ code }: { code: string }) => {
  return (
    <div className="px-8 py-6 rounded" style={{
      background: S.darkSection,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <div className="flex items-center justify-center gap-3">
        {code.split('').map((ch, i) => (
          <span
            key={i}
            className="font-['Source_Code_Pro'] font-bold text-4xl sm:text-5xl"
            style={{
              color: S.white,
              textShadow: '0 2px 4px rgba(0,0,0,0.15)',
              animation: `slideUp 300ms ease ${i * 80}ms both`,
              letterSpacing: '0.04em',
            }}
          >
            {ch}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Modal ─────────────────────────────────────────────────────────
const SettingsModal = ({ open, onClose, onConfirm }: {
  open: boolean; onClose: () => void; onConfirm: (s: RoomConfig) => void
}) => {
  const [pw, setPw] = useState(''); const [dataMb, setDataMb] = useState('')
  const [timeMin, setTimeMin] = useState(''); const [hasPw, setHasPw] = useState(false)
  const [hasData, setHasData] = useState(false); const [hasTime, setHasTime] = useState(false)
  useEffect(() => {
    if (!open) { setPw(''); setDataMb(''); setTimeMin(''); setHasPw(false); setHasData(false); setHasTime(false) }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(6,27,49,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-sm bg-white border border-[#e5edf5] p-6" style={{ borderRadius: '5px', boxShadow: 'rgba(50,50,93,0.25) 0px 30px 60px -12px, rgba(0,0,0,0.1) 0px 18px 36px -18px' }} onClick={e => e.stopPropagation()}>
        <h2 className="text-[22px] font-light text-[#061b31] mb-1" style={{ letterSpacing: '-0.22px', fontFeatureSettings: '"ss01"' }}>Room settings</h2>
        <p className="text-[14px] text-[#64748d] mb-6" style={{ fontWeight: 300 }}>Customise your room before creating</p>

        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasPw} onChange={e => setHasPw(e.target.checked)}
              className="accent-[#533afd] w-4 h-4 rounded border-[#e5edf5]" />
            <span className="text-[14px] font-normal text-[#273951]" style={{ fontFeatureSettings: '"ss01"' }}>Password protect</span>
          </label>
          {hasPw && (
            <input type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter room password"
              className="w-full px-3 py-2 text-[14px] bg-white border border-[#e5edf5] text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
              style={{ borderRadius: '4px', fontWeight: 300, fontFeatureSettings: '"ss01"' }} />
          )}
        </div>

        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasData} onChange={e => setHasData(e.target.checked)}
              className="accent-[#533afd] w-4 h-4 rounded border-[#e5edf5]" />
            <span className="text-[14px] font-normal text-[#273951]" style={{ fontFeatureSettings: '"ss01"' }}>Data limit</span>
          </label>
          {hasData && (
            <div className="flex items-center gap-2">
              <input type="number" value={dataMb} onChange={e => setDataMb(e.target.value)} placeholder="100" min={1}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#e5edf5] text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
                style={{ borderRadius: '4px', fontWeight: 300, fontFeatureSettings: '"ss01"' }} />
              <span className="text-[12px] text-[#64748d]" style={{ fontWeight: 300 }}>MB</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasTime} onChange={e => setHasTime(e.target.checked)}
              className="accent-[#533afd] w-4 h-4 rounded border-[#e5edf5]" />
            <span className="text-[14px] font-normal text-[#273951]" style={{ fontFeatureSettings: '"ss01"' }}>Time limit</span>
          </label>
          {hasTime && (
            <div className="flex items-center gap-2">
              <input type="number" value={timeMin} onChange={e => setTimeMin(e.target.value)} placeholder="30" min={1}
                className="w-full px-3 py-2 text-[14px] bg-white border border-[#e5edf5] text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
                style={{ borderRadius: '4px', fontWeight: 300, fontFeatureSettings: '"ss01"' }} />
              <span className="text-[12px] text-[#64748d]" style={{ fontWeight: 300 }}>minutes</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-[14px] font-normal text-[#533afd] bg-transparent border"
            style={{ borderRadius: '4px', borderColor: S.purpleLight, fontFeatureSettings: '"ss01"' }}>
            Cancel
          </button>
          <button onClick={() => onConfirm({ password: hasPw && pw ? pw : null, maxDataMB: hasData && dataMb ? parseFloat(dataMb) : null, maxTimeMinutes: hasTime && timeMin ? parseInt(timeMin) : null })}
            className="flex-1 py-2.5 text-[14px] font-normal text-white"
            style={{ borderRadius: '4px', background: S.purple, fontFeatureSettings: '"ss01"' }}>
            Create Room
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Panel ────────────────────────────────────────────────────────────
const StatsPanel = ({ update }: { update: RoomUpdate }) => {
  const dp = update.maxDataMB ? Math.min(100, Math.round((update.dataMBUsed / update.maxDataMB) * 100)) : -1
  const tp = update.maxTimeMinutes ? Math.min(100, Math.round((update.duration / (update.maxTimeMinutes * 60)) * 100)) : -1
  return (
    <div className="p-5 rounded" style={{ border: `1px solid ${S.border}`, boxShadow: 'rgba(50,50,93,0.25) 0px 14px 28px -12px, rgba(0,0,0,0.1) 0px 8px 18px -8px' }}>
      <p className="text-[10px] text-[#64748d] font-medium mb-4" style={{ letterSpacing: '0.02em' }}>SESSION STATS</p>
      {dp >= 0 && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-[13px] text-[#64748d]" style={{ fontFeatureSettings: '"ss01"', fontWeight: 300 }}>Data</span>
            <span className={`text-[13px] font-['Source_Code_Pro'] ${dp >= 80 ? 'text-[#ea2261]' : 'text-[#061b31]'}`} style={{ fontWeight: dp >= 80 ? 500 : 400 }}>
              {update.dataMBUsed.toFixed(1)} / {update.maxDataMB} MB
            </span>
          </div>
          <div className="h-[4px] overflow-hidden" style={{ background: '#e5edf5', borderRadius: '2px' }}>
            <div className={`h-full transition-all duration-300`} style={{ width: `${dp}%`, background: dp >= 80 ? S.ruby : S.purple, borderRadius: '2px' }} />
          </div>
        </div>
      )}
      {tp >= 0 && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[13px] text-[#64748d]" style={{ fontFeatureSettings: '"ss01"', fontWeight: 300 }}>Duration</span>
            <span className={`text-[13px] font-['Source_Code_Pro'] ${tp >= 80 ? 'text-[#ea2261]' : 'text-[#061b31]'}`} style={{ fontWeight: tp >= 80 ? 500 : 400 }}>
              {fmtDur(update.duration)} / {fmtDur(update.maxTimeMinutes! * 60)}
            </span>
          </div>
          <div className="h-[4px] overflow-hidden" style={{ background: '#e5edf5', borderRadius: '2px' }}>
            <div className={`h-full transition-all duration-300`} style={{ width: `${tp}%`, background: tp >= 80 ? S.ruby : '#64748d', borderRadius: '2px' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Button variants ────────────────────────────────────────────────────────
const btnPrimary = `inline-flex items-center justify-center gap-2 text-white text-[14px] font-normal px-4 py-2.5`
const btnGhost = `inline-flex items-center justify-center gap-2 text-[14px] font-normal px-4 py-2.5 bg-transparent`
const btnNeutral = `inline-flex items-center justify-center gap-2 text-[14px] font-normal px-4 py-2.5 text-[rgba(16,16,16,0.3)] border`
const btnSm = `inline-flex items-center justify-center gap-2 text-[13px] font-normal px-3 py-2 bg-transparent`

// ─── Home Screen ────────────────────────────────────────────────────────────
const Home = ({ onSelect }: { onSelect: (m: Mode) => void }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: S.white }}>
      <div className="w-full max-w-md px-6 py-12 text-center">
        <div className="mb-10">
          <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center rounded" style={{ background: 'rgba(83,58,253,0.05)', border: '1px solid rgba(83,58,253,0.2)' }}>
            <IconWifi />
          </div>
          <h1 className="text-4xl font-light mb-2" style={{ color: S.navy, letterSpacing: '-0.96px', fontFeatureSettings: '"ss01"' }}>
            ShareNet
          </h1>
          <p className="text-[16px]" style={{ color: S.body, fontWeight: 300, fontFeatureSettings: '"ss01"' }}>
            Host a room, share the code, connect with anyone.
          </p>
        </div>

        <div className="space-y-4">
          <button onClick={() => onSelect('create')}
            className="w-full text-left p-5 bg-white rounded transition-all"
            style={{ border: `1px solid ${S.border}`, boxShadow: 'rgba(50,50,93,0.25) 0px 14px 28px -12px, rgba(0,0,0,0.1) 0px 8px 18px -8px', borderRadius: '5px' }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded" style={{ background: 'rgba(83,58,253,0.05)', border: '1px solid rgba(83,58,253,0.2)' }}>
                <IconWifi />
              </div>
              <div>
                <h3 className="text-[18px] font-light" style={{ color: S.navy, letterSpacing: '-0.18px', fontFeatureSettings: '"ss01"' }}>Host a Room</h3>
                <p className="text-[13px]" style={{ color: S.body, fontWeight: 300, fontFeatureSettings: '"ss01"' }}>Get a code to share</p>
              </div>
            </div>
          </button>

          <button onClick={() => onSelect('join')}
            className="w-full text-left p-5 bg-white rounded transition-all"
            style={{ border: `1px solid ${S.border}`, boxShadow: 'rgba(50,50,93,0.25) 0px 14px 28px -12px, rgba(0,0,0,0.1) 0px 8px 18px -8px', borderRadius: '5px' }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded" style={{ background: 'rgba(83,58,253,0.05)', border: '1px solid rgba(83,58,253,0.2)' }}>
                <IconKey />
              </div>
              <div>
                <h3 className="text-[18px] font-light" style={{ color: S.navy, letterSpacing: '-0.18px', fontFeatureSettings: '"ss01"' }}>Join a Room</h3>
                <p className="text-[13px]" style={{ color: S.body, fontWeight: 300, fontFeatureSettings: '"ss01"' }}>Enter a code and connect</p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: '#f6f9fc', border: `1px solid ${S.border}` }}>
            <span className="w-[6px] h-[6px] rounded-[1px] bg-[#533afd] animate-pulse" />
            <span className="text-[10px] text-[#64748d] font-medium tracking-normal">Peer-to-peer relay &bull; 4-digit room codes</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Room Screen ─────────────────────────────────────────────────────
const CreateScreen = ({ tunnel, state, onBack }: { tunnel: TunnelClient; state: AppState; onBack: () => void }) => {
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const joinUrl = state.roomCode ? `${window.location.origin}${window.location.pathname}?join=${state.roomCode}` : ''

  const handleCreate = useCallback((s: RoomConfig) => { tunnel.createRoom(s); setShowSettings(false) }, [tunnel])
  const handleQuick = useCallback(() => { tunnel.createRoom(); setShowSettings(false) }, [tunnel])
  const handleCopy = useCallback(() => {
    if (state.roomCode) { navigator.clipboard.writeText(state.roomCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }, [state.roomCode])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: S.white }}>
      <button onClick={onBack}
        className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded text-[#64748d] hover:text-[#061b31] transition-colors"
        style={{ border: `1px solid ${S.border}` }}>
        <IconArrowLeft />
      </button>

      <SettingsModal open={showSettings && !state.roomCode} onClose={() => setShowSettings(false)} onConfirm={handleCreate} />

      <div className="w-full max-w-sm px-6 text-center">
        {!state.roomCode ? (
          <>
            <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center rounded" style={{ background: 'rgba(83,58,253,0.05)', border: '1px solid rgba(83,58,253,0.2)' }}>
              <IconWifi />
            </div>
            <h2 className="text-[26px] font-light mb-1" style={{ color: S.navy, letterSpacing: '-0.26px', fontFeatureSettings: '"ss01"' }}>Host a Room</h2>
            <p className="text-[14px] mb-6" style={{ color: S.body, fontWeight: 300, fontFeatureSettings: '"ss01"' }}>Create a room and share the code</p>
            <StatusBadge state={state.connectionState} />

            <div className="flex flex-col gap-3 mt-8">
              <button onClick={handleQuick}
                className={`${btnPrimary} w-full`} style={{ borderRadius: '4px', background: S.purple, fontFeatureSettings: '"ss01"' }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = S.purpleHover}
                onMouseLeave={e => (e.target as HTMLElement).style.background = S.purple}>
                Quick Start
              </button>
              <button onClick={() => setShowSettings(true)}
                className={`${btnGhost} w-full`}
                style={{ borderRadius: '4px', border: `1px solid ${S.purpleLight}`, color: S.purple, fontFeatureSettings: '"ss01"' }}>
                Custom Setup
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[10px] text-[#64748d] mb-3 font-medium tracking-normal">ROOM CODE</p>
            <RoomCode code={state.roomCode} />

            {state.roomCode && state.roomConfig && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {state.roomConfig.password && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(21,190,83,0.2)', color: S.greenText, border: `1px solid ${S.greenBorder}`, borderRadius: '4px' }}>
                    <IconLock /> Protected
                  </span>
                )}
                {state.roomConfig.maxDataMB && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium" style={{ background: '#f6f9fc', color: S.navy, border: `1px solid ${S.border}`, borderRadius: '4px' }}>
                    <IconData /> {state.roomConfig.maxDataMB}MB
                  </span>
                )}
                {state.roomConfig.maxTimeMinutes && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium" style={{ background: '#f6f9fc', color: S.navy, border: `1px solid ${S.border}`, borderRadius: '4px' }}>
                    <IconClock /> {state.roomConfig.maxTimeMinutes}m
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col items-center gap-4 mt-6">
              <QRPanel code={state.roomCode} url={joinUrl} />
              <button onClick={handleCopy}
                className={`${btnGhost}`}
                style={{ borderRadius: '4px', border: `1px solid ${S.purpleLight}`, color: S.purple, fontFeatureSettings: '"ss01"' }}>
                {copied ? <span className="flex items-center gap-2" style={{ color: S.greenText }}><IconCheck /> Copied!</span> : <span className="flex items-center gap-2"><IconCopy /> Copy code</span>}
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleCopy}
                className={`${btnNeutral} flex-1`}
                style={{ borderRadius: '4px', borderColor: S.border, fontFeatureSettings: '"ss01"' }}>
                {copied ? <span className="flex items-center gap-2" style={{ color: S.greenText }}><IconCheck /> Copied!</span> : <span className="flex items-center gap-2"><IconCopy /> Copy</span>}
              </button>
              <button onClick={onBack}
                className={`${btnSm} border-transparent hover:border-[${S.border}]`}
                style={{ borderRadius: '4px', color: S.body, fontFeatureSettings: '"ss01"' }}>
                Leave
              </button>
            </div>

            {state.connectionState === 'connected' && state.roomCode && !state.roomUpdate && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-[13px]" style={{ color: S.body, fontWeight: 300, fontFeatureSettings: '"ss01"' }}>Waiting for someone to join…</p>
              </div>
            )}

            {state.connectionState === 'paired' && state.roomUpdate && (
              <div className="mt-6 w-full space-y-4">
                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded" style={{ background: S.greenBg, border: `1px solid ${S.greenBorder}` }}>
                  <span className="w-2 h-2 rounded-[1px] animate-pulse" style={{ background: S.green }} />
                  <span className="text-[13px] font-medium" style={{ color: S.greenText, fontFeatureSettings: '"ss01"' }}>Connected — relay active</span>
                </div>
                <StatsPanel update={state.roomUpdate} />
              </div>
            )}

            {state.error && (
              <div className="mt-6 p-3 rounded text-[12px] text-[#ea2261] font-medium" style={{ background: 'rgba(234,34,97,0.05)', border: '1px solid rgba(234,34,97,0.15)' }}>
                {state.error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Join Room Screen ───────────────────────────────────────────────────────
const JoinScreen = ({ tunnel, state, onBack }: { tunnel: TunnelClient; state: AppState; onBack: () => void }) => {
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
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: S.white }}>
      <button onClick={onBack}
        className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded text-[#64748d] hover:text-[#061b31] transition-colors"
        style={{ border: `1px solid ${S.border}` }}>
        <IconArrowLeft />
      </button>

      <div className="w-full max-w-sm px-6 text-center">
        <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center rounded" style={{ background: 'rgba(83,58,253,0.05)', border: '1px solid rgba(83,58,253,0.2)' }}>
          <IconKey />
        </div>
        <h2 className="text-[26px] font-light mb-1" style={{ color: S.navy, letterSpacing: '-0.26px', fontFeatureSettings: '"ss01"' }}>Join a Room</h2>
        <p className="text-[14px] mb-6" style={{ color: S.body, fontWeight: 300, fontFeatureSettings: '"ss01"' }}>Enter the code to connect</p>
        <StatusBadge state={state.connectionState} />

        <div className="mt-6 space-y-4">
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
            placeholder="ABCD" maxLength={4}
            className="w-full text-center text-4xl font-bold py-4 bg-white border text-[#061b31] placeholder:text-[#c8d4e0] focus:outline-none"
            style={{ borderRadius: '4px', borderColor: S.border, fontFamily: "'Source Code Pro', monospace", letterSpacing: '0.12em' }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()} />

          {showPw && (
            <div>
              <p className="text-[11px] text-[#64748d] font-medium mb-2 text-left">This room is password protected</p>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                className="w-full px-3 py-2.5 text-[14px] bg-white border text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
                style={{ borderRadius: '4px', borderColor: S.border, fontWeight: 300, fontFeatureSettings: '"ss01"' }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            </div>
          )}

          <button onClick={handleJoin} disabled={code.length < 4}
            className={`${btnPrimary} w-full disabled:opacity-30 disabled:cursor-not-allowed`}
            style={{ borderRadius: '4px', background: S.purple, fontFeatureSettings: '"ss01"' }}
            onMouseEnter={e => code.length >= 4 && ((e.target as HTMLElement).style.background = S.purpleHover)}
            onMouseLeave={e => (e.target as HTMLElement).style.background = S.purple}>
            Connect
          </button>

          {state.error && (
            <div className="p-3 rounded text-[12px] text-[#ea2261] font-medium" style={{ background: 'rgba(234,34,97,0.05)', border: '1px solid rgba(234,34,97,0.15)' }}>
              {state.error}
            </div>
          )}

          {state.connectionState === 'paired' && state.roomUpdate && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 py-2 px-4 rounded" style={{ background: S.greenBg, border: `1px solid ${S.greenBorder}` }}>
                <span className="w-2 h-2 rounded-[1px] animate-pulse" style={{ background: S.green }} />
                <span className="text-[13px] font-medium" style={{ color: S.greenText, fontFeatureSettings: '"ss01"' }}>Connected — relay active</span>
              </div>
              <StatsPanel update={state.roomUpdate} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────
const Footer = () => (
  <div className="fixed bottom-0 left-0 right-0 text-center py-3 text-[10px] text-[#64748d] font-medium"
    style={{ borderTop: `1px solid ${S.border}`, background: S.white }}>
    <span className="inline-flex items-center gap-2">
      <span className="w-[4px] h-[4px] rounded-[1px] bg-[#533afd]" />
      SECURE PEER-TO-PEER RELAY
    </span>
  </div>
)

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [state, setState] = useState<AppState>({
    mode: 'home', connectionState: 'disconnected', roomCode: null, roomConfig: {}, roomUpdate: null, error: null, duration: 0, peerRole: null,
  })
  const tunnelRef = useRef<TunnelClient | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const tunnel = new TunnelClient(SERVER_URL, {
      onMessage: (msg: ServerMessage) => {
        setState(prev => {
          switch (msg.type) {
            case 'room_created':
              return { ...prev, roomCode: msg.roomCode, roomConfig: msg.config || {}, connectionState: 'connected', peerRole: 'host', duration: 0, error: null }
            case 'room_joined':
              return { ...prev, roomCode: msg.roomCode, roomConfig: msg.config || {}, connectionState: 'connected', peerRole: 'joiner', duration: 0, error: null }
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
              return { ...prev, connectionState: 'disconnected', roomCode: null, roomConfig: {}, roomUpdate: null, duration: 0, peerRole: null }
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
    setState(prev => ({ ...prev, mode: m, error: null, roomCode: null, roomConfig: {}, roomUpdate: null, duration: 0, peerRole: null }))
  }, [])

  const handleBack = useCallback(() => {
    tunnelRef.current?.leaveRoom()
    setState(prev => ({ ...prev, mode: 'home', roomCode: null, roomConfig: {}, roomUpdate: null, error: null, duration: 0, peerRole: null }))
  }, [])

  return (
    <div style={{ background: S.white, minHeight: '100vh', position: 'relative' }}>
      {state.connectionState !== 'disconnected' && (
        <div className="fixed top-4 right-4 z-20 flex items-center gap-3">
          <StatusBadge state={state.connectionState} />
          {state.duration > 0 && (
            <span className="inline-flex items-center px-2.5 py-1.5 text-[10px] font-['Source_Code_Pro'] font-medium" style={{ background: '#f6f9fc', color: S.body, border: `1px solid ${S.border}`, borderRadius: '4px' }}>
              {fmtDur(state.duration)}
            </span>
          )}
        </div>
      )}
      {state.mode === 'home' && <Home onSelect={handleSelect} />}
      {state.mode === 'create' && tunnelRef.current && <CreateScreen tunnel={tunnelRef.current} state={state} onBack={handleBack} />}
      {state.mode === 'join' && tunnelRef.current && <JoinScreen tunnel={tunnelRef.current} state={state} onBack={handleBack} />}
      <Footer />
    </div>
  )
}

export default App
