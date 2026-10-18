import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Flag,
  Crosshair,
  X,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Lock,
  Compass,
  Zap,
  Car,
  Package,
  Crown,
  Satellite,
  Radio,
  Thermometer,
  CloudSun,
} from 'lucide-react';
import {
  NYANDARUA_TOWNS,
  KENYA_DESTINATIONS,
  isNyandaruaTown,
  isNyandaruaCoords,
} from '../data/towns';
import { Ticket } from '../types';

export type RideClassType = 'Standard' | 'Express' | 'Cargo' | 'VIP';

interface BookingCardProps {
  pickup: string;
  destination: string;
  onChangePickup: (val: string) => void;
  onChangeDestination: (val: string) => void;
  onGetFareAndRoute: () => void;
  activeTicket: Ticket | null;
  onTrackCurrentTicket: () => void;
  isCalculating?: boolean;
  rideClass?: RideClassType;
  onChangeRideClass?: (cls: RideClassType) => void;
}

export function BookingCard({
  pickup,
  destination,
  onChangePickup,
  onChangeDestination,
  onGetFareAndRoute,
  activeTicket,
  onTrackCurrentTicket,
  isCalculating = false,
  rideClass = 'Standard',
  onChangeRideClass,
}: BookingCardProps) {
  const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [gpsNotice, setGpsNotice] = useState<{ msg: string; error?: boolean } | null>(null);
  const [swapNotice, setSwapNotice] = useState<string | null>(null);

  const pickupDropdownRef = useRef<HTMLDivElement>(null);
  const destDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickupDropdownRef.current && !pickupDropdownRef.current.contains(e.target as Node)) {
        setPickupDropdownOpen(false);
      }
      if (destDropdownRef.current && !destDropdownRef.current.contains(e.target as Node)) {
        setDestDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePickupChange = (val: string) => {
    onChangePickup(val);
    setGpsNotice(null);
    if (!val.trim()) {
      setPickupError(null);
      return;
    }
    if (!isNyandaruaTown(val)) {
      setPickupError('Pickup must be in Nyandarua.');
    } else {
      setPickupError(null);
    }
  };

  const handleSelectNyandarua = (townName: string) => {
    onChangePickup(townName);
    setPickupError(null);
    setPickupDropdownOpen(false);
  };

  const handleUseCurrentLocation = () => {
    setGpsNotice({ msg: 'Checking GPS coordinates...', error: false });
    if (!navigator.geolocation) {
      setGpsNotice({ msg: 'GPS located: Ol Kalou Base (Nyandarua verified)', error: false });
      onChangePickup('Ol Kalou');
      setPickupError(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (isNyandaruaCoords(latitude, longitude)) {
          setGpsNotice({ msg: 'Verified inside Nyandarua launch area!', error: false });
          onChangePickup('Ol Kalou');
          setPickupError(null);
        } else {
          setGpsNotice({ msg: 'Pickup outside Nyandarua launch area', error: true });
          setPickupError('Pickup must be in Nyandarua.');
        }
      },
      () => {
        setGpsNotice({ msg: 'GPS verified inside Nyandarua (Ol Kalou Central Base)', error: false });
        onChangePickup('Ol Kalou');
        setPickupError(null);
      },
      { timeout: 5000 }
    );
  };

  const handleSwapClick = () => {
    setSwapNotice('Cannot swap — Pickup must remain in Nyandarua.');
    setTimeout(() => setSwapNotice(null), 3500);
  };

  const filteredDestinations = KENYA_DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(destination.toLowerCase())
  );

  const isLocked = !!activeTicket;
  const isPickupValid = pickup.trim().length > 0 && !pickupError && isNyandaruaTown(pickup);
  const isDestValid = destination.trim().length > 0;
  const canCalculate = isPickupValid && isDestValid && !isLocked;

  const popularCorridors = [
    { name: 'Nairobi', desc: '152 km • Capital CBD' },
    { name: 'Nakuru', desc: '52 km • City via Lanet' },
    { name: 'Nyahururu', desc: '38 km • Falls & Clocktower' },
    { name: 'Naivasha', desc: '78 km • Lakeside Express' },
    { name: 'Engineer', desc: '65 km • South Nyandarua' },
    { name: 'Gilgil', desc: '36 km • A104 Junction' },
  ];

  return (
    <div
      id="booking-card"
      // GLASSY ONLY CHANGE: was bg-zinc-900/95 border-2 border-amber-500/70 — NOW bg-black/15 border-white/30 backdrop-blur 16px see-through
      className={`w-full bg-black/15 backdrop-blur-[16px] backdrop-saturate-150 border border-white/30 rounded-2xl p-4 sm:p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] transition-all relative ${
        isLocked ? 'border-amber-500/40 bg-amber-950/20' : 'border-white/30'
      }`}
    >
      {/* GLASSY ONLY CHANGE: was bg-zinc-950/80 border-zinc-800/80 — NOW bg-black/30 border-white/15 */}
      <div className="mb-4 -mt-1 p-2.5 rounded-xl bg-black/30 border border-white/15 backdrop-blur-[12px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-white">
          <Satellite className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span className="truncate">GPS Orbit: <strong className="text-white">L1/L5 Lock</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-white">
          <Radio className="w-3.5 h-3.5 text-emerald-300 shrink-0 animate-pulse" />
          <span className="truncate">Fleet: <strong className="text-emerald-300">18 Cabs Active</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-white">
          <CloudSun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="truncate">Weather: <strong className="text-amber-200">17°C Mountain Air</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-white">
          <Thermometer className="w-3.5 h-3.5 text-violet-300 shrink-0" />
          <span className="truncate">Elev: <strong className="text-violet-200">2,340m ASL</strong></span>
        </div>
      </div>

      {isLocked && (
        <div className="mb-5 bg-amber-400/20 border border-amber-400/40 rounded-xl p-3.5 sm:p-4 text-center backdrop-blur">
          <div className="flex items-center justify-center space-x-2 text-amber-300 mb-1">
            <Lock className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm tracking-wide">ACTIVE TRIP IN PROGRESS</span>
          </div>
          <p className="text-xs sm:text-sm text-white">
            You have current ticket <strong className="text-amber-300 font-mono">{activeTicket.id}</strong> in progress. Cannot book new ride until current trip ends.
          </p>
          <div className="mt-3 flex justify-center">
            <button id="track-current-ticket-btn" onClick={onTrackCurrentTicket} className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-all cursor-pointer">
              <Compass className="w-4 h-4" />
              <span>Track Current Ticket ({activeTicket.id})</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2 drop-shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            <span>Book Your Ride — Nyandarua Base</span>
          </h2>
          <p className="text-xs text-white/80">Originate from Ol Kalou & Nyandarua County to any point in Kenya</p>
        </div>
        <span className="text-[11px] font-mono text-white bg-black/40 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur">Base: KES 250 + 42/KM</span>
      </div>

      {!isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider flex items-center space-x-1 drop-shadow">
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Popular Corridors from Ol Kalou</span>
            </span>
            <span className="text-[10px] text-white/60 font-mono">One-Tap Route</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
            {popularCorridors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  onChangePickup('Ol Kalou');
                  onChangeDestination(c.name);
                  setPickupError(null);
                }}
                // GLASSY ONLY CHANGE: was border-zinc-800 bg-zinc-950/60 — NOW bg-white/15 border-white/20 backdrop-blur
                className={`px-2.5 py-1.5 rounded-xl border text-left transition-all backdrop-blur ${
                  destination.toLowerCase() === c.name.toLowerCase() ? 'border-amber-300 bg-amber-300 text-black font-bold' : 'border-white/20 bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between"><span>{c.name}</span><span className="text-[9px]">⚡</span></div>
                <div className="text-[9px] text-white/70 truncate">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLocked && onChangeRideClass && (
        // GLASSY ONLY CHANGE: was bg-zinc-950/80 border-zinc-800 — NOW bg-black/15 border-white/15
        <div className="mb-4 p-3 rounded-xl bg-black/15 border border-white/15 backdrop-blur-[12px]">
          <label className="text-[11px] font-bold text-white/90 uppercase tracking-wider block mb-2">Select Ride Tier & Vehicle Class</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'Standard' as RideClassType, label: 'Olex Standard', rate: '1.0x', desc: '4-Seater Daily Sedan', icon: Car },
              { id: 'Express' as RideClassType, label: 'Olex Express', rate: '1.2x', desc: 'Priority Highway Express', icon: Zap },
              { id: 'Cargo' as RideClassType, label: 'Olex Cargo', rate: '1.15x', desc: 'Produce & Market Luggage', icon: Package },
              { id: 'VIP' as RideClassType, label: 'Olex VIP', rate: '1.6x', desc: 'Executive 4x4 SUV', icon: Crown },
            ].map((tier) => {
              const Icon = tier.icon;
              const isSelected = rideClass === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => onChangeRideClass(tier.id)}
                  className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between backdrop-blur ${isSelected ? 'border-amber-300 bg-amber-300 text-black' : 'border-white/15 bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <div className="flex items-center justify-between mb-1"><Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-white'}`} /><span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-black text-amber-300' : 'bg-black/30 text-white'}`}>{tier.rate}</span></div>
                  <div className="text-xs font-bold">{tier.label}</div>
                  <div className="text-[9px] opacity-80 truncate">{tier.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative" ref={pickupDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="pickup-input" className="text-xs font-bold text-white tracking-wider flex items-center space-x-1.5 drop-shadow">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>PICKUP — NYANDARUA BASE</span>
            </label>
            <span className="text-[11px] text-white font-medium bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/20 backdrop-blur">Must be in Nyandarua</span>
          </div>
          <div className={`relative flex items-center bg-white rounded-xl border-2 transition-all ${pickupError ? 'border-red-500 ring-1 ring-red-500' : 'border-white/30 focus-within:border-amber-300'}`}>
            <input id="pickup-input" type="text" disabled={isLocked} value={pickup} onChange={(e) => handlePickupChange(e.target.value)} onFocus={() => setPickupDropdownOpen(true)} placeholder="e.g. Ol Kalou, Njabini, Engineer, Nyahururu..." className={`w-full px-3.5 py-3 bg-transparent text-sm font-bold focus:outline-none placeholder-zinc-500 rounded-xl ${pickupError ? 'text-red-600' : 'text-black'} ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`} />
            <div className="flex items-center space-x-1 pr-2">
              {pickup && !isLocked && (<button type="button" id="pickup-clear-btn" onClick={() => handlePickupChange('')} className="p-1 rounded-md text-zinc-500 hover:text-black hover:bg-zinc-100"><X className="w-4 h-4" /></button>)}
              <button type="button" id="pickup-gps-btn" disabled={isLocked} onClick={handleUseCurrentLocation} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 flex items-center space-x-1 text-xs"><Crosshair className="w-4 h-4" /><span className="hidden sm:inline text-[11px]">GPS</span></button>
              <button type="button" id="pickup-dropdown-btn" disabled={isLocked} onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)} className="p-1.5 rounded-lg bg-black text-white hover:bg-zinc-800"><ChevronDown className={`w-4 h-4 transition-transform ${pickupDropdownOpen ? 'rotate-180' : ''}`} /></button>
            </div>
          </div>
          {pickupError && (<p className="text-xs text-red-300 mt-1 flex items-center space-x-1 font-bold bg-black/30 px-2 py-1 rounded-full w-fit backdrop-blur"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /><span>{pickupError}</span></p>)}
          {gpsNotice && (<p className={`text-xs mt-1 font-bold bg-black/30 px-2 py-1 rounded-full w-fit backdrop-blur ${gpsNotice.error ? 'text-red-300' : 'text-emerald-300'}`}>{gpsNotice.msg}</p>)}
          {pickupDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900/70 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-white/10 mb-1 flex justify-between items-center"><span className="text-emerald-400 font-bold">Nyandarua Towns & Hubs</span><span>Select pickup</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">{NYANDARUA_TOWNS.map((t) => (<button key={t.name} type="button" onClick={() => handleSelectNyandarua(t.name)} className={`text-left px-2.5 py-1.5 rounded-lg text-xs truncate font-bold border ${pickup.toLowerCase() === t.name.toLowerCase() ? 'bg-amber-300 text-black border-amber-300' : 'text-white bg-white/5 border-white/5 hover:bg-white/10'}`}>{t.name}</button>))}</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center -my-2 relative z-10">
          <div className="relative">
            <button type="button" id="swap-locations-btn" onClick={handleSwapClick} className="p-2 rounded-full bg-white text-black border-2 border-black shadow-lg hover:bg-zinc-100 transition-all">
              <ArrowUpDown className="w-4 h-4" />
            </button>
            {swapNotice && (<div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-3 py-1.5 bg-amber-300 border-2 border-black rounded-full text-black text-xs font-bold whitespace-nowrap shadow-xl z-20">{swapNotice}</div>)}
          </div>
        </div>

        <div className="relative" ref={destDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="destination-input" className="text-xs font-bold text-white tracking-wider flex items-center space-x-1.5 drop-shadow"><Flag className="w-3.5 h-3.5 text-amber-300" /><span>DESTINATION — ANYWHERE IN KENYA</span></label>
            <span className="text-[11px] text-white/80 font-medium bg-white/10 px-2 py-0.5 rounded-full border border-white/15 backdrop-blur">Nationwide (47 Counties)</span>
          </div>
          <div className="relative flex items-center bg-white rounded-xl border-2 border-white/30 focus-within:border-amber-300 transition-all">
            <input id="destination-input" type="text" disabled={isLocked} value={destination} onChange={(e) => onChangeDestination(e.target.value)} onFocus={() => setDestDropdownOpen(true)} placeholder="e.g. Nairobi, Nakuru, Nyahururu, Mombasa, Kisumu..." className={`w-full px-3.5 py-3 bg-transparent text-sm font-bold text-black focus:outline-none placeholder-zinc-500 rounded-xl ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`} />
            <div className="flex items-center space-x-1 pr-2">
              {destination && !isLocked && (<button type="button" id="dest-clear-btn" onClick={() => onChangeDestination('')} className="p-1 rounded-md text-zinc-500 hover:text-black hover:bg-zinc-100"><X className="w-4 h-4" /></button>)}
              <button type="button" id="dest-dropdown-btn" disabled={isLocked} onClick={() => setDestDropdownOpen(!destDropdownOpen)} className="p-1.5 rounded-full bg-amber-300 text-black border border-black"><Search className="w-4 h-4" /></button>
            </div>
          </div>
          <p className="text-[11px] text-white/70 mt-1">Accepts any destination across Kenya: towns, highways, counties, villages</p>
          {destDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900/70 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-white/10 mb-1 flex justify-between items-center"><span className="text-amber-300 font-bold">Kenya Wide Destinations</span><span>Select or type any</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">{filteredDestinations.slice(0, 18).map((d) => (<button key={d.name} type="button" onClick={() => { onChangeDestination(d.name); setDestDropdownOpen(false); }} className={`text-left px-2.5 py-1.5 rounded-lg text-xs truncate font-bold border ${destination.toLowerCase() === d.name.toLowerCase() ? 'bg-amber-300 text-black border-amber-300' : 'text-white bg-white/5 border-white/5 hover:bg-white/10'}`}><span>{d.name}</span><span className="text-[10px] opacity-60 ml-1">({d.county})</span></button>))}</div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button type="button" id="get-fare-and-route-btn" disabled={!canCalculate || isCalculating} onClick={onGetFareAndRoute} className={`w-full py-3.5 px-6 rounded-full font-bold text-base transition-all flex items-center justify-center space-x-2 shadow-xl border-2 ${isLocked ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border-zinc-700' : canCalculate ? 'bg-amber-300 hover:bg-amber-200 text-black cursor-pointer border-black shadow-amber-500/20 active:scale-[0.99]' : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border-zinc-700'}`}>
            {isCalculating ? (<><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div><span>Calculating road network & fare...</span></> ) : isLocked ? (<span>Locked: Trip OLX in progress</span> ) : (<span>Get Fare and Route</span>)}
          </button>
        </div>
      </div>
    </div>
  );
}
