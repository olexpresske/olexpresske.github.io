import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Flag,
  Crosshair,
  ArrowUpDown,
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
  ShieldCheck,
  Sparkles,
  Navigation,
  PhoneCall,
  Share2,
  Minimize2,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import { db } from './firebaseConfig';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// ==========================================
// 1. DATA & TYPES
// ==========================================
export type RideClassType = 'Standard' | 'Express' | 'Cargo' | 'VIP';

export interface Ticket {
  id: string;
  pickup: string;
  destination: string;
  fare: number;
  rideClass: RideClassType;
  status: 'PENDING_DISPATCH' | 'DRIVER_ACCEPTED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED';
  driverId: string | null;
  driverCoordinates: { lat: number; lng: number } | null;
}

export interface RouteComputation {
  distanceKm: number;
  timeFormatted: string;
  fare: number;
  routeCoords: [number, number][];
}

const NYANDARUA_TOWNS = [
  { name: 'Ol Kalou', region: 'Central Base' },
  { name: 'Nyahururu', region: 'North Quad' },
  { name: 'Engineer', region: 'South Quad' },
  { name: 'Miharati', region: 'West Corridor' },
  { name: 'Ndaragwa', region: 'North East Ridge' },
  { name: 'Njabini', region: 'South Hub' },
  { name: 'Mai Mahiu', region: 'Escarpment' },
  { name: 'Gilgil', region: 'A104 Junction' }
];

const KENYA_DESTINATIONS = [
  { name: 'Nairobi CBD', region: 'Capital Node' },
  { name: 'Nakuru City', region: 'Rift Valley Corridor' },
  { name: 'Nyahururu Town', region: 'Laikipia Hub' },
  { name: 'Naivasha Express', region: 'Lakeside Junction' },
  { name: 'Gilgil Corridor', region: 'A104 Junction' },
  { name: 'Mombasa', region: 'Coast Express' },
  { name: 'Kisumu', region: 'Lake Victoria' }
];

const isNyandaruaTown = (town: string) => 
  NYANDARUA_TOWNS.some(t => t.name.toLowerCase() === town.toLowerCase().trim());

// ==========================================
// 2. ULTRA CLEAR GLASS BOOKING CARD — SAMPLE 1
//    bg-black/15 — see hills almost fully through
// ==========================================
interface BookingCardProps {
  pickup: string;
  destination: string;
  onChangePickup: (val: string) => void;
  onChangeDestination: (val: string) => void;
  onGetFareAndRoute: () => void;
  activeTicket: Ticket | null;
  onAbortTrip: () => void;
  isCalculating: boolean;
  rideClass: RideClassType;
  onChangeRideClass: (cls: RideClassType) => void;
}

