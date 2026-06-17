import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Square, Shield, Globe } from 'lucide-react';
import type { UserProfile, RegionOption } from '../types';

interface ReceiverJoinProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onBack: () => void;
}

export default function ReceiverJoin({ user, onUpdateUser, onBack }: ReceiverJoinProps) {
  const [regions] = useState<RegionOption[]>([
    { id: 'reg1', name: 'US East (Virginia)', flag: '🇺🇸', latency: 22, bandwidthCap: '1 Gbps' },
    { id: 'reg2', name: 'EU Central (Frankfurt)', flag: '🇩🇪', latency: 14, bandwidthCap: '1 Gbps' },
    { id: 'reg3', name: 'Asia East (Tokyo)', flag: '🇯🇵', latency: 45, bandwidthCap: '500 Mbps' },
    { id: 'reg4', name: 'Asia SE (Singapore)', flag: '🇸🇬', latency: 38, bandwidthCap: '800 Mbps' },
    { id: 'reg5', name: 'UK South (London)', flag: '🇬🇧', latency: 18, bandwidthCap: '1 Gbps' },
  ]);

  const [selectedRegionId, setSelectedRegionId] = useState<string>('reg2'); // Default to Frankfurt
  const [tunnelType, setTunnelType] = useState<string>('socks5'); // SOCKS5, HTTP, VPN
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectingStep, setConnectingStep] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0); // in MB/s
  const [uploadSpeed, setUploadSpeed] = useState<number>(0); // in MB/s
  const [packetLoss, setPacketLoss] = useState<number>(0.0);
  const [currentLatency, setCurrentLatency] = useState<number>(0);
  const [totalDownloaded, setTotalDownloaded] = useState<number>(user.totalDownloadedBytes);

  const activeRegion = regions.find(r => r.id === selectedRegionId) || regions[0];
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepsList = [
    'Synthesizing secure workspace keystores...',
    'Interfacing with cloud relay cluster master...',
    `Discovering premium residential donor nodes in ${activeRegion.name}...`,
    'Negotiating TLS double-nested nested handshakes (AES-256)...',
    'Auditing packet stream integrity... Tunnel established!'
  ];

  const handleToggleConnection = () => {
    if (connectionState === 'disconnected') {
      setConnectionState('connecting');
      setConnectingStep(0);
      
      // Simulate sequential step activation
      let currentStep = 0;
      const stepInterval = setInterval(() => {
        currentStep++;
        if (currentStep < stepsList.length) {
          setConnectingStep(currentStep);
        } else {
          clearInterval(stepInterval);
          setConnectionState('connected');
          // Start actual connection simulation
          setDownloadSpeed(42.84);
          setUploadSpeed(6.12);
          setCurrentLatency(activeRegion.latency);
          setPacketLoss(0.01);
        }
      }, 900);
      
    } else {
      setConnectionState('disconnected');
      setDownloadSpeed(0);
      setUploadSpeed(0);
      setCurrentLatency(0);
      setPacketLoss(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  // Live traffic ticker if connected
  useEffect(() => {
    if (connectionState === 'connected') {
      intervalRef.current = setInterval(() => {
        // Fluctuating download speed
        const newDownload = 35 + Math.random() * 20; // 35-55 MB/s
        const newUpload = 4 + Math.random() * 4; // 4-8 MB/s
        setDownloadSpeed(parseFloat(newDownload.toFixed(2)));
        setUploadSpeed(parseFloat(newUpload.toFixed(2)));

        // Micro bytes consumed accumulator
        const bytesAdd = Math.floor(newDownload * 1024 * 1024);
        setTotalDownloaded(prev => {
          const next = prev + bytesAdd;
          return next;
        });

        // Small latency drift
        setCurrentLatency(activeRegion.latency + Math.floor(Math.random() * 4 - 2));
        setPacketLoss(parseFloat((Math.random() * 0.05).toFixed(3)));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connectionState, selectedRegionId]);

  // Sync profile data back, tracking usage in main app
  useEffect(() => {
    onUpdateUser({
      ...user,
      totalDownloadedBytes: totalDownloaded
    });
  }, [totalDownloaded]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0.00 GB';
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div id="receiver-root" className="bg-[#ffffff] flex flex-col w-full">
      {/* 
        Requirement: "Dark section: #1c1e54 (auth left panel, room detail header)"
        Header styled with Stripe dark color 
      */}
      <header id="receiver-dark-header" className="bg-[#1c1e54] text-white py-6 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <button 
              id="btn-receiver-back"
              onClick={onBack}
              className="p-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-wider uppercase text-[#c2bdfa]">Secure Transit Pipeline</span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${connectionState === 'connected' ? 'bg-[#15be53] animate-pulse' : connectionState === 'connecting' ? 'bg-amber-400 animate-spin border-t-transparent border border-white' : 'bg-rose-500'}`} />
              </div>
              <h2 className="text-[20px] font-light tracking-tight text-white">
                Client Pipeline Connection Hub
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-medium tracking-wide uppercase text-[#c2bdfa]">Active Gateway Endpoint</p>
              <p className="text-[14px] font-mono text-white/90">
                {connectionState === 'connected' ? `frankfurt-swarm-de19.socks` : 'inactive_pipeline_session'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main id="receiver-main" className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Configuration Settings */}
        <div className="space-y-6">
          <div id="card-route-settings" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)] space-y-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Conduit Parameters</p>
              <h3 className="text-[18px] font-light text-[#061b31]">Pipeline Configuration</h3>
            </div>

            {/* Region Dropdown Selector */}
            <div className="space-y-2">
              <label htmlFor="select-region" className="text-[11px] font-medium uppercase tracking-wider text-[#273951] block font-sans">
                Target Relay Region
              </label>
              <div className="relative">
                <select
                  id="select-region"
                  disabled={connectionState !== 'disconnected'}
                  value={selectedRegionId}
                  onChange={(e) => setSelectedRegionId(e.target.value)}
                  className="w-full px-3.5 py-3 border border-[#e5edf5] rounded-[4px] bg-white text-[14px] font-light text-[#061b31] focus:outline-none focus:border-[#533afd] disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer transition-colors"
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.flag} {r.name} (Avg Latency: {r.latency}ms)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Protocol Selector */}
            <div className="space-y-2">
              <label htmlFor="select-protocol-tunnel" className="text-[11px] font-medium uppercase tracking-wider text-[#273951] block font-sans">
                Tunnel Integrity Protocol
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="btn-proto-socks5"
                  type="button"
                  disabled={connectionState !== 'disconnected'}
                  onClick={() => setTunnelType('socks5')}
                  className={`py-2 text-[12px] font-medium rounded-[4px] border uppercase tracking-wider transition-all cursor-pointer ${
                    tunnelType === 'socks5'
                      ? 'border-[#533afd] bg-[#533afd]/5 text-[#533afd]'
                      : 'border-[#e5edf5] text-slate-500 hover:bg-slate-50 disabled:opacity-50'
                  }`}
                >
                  SOCKS5
                </button>
                <button
                  id="btn-proto-http"
                  type="button"
                  disabled={connectionState !== 'disconnected'}
                  onClick={() => setTunnelType('http')}
                  className={`py-2 text-[12px] font-medium rounded-[4px] border uppercase tracking-wider transition-all cursor-pointer ${
                    tunnelType === 'http'
                      ? 'border-[#533afd] bg-[#533afd]/5 text-[#533afd]'
                      : 'border-[#e5edf5] text-slate-500 hover:bg-slate-50 disabled:opacity-50'
                  }`}
                >
                  HTTP Proxy
                </button>
                <button
                  id="btn-proto-vpn"
                  type="button"
                  disabled={connectionState !== 'disconnected'}
                  onClick={() => setTunnelType('vpn')}
                  className={`py-2 text-[12px] font-medium rounded-[4px] border uppercase tracking-wider transition-all cursor-pointer ${
                    tunnelType === 'vpn'
                      ? 'border-[#533afd] bg-[#533afd]/5 text-[#533afd]'
                      : 'border-[#e5edf5] text-slate-500 hover:bg-slate-50 disabled:opacity-50'
                  }`}
                >
                  AES VPN
                </button>
              </div>
            </div>

            {/* Security Profile Disclaimer */}
            <div className="bg-[#f8fafc] border border-[#e5edf5] p-4 rounded text-slate-600 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#533afd]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#061b31]">Tunnel Perimeter Safe</span>
              </div>
              <p className="text-[11.5px] font-light leading-relaxed">
                Relaying is end-to-end encrypted with zero hardware trace on host. Dynamic key-rotations are enforced every 600 cycles to prevent deep payload surveillance.
              </p>
            </div>

            {/* BIG TRIGGER BUTTON */}
            <button
              id="btn-tunnel-power"
              onClick={handleToggleConnection}
              disabled={connectionState === 'connecting'}
              className={`w-full px-6 py-3.5 text-[14px] font-normal rounded-[4px] flex items-center justify-center gap-2 transition-all cursor-pointer text-white ${
                connectionState === 'connected'
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_4px_6px_rgba(239,68,68,0.11)]'
                  : 'bg-[#533afd] hover:opacity-95 shadow-[0_4px_6px_rgba(83,58,253,0.11)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {connectionState === 'disconnected' && (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Establish Proxy Tunnel</span>
                </>
              )}
              {connectionState === 'connecting' && (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Establishing Conduit...</span>
                </>
              )}
              {connectionState === 'connected' && (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Disconnect Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Middle and Right Columns: Status Metrics & Interactive Connection Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Connection establishing log screens */}
          {connectionState === 'connecting' && (
            <div id="connecting-terminal" className="bg-[#1c1e54] text-white p-6 rounded-[5px] shadow-lg font-mono text-[13px] leading-relaxed space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[11px] tracking-wider uppercase text-[#c2bdfa]">Secure Tunnel Pipeline Setup</span>
                </div>
                <span className="text-[11px] text-white/50">TLS Handshake v3.1</span>
              </div>

              <div className="space-y-2">
                {stepsList.map((step, idx) => {
                  if (idx < connectingStep) {
                    return (
                      <p key={idx} className="text-[#15be53] flex items-center gap-2">
                        <span>✔</span>
                        <span>{step}</span>
                      </p>
                    );
                  } else if (idx === connectingStep) {
                    return (
                      <p key={idx} className="text-amber-400 flex items-center gap-2 animate-pulse">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>{step}</span>
                      </p>
                    );
                  } else {
                    return (
                      <p key={idx} className="text-white/30 flex items-center gap-2">
                        <span>○</span>
                        <span>{step}</span>
                      </p>
                    );
                  }
                })}
              </div>

              <div className="pt-2 text-center text-[10px] text-white/40">
                Connection is being provisioned. Please wait...
              </div>
            </div>
          )}

          {/* Connected Telemetry Console */}
          <div id="telemetry-grid-parent" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)] space-y-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Live Telemetry Console</p>
              <h3 className="text-[18px] font-light text-[#061b31]">Active Data Conduit Monitor</h3>
            </div>

            {connectionState === 'disconnected' ? (
              <div className="py-12 text-center border border-dashed border-[#e5edf5] rounded-[4px] bg-[#f8fafc] text-[#64748d]">
                <Globe className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-bounce" />
                <h4 className="text-[15px] font-medium text-[#061b31] mb-1">Tunnel Pipeline Suspended</h4>
                <p className="text-[12px] font-light max-w-sm mx-auto">
                  Select your region param and protocol format, then launch the gateway tunnel using the control console in the left panel.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 2x2 Telemetry Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-[#e5edf5] rounded">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Download Velocity</p>
                    <p className="text-[24px] font-light text-[#533afd] font-mono mt-1">
                      {downloadSpeed.toFixed(2)} <span className="text-xs font-sans text-[#64748d]">MB/s</span>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-[#e5edf5] rounded">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Upload Velocity</p>
                    <p className="text-[24px] font-light text-[#061b31] font-mono mt-1">
                      {uploadSpeed.toFixed(2)} <span className="text-xs font-sans text-slate-600">MB/s</span>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-[#e5edf5] rounded">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Session Ping RT</p>
                    <p className="text-[24px] font-light text-[#15be53] font-mono mt-1">
                      {currentLatency} <span className="text-xs font-sans text-[#64748d]">ms</span>
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-[#e5edf5] rounded">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Packet Leakage</p>
                    <p className="text-[24px] font-light text-[#ea2261] font-mono mt-1">
                      {packetLoss}% <span className="text-xs font-sans text-slate-600">Loss</span>
                    </p>
                  </div>
                </div>

                {/* Sub routing specs */}
                <div className="bg-[#f8fafc] border border-[#e5edf5] rounded-[4px] p-4 flex flex-col md:flex-row justify-between gap-4 text-[13px] font-light">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-medium text-[10px] uppercase">Proxy Host IP Address</p>
                    <p className="text-[#061b31] font-mono">198.51.100.{Math.floor(10 + Math.random() * 89)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-medium text-[10px] uppercase">Accumulated Consumption Session</p>
                    <p className="text-[#061b31] font-sans font-medium">{formatBytes(totalDownloaded)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-medium text-[10px] uppercase">Node Encryption ID</p>
                    <p className="text-[#533afd] font-mono">AES-256-GCM-TUNNEL</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Historical sessions table */}
          <div id="card-transit-logs" className="bg-white border border-[#e5edf5] rounded-[5px] p-6 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.04)]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951] mb-2">Transit Logs</p>
            <h4 className="text-[16px] font-light text-[#061b31] mb-4">Historical connections proxy telemetry</h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5edf5] text-[11px] uppercase tracking-wider text-[#64748d]">
                    <th className="pb-3 font-medium">Gateway Node Spec</th>
                    <th className="pb-3 font-medium">Network Prot.</th>
                    <th className="pb-3 font-medium text-right">Data Exchanged</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5edf5] text-[13px] font-light text-[#061b31]">
                  <tr>
                    <td className="py-3 font-mono">Frankfurt-Cluster-DE4</td>
                    <td className="py-3 uppercase text-slate-500 font-mono">socks5</td>
                    <td className="py-3 text-right font-mono">2.14 GB</td>
                    <td className="py-3 text-right">
                      <span className="text-[#64748d] inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                        Closed
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-mono">Tokyo-Residential-JP9</td>
                    <td className="py-3 uppercase text-slate-500 font-mono">http proxy</td>
                    <td className="py-3 text-right font-mono">1.82 GB</td>
                    <td className="py-3 text-right">
                      <span className="text-[#64748d] inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                        Closed
                      </span>
                    </td>
                  </tr>
                  {connectionState === 'connected' && (
                    <tr className="text-[#533afd] animate-pulse">
                      <td className="py-3 font-mono">{activeRegion.name.split(' ')[0]}-Tunnel-Core</td>
                      <td className="py-3 uppercase font-mono">{tunnelType}</td>
                      <td className="py-3 text-right font-mono">{formatBytes(totalDownloaded - user.totalDownloadedBytes)}</td>
                      <td className="py-3 text-right">
                        <span className="text-[#15be53] inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-50 border border-green-100 text-[11px] font-medium">
                          Active Stream
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
