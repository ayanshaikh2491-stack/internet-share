import { useState, useEffect, useCallback, useRef } from 'react'
import { TunnelClient } from './services/tunnel'
import { auth } from './services/auth'
import type { AuthUser } from './services/auth'
import type { ConnectionState, ServerMessage, RoomConfig, RoomUpdate } from './services/tunnel'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001'

// ─── Stripe Design Tokens ───────────────────────────────────────────────────
const S = {
  purple: '#533afd', purpleHover: '#4434d4', purpleDeep: '#2e2b8c', purpleLight: '#b9b9f9', purpleMid: '#665efd', purpleSoft: '#d6d9fc', purpleBg: 'rgba(83,58,253,0.05)',
  navy: '#061b31', label: '#273951', body: '#64748d', white: '#ffffff', border: '#e5edf5',
  darkSection: '#1c1e54', darkNavy: '#0d253d',
  shadow1: 'rgba(50,50,93,0.25)', shadow2: 'rgba(0,0,0,0.1)',
  shadow3: 'rgba(23,23,23,0.08)',
  green: '#15be53', greenBg: 'rgba(21,190,83,0.2)', greenText: '#108c3d', greenBorder: 'rgba(21,190,83,0.4)',
  ruby: '#ea2261', magenta: '#f96bee',
  lemon: '#9b6829',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtDur = (s: number) => { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; }

// ─── Inline SVG Icons (Stripe style — thin weight, precise) ─────────────────
const ArrowLeft = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>;
const Plus = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const KeyIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>;
const LockIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>;
const StopIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"/></svg>;
const WifiIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0"/></svg>;
const MailIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>;

// ─── Stripe Status Badge ─────────────────────────────────────────────────────
const StatusBadge = ({ state, small }: { state: ConnectionState; small?: boolean }) => {
  const map: Record<string, { l: string; cls: string; dot: string }> = {
    disconnected: { l: 'OFFLINE', cls: 'bg-[#f6f9fc] text-[#64748d] border border-[#e5edf5]', dot: 'bg-[#64748d]' },
    connecting: { l: 'CONNECTING', cls: 'bg-white text-[#533afd] border border-[#b9b9f9]', dot: 'bg-[#533afd] animate-pulse' },
    connected: { l: 'ONLINE', cls: 'bg-white text-[#4434d4] border border-[#b9b9f9]', dot: 'bg-[#4434d4]' },
    paired: { l: 'ACTIVE', cls: 'bg-white border border-[rgba(21,190,83,0.4)] text-[#108c3d]', dot: 'bg-[#108c3d] animate-pulse' },
  };
  const c = map[state];
  return (
    <span className={`inline-flex items-center gap-2 ${small ? 'px-2 py-1 text-[9px]' : 'px-3 py-1.5 text-[11px]'} font-medium rounded`}
      style={{ ...(small ? {} : {}), border: `1px solid ${state === 'connected' || state === 'connecting' ? '#b9b9f9' : '#e5edf5'}`, background: c.cls.split(' ')[0], color: c.cls.includes('text-') ? c.cls.split('text-')[1]?.split(' ')[0] : '#64748d', borderRadius: '4px' }}>
      <span className={`w-[6px] h-[6px] rounded-[1px] ${c.dot}`} />
      {c.l}
    </span>
  );
};

// ─── Auth Screen ────────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const fn = mode === 'login' ? auth.login.bind(auth) : auth.register.bind(auth);
    const result = await fn(email.trim(), password);
    setLoading(false);
    if (!result.success) { setError(result.error || 'Something went wrong'); return; }
    if (mode === 'signup') { setSuccess(true); return; }
    onAuth();
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#f6f9fc' }}>
        <div className="w-full max-w-sm px-6 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded-full" style={{ background: S.greenBg }}>
            <span className="text-3xl" style={{ color: S.greenText }}>✓</span>
          </div>
          <h2 className="text-[26px] font-light mb-1" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.26px' }}>Account created</h2>
          <p className="text-[14px] mb-6" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>
            {email} — check your email for confirmation (or just sign in below)
          </p>
          <button onClick={() => { setSuccess(false); setMode('login'); }}
            className="w-full py-2.5 text-[14px] font-normal text-white"
            style={{ borderRadius: '4px', background: S.purple }}>Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: '#f6f9fc' }}>
      <div className="w-full max-w-sm px-6 py-12">
        {/* Logo */}
        <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded" style={{ background: S.purpleBg, border: `1px solid ${S.purpleSoft}` }}>
          <WifiIcon />
        </div>
        <h1 className="text-[32px] font-light text-center mb-1" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.64px' }}>ShareNet</h1>
        <p className="text-[16px] text-center mb-8" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {error && <div className="mb-5 p-3 rounded text-[12px]" style={{ background: 'rgba(234,34,97,0.05)', border: '1px solid rgba(234,34,97,0.15)', color: S.ruby, borderRadius: '4px', fontFamily: "'Source Sans 3'", fontWeight: 400 }}>{error}</div>}

        <div className="space-y-5">
          <div>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: S.label, fontFamily: "'Source Sans 3'" }}>Email</p>
            <div className="flex items-center border px-3 py-2.5 gap-2" style={{ borderColor: S.border, borderRadius: '4px', background: S.white }}>
              <MailIcon />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full text-[14px] bg-transparent text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
                style={{ fontFamily: "'Source Sans 3'", fontWeight: 300 }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: S.label, fontFamily: "'Source Sans 3'" }}>Password</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 4 characters"
              className="w-full px-3 py-2.5 text-[14px] bg-white border text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
              style={{ borderColor: S.border, borderRadius: '4px', fontFamily: "'Source Sans 3'", fontWeight: 300 }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 text-[14px] font-normal text-white disabled:opacity-50"
            style={{ borderRadius: '4px', background: S.purple }}>
            {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </div>

        <p className="mt-6 text-center text-[14px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>
          {mode === 'login' ? (
            <>No account? <button onClick={() => { setMode('signup'); setError(null); }} className="font-medium" style={{ color: S.purple }}>Sign up</button></>
          ) : (
            <>Already have one? <button onClick={() => { setMode('login'); setError(null); }} className="font-medium" style={{ color: S.purple }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
};

// ─── Create Room Modal ──────────────────────────────────────────────────────
const CreateRoomModal = ({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (s: RoomConfig) => void }) => {
  const [pw, setPw] = useState(''); const [data, setData] = useState(''); const [time, setTime] = useState('');
  const [hasPw, setHasPw] = useState(false); const [hasData, setHasData] = useState(false); const [hasTime, setHasTime] = useState(false);
  useEffect(() => { if (!open) { setPw(''); setData(''); setTime(''); setHasPw(false); setHasData(false); setHasTime(false); } }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(6,27,49,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-sm bg-white border p-6" style={{ borderColor: S.border, borderRadius: '5px', boxShadow: `${S.shadow1} 0px 30px 60px -12px, ${S.shadow2} 0px 18px 36px -18px`, fontFamily: "'Source Sans 3'" }} onClick={e => e.stopPropagation()}>
        <h2 className="text-[22px] font-light mb-1" style={{ color: S.navy, letterSpacing: '-0.22px' }}>New Room</h2>
        <p className="text-[14px] mb-6" style={{ color: S.body, fontWeight: 300 }}>Set optional limits and a password</p>
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasPw} onChange={e => setHasPw(e.target.checked)} className="accent-[#533afd] w-4 h-4 rounded border-[#e5edf5]" />
            <span className="text-[14px] font-normal" style={{ color: S.label }}>Password protect</span>
          </label>
          {hasPw && <input type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder="Room password"
            className="w-full px-3 py-2 text-[14px] bg-white border text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
            style={{ borderColor: S.border, borderRadius: '4px', fontWeight: 300 }} />}
        </div>
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasData} onChange={e => setHasData(e.target.checked)} className="accent-[#533afd] w-4 h-4 rounded border-[#e5edf5]" />
            <span className="text-[14px] font-normal" style={{ color: S.label }}>Data limit</span>
          </label>
          {hasData && <div className="flex items-center gap-2">
            <input type="number" value={data} onChange={e => setData(e.target.value)} placeholder="100" min={1}
              className="w-full px-3 py-2 text-[14px] bg-white border text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
              style={{ borderColor: S.border, borderRadius: '4px', fontWeight: 300 }} />
            <span className="text-[12px]" style={{ color: S.body, fontWeight: 300 }}>MB</span>
          </div>}
        </div>
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={hasTime} onChange={e => setHasTime(e.target.checked)} className="accent-[#533afd] w-4 h-4 rounded border-[#e5edf5]" />
            <span className="text-[14px] font-normal" style={{ color: S.label }}>Time limit</span>
          </label>
          {hasTime && <div className="flex items-center gap-2">
            <input type="number" value={time} onChange={e => setTime(e.target.value)} placeholder="30" min={1}
              className="w-full px-3 py-2 text-[14px] bg-white border text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
              style={{ borderColor: S.border, borderRadius: '4px', fontWeight: 300 }} />
            <span className="text-[12px]" style={{ color: S.body, fontWeight: 300 }}>min</span>
          </div>}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-[14px] font-normal bg-transparent border" style={{ borderRadius: '4px', borderColor: S.purpleLight, color: S.purple }}>Cancel</button>
          <button onClick={() => onConfirm({ password: hasPw && pw ? pw : null, maxDataMB: hasData && data ? parseFloat(data) : null, maxTimeMinutes: hasTime && time ? parseInt(time) : null })}
            className="flex-1 py-2.5 text-[14px] font-normal text-white" style={{ borderRadius: '4px', background: S.purple }}>Create Room</button>
        </div>
      </div>
    </div>
  );
};

// ─── Peer Badge (Stripe styled) ─────────────────────────────────────────────
const PeerBadge = ({ data, label }: { data: number; label: string }) => (
  <div className="flex items-center justify-between py-2.5 px-3.5 rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '4px', background: S.white }}>
    <div className="flex items-center gap-2.5">
      <span className="w-2 h-2 rounded-[2px] bg-[#15be53] animate-pulse" />
      <span className="text-[12px]" style={{ color: S.label, fontFamily: "'Source Sans 3'", fontWeight: 400 }}>{label}</span>
    </div>
    <span className="text-[12px]" style={{ color: S.navy, fontFamily: "'Source Code Pro'", fontWeight: 500 }}>{data.toFixed(1)} MB</span>
  </div>
);

// ─── Home Screen ────────────────────────────────────────────────────────────
const Home = ({ onSelect, user, onLogout }: { onSelect: (mode: 'donor' | 'receiver') => void; user: AuthUser; onLogout: () => void }) => (
  <div className="min-h-screen" style={{ background: S.white }}>
    {/* Hero Section with purple gradient glow */}
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(83,58,253,0.04) 0%, rgba(83,58,253,0.01) 100%)' }}>
      {/* Decorative purple orbs */}
      <div className="absolute top-[-80px] right-[-60px] w-[300px] h-[300px] rounded-full opacity-[0.08]" style={{ background: S.purple, filter: 'blur(80px)' }} />
      <div className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full opacity-[0.06]" style={{ background: S.purple, filter: 'blur(60px)' }} />

      {/* Navigation */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ borderBottom: `1px solid ${S.border}`, background: 'rgba(255,255,255,0.85)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded" style={{ background: S.purple }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0"/></svg>
            </div>
            <span className="text-[16px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.16px' }}>ShareNet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>{user.email}</span>
            <button onClick={onLogout} className="text-[11px] font-medium px-2.5 py-1" style={{ border: `1px solid ${S.border}`, borderRadius: '4px', color: S.body, fontFamily: "'Source Sans 3'" }}>Sign out</button>
          </div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="max-w-lg mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-[48px] font-light mb-4" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.96px', lineHeight: '1.15' }}>
          Share your internet.
          <br />
          <span style={{ color: S.purple }}>Receive from others.</span>
        </h1>
        <p className="text-[18px] mb-8" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300, lineHeight: '1.4' }}>
          Peer-to-peer relay. Create rooms, invite receivers, share your bandwidth.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => onSelect('donor')}
            className="px-6 py-2.5 text-[14px] font-normal text-white"
            style={{ borderRadius: '4px', background: S.purple }}>
            Start Sharing
          </button>
          <button onClick={() => onSelect('receiver')}
            className="px-6 py-2.5 text-[14px] font-normal"
            style={{ borderRadius: '4px', border: `1px solid ${S.purpleLight}`, color: S.purple, background: 'transparent' }}>
            Receive Internet
          </button>
        </div>
      </div>
    </div>

    {/* Feature Cards Section */}
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="grid gap-4">
        <div className="p-5 bg-white" style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow3} 0px 15px 35px 0px` }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded shrink-0" style={{ background: S.purple, borderRadius: '4px' }}><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0"/></svg></div>
            <div>
              <h3 className="text-[18px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.18px' }}>Share Internet</h3>
              <p className="text-[13px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>Create rooms, invite receivers, share your bandwidth</p>
            </div>
          </div>
        </div>
        <div className="p-5 bg-white" style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow3} 0px 15px 35px 0px` }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded shrink-0" style={{ border: `1px solid ${S.purpleLight}`, borderRadius: '4px' }}><KeyIcon /></div>
            <div>
              <h3 className="text-[18px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.18px' }}>Receive Internet</h3>
              <p className="text-[13px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>Enter a room code and start receiving</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-8 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-medium" style={{ background: '#f6f9fc', border: `1px solid ${S.border}`, borderRadius: '4px', color: S.body, fontFamily: "'Source Sans 3'" }}>
          <span className="w-2 h-2 rounded-[2px] bg-[#533afd] animate-pulse" /> Multi-room &bull; Multi-peer &bull; Real-time relay
        </span>
      </div>
    </div>
  </div>
);

