import { useState } from 'react';
import { Menu, X, Ticket as TicketIcon, Info, PhoneCall, FileText, Car, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  currentView: 'passenger' | 'driver' | 'admin';
  onNavigate: (view: 'passenger' | 'driver' | 'admin') => void;
  onOpenMyTickets: () => void;
  onOpenAbout: () => void;
  onOpenSupport: () => void;
  onOpenTerms: () => void;
  activeTicketCount?: number;
}

export function Header({
  currentView,
  onNavigate,
  onOpenMyTickets,
  onOpenAbout,
  onOpenSupport,
  onOpenTerms,
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
        {/* Empty left spacer to keep logo centered */}
        <div className="w-10 sm:w-24"></div>

        {/* Center: Glowing Green Road Pin Logo with 3 Rotating Orbits (Gold, Green, Blue) */}
        <div className="flex flex-col items-center justify-center text-center select-none py-1">
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

            {/* Center Green Road Pin Logo: No white box, direct on black with soft glow */}
            <div className="relative z-10 filter drop-shadow-[0_0_12px_rgba(34,197,94,0.7)] flex items-center justify-center transition-transform hover:scale-105">
              <svg
                width="34"
                height="44"
                viewBox="0 0 34 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Outer Map Pin Shape in Green */}
                <path
                  d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 42.5 16.1 43.8C16.6 44.1 17.4 44.1 17.9 43.8C19.5 42.5 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z"
                  fill="#10B981"
                />
                {/* Curved Road Highway inside pin in dark black/green */}
                <path
                  d="M11 25L13.5 9H20.5L23 25H11Z"
                  fill="#064E3B"
                />
                {/* Dashed white center road divider line */}
                <path
                  d="M17 11V14"
                  stroke="#FDE047"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M17 17V20"
                  stroke="#FDE047"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M17 22V24"
                  stroke="#FDE047"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
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
        <div className="w-10 sm:w-24 flex justify-end">
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
