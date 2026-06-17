import { useState, useEffect, useCallback, useRef } from 'react'
import { TunnelClient } from './services/tunnel'
import type { ConnectionState, ServerMessage, RoomConfig, RoomUpdate } from './services/tunnel'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001'

// ─── Stripe Design Tokens ───────────────────────────────────────────────────
const S = {
  purple: '#533afd', purpleHover: '#4434d4', purpleLight: '#b9b9f9',
  navy: '#061b31', label: '#273951', body: '#64748d', white: '#ffffff',
  border: '#e5edf5', darkSection: '#1c1e54',
  shadow: 'rgba(50,50,93,0.25)', shadowB: 'rgba(0,0,0,0.1)',
  green: '#15be53', greenBg: 'rgba(21,190,83,0.2)', greenText: '#108c3d', greenBorder: 'rgba(21,190,83,0.4)',
  ruby: '#ea2261',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtDur = (s: number) => { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; }

// ─── Inline SVG Icons ───────────────────────────────────────────────────────
const ArrowLeft = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>;
const Plus = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>;
const DataIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const KeyIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/></svg>;
const LockIcon = () => <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>;
const StopIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"/></svg>;
const WifiIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.746-5.747 15.06-5.747 20.808 0"/></svg>;

const StatusBadge = ({ state }: { state: ConnectionState }) => {
  const c: Record<string, { l: string; cls: string; dot: string }> = {
    disconnected: { l: 'OFFLINE', cls: 'bg-[#f6f9fc] text-[#64748d] border border-[#e5edf5]', dot: 'bg-[#64748d]' },
    connecting: { l: 'CONNECTING', cls: 'bg-white text-[#533afd] border border-[#b9b9f9]', dot: 'bg-[#533afd] animate-pulse' },
    connected: { l: 'ONLINE', cls: 'bg-white text-[#4434d4] border border-[#b9b9f9]', dot: 'bg-[#4434d4]' },
    paired: { l: 'ACTIVE', cls: 'bg-white border border-[rgba(21,190,83,0.4)] text-[#108c3d]', dot: 'bg-[#108c3d] animate-pulse' },
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-medium tracking-normal ${c[state].cls}`}>
      <span className={`w-[6px] h-[6px] rounded-[1px] ${c[state].dot}`} />
      {c[state].l}
    </span>
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
      <div className="w-full max-w-sm bg-white border p-6" style={{ borderColor: S.border, borderRadius: '5px', boxShadow: `${S.shadow} 0px 30px 60px -12px, ${S.shadowB} 0px 18px 36px -18px` }} onClick={e => e.stopPropagation()}>
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

// ─── Peer Badge ─────────────────────────────────────────────────────────────
const PeerBadge = ({ data, label }: { data: number; label: string }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded text-[12px]" style={{ border: `1px solid ${S.border}`, borderRadius: '4px' }}>
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-[1px] bg-[#15be53] animate-pulse" />
      <span className="text-[11px]" style={{ color: S.body }}>{label}</span>
    </div>
    <span className="text-[11px] font-medium" style={{ color: S.navy }}>{data.toFixed(1)} MB</span>
  </div>
);

// ─── Home Screen ────────────────────────────────────────────────────────────
const Home = ({ onSelect }: { onSelect: (mode: 'donor' | 'receiver') => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: S.white }}>
    <div className="w-full max-w-md px-6 py-12 text-center">
      <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded" style={{ background: 'rgba(83,58,253,0.05)', border: '1px solid rgba(83,58,253,0.2)' }}>
        <WifiIcon />
      </div>
      <h1 className="text-4xl font-light mb-2" style={{ color: S.navy, letterSpacing: '-0.96px' }}>ShareNet</h1>
      <p className="text-[16px] mb-10" style={{ color: S.body, fontWeight: 300 }}>Share your internet. Receive from others. Peer-to-peer relay.</p>

      <div className="space-y-4">
        <button onClick={() => onSelect('donor')}
          className="w-full p-5 bg-white text-left rounded transition-all hover:shadow-md"
          style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow} 0px 14px 28px -12px, ${S.shadowB} 0px 8px 18px -8px` }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center rounded shrink-0" style={{ background: S.purple }}><WifiIcon /></div>
            <div>
              <h3 className="text-[18px] font-light" style={{ color: S.navy, letterSpacing: '-0.18px' }}>Share Internet</h3>
              <p className="text-[13px]" style={{ color: S.body, fontWeight: 300 }}>Create rooms, invite receivers, share your bandwidth</p>
            </div>
          </div>
        </button>

        <button onClick={() => onSelect('receiver')}
          className="w-full p-5 bg-white text-left rounded transition-all hover:shadow-md"
          style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow} 0px 14px 28px -12px, ${S.shadowB} 0px 8px 18px -8px` }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 flex items-center justify-center rounded shrink-0" style={{ border: `1px solid ${S.purpleLight}` }}><KeyIcon /></div>
            <div>
              <h3 className="text-[18px] font-light" style={{ color: S.navy, letterSpacing: '-0.18px' }}>Receive Internet</h3>
              <p className="text-[13px]" style={{ color: S.body, fontWeight: 300 }}>Enter a room code and start receiving</p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-10 inline-flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: '#f6f9fc', border: `1px solid ${S.border}` }}>
        <span className="w-[6px] h-[6px] rounded-[1px] bg-[#533afd] animate-pulse" />
        <span className="text-[10px]" style={{ color: S.body, fontWeight: 500 }}>Multi-room &bull; Multi-peer &bull; Real-time relay</span>
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
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: S.white }}>
        <div className="w-full max-w-sm px-6 text-center">
          <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center rounded" style={{ background: S.greenBg }}>
            <span className="text-2xl" style={{ color: S.greenText }}>✓</span>
          </div>
          <h2 className="text-[22px] font-light mb-1" style={{ color: S.navy, letterSpacing: '-0.22px' }}>Connected</h2>
          <span className="text-lg font-bold tracking-widest" style={{ color: S.purple, fontFamily: "'Source Code Pro', monospace" }}>{code}</span>
          {update && (
            <div className="mt-6 text-left space-y-3">
              <div className="p-4 rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '5px' }}>
                <p className="text-[10px] font-medium mb-2" style={{ color: S.body }}>RECEIVING</p>
                <div className="flex items-center justify-between text-[14px]">
                  <span className="flex items-center gap-1"><DataIcon /> {update.dataMBUsed.toFixed(1)} MB</span>
                  <span className="flex items-center gap-1"><ClockIcon /> {fmtDur(update.duration)}</span>
                </div>
              </div>
            </div>
          )}
          <button onClick={() => { tunnel.leaveRoom(); setConnected(false); onBack(); }}
            className="mt-6 w-full py-2.5 text-[14px] font-normal text-white" style={{ borderRadius: '4px', background: '#64748d' }}>Disconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: S.white }}>
      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: S.border }}>
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-4">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '4px' }}><ArrowLeft /></button>
          <button onClick={() => setShowManual(!showManual)}
            className="text-[12px] font-medium px-3 py-1.5 rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '4px', color: S.purple }}>
            {showManual ? 'Show rooms' : 'Enter code'}
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <h2 className="text-[26px] font-light mb-1" style={{ color: S.navy, letterSpacing: '-0.26px' }}>Join a Room</h2>
        <p className="text-[14px] mb-6" style={{ color: S.body, fontWeight: 300 }}>{availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available</p>

        {error && <div className="mb-4 p-3 rounded text-[12px]" style={{ background: 'rgba(234,34,97,0.05)', border: '1px solid rgba(234,34,97,0.15)', color: S.ruby }}>{error}</div>}

        {availableRooms.length > 0 && !showManual && (
          <div className="space-y-3 mb-6">
            {availableRooms.map(room => (
              <button key={room.code} onClick={() => handleRoomClick(room)}
                className="w-full p-4 bg-white text-left rounded transition-all hover:shadow-md"
                style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow} 0px 14px 28px -12px, ${S.shadowB} 0px 8px 18px -8px` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold tracking-widest" style={{ color: S.navy, fontFamily: "'Source Code Pro', monospace" }}>{room.code}</span>
                  <div className="flex items-center gap-2">
                    {room.hasPassword && <span className="flex items-center text-[11px]" style={{ color: S.purple }}><LockIcon /> &nbsp;Locked</span>}
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 ${room.status === 'active' ? 'text-[#108c3d]' : 'text-[#64748d]'}`}
                      style={{ background: room.status === 'active' ? S.greenBg : '#f6f9fc', border: `1px solid ${room.status === 'active' ? S.greenBorder : S.border}`, borderRadius: '4px' }}>
                      <span className={`w-[4px] h-[4px] rounded-[1px] ${room.status === 'active' ? 'bg-[#15be53] animate-pulse' : 'bg-[#64748d]'}`} />
                      {room.status === 'active' ? `${room.peerCount} connected` : 'Waiting'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px]" style={{ color: S.body }}>
                  {room.maxDataMB && <span><DataIcon /> {room.maxDataMB}MB limit</span>}
                  {room.maxTimeMinutes && <span><ClockIcon /> {room.maxTimeMinutes}min</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {availableRooms.length === 0 && !showManual && (
          <div className="text-center py-10">
            <div className="mb-3" style={{ fontSize: '32px' }}>🔌</div>
            <p className="text-[14px]" style={{ color: S.body, fontWeight: 300 }}>No active rooms right now</p>
            <p className="text-[12px] mt-1" style={{ color: S.body }}>Waiting for donors to create rooms…</p>
          </div>
        )}

        {(showManual || availableRooms.length === 0) && (
          <div className="pt-2">
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              placeholder="ABCD" maxLength={4}
              className="w-full text-center text-4xl font-bold py-4 bg-white border text-[#061b31] placeholder:text-[#c8d4e0] focus:outline-none"
              style={{ borderColor: S.border, borderRadius: '4px', fontFamily: "'Source Code Pro', monospace", letterSpacing: '0.12em' }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()} />
            {needPw && (
              <div className="mt-4">
                <p className="text-[11px] font-medium text-left mb-1.5" style={{ color: S.body }}>This room is password protected</p>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                  className="w-full px-3 py-2.5 text-[14px] bg-white border text-[#061b31] placeholder:text-[#64748d] focus:outline-none"
                  style={{ borderColor: S.border, borderRadius: '4px' }} onKeyDown={e => e.key === 'Enter' && handleJoin()} />
              </div>
            )}
            <button onClick={handleJoin} disabled={code.length < 4}
              className="mt-4 w-full py-2.5 text-[14px] font-normal text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ borderRadius: '4px', background: S.purple }}>Connect</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState<'home' | 'donor' | 'receiver'>('home');
  const [cs, setCs] = useState<ConnectionState>('disconnected');
  const tunnelRef = useRef<TunnelClient | null>(null);

  useEffect(() => {
    const tunnel = new TunnelClient(SERVER_URL, { onMessage: () => {}, onStateChange: (s: ConnectionState) => setCs(s) });
    tunnelRef.current = tunnel;
    tunnel.connect();
    return () => tunnel.disconnect();
  }, []);

  return (
    <div style={{ background: S.white, minHeight: '100vh' }}>
      {screen === 'home' && <Home onSelect={(m) => { setScreen(m); if (m === 'donor') setTimeout(() => tunnelRef.current?.getRooms(), 500); }} />}
      {screen === 'donor' && <DonorDashboard tunnel={tunnelRef.current!} cs={cs} onBack={() => { setScreen('home'); tunnelRef.current?.leaveAll(); }} />}
      {screen === 'receiver' && <ReceiverJoin tunnel={tunnelRef.current!} onBack={() => setScreen('home')} />}
      <div className="fixed bottom-0 left-0 right-0 text-center py-3 text-[10px] font-medium" style={{ borderTop: `1px solid ${S.border}`, background: S.white, color: S.body }}>
        <span className="inline-flex items-center gap-2">
          <span className="w-[4px] h-[4px] rounded-[1px] bg-[#533afd]" /> PEER-TO-PEER INTERNET RELAY
        </span>
      </div>
    </div>
  );
}

// ─── Donor Dashboard ────────────────────────────────────────────────────────
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

  if (detailView) {
    return (
      <div className="min-h-screen" style={{ background: S.white }}>
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={() => { setDetailView(null); tunnel.getRooms(); }}
            className="w-9 h-9 flex items-center justify-center rounded mb-6" style={{ border: `1px solid ${S.border}`, borderRadius: '4px' }}><ArrowLeft /></button>
          <div className="mb-6 p-5 rounded text-center" style={{ background: S.darkSection }}>
            <p className="text-[10px] tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>ROOM CODE</p>
            <span className="text-5xl font-bold tracking-[0.08em]" style={{ color: S.white, fontFamily: "'Source Code Pro', monospace" }}>{detailView.code}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1"
              style={{ background: S.greenBg, color: S.greenText, border: `1px solid ${S.greenBorder}`, borderRadius: '4px' }}>
              <span className="w-[4px] h-[4px] rounded-[1px] bg-[#15be53] animate-pulse" />
              {detailView.status === 'active' ? `${detailView.peerCount || 0} peer${detailView.peerCount !== 1 ? 's' : ''}` : 'WAITING'}
            </span>
            {detailView.config?.password && <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1" style={{ background: '#f6f9fc', border: `1px solid ${S.border}`, borderRadius: '4px' }}><LockIcon /> Password</span>}
            {detailView.config?.maxDataMB && <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1" style={{ background: '#f6f9fc', border: `1px solid ${S.border}`, borderRadius: '4px' }}><DataIcon /> {detailView.config.maxDataMB}MB</span>}
            {detailView.config?.maxTimeMinutes && <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1" style={{ background: '#f6f9fc', border: `1px solid ${S.border}`, borderRadius: '4px' }}><ClockIcon /> {detailView.config.maxTimeMinutes}m</span>}
          </div>
          <div className="p-4 mb-5 rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '5px' }}>
            <p className="text-[10px] font-medium mb-1" style={{ color: S.body }}>SESSION</p>
            <div className="flex items-center justify-between text-[13px]" style={{ color: S.body }}>
              <span className="flex items-center gap-1"><DataIcon /> {detailView.dataMBUsed.toFixed(1)} MB</span>
              <span className="flex items-center gap-1"><ClockIcon /> {fmtDur(detailView.duration)}</span>
            </div>
          </div>
          <p className="text-[10px] font-medium mb-2" style={{ color: S.body }}>RECEIVERS</p>
          {detailView.peerCount === 0 ? (
            <div className="text-center py-8">
              <div className="flex justify-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-[1px] bg-[#533afd] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-[13px]" style={{ color: S.body, fontWeight: 300 }}>Waiting for someone to join…</p>
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

  return (
    <div className="min-h-screen" style={{ background: S.white }}>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '4px' }}><ArrowLeft /></button>
          <StatusBadge state={cs} />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[26px] font-light" style={{ color: S.navy, letterSpacing: '-0.26px' }}>My Rooms</h2>
            <p className="text-[13px]" style={{ color: S.body, fontWeight: 300 }}>{roomsList.length} room{roomsList.length !== 1 ? 's' : ''}</p>
          </div>
          <span className="px-3 py-1.5 text-[11px] font-medium rounded" style={{ background: '#f6f9fc', border: `1px solid ${S.border}`, borderRadius: '4px', color: S.purple }}>Donor</span>
        </div>
        <button onClick={() => setShowCreateM(true)}
          className="w-full p-4 mb-5 text-left flex items-center gap-3 bg-white rounded transition-all"
          style={{ border: `1px dashed ${S.purpleLight}`, borderRadius: '5px' }}>
          <div className="w-9 h-9 flex items-center justify-center rounded" style={{ background: 'rgba(83,58,253,0.05)' }}><Plus /></div>
          <span className="text-[14px] font-normal" style={{ color: S.purple }}>Create a new room</span>
        </button>
        <CreateRoomModal open={showCreateM} onClose={() => setShowCreateM(false)} onConfirm={(config) => createRoom(config)} />
        {roomsList.length === 0 && <div className="text-center py-12"><p className="text-[14px]" style={{ color: S.body, fontWeight: 300 }}>No rooms yet.</p></div>}
        <div className="space-y-4">
          {roomsList.map(room => (
            <div key={room.code} className="p-5 bg-white rounded" style={{ border: `1px solid ${S.border}`, borderRadius: '5px', boxShadow: `${S.shadow} 0px 14px 28px -12px, ${S.shadowB} 0px 8px 18px -8px` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold tracking-widest" style={{ color: S.navy, fontFamily: "'Source Code Pro', monospace" }}>{room.code}</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1" style={{
                  background: room.status === 'active' ? S.greenBg : '#f6f9fc',
                  color: room.status === 'active' ? S.greenText : S.body,
                  border: `1px solid ${room.status === 'active' ? S.greenBorder : S.border}`,
                  borderRadius: '4px',
                }}>
                  <span className={`w-[4px] h-[4px] rounded-[1px] ${room.status === 'active' ? 'bg-[#15be53] animate-pulse' : 'bg-[#64748d]'}`} />
                  {room.status === 'active' ? `${room.peerCount || 0} peer${room.peerCount !== 1 ? 's' : ''}` : 'WAITING'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] mb-4" style={{ color: S.body }}>
                <span className="flex items-center gap-1"><DataIcon /> {room.dataMBUsed.toFixed(1)} MB</span>
                <span className="flex items-center gap-1"><ClockIcon /> {fmtDur(room.duration)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDetailView(room)}
                  className="flex-1 py-2 text-[12px] font-normal text-white rounded" style={{ background: S.purple, borderRadius: '4px' }}>View</button>
                <button onClick={() => closeRoom(room.code)}
                  className="py-2 px-3 text-[12px] font-normal rounded border" style={{ borderColor: S.border, color: S.body, borderRadius: '4px' }}><StopIcon /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
