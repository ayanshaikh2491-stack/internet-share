import { Shield, Globe, Coins, ArrowRight, Server, Radio, Cpu, LogOut } from 'lucide-react';
import type { UserProfile, ActiveView } from '../types';

interface HomeScreenProps {
  user: UserProfile;
  onSelectView: (view: ActiveView) => void;
  onLogout: () => void;
}

export default function HomeScreen({ user, onSelectView, onLogout }: HomeScreenProps) {
  return (
    <div id="home-screen-root" className="bg-[#ffffff] flex flex-col w-full">
      {/* Top Professional Header matching High Density style */}
      <header className="h-16 border-b border-[#e5edf5] px-6 md:px-8 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
        <h1 className="text-[20px] md:text-[22px] font-light text-[#061b31] tracking-[-0.5px]">Dashboard Overview</h1>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f9f4] text-[#15be53] text-[11px] font-medium rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-[#15be53] animate-pulse" />
            <span>Active & Operational</span>
          </div>
          <button
            onClick={onLogout}
            className="text-[11px] font-medium px-2.5 py-1 border border-[#e5edf5] rounded-[4px] text-[#64748d] hover:bg-[#f8fafc] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 md:py-16 space-y-12">
        {/* Pitch Hero Header */}
        <div id="hero-header" className="max-w-2xl">
          <h1 className="text-[40px] md:text-[48px] font-light tracking-[-0.96px] text-[#061b31] leading-[1.1]">
            Global Decentralized <br />
            <span className="text-[#533afd] font-normal">Network Resource Gateway</span>
          </h1>
          <p className="mt-4 text-[14px] font-light text-[#64748d] leading-relaxed max-w-xl">
            Rent out unused downstream connection capacities to peer clients or route localized connections over verified global nodes using Stripe-grade automated accounting pipelines.
          </p>
        </div>

        {/* Global Pool & Performance Metrics Block */}
        <div 
          id="global-metrics" 
          className="grid grid-cols-1 md:grid-cols-4 border border-[#e5edf5] rounded-[5px] bg-white divide-y md:divide-y-0 md:divide-x divide-[#e5edf5] shadow-[0px_15px_35px_0px_rgba(23,23,23,0.03)]"
        >
          <div className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#e5edf5]/30 text-[#533afd] rounded-full">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Total Live Traffic</p>
              <h4 className="text-[20px] font-light text-[#061b31]">482.91 Gbps <span className="text-xs text-[#15be53] font-medium">▲ 14%</span></h4>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#e5edf5]/30 text-[#533afd] rounded-full">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Active Global Nodes</p>
              <h4 className="text-[20px] font-light text-[#061b31]">12,419 <span className="text-xs text-[#64748d]">Live Swarm</span></h4>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#e5edf5]/30 text-[#533afd] rounded-full">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Verified Integrity</p>
              <h4 className="text-[20px] font-light text-[#061b31]">99.98% <span className="text-xs text-[#15be53] font-medium">Uptime Guarantee</span></h4>
            </div>
          </div>

          <div className="p-5 flex items-center gap-4">
            <div className="p-3 bg-[#e5edf5]/30 text-[#533afd] rounded-full">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#273951]">Your Accrued Account</p>
              <h4 className="text-[20px] font-light text-[#061b31]">${user.totalEarnings.toFixed(2)} USD</h4>
            </div>
          </div>
        </div>

        {/* Dual Mode Choices */}
        <div id="role-selections" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Option A: Donor Card */}
          <div 
            id="card-mode-donor"
            className="group bg-white border border-[#e5edf5] rounded-[5px] p-8 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.06),_0px_18px_36px_-18px_rgba(0,0,0,0.08)] hover:border-[#533afd]/50 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded bg-[#533afd]/10 text-[#533afd] group-hover:scale-105 transition-transform duration-200">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider rounded bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/10">
                  Provide Nodes
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[24px] font-light text-[#061b31] tracking-tight group-hover:text-[#533afd] transition-colors">
                  Share Bandwidth (Donor)
                </h3>
                <p className="text-[14px] font-light text-[#64748d] leading-relaxed">
                  Contribute your surplus localized bandwidth. Monetize idle residential networks continuously. Our background socket maintains reliable and safe relay pipelines for validated corporations.
                </p>
              </div>

              <div className="border-t border-[#e5edf5] pt-5 space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-light text-[#64748d]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#15be53]" />
                  <span>Configurable upload rates up to 100 Mbps</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-light text-[#64748d]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#15be53]" />
                  <span>Instant payouts directly in USD credits ($0.15 / GB)</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-light text-[#64748d]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#15be53]" />
                  <span>Real-time connections visual tracker</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                id="btn-goto-donor"
                onClick={() => onSelectView('donor')}
                className="w-full px-6 py-3.5 text-[14px] font-normal text-white bg-[#533afd] rounded-[4px] hover:opacity-95 transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_6px_rgba(50,50,93,0.11)]"
              >
                <span>Launch Sharing Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Option B: Receiver Card */}
          <div 
            id="card-mode-receiver"
            className="group bg-white border border-[#e5edf5] rounded-[5px] p-8 shadow-[0px_15px_35px_0px_rgba(23,23,23,0.06),_0px_18px_36px_-18px_rgba(0,0,0,0.08)] hover:border-[#533afd]/50 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded bg-[#533afd]/10 text-[#533afd] group-hover:scale-105 transition-transform duration-200">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider rounded bg-slate-100 text-[#061b31] border border-slate-200">
                  Acquire Pipeline
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[24px] font-light text-[#061b31] tracking-tight group-hover:text-[#533afd] transition-colors">
                  Receive Connection (Client)
                </h3>
                <p className="text-[14px] font-light text-[#64748d] leading-relaxed">
                  Route applets, code structures, or workflows through standard geographical residential backdoors. Ideal for scraping localization datasets or testing regional latency models.
                </p>
              </div>

              <div className="border-t border-[#e5edf5] pt-5 space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-light text-[#64748d]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#533afd]" />
                  <span>Choose from 12 high-performance geographic hubs</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-light text-[#64748d]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#533afd]" />
                  <span>Multi-layer AES tunnel configuration options</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] font-light text-[#64748d]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#533afd]" />
                  <span>Detailed connection health logs and metrics</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button
                id="btn-goto-receiver"
                onClick={() => onSelectView('receiver')}
                className="w-full px-6 py-3.5 text-[14px] font-normal text-[#533afd] bg-white border border-[#b9b9f9] rounded-[4px] hover:bg-[#533afd]/[0.03] transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Initialize Receiver Tunnel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Footnote information regarding data & limits */}
        <div id="footer-explainer" className="p-4 bg-slate-50 border border-[#e5edf5] rounded-[4px] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Shield className="w-4 h-4 text-[#533afd]" />
            <span className="text-[12px] font-light text-slate-500">All data packets and relays strictly pass metadata filtration profiles. No client credentials are stored.</span>
          </div>
          <span className="text-[11px] font-mono text-[#273951] bg-[#e5edf5]/50 px-2 py-0.5 rounded">
            API Core Connection: Localhost Socket Secure
          </span>
        </div>
      </main>
    </div>
  );
}