// ─── Receiver Join Screen ───────────────────────────────────────────────────
const ReceiverJoin = ({ tunnel, onBack }: { tunnel: TunnelClient; onBack: () => void }) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [needPw, setNeedPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [update, setUpdate] = useState<RoomUpdate | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const jc = p.get('join');
    if (jc && jc.length >= 4) setCode(jc.toUpperCase().slice(0, 4));
  }, []);

  useEffect(() => {
    tunnel.listRooms();
    tunnel.onMessage = (msg: ServerMessage) => {
      if (msg.type === 'room_joined') { setConnected(true); setError(null); setNeedPw(false); }
      else if (msg.type === 'error') { if (msg.needPassword) setNeedPw(true); setError(msg.reason); }
      else if (msg.type === 'room_list') setAvailableRooms(msg.rooms || []);
      else if (msg.type === 'room_update') setUpdate(msg as unknown as RoomUpdate);
      else if (msg.type === 'owner_disconnected' || msg.type === 'room_left') { setConnected(false); setUpdate(null); setError(msg.reason || 'Room closed'); }
    };
    const interval = setInterval(() => tunnel.listRooms(), 3000);
    return () => { clearInterval(interval); tunnel.onMessage = () => {}; };
  }, [tunnel]);

  const handleJoin = useCallback(() => {
    if (code.trim().length >= 4) { setError(null); tunnel.joinRoom(code.trim().toUpperCase(), password || undefined); }
  }, [tunnel, code, password]);

  const handleRoomClick = useCallback((room: any) => {
    setCode(room.code);
    setNeedPw(room.hasPassword);
    setPassword('');
    setError(null);
    if (!room.hasPassword) tunnel.joinRoom(room.code);
  }, [tunnel]);

  if (connected) {
    return (
      /* Stripe dark section for connected state */
      <div className="min-h-screen flex flex-col" style={{ background: S.white }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm px-6 text-center">
            <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center rounded" style={{ background: S.greenBg, borderRadius: '50%' }}>
              <span className="text-3xl" style={{ color: S.greenText }}>✓</span>
            </div>
            <h2 className="text-[26px] font-light mb-1" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.26px' }}>Connected</h2>
            <p className="text-[14px] mb-1" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>Room</p>
            <span className="text-[32px] font-light tracking-[0.12em]" style={{ color: S.purple, fontFamily: "'Source Code Pro'", marginBottom: '24px', display: 'block' }}>{code}</span>
            {update && (
              <div className="mt-5" style={{ border: `1px solid ${S.border}`, borderRadius: '5px', background: S.white, boxShadow: `${S.shadow3} 0px 15px 35px 0px` }}>
                <div className="p-4">
                  <p className="text-[10px] font-medium mb-3" style={{ color: S.body, fontFamily: "'Source Sans 3'" }}>RECEIVING</p>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-[22px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.22px' }}>{update.dataMBUsed.toFixed(1)}</p>
                      <p className="text-[11px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>MB received</p>
                    </div>
                    <div className="w-px h-10" style={{ background: S.border }} />
                    <div className="text-center">
                      <p className="text-[22px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.22px' }}>{fmtDur(update.duration)}</p>
                      <p className="text-[11px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>Duration</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button onClick={() => { tunnel.leaveRoom(); setConnected(false); onBack(); }}
              className="mt-6 w-full py-2.5 text-[14px] font-normal text-white"
              style={{ borderRadius: '4px', background: S.label, fontFamily: "'Source Sans 3'" }}>Disconnect</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f6f9fc' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ borderBottom: `1px solid ${S.border}`, background: 'rgba(255,255,255,0.85)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '4px', background: S.white }}>
              <ArrowLeft />
            </button>
            <span className="text-[16px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.16px' }}>Join a Room</span>
          </div>
          <button onClick={() => setShowManual(!showManual)}
            className="text-[11px] font-medium px-2.5 py-1" style={{ border: `1px solid ${S.border}`, borderRadius: '4px', color: S.purple, background: S.white, fontFamily: "'Source Sans 3'" }}>
            {showManual ? 'Show rooms' : 'Enter code'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-[12px] mb-4" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 400 }}>
          {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available
        </p>
        {error && <div className="mb-4 p-3 rounded text-[12px]" style={{ background: 'rgba(234,34,97,0.05)', border: '1px solid rgba(234,34,97,0.15)', color: S.ruby, borderRadius: '4px', fontFamily: "'Source Sans 3'" }}>{error}</div>}

        {/* Room List */}
        {availableRooms.length > 0 && !showManual && (
          <div className="space-y-3 mb-6">
            {availableRooms.map((room: any) => (
              <button key={room.code} onClick={() => handleRoomClick(room)}
                className="w-full p-4 bg-white text-left transition-all hover:shadow-md"
                style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow3} 0px 15px 35px 0px` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[22px] font-light tracking-[0.08em]" style={{ color: S.navy, fontFamily: "'Source Code Pro'" }}>{room.code}</span>
                  <div className="flex items-center gap-2">
                    {room.hasPassword && <span className="text-[10px] flex items-center" style={{ color: S.lemon, fontFamily: "'Source Sans 3'", fontWeight: 400 }}><LockIcon /> Locked</span>}
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded" style={{
                      background: room.status === 'active' ? S.greenBg : S.white,
                      color: room.status === 'active' ? S.greenText : S.body,
                      border: `1px solid ${room.status === 'active' ? S.greenBorder : S.border}`,
                      borderRadius: '4px',
                      fontFamily: "'Source Sans 3'",
                    }}>
                      <span className={`w-[5px] h-[5px] rounded-[1px] ${room.status === 'active' ? 'bg-[#15be53] animate-pulse' : 'bg-[#64748d]'}`} />
                      {room.status === 'active' ? `${room.peerCount} connected` : 'Waiting'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>
                  {room.maxDataMB && <span>{room.maxDataMB}MB limit</span>}
                  {room.maxTimeMinutes && <span>{room.maxTimeMinutes}min limit</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {availableRooms.length === 0 && !showManual && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded" style={{ background: S.purpleBg, border: `1px solid ${S.purpleSoft}` }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={S.purple} strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0"/></svg>
            </div>
            <p className="text-[16px] font-light mb-1" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.16px' }}>No active rooms</p>
            <p className="text-[13px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>Waiting for donors to create rooms…</p>
          </div>
        )}

        {/* Manual entry */}
        {(showManual || availableRooms.length === 0) && (
          <div>
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              placeholder="ABCD" maxLength={4}
              className="w-full text-center text-[40px] font-light py-5 bg-white border text-[#061b31] placeholder:text-[#c8d4e0] focus:outline-none"
              style={{ borderColor: S.border, borderRadius: '4px', fontFamily: "'Source Code Pro'", letterSpacing: '0.12em' }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            {needPw && (
              <div className="mt-4">
                <p className="text-[11px] font-medium mb-1.5" style={{ color: S.label, fontFamily: "'Source Sans 3'" }}>This room is password protected</p>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                  className="w-full px-3 py-2.5 text-[14px] bg-white border text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
                  style={{ borderColor: S.border, borderRadius: '4px', fontFamily: "'Source Sans 3'", fontWeight: 300 }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()} />
              </div>
            )}
            <button onClick={handleJoin} disabled={code.length < 4}
              className="mt-4 w-full py-2.5 text-[14px] font-normal text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderRadius: '4px', background: S.purple, fontFamily: "'Source Sans 3'" }}>Connect</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<'home' | 'donor' | 'receiver'>('home');
  const [cs, setCs] = useState<ConnectionState>('disconnected');
  const tunnelRef = useRef<TunnelClient | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (auth.isAuthenticated()) {
      setAuthed(true);
      setUser(auth.getUser());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authed) return;
    const token = auth.getToken() || undefined;
    const tunnel = new TunnelClient(SERVER_URL, {
      onMessage: () => {},
      onStateChange: (s: ConnectionState) => setCs(s),
      token,
    });
    tunnelRef.current = tunnel;
    tunnel.connect();
    return () => tunnel.disconnect();
  }, [authed]);

  const handleAuth = () => { setAuthed(true); setUser(auth.getUser()); };
  const handleLogout = () => { auth.logout(); setAuthed(false); setUser(null); setScreen('home'); if (tunnelRef.current) tunnelRef.current.disconnect(); };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#f6f9fc' }}>
      <div className="w-6 h-6 rounded-[2px]" style={{ border: `2px solid ${S.border}`, borderTopColor: S.purple }} />
    </div>;
  }

  if (!authed) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div style={{ minHeight: '100vh', background: S.white }}>
      {screen === 'home' && <Home onSelect={(m) => { setScreen(m); if (m === 'donor') setTimeout(() => tunnelRef.current?.getRooms(), 500); }} user={user!} onLogout={handleLogout} />}
      {screen === 'donor' && <DonorDashboard tunnel={tunnelRef.current!} cs={cs} onBack={() => { setScreen('home'); tunnelRef.current?.leaveAll(); }} />}
      {screen === 'receiver' && <ReceiverJoin tunnel={tunnelRef.current!} onBack={() => setScreen('home')} />}
    </div>
  );
}

// ─── Donor Dashboard (Stripe Dark Section style) ────────────────────────────
function DonorDashboard({ tunnel, cs, onBack }: { tunnel: TunnelClient; cs: ConnectionState; onBack: () => void }) {
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [showCreateM, setShowCreateM] = useState(false);
  const [detailView, setDetailView] = useState<any | null>(null);

  useEffect(() => {
    tunnel.onMessage = (msg: ServerMessage) => {
      if (msg.type === 'room_list') setRoomsList(msg.rooms || []);
      else if (msg.type === 'room_created') { setTimeout(() => tunnel.getRooms(), 300); setShowCreateM(false); }
    };
    const interval = setInterval(() => tunnel.getRooms(), 3000);
    tunnel.getRooms();
    return () => { clearInterval(interval); tunnel.onMessage = () => {}; };
  }, [tunnel]);

  const createRoom = useCallback((config: RoomConfig) => tunnel.createRoom(config), [tunnel]);
  const closeRoom = useCallback((code: string) => tunnel.send('leave_room', { roomCode: code }), [tunnel]);

  // ── Detail View ──
  if (detailView) {
    return (
      <div className="min-h-screen" style={{ background: S.white }}>
        {/* Dark section header */}
        <div style={{ background: S.darkSection }}>
          <div className="max-w-lg mx-auto px-4 py-6">
            <button onClick={() => { setDetailView(null); tunnel.getRooms(); }}
              className="w-8 h-8 flex items-center justify-center rounded mb-5" style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            </button>
            <div className="text-center mb-6">
              <p className="text-[10px] tracking-[0.08em] mb-3" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Source Sans 3'", fontWeight: 400 }}>ROOM CODE</p>
              <span className="text-[48px] font-light tracking-[0.08em]" style={{ color: S.white, fontFamily: "'Source Code Pro'" }}>{detailView.code}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded" style={{
                background: detailView.status === 'active' ? S.greenBg : 'rgba(255,255,255,0.1)',
                color: detailView.status === 'active' ? S.greenText : 'rgba(255,255,255,0.7)',
                border: `1px solid ${detailView.status === 'active' ? S.greenBorder : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '4px',
                fontFamily: "'Source Sans 3'"
              }}>
                <span className={`w-[5px] h-[5px] rounded-[1px] ${detailView.status === 'active' ? 'bg-[#15be53] animate-pulse' : 'bg-[#64748d]'}`} />
                {detailView.status === 'active' ? `${detailView.peerCount || 0} peer${detailView.peerCount !== 1 ? 's' : ''}` : 'WAITING'}
              </span>
              {detailView.config?.password && <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded" style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Source Sans 3'" }}><LockIcon /> Password</span>}
              {detailView.config?.maxDataMB && <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded" style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Source Sans 3'" }}>{detailView.config.maxDataMB}MB limit</span>}
              {detailView.config?.maxTimeMinutes && <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded" style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Source Sans 3'" }}>{detailView.config.maxTimeMinutes}m limit</span>}
            </div>
          </div>
        </div>

        {/* Stats card */}
        <div className="max-w-lg mx-auto px-4 -mt-5 relative z-10">
          <div className="p-5 bg-white" style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow1} 0px 30px 45px -30px, ${S.shadow2} 0px 18px 36px -18px` }}>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-[10px] font-medium mb-1" style={{ color: S.body, fontFamily: "'Source Sans 3'" }}>DATA</p>
                <p className="text-[22px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.22px' }}>{detailView.dataMBUsed.toFixed(1)}</p>
                <p className="text-[10px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>MB</p>
              </div>
              <div className="w-px h-12" style={{ background: S.border }} />
              <div className="text-center">
                <p className="text-[10px] font-medium mb-1" style={{ color: S.body, fontFamily: "'Source Sans 3'" }}>DURATION</p>
                <p className="text-[22px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.22px' }}>{fmtDur(detailView.duration)}</p>
                <p className="text-[10px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>minutes</p>
              </div>
              <div className="w-px h-12" style={{ background: S.border }} />
              <div className="text-center">
                <p className="text-[10px] font-medium mb-1" style={{ color: S.body, fontFamily: "'Source Sans 3'" }}>PEERS</p>
                <p className="text-[22px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.22px' }}>{detailView.peerCount}</p>
                <p className="text-[10px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Peers list */}
        <div className="max-w-lg mx-auto px-4 mt-6">
          <p className="text-[10px] font-medium mb-3" style={{ color: S.body, fontFamily: "'Source Sans 3'" }}>RECEIVERS</p>
          {detailView.peerCount === 0 ? (
            <div className="text-center py-8" style={{ border: `1px solid ${S.border}`, borderRadius: '5px', background: S.white }}>
              <div className="flex justify-center gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-[13px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>Waiting for someone to join…</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: detailView.peerCount }).map((_, i) => (
                <PeerBadge key={i} data={detailView.dataMBUsed / Math.max(detailView.peerCount, 1)} label={`Peer ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Room List ──
  return (
    <div className="min-h-screen" style={{ background: '#f6f9fc' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-lg" style={{ borderBottom: `1px solid ${S.border}`, background: 'rgba(255,255,255,0.85)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '4px', background: S.white }}>
              <ArrowLeft />
            </button>
            <span className="text-[16px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.16px' }}>My Rooms</span>
          </div>
          <StatusBadge state={cs} small />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[26px] font-light" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.26px' }}>My Rooms</h2>
            <p className="text-[12px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>{roomsList.length} room{roomsList.length !== 1 ? 's' : ''} &bull; Donor</p>
          </div>
        </div>

        {/* Create room button (dashed) */}
        <button onClick={() => setShowCreateM(true)}
          className="w-full p-4 mb-6 flex items-center gap-3 bg-white rounded"
          style={{ border: `1px dashed ${S.purpleLight}`, borderRadius: '5px' }}>
          <div className="w-9 h-9 flex items-center justify-center rounded" style={{ background: S.purpleBg, borderRadius: '4px' }}>
            <Plus />
          </div>
          <span className="text-[14px] font-normal" style={{ color: S.purple, fontFamily: "'Source Sans 3'" }}>Create a new room</span>
        </button>
        <CreateRoomModal open={showCreateM} onClose={() => setShowCreateM(false)} onConfirm={(config) => createRoom(config)} />

        {roomsList.length === 0 && <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded" style={{ background: S.purpleBg, border: `1px solid ${S.purpleSoft}` }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={S.purple} strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          </div>
          <p className="text-[16px] font-light mb-1" style={{ color: S.navy, fontFamily: "'Source Sans 3'", letterSpacing: '-0.16px' }}>No rooms yet</p>
          <p className="text-[13px]" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>Create your first room to start sharing.</p>
        </div>}

        {/* Room cards */}
        <div className="space-y-4">
          {roomsList.map((room: any) => (
            <div key={room.code} className="p-5 bg-white" style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow3} 0px 15px 35px 0px` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[22px] font-light tracking-[0.08em]" style={{ color: S.navy, fontFamily: "'Source Code Pro'" }}>{room.code}</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded" style={{
                  background: room.status === 'active' ? S.greenBg : S.white,
                  color: room.status === 'active' ? S.greenText : S.body,
                  border: `1px solid ${room.status === 'active' ? S.greenBorder : S.border}`,
                  borderRadius: '4px',
                  fontFamily: "'Source Sans 3'",
                }}>
                  <span className={`w-[5px] h-[5px] rounded-[1px] ${room.status === 'active' ? 'bg-[#15be53] animate-pulse' : 'bg-[#64748d]'}`} />
                  {room.status === 'active' ? `${room.peerCount || 0} peer${room.peerCount !== 1 ? 's' : ''}` : 'WAITING'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] mb-4" style={{ color: S.body, fontFamily: "'Source Sans 3'", fontWeight: 300 }}>
                <span>{room.dataMBUsed.toFixed(1)} MB shared</span>
                <span>⏱ {fmtDur(room.duration)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDetailView(room)}
                  className="flex-1 py-2 text-[12px] font-normal text-white" style={{ background: S.purple, borderRadius: '4px', fontFamily: "'Source Sans 3'" }}>View</button>
                <button onClick={() => closeRoom(room.code)}
                  className="py-2 px-3 text-[12px] font-normal" style={{ border: `1px solid ${S.border}`, borderRadius: '4px', color: S.body, fontFamily: "'Source Sans 3'" }}>
                  <StopIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
