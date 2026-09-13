import { useState } from 'react';
import {
  Menu,
  X,
  Ticket as TicketIcon,
  Info,
  PhoneCall,
  FileText,
  Car,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { OlexLogo } from './OlexLogo';

interface HeaderProps {
  currentView: 'passenger' | 'driver' | 'admin';
  onNavigate: (view: 'passenger' | 'driver' | 'admin') => void;
  onOpenMyTickets: () => void;
  onOpenAbout: () => void;
  onOpenSupport: () => void;
  onOpenTerms: () => void;
  onOpenGalaxy?: () => void;
  activeTicketCount?: number;
}

export function Header({
  currentView,
  onNavigate,
  onOpenMyTickets,
  onOpenAbout,
  onOpenSupport,
  onOpenTerms,
  onOpenGalaxy,
  activeTicketCount = 0,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative w-full bg-black border-b border-zinc-800/80 px-4 py-3 sm:py-4 z-40">
      {/* Portal switcher pill at very top for testing ease */}
      <div className="max-w-5xl mx-auto flex items-center justify-between pb-2 mb-2 border-b border-zinc-900/90 text-xs">
        <div className="flex items-center space-x-2 text-zinc-400 font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>LAUNCH BASE: <strong className="text-emerald-400">OL KALOU</strong>, NYANDARUA</span>
        </div>
        <div className="flex items-center space-x-1 bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800">
          <button
            id="nav-passenger-btn"
            onClick={() => onNavigate('passenger')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1.5 ${
              currentView === 'passenger'
                ? 'bg-amber-500 text-black shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Passenger</span>
            {activeTicketCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
          <button
            id="nav-driver-btn"
            onClick={() => onNavigate('driver')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1.5 ${
              currentView === 'driver'
                ? 'bg-emerald-500 text-black shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Driver</span>
          </button>
          <button
            id="nav-admin-btn"
            onClick={() => onNavigate('admin')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1.5 ${
              currentView === 'admin'
                ? 'bg-amber-400 text-black shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-5xl mx-auto flex items-center justify-between relative">
        {/* Left: 3D Galaxy Button */}
        <div className="w-auto sm:w-28 flex items-center">
          {onOpenGalaxy && (
            <button
              onClick={onOpenGalaxy}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-emerald-500/40 text-emerald-400 hover:text-white hover:border-amber-400 transition-all text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95"
              title="Launch 3D Galaxy Globe with moving stars"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">3D Galaxy</span>
            </button>
          )}
        </div>

        {/* Center: Glowing Green Road Pin Logo with 3 Rotating Orbits (Gold, Green, Blue) */}
        <div
          onClick={onOpenGalaxy}
          className={`flex flex-col items-center justify-center text-center select-none py-1 ${
            onOpenGalaxy ? 'cursor-pointer group' : ''
          }`}
          title={onOpenGalaxy ? 'Click to open 3D Galaxy Globe' : undefined}
        >
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Orbit 3 (Outer): Blue */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-[spin_30s_linear_infinite]">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] absolute -top-[3px] left-1/2 -translate-x-1/2" />
            </div>

            {/* Orbit 2 (Middle): Green */}
            <div className="absolute inset-2 rounded-full border border-emerald-400/50 animate-[spin_22s_linear_infinite_reverse]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] absolute top-1/2 -right-[3px] -translate-y-1/2" />
            </div>

            {/* Orbit 1 (Inner): Gold */}
            <div className="absolute inset-4 rounded-full border border-amber-400/60 animate-[spin_16s_linear_infinite]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] absolute -bottom-[3px] left-1/2 -translate-x-1/2" />
            </div>

            {/* Center Green Road Pin Logo: Exact uploaded logo with inner circular cutout and curved highway */}
            <div className="relative z-10 filter drop-shadow-[0_0_14px_rgba(34,197,94,0.85)] flex items-center justify-center transition-transform group-hover:scale-110">
              <OlexLogo size={42} showGlow />
            </div>
          </div>

          {/* Below Logo: Gold text OlexPress and small white text Your Ride Everywhere */}
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-wider text-amber-400 font-['Plus_Jakarta_Sans',sans-serif]">
            OlexPress
          </h1>
          <p className="text-xs sm:text-sm font-medium tracking-wide text-zinc-100">
            Your Ride Everywhere
          </p>
        </div>

        {/* Top right: Menu button (three lines) */}
        <div className="w-auto sm:w-28 flex justify-end">
          <button
            id="menu-toggle-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu dropdown options */}
      {menuOpen && (
        <div className="absolute right-4 top-full mt-2 w-64 rounded-xl bg-zinc-950 border border-amber-500/40 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
            <p className="text-xs text-amber-400 font-mono font-semibold">OLEXPRESS MENU</p>
            <p className="text-[11px] text-zinc-400">Nyandarua Base • Kenya Wide</p>
          </div>

          {onOpenGalaxy && (
            <button
              id="menu-galaxy-btn"
              onClick={() => {
                setMenuOpen(false);
                onOpenGalaxy();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-900 hover:text-emerald-400 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>3D Galaxy Globe</span>
            </button>
          )}

          <button
            id="menu-my-tickets-btn"
            onClick={() => {
              setMenuOpen(false);
              onOpenMyTickets();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-900 hover:text-amber-400 transition-colors"
          >
            <TicketIcon className="w-4 h-4 text-amber-400" />
            <span>My Tickets</span>
          </button>

          <button
            id="menu-about-btn"
            onClick={() => {
              setMenuOpen(false);
              onOpenAbout();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-900 hover:text-amber-400 transition-colors"
          >
            <Info className="w-4 h-4 text-emerald-400" />
            <span>About</span>
          </button>

          <button
            id="menu-support-btn"
            onClick={() => {
              setMenuOpen(false);
              onOpenSupport();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-900 hover:text-amber-400 transition-colors"
          >
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <span>Support</span>
          </button>

          <button
            id="menu-terms-btn"
            onClick={() => {
              setMenuOpen(false);
              onOpenTerms();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-zinc-200 hover:bg-zinc-900 hover:text-amber-400 transition-colors"
          >
            <FileText className="w-4 h-4 text-zinc-400" />
            <span>Terms</span>
          </button>

          <div className="border-t border-zinc-900 my-1 pt-1">
            <p className="px-3 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
              Portals
            </p>
            <button
              onClick={() => {
                setMenuOpen(false);
                onNavigate('driver');
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-emerald-400 hover:bg-zinc-900 transition-colors"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Driver Dashboard (http://driver.html)</span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onNavigate('admin');
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-amber-400 hover:bg-zinc-900 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
