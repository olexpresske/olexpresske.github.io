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
    // ===== SAMPLE 1: ULTRA CLEAR GLASS — bg-black/15 — see hills almost fully through =====
    <div
      id="booking-card"
      className={`w-full rounded-[24px] p-4 sm:p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] transition-all relative backdrop-blur-[16px] backdrop-saturate-150 border border-white/30 bg-black/15 ${
        isLocked ? 'border-amber-500/30 shadow-[0_0_20px_rgba(0,0,0,0.1)]' : ''
      }`}
    >
      {/* Glass shine line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none rounded-t-[24px]" />

      {/* TELEMETRY — ultra clear */}
      <div className="mb-4 -mt-1 p-2.5 rounded-xl bg-black/20 border border-white/20 backdrop-blur-[12px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-white">
          <Satellite className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="truncate">GPS Orbit: <strong className="text-white">L1/L5 Lock</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-white">
          <Radio className="w-3.5 h-3.5 text-white shrink-0 animate-pulse" />
          <span className="truncate">Fleet: <strong className="text-white">18 Cabs Active</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-white">
          <CloudSun className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="truncate">Weather: <strong className="text-white">17°C Mountain</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-white">
          <Thermometer className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="truncate">Elev: <strong className="text-white">2,340m ASL</strong></span>
        </div>
      </div>

      {isLocked && (
        <div className="mb-5 bg-white/90 backdrop-blur border border-white/50 rounded-xl p-3.5 sm:p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-black mb-1">
            <Lock className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm tracking-wide">ACTIVE TRIP IN PROGRESS</span>
          </div>
          <p className="text-xs sm:text-sm text-black/70">
            You have current ticket <strong className="text-black font-mono">{activeTicket.id}</strong> in progress. Cannot book new ride until current trip ends.
          </p>
          <div className="mt-3 flex justify-center">
            <button
              id="track-current-ticket-btn"
              onClick={onTrackCurrentTicket}
              className="px-5 py-2.5 rounded-xl bg-black text-white font-bold text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Track Current Ticket ({activeTicket.id})</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-black flex items-center space-x-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Book Your Ride — Nyandarua Base</span>
          </h2>
          <p className="text-xs text-black/60 font-medium">Originate from Ol Kalou & Nyandarua County to any point in Kenya</p>
        </div>
        <span className="text-[11px] font-mono text-black bg-white/80 px-2.5 py-1 rounded-full border border-white/50 backdrop-blur">
          Base: KES 250 + 42/KM
        </span>
      </div>

      {!isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-black/70 uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3 h-3 text-black" />
              <span>Popular Corridors from Ol Kalou</span>
            </span>
            <span className="text-[10px] text-black/50 font-mono">One-Tap Route</span>
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
                className={`px-2.5 py-1.5 rounded-xl border text-left transition-all backdrop-blur ${
                  destination.toLowerCase() === c.name.toLowerCase()
                    ? 'border-black bg-black text-white'
                    : 'border-white/30 bg-white/70 text-black hover:bg-white/90'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-[9px]">⚡</span>
                </div>
                <div className="text-[9px] text-black/60 truncate">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLocked && onChangeRideClass && (
        <div className="mb-4 p-3 rounded-xl bg-white/60 border border-white/30 backdrop-blur-[12px]">
          <label className="text-[11px] font-bold text-black/80 uppercase tracking-wider block mb-2">
            Select Ride Tier & Vehicle Class
          </label>
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
                  className={`p-2 rounded-lg border text-left transition-all backdrop-blur flex flex-col justify-between ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-white/30 bg-white/60 text-black hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-black/70'}`} />
                    <span className="text-[10px] font-mono font-bold">{tier.rate}</span>
                  </div>
                  <div className="text-xs font-bold">{tier.label}</div>
                  <div className="text-[9px] opacity-60 truncate">{tier.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="relative" ref={pickupDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="pickup-input" className="text-xs font-bold text-black tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-black" />
              <span>PICKUP — NYANDARUA BASE</span>
            </label>
            <span className="text-[11px] text-black/60 font-medium bg-white/60 px-2 py-0.5 rounded-full border border-white/30">
              Must be in Nyandarua
            </span>
          </div>
          <div className={`relative flex items-center bg-white/90 backdrop-blur rounded-xl border-2 transition-all ${pickupError ? 'border-red-500' : 'border-white/50 focus-within:border-black'}`}>
            <input
              id="pickup-input"
              type="text"
              disabled={isLocked}
              value={pickup}
              onChange={(e) => handlePickupChange(e.target.value)}
              onFocus={() => setPickupDropdownOpen(true)}
              placeholder="e.g. Ol Kalou, Njabini, Engineer, Nyahururu..."
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-bold focus:outline-none placeholder-black/40 rounded-xl ${pickupError ? 'text-red-600' : 'text-black'} ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            <div className="flex items-center space-x-1 pr-2">
              {pickup && !isLocked && (
                <button type="button" onClick={() => handlePickupChange('')} className="p-1 rounded-md text-black/40 hover:text-black hover:bg-black/5">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button type="button" disabled={isLocked} onClick={handleUseCurrentLocation} className="p-1.5 rounded-lg text-black hover:bg-black/5 flex items-center space-x-1 text-xs">
                <Crosshair className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">GPS</span>
              </button>
              <button type="button" disabled={isLocked} onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)} className="p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/5">
                <ChevronDown className={`w-4 h-4 transition-transform ${pickupDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          {pickupError && <p className="text-xs text-red-600 mt-1 flex items-center space-x-1 font-bold bg-white/80 px-2 py-1 rounded-full w-fit"><AlertTriangle className="w-3.5 h-3.5" /><span>{pickupError}</span></p>}
          {gpsNotice && <p className={`text-xs mt-1 font-bold bg-white/80 px-2 py-1 rounded-full w-fit ${gpsNotice.error ? 'text-red-600' : 'text-emerald-700'}`}>{gpsNotice.msg}</p>}
          {pickupDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-white/50 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-black/50 border-b border-black/10 mb-1 flex justify-between">
                <span className="text-black font-bold">Nyandarua Towns & Hubs</span><span>Select pickup</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {NYANDARUA_TOWNS.map((t) => (
                  <button key={t.name} type="button" onClick={() => handleSelectNyandarua(t.name)} className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold border truncate ${pickup.toLowerCase() === t.name.toLowerCase() ? 'bg-black text-white border-black' : 'text-black bg-black/5 border-black/5 hover:bg-black/10'}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center -my-2 relative z-10">
          <div className="relative">
            <button type="button" onClick={handleSwapClick} className="p-2 rounded-full bg-white/90 border border-white/50 text-black hover:bg-white shadow-md">
              <ArrowUpDown className="w-4 h-4" />
            </button>
            {swapNotice && <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs whitespace-nowrap shadow-xl z-20">{swapNotice}</div>}
          </div>
        </div>

        <div className="relative" ref={destDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="destination-input" className="text-xs font-bold text-black tracking-wider flex items-center space-x-1.5">
              <Flag className="w-3.5 h-3.5 text-black" />
              <span>DESTINATION — ANYWHERE IN KENYA</span>
            </label>
            <span className="text-[11px] text-black/60 font-medium bg-white/60 px-2 py-0.5 rounded-full border border-white/30">Nationwide (47 Counties)</span>
          </div>
          <div className="relative flex items-center bg-white/90 backdrop-blur rounded-xl border-2 border-white/50 focus-within:border-black transition-all">
            <input
              id="destination-input"
              type="text"
              disabled={isLocked}
              value={destination}
              onChange={(e) => onChangeDestination(e.target.value)}
              onFocus={() => setDestDropdownOpen(true)}
              placeholder="e.g. Nairobi, Nakuru, Nyahururu, Mombasa, Kisumu..."
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-bold text-black focus:outline-none placeholder-black/40 rounded-xl ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
            />
            <div className="flex items-center space-x-1 pr-2">
              {destination && !isLocked && (
                <button type="button" onClick={() => onChangeDestination('')} className="p-1 rounded-md text-black/40 hover:text-black hover:bg-black/5"><X className="w-4 h-4" /></button>
              )}
              <button type="button" disabled={isLocked} onClick={() => setDestDropdownOpen(!destDropdownOpen)} className="p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/5"><Search className="w-4 h-4" /></button>
            </div>
          </div>
          <p className="text-[11px] text-black/50 mt-1 font-medium">Accepts any destination across Kenya: towns, highways, counties, villages</p>
          {destDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-white/50 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-black/50 border-b border-black/10 mb-1 flex justify-between">
                <span className="text-black font-bold">Kenya Wide Destinations</span><span>Select or type any</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {filteredDestinations.slice(0, 18).map((d) => (
                  <button key={d.name} type="button" onClick={() => { onChangeDestination(d.name); setDestDropdownOpen(false); }} className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-bold border truncate ${destination.toLowerCase() === d.name.toLowerCase() ? 'bg-black text-white border-black' : 'text-black bg-black/5 border-black/5 hover:bg-black/10'}`}>
                    <span>{d.name}</span><span className="text-[10px] opacity-60 ml-1">({d.county})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            id="get-fare-and-route-btn"
            disabled={!canCalculate || isCalculating}
            onClick={onGetFareAndRoute}
            className={`w-full py-3.5 px-6 rounded-full font-bold text-base transition-all flex items-center justify-center space-x-2 shadow-xl border ${
              isLocked ? 'bg-white/50 text-black/30 border-white/20 cursor-not-allowed' : canCalculate ? 'bg-black hover:bg-zinc-800 text-white border-black active:scale-[0.99]' : 'bg-white/50 text-black/30 border-white/20 cursor-not-allowed'
            }`}
          >
            {isCalculating ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Calculating road network & fare...</span></> : isLocked ? <span>Locked: Trip OLX in progress</span> : <span>Get Fare and Route</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