export function BookingCard({
  pickup,
  destination,
  onChangePickup,
  onChangeDestination,
  onGetFareAndRoute,
  activeTicket,
  onAbortTrip,
  isCalculating,
  rideClass,
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
      if (pickupDropdownRef.current && !pickupDropdownRef.current.contains(e.target as Node)) setPickupDropdownOpen(false);
      if (destDropdownRef.current && !destDropdownRef.current.contains(e.target as Node)) setDestDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePickupChange = (val: string) => {
    onChangePickup(val);
    setGpsNotice(null);
    if (!val.trim()) { setPickupError(null); return; }
    if (!isNyandaruaTown(val)) setPickupError('Pickup must be strictly in Nyandarua County.');
    else setPickupError(null);
  };

  const handleSelectTown = (name: string) => {
    onChangePickup(name);
    setPickupError(null);
    setPickupDropdownOpen(false);
  };

  const handleUseCurrentLocation = () => {
    setGpsNotice({ msg: 'Interrogating orbital telemetry GPS...', error: false });
    setTimeout(() => {
      setGpsNotice({ msg: 'GPS Lock Verified: Ol Kalou Central Base.', error: false });
      onChangePickup('Ol Kalou');
      setPickupError(null);
    }, 1000);
  };

  const handleSwapClick = () => {
    setSwapNotice('Cannot swap — Pickup must remain in Nyandarua.');
    setTimeout(() => setSwapNotice(null), 3000);
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
    { name: 'Nyahururu', desc: '38 km • Falls' },
    { name: 'Naivasha', desc: '78 km • Lakeside' },
    { name: 'Engineer', desc: '65 km • South' },
    { name: 'Gilgil', desc: '36 km • A104' },
  ];

  return (
    <div className={`w-full rounded-[24px] p-5 sm:p-6 transition-all duration-500 relative overflow-hidden border backdrop-blur-[16px] backdrop-saturate-150 shadow-[0_20px_80px_rgba(0,0,0,0.25)] ${isLocked ? 'bg-amber-950/20 border-amber-500/30' : 'bg-black/15 border-white/30'}`}>
      
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* TELEMETRY BAR — bg-black/30 glassy */}
      <div className="mb-5 p-2.5 rounded-xl bg-black/30 border border-white/15 backdrop-blur-[12px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-white"><Satellite className="w-3.5 h-3.5 text-cyan-300" /><span className="truncate">GPS: <strong className="text-white">L1/L5 Lock</strong></span></div>
        <div className="flex items-center space-x-1.5 text-white"><Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" /><span className="truncate">Fleet: <strong className="text-emerald-300">18 Active</strong></span></div>
        <div className="flex items-center space-x-1.5 text-white"><CloudSun className="w-3.5 h-3.5 text-amber-300" /><span className="truncate">Air: <strong className="text-amber-200">17°C Alpine</strong></span></div>
        <div className="flex items-center space-x-1.5 text-white"><Thermometer className="w-3.5 h-3.5 text-violet-300" /><span className="truncate">Elev: <strong className="text-violet-200">2,340m</strong></span></div>
      </div>

      {isLocked && (
        <div className="mb-5 bg-amber-400/20 border border-amber-400/40 rounded-xl p-3.5 text-center backdrop-blur">
          <div className="flex items-center justify-center space-x-2 text-amber-300 mb-1"><Lock className="w-5 h-5 animate-pulse" /><span className="font-bold text-sm">ACTIVE TRIP IN PROGRESS</span></div>
          <p className="text-xs text-white">Ticket <strong className="text-amber-300 font-mono">{activeTicket.id}</strong> — {activeTicket.status}</p>
          <div className="mt-3 flex justify-center space-x-2">
            <button onClick={() => {}} className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs flex items-center space-x-2"><Compass className="w-4 h-4" /><span>Track {activeTicket.id}</span></button>
            <button onClick={onAbortTrip} className="px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs">Abort</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2 drop-shadow"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span><span>Book Your Ride — Nyandarua Base</span></h2>
          <p className="text-xs text-white/80">// See hills through glass — Ultra Clear</p>
        </div>
        <span className="text-[11px] font-mono text-white bg-black/40 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur">Base: KES 250 + 42/KM</span>
      </div>

      {!isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5"><span className="text-[11px] font-semibold text-white/90 uppercase flex items-center space-x-1"><Zap className="w-3 h-3 text-amber-300" /><span>Popular Corridors from Ol Kalou</span></span></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
            {popularCorridors.map((c) => (
              <button key={c.name} type="button" onClick={() => { onChangePickup('Ol Kalou'); onChangeDestination(c.name); setPickupError(null); }} className={`px-2.5 py-1.5 rounded-xl border text-left transition-all backdrop-blur ${destination.toLowerCase() === c.name.toLowerCase() ? 'border-amber-300 bg-amber-300 text-black font-bold' : 'border-white/20 bg-white/15 text-white hover:bg-white/25'}`}>
                <div className="text-xs font-bold">{c.name}</div><div className="text-[9px] opacity-70 truncate">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLocked && (
        <div className="mb-4 p-3 rounded-xl bg-black/15 border border-white/15 backdrop-blur-[12px]">
          <label className="text-[11px] font-bold text-white/90 uppercase block mb-2">Select Ride Tier & Vehicle Class</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'Standard' as RideClassType, label: 'Olex Standard', rate: '1.0x', icon: Car },
              { id: 'Express' as RideClassType, label: 'Olex Express', rate: '1.2x', icon: Zap },
              { id: 'Cargo' as RideClassType, label: 'Olex Cargo', rate: '1.15x', icon: Package },
              { id: 'VIP' as RideClassType, label: 'Olex VIP', rate: '1.6x', icon: Crown },
            ].map((tier) => {
              const Icon = tier.icon;
              const isSelected = rideClass === tier.id;
              return (
                <button key={tier.id} type="button" onClick={() => onChangeRideClass(tier.id)} className={`p-2 rounded-lg border text-left transition-all backdrop-blur ${isSelected ? 'border-amber-300 bg-amber-300 text-black' : 'border-white/15 bg-white/10 text-white hover:bg-white/20'}`}>
                  <div className="flex items-center justify-between mb-1"><Icon className="w-4 h-4" /><span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-black text-amber-300' : 'bg-black/30 text-white'}`}>{tier.rate}</span></div>
                  <div className="text-xs font-bold">{tier.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative" ref={pickupDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-white flex items-center space-x-1.5 drop-shadow"><MapPin className="w-3.5 h-3.5 text-emerald-300" /><span>PICKUP — NYANDARUA BASE</span></label>
            <span className="text-[11px] text-white font-medium bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/20 backdrop-blur">Must be in Nyandarua</span>
          </div>
          <div className={`relative flex items-center bg-white rounded-xl border-2 transition-all ${pickupError ? 'border-red-500' : 'border-white/30 focus-within:border-amber-300'}`}>
            <input type="text" value={pickup} onChange={(e) => handlePickupChange(e.target.value)} onFocus={() => setPickupDropdownOpen(true)} disabled={isLocked} placeholder="e.g. Ol Kalou, Njabini..." className={`w-full px-3.5 py-3 bg-transparent text-sm font-bold focus:outline-none placeholder-zinc-500 rounded-xl ${pickupError ? 'text-red-600' : 'text-black'}`} />
            <div className="flex items-center space-x-1 pr-2">
              <button type="button" onClick={handleUseCurrentLocation} disabled={isLocked} className="p-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center space-x-1"><Crosshair className="w-4 h-4" /><span className="hidden sm:inline text-[11px] font-bold">GPS</span></button>
              <button type="button" onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)} disabled={isLocked} className="p-1.5 rounded-full bg-black text-white"><ShieldCheck className="w-4 h-4" /></button>
            </div>
          </div>
          {pickupError && <p className="text-xs text-red-300 mt-1 font-bold bg-black/30 px-2 py-1 rounded-full w-fit backdrop-blur flex items-center space-x-1"><AlertTriangle className="w-3.5 h-3.5" /><span>{pickupError}</span></p>}
          {gpsNotice && <p className={`text-xs mt-1 font-bold bg-black/30 px-2 py-1 rounded-full w-fit backdrop-blur ${gpsNotice.error ? 'text-red-300' : 'text-emerald-300'}`}>{gpsNotice.msg}</p>}
          {pickupDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900/70 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-white/10 mb-1 flex justify-between"><span className="text-emerald-400 font-bold">Nyandarua Towns & Hubs</span><span>Select pickup</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {NYANDARUA_TOWNS.map((t) => (<button key={t.name} type="button" onClick={() => handleSelectTown(t.name)} className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold border truncate ${pickup.toLowerCase() === t.name.toLowerCase() ? 'bg-amber-300 text-black border-amber-300' : 'text-white bg-white/5 border-white/5 hover:bg-white/10'}`}>{t.name}</button>))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center -my-2 relative z-10">
          <div className="relative">
            <button type="button" onClick={handleSwapClick} className="p-2 rounded-full bg-white text-black border-2 border-black shadow-lg hover:bg-zinc-100"><ArrowUpDown className="w-4 h-4" /></button>
            {swapNotice && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-3 py-1.5 bg-amber-300 border-2 border-black rounded-full text-black text-xs font-bold whitespace-nowrap shadow-xl z-20">{swapNotice}</div>}
          </div>
        </div>

        <div className="relative" ref={destDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-white flex items-center space-x-1.5 drop-shadow"><Flag className="w-3.5 h-3.5 text-amber-300" /><span>DESTINATION — ANYWHERE IN KENYA</span></label>
            <span className="text-[11px] text-white/80 font-medium bg-white/10 px-2 py-0.5 rounded-full border border-white/15 backdrop-blur">Nationwide</span>
          </div>
          <div className="relative flex items-center bg-white rounded-xl border-2 border-white/30 focus-within:border-amber-300 transition-all">
            <input type="text" value={destination} onChange={(e) => onChangeDestination(e.target.value)} onFocus={() => setDestDropdownOpen(true)} disabled={isLocked} placeholder="e.g. Nairobi, Nakuru, Mombasa..." className="w-full px-3.5 py-3 bg-transparent text-sm font-bold text-black focus:outline-none placeholder-zinc-500 rounded-xl" />
            <div className="flex items-center space-x-1 pr-2"><button type="button" onClick={() => setDestDropdownOpen(!destDropdownOpen)} disabled={isLocked} className="p-1.5 rounded-full bg-amber-300 text-black border border-black"><Navigation className="w-4 h-4" /></button></div>
          </div>
          {destDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-900/70 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-white/10 mb-1 flex justify-between"><span className="text-amber-300 font-bold">Kenya Wide Destinations</span><span>Select or type any</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {filteredDestinations.map((d) => (<button key={d.name} type="button" onClick={() => { onChangeDestination(d.name); setDestDropdownOpen(false); }} className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold border truncate ${destination.toLowerCase() === d.name.toLowerCase() ? 'bg-amber-300 text-black border-amber-300' : 'text-white bg-white/5 border-white/5 hover:bg-white/10'}`}><span>{d.name}</span></button>))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button type="button" disabled={!canCalculate || isCalculating} onClick={onGetFareAndRoute} className={`w-full py-3.5 px-6 rounded-full font-bold text-base transition-all flex items-center justify-center space-x-2 shadow-xl border-2 ${isLocked ? 'bg-zinc-800/50 text-zinc-500 border-zinc-700 cursor-not-allowed' : canCalculate ? 'bg-amber-300 hover:bg-amber-200 text-black border-black active:scale-[0.99]' : 'bg-zinc-800/50 text-zinc-500 border-zinc-700 cursor-not-allowed'}`}>
            {isCalculating ? <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div><span>Calculating...</span></> : isLocked ? <span>Locked: Trip in progress</span> : <span>Get Fare and Route — Sample 1 Ultra Clear</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingCard;
