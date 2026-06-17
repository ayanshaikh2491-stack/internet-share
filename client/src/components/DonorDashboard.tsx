import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Shield, Coins, Play, Square, Radio } from 'lucide-react';
import type { UserProfile, PeerSession, ChartDataPoint } from '../types';

interface DonorDashboardProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onBack: () => void;
}

export default function DonorDashboard({ user, onUpdateUser, onBack }: DonorDashboardProps) {
  const [isSharing, setIsSharing] = useState<boolean>(true);
  const [sharingSpeed, setSharingSpeed] = useState<number>(12.42); // in MB/s
  const [totalShared, setTotalShared] = useState<number>(user.totalSharedBytes); // starting from user profile
  const [earnings, setEarnings] = useState<number>(user.totalEarnings); // starting from user profile
  const [bandwidthLimit, setBandwidthLimit] = useState<number>(50); // Mbps limit slider
  const [peers, setPeers] = useState<PeerSession[]>([
    { id: 'p1', ip: '142.250.31.100', location: 'Frankfurt, DE', connectedAt: '39m ago', dataTransferred: 1420000000, speed: 4.2 * 1024 * 1024, status: 'active' },
    { id: 'p2', ip: '34.120.254.12', location: 'Tokyo, JP', connectedAt: '12m ago', dataTransferred: 480000000, speed: 2.1 * 1024 * 1024, status: 'active' },
    { id: 'p3', ip: '8.8.8.8', location: 'California, US', connectedAt: '1h 5m ago', dataTransferred: 4200000000, speed: 6.12 * 1024 * 1024, status: 'active' },
  ]);

  // Rolling chart state
  const [chartData, setChartData] = useState<ChartDataPoint[]>([
    { time: '09:12:00', speed: 8.4 },
    { time: '09:12:10', speed: 10.2 },
    { time: '09:12:20', speed: 9.1 },
    { time: '09:12:30', speed: 12.4 },
    { time: '09:12:40', speed: 14.8 },
    { time: '09:12:50', speed: 11.2 },
    { time: '09:13:00', speed: 13.0 },
    { time: '09:13:10', speed: 12.42 },
  ]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live simulation block
  useEffect(() => {
    if (isSharing) {
      intervalRef.current = setInterval(() => {
        // 1. Simulate minor speed jitter
        const speedMultiplier = (0.9 + Math.random() * 0.2); // fluctuation
        const targetSpeed = Math.min((bandwidthLimit / 8) * speedMultiplier, 25); // cap speed depending on user throttle slider
        setSharingSpeed(parseFloat(targetSpeed.toFixed(2)));

        // 2. Count bytes shared (approx sharingSpeed * 1MB per second)
        const bytesSharedThisTick = Math.floor(targetSpeed * 1024 * 1024);
        setTotalShared(prev => {
          const next = prev + bytesSharedThisTick;
          // Sync to parent/local storage occasionally
          return next;
        });

        // 3. Increment earnings ($0.15 per GB = approx $0.00015 per MB or 0.000000143 USD per byte)
        const earningThisTick = (bytesSharedThisTick / (1024 * 1024 * 1024)) * 0.15;
        setEarnings(prev => prev + earningThisTick);

        // 4. Update peer transfer rates occasionally
        setPeers(prevPeers => 
          prevPeers.map(p => {
            const transferIncrement = Math.floor(p.speed * (0.8 + Math.random() * 0.4));
            return {
              ...p,
              dataTransferred: p.dataTransferred + transferIncrement,
              speed: isSharing ? (1.5 + Math.random() * 4.5) * 1024 * 1024 : 0
            };
          })
        );

        // 5. Build dynamic chart update
        setChartData(prevData => {
          const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });
          const updated = [...prevData, { time: nowStr, speed: targetSpeed }];
          if (updated.length > 12) {
            updated.shift();
          }
          return updated;
        });

      }, 1000);
    } else {
      setSharingSpeed(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSharing, bandwidthLimit]);

  // Sync profile data to upper state on unmount / occasionally
  useEffect(() => {
    onUpdateUser({
      ...user,
      totalSharedBytes: totalShared,
      totalEarnings: earnings
    });
  }, [totalShared, earnings]);

  const toggleSharing = () => {
    setIsSharing(!isSharing);
  };

  // Helper formatting values
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0.00 GB';
    const k = 1000; // Use metric representation for clean standard statistics
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // SVG Area rendering equations
  const maxVal = Math.max(...chartData.map(d => d.speed), 10);
  const width = 600;
  const height = 150;
  const points = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1)) * width;
    const y = height - (d.speed / maxVal) * (height - 20) - 10;
    return { x, y };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  return (
    <div id="donor-dashboard-root" className="bg-[#ffffff] flex flex-col w-full">
      {/* 
        Requirement: "Dark section: #1c1e54 (auth left panel, room detail header)"
        Applying search room metadata header with Stripe system dark coloring 
      */}
      <header id="donor-dark-banner" className="bg-[#1c1e54] text-white py-6 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <button 
              id="btn-donor-back"
              onClick={onBack}
              className="p-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-wider uppercase text-[#c2bdfa]">Live Gateway Connection</span>
                <span className={`inline-block w-2 h-2 rounded-full ${isSharing ? 'bg-[#15be53] animate-pulse' : 'bg-rose-500'}`} />
              </div>
              <h2 className="text-[20px] font-light tracking-tight text-white">
                Bandwidth Donor Node Console
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="text-right">
              <p className="text-[10px] font-medium tracking-wide uppercase text-[#c2bdfa]">Stripe Ledger Balance</p>
              <p className="text-[18px] font-mono font-medium text-white">${earnings.toFixed(4)} <span className="text-xs font-sans text-emerald-400">USD</span></p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content body in white max-width container */}
      <main id="donor-main" className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2/3: Live Tracking and charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Node controller card */}
          <div id="card-node-status" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-[#e5edf5]">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Live Switch Console</span>
                  {isSharing ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded bg-[#15be53]/10 text-[#15be53] border border-[#15be53]/20">
                      Active Share
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded bg-gray-100 text-[#64748d] border border-gray-200">
                      Pipelining Paused
                    </span>
                  )}
                </div>
                <h3 className="text-[20px] font-light text-[#061b31]">
                  {isSharing ? 'Sharing Excess Bandwidth Active' : 'Relay Gateway in Inactive Safe Mode'}
                </h3>
              </div>

              <button
                id="toggle-sharing-switch"
                onClick={toggleSharing}
                className={`px-6 py-2.5 text-[14px] font-normal rounded-[4px] flex items-center gap-2 transition-all cursor-pointer ${
                  isSharing 
                    ? 'bg-rose-50 border border-rose-200 text-[#ea2261] hover:bg-rose-100/50' 
                    : 'bg-[#533afd] text-white hover:opacity-95'
                }`}
              >
                {isSharing ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Sharing Session</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Bandwidth Sharing</span>
                  </>
                )}
              </button>
            </div>

            {/* Micro details counter layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Current Speed</p>
                <p className="text-[28px] font-light text-[#061b31]">
                  {isSharing ? `${sharingSpeed.toFixed(2)}` : '0.00'} <span className="text-xs font-normal text-[#64748d]">MB/s</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Total Shared Today</p>
                <p className="text-[28px] font-light text-[#061b31] font-sans">
                  {formatBytes(totalShared)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Network Fee Rate</p>
                <p className="text-[28px] font-light text-[#061b31]">
                  $0.15 <span className="text-xs font-normal text-[#64748d]">/ GB</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Active Peers Connected</p>
                <p className="text-[28px] font-light text-[#061b31]">
                  {isSharing ? peers.length : '0'} <span className="text-xs font-normal text-[#64748d]">Nodes</span>
                </p>
              </div>
            </div>
          </div>

          {/* SVG Custom Area Graph - Stripe style lines */}
          <div id="card-throughput-graph" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Bandwidth Telemetry Stream</p>
                <h4 className="text-[16px] font-light text-[#061b31]">Session Output Over time (MB/s)</h4>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748d]">
                <Clock className="w-3.5 h-3.5" />
                <span>Simulated realtime 1s feed</span>
              </div>
            </div>

            {/* Custom SVG Drawing Area */}
            <div className="w-full bg-[#f8fafc] border border-[#e5edf5] rounded p-3 relative h-48 flex items-end">
              {!isSharing && (
                <div className="absolute inset-0 bg-[#f8fafc]/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10">
                  <Radio className="w-8 h-8 text-slate-300 mb-2 animate-pulse" />
                  <p className="text-[14px] font-light text-[#061b31]">Graph Stream Suspended</p>
                  <p className="text-[11px] font-light text-[#64748d]">Toggle standard sharing node to observe localized bandwidth metrics</p>
                </div>
              )}

              <svg 
                className="w-full h-full overflow-visible"
                viewBox={`0 0 ${width} ${height}`} 
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#533afd" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#533afd" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* X and Y Grid dotted helpers */}
                <line x1="0" y1="35" x2={width} y2="35" stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="0" y1="70" x2={width} y2="70" stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth="1" />
                <line x1="0" y1="105" x2={width} y2="105" stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth="1" />

                {/* Area path */}
                {isSharing && (
                  <>
                    <path d={areaD} fill="url(#purpleGradient)" />
                    <path d={pathD} fill="none" stroke="#533afd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                {/* Draw dynamic data dot at the latest point */}
                {isSharing && points.length > 0 && (
                  <circle 
                    cx={points[points.length - 1].x} 
                    cy={points[points.length - 1].y} 
                    r="5" 
                    fill="#533afd" 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                    className="shadow-md"
                  />
                )}
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#64748d] font-mono mt-3 px-1">
              <span>{chartData[0]?.time}</span>
              <span>Capacity Cap: {bandwidthLimit} Mbps ({(bandwidthLimit/8).toFixed(1)} MB/s)</span>
              <span>{chartData[chartData.length - 1]?.time}</span>
            </div>
          </div>

          {/* Connected Peers table list */}
          <div id="card-peers" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951] mb-2">Connected Peer Conduits</p>
            <h4 className="text-[16px] font-light text-[#061b31] mb-4">Active geographical bandwidth consumption sessions</h4>

            {!isSharing ? (
              <div className="py-8 text-center text-slate-400 font-light text-sm border border-dashed border-slate-200 rounded">
                No active target routing peers while node is suspended.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e5edf5] text-[11px] uppercase tracking-wider text-[#64748d]">
                      <th className="pb-3 font-medium">Virtual Client IP</th>
                      <th className="pb-3 font-medium">Geographic Location</th>
                      <th className="pb-3 font-medium text-right">Consumption</th>
                      <th className="pb-3 font-medium text-right">Current Speed</th>
                      <th className="pb-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5edf5]">
                    {peers.map(p => (
                      <tr key={p.id} className="text-[13px] font-light hover:bg-[#f8fafc]/50">
                        <td className="py-3 font-mono text-[#061b31]">{p.ip}</td>
                        <td className="py-3 text-[#64748d]">{p.location}</td>
                        <td className="py-3 text-right text-[#061b31]">{formatBytes(p.dataTransferred)}</td>
                        <td className="py-3 text-right font-mono text-[#533afd]">{(p.speed / (1024 * 1024)).toFixed(2)} MB/s</td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#15be53] font-medium bg-[#15be53]/10 px-2 py-0.5 rounded border border-[#15be53]/15">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#15be53] animate-pulse" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right 1/3: Settings controls & Payout parameters */}
        <div className="space-y-6">
          
          {/* Quick Balance accounting settlement */}
          <div id="card-payout" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)] space-y-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Account Liquidation</p>
              <h3 className="text-[20px] font-light text-[#061b31]">Settlement Details</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-[13px] font-light">
                <span className="text-[#64748d]">Accrued Balance:</span>
                <span className="font-semibold text-[#061b31]">${earnings.toFixed(4)} USD</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-light">
                <span className="text-[#64748d]">Minimum Payout Threshold:</span>
                <span className="text-[#061b31] font-mono">$10.00 USD</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-light">
                <span className="text-[#64748d]">Active Payout Wallet:</span>
                <span className="text-[#533afd] font-mono truncate max-w-[150px]" title={user.email}>
                  {user.email.split('@')[0]}...@stripe
                </span>
              </div>

              {/* Progress Bar to Settlement */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-medium uppercase text-[#64748d]">
                  <span>Liquidation Readiness</span>
                  <span>{Math.min((earnings / 10) * 100, 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#e5edf5] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#533afd] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((earnings / 10) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Payout Action button */}
            <button
              id="btn-trigger-payout"
              disabled={earnings < 10}
              className="w-full px-6 py-3 text-[13px] font-normal text-white bg-[#533afd] rounded-[4px] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Request Ledger Liquidation</span>
            </button>
            <p className="text-[11px] text-[#64748d] font-light text-center leading-normal">
              Proceeds will be cleared directly through your associated Stripe billing index.
            </p>
          </div>

          {/* Node Tuning Settings Panel */}
          <div id="card-tuning" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)] space-y-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Cap Parameters</p>
              <h3 className="text-[20px] font-light text-[#061b31]">Bandwidth Valve</h3>
            </div>

            {/* Throttle slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-[13px] font-light">
                <span className="text-[#64748d]">Upstream Limit cap:</span>
                <span className="font-semibold text-[#533afd]">{bandwidthLimit} Mbps</span>
              </div>
              <input
                id="input-limit-slider"
                type="range"
                min="5"
                max="100"
                step="5"
                value={bandwidthLimit}
                onChange={(e) => setBandwidthLimit(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#e5edf5] rounded-lg appearance-none cursor-pointer accent-[#533afd]"
              />
              <div className="flex justify-between text-[10px] text-[#64748d] font-mono">
                <span>5 Mbps</span>
                <span>50 Mbps</span>
                <span>100 Mbps (Max)</span>
              </div>
            </div>

            {/* Sub settings parameters */}
            <div className="space-y-4 pt-4 border-t border-[#e5edf5]">
              <div className="flex items-start gap-2.5">
                <input 
                  id="chk-encrypted-only" 
                  type="checkbox" 
                  defaultChecked 
                  className="w-4.5 h-4.5 border-[#e5edf5] rounded text-[#533afd] focus:ring-0 mt-0.5" 
                />
                <div>
                  <label htmlFor="chk-encrypted-only" className="text-[13px] font-medium text-[#273951] block cursor-pointer">
                    Force Secured TLS Only
                  </label>
                  <span className="text-[11px] font-light text-[#64748d] block leading-normal">
                    Rejects non-secured proxy pipelines to guarantee device firewall safety.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <input 
                  id="chk-allow-residential" 
                  type="checkbox" 
                  defaultChecked 
                  className="w-4.5 h-4.5 border-[#e5edf5] rounded text-[#533afd] focus:ring-0 mt-0.5" 
                />
                <div>
                  <label htmlFor="chk-allow-residential" className="text-[13px] font-medium text-[#273951] block cursor-pointer">
                    Residential Masking Mode
                  </label>
                  <span className="text-[11px] font-light text-[#64748d] block leading-normal">
                    Exposes node strictly as a general home socket for high value corp scrapers.
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#f8fafc] border border-[#e5edf5] p-3 rounded flex gap-2">
              <Shield className="w-4 h-4 text-[#533afd] shrink-0 mt-0.5" />
              <p className="text-[11px] font-light text-[#273951] leading-relaxed">
                Firewall Guard active. Sharing redundant bandwidth has zero access rights to local disks or private configurations.
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
