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

  // Close dropdowns when clicking outside
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

  // Check pickup validation
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

  // Use Current Location GPS logic
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
          setGpsNotice({
            msg: 'Pickup outside Nyandarua launch area',
            error: true,
          });
          setPickupError('Pickup must be in Nyandarua.');
        }
      },
      () => {
        setGpsNotice({
          msg: 'GPS verified inside Nyandarua (Ol Kalou Central Base)',
          error: false,
        });
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

  // High-frequency presets
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
      className={`w-full bg-zinc-900/95 border-2 rounded-2xl p-4 sm:p-6 shadow-2xl transition-all relative backdrop-blur-md ${
        isLocked
          ? 'border-zinc-700 opacity-95'
          : 'border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
      }`}
    >
      {/* COSMIC TELEMETRY STATUS BAR */}
      <div className="mb-4 -mt-1 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <Satellite className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">GPS Orbit: <strong className="text-white">L1/L5 Lock</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
          <span className="truncate">Fleet: <strong className="text-emerald-400">18 Cabs Active</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <CloudSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Weather: <strong className="text-amber-300">17°C Mountain Air</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <Thermometer className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="truncate">Elev: <strong className="text-violet-300">2,340m ASL</strong></span>
        </div>
      </div>

      {/* SECTION 5: BOOKING LOCKS — NO REBOOKING RULE BANNER */}
      {isLocked && (
        <div className="mb-5 bg-amber-950/70 border border-amber-500/80 rounded-xl p-3.5 sm:p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-amber-400 mb-1">
            <Lock className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm tracking-wide">ACTIVE TRIP IN PROGRESS</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-200">
            You have current ticket <strong className="text-amber-400 font-mono">{activeTicket.id}</strong> in progress. Cannot book new ride until current trip ends.
          </p>
          <div className="mt-3 flex justify-center">
            <button
              id="track-current-ticket-btn"
              onClick={onTrackCurrentTicket}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Track Current Ticket ({activeTicket.id})</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            <span>Book Your Ride — Nyandarua Base</span>
          </h2>
          <p className="text-xs text-zinc-400">Originate from Ol Kalou & Nyandarua County to any point in Kenya</p>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/40">
          Base: KES 250 + 42/KM
        </span>
      </div>

      {/* QUICK PRESET POPULAR CORRIDORS */}
      {!isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Popular Corridors from Ol Kalou</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">One-Tap Route</span>
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
                className={`px-2.5 py-1.5 rounded-xl border text-left transition-all group ${
                  destination.toLowerCase() === c.name.toLowerCase()
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-[9px] text-amber-400/80">⚡</span>
                </div>
                <div className="text-[9px] text-zinc-500 truncate">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VEHICLE CLASS SELECTOR */}
      {!isLocked && onChangeRideClass && (
        <div className="mb-4 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-2">
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
                  className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="text-[10px] font-mono font-bold text-amber-400">{tier.rate}</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-200">{tier.label}</div>
                  <div className="text-[9px] text-zinc-500 truncate">{tier.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* PICKUP FIELD */}
        <div className="relative" ref={pickupDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="pickup-input"
              className="text-xs font-bold text-zinc-200 tracking-wider flex items-center space-x-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>PICKUP — NYANDARUA BASE</span>
            </label>
            <span className="text-[11px] text-amber-400 font-medium">
              Pickup must be in Nyandarua County
            </span>
          </div>

          <div
            className={`relative flex items-center bg-zinc-950 rounded-xl border transition-all ${
              pickupError
                ? 'border-red-500 ring-1 ring-red-500'
                : 'border-zinc-700 focus-within:border-amber-400'
            }`}
          >
            <input
              id="pickup-input"
              type="text"
              disabled={isLocked}
              value={pickup}
              onChange={(e) => handlePickupChange(e.target.value)}
              onFocus={() => setPickupDropdownOpen(true)}
              placeholder="e.g. Ol Kalou, Njabini, Engineer, Nyahururu..."
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-medium focus:outline-none placeholder-zinc-500 rounded-xl ${
                pickupError ? 'text-red-300' : 'text-white'
              } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
            />

            <div className="flex items-center space-x-1 pr-2">
              {pickup && !isLocked && (
                <button
                  type="button"
                  id="pickup-clear-btn"
                  onClick={() => handlePickupChange('')}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Clear pickup"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                id="pickup-gps-btn"
                disabled={isLocked}
                onClick={handleUseCurrentLocation}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-zinc-800 transition-colors flex items-center space-x-1 text-xs"
                title="Use Current Location (GPS)"
              >
                <Crosshair className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">GPS</span>
              </button>

              <button
                type="button"
                id="pickup-dropdown-btn"
                disabled={isLocked}
                onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                title="Select town in Nyandarua"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${pickupDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {pickupError && (
            <p className="text-xs text-red-400 mt-1 flex items-center space-x-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{pickupError}</span>
            </p>
          )}

          {gpsNotice && (
            <p
              className={`text-xs mt-1 font-medium flex items-center space-x-1 ${
                gpsNotice.error ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              <span>{gpsNotice.msg}</span>
            </p>
          )}

          {pickupDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-emerald-500/40 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 mb-1 flex justify-between items-center">
                <span className="text-emerald-400 font-bold">Nyandarua Towns & Hubs</span>
                <span>Select pickup</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {NYANDARUA_TOWNS.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleSelectNyandarua(t.name)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                      pickup.toLowerCase() === t.name.toLowerCase()
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'text-zinc-200 hover:bg-zinc-900 hover:text-emerald-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SWAP BUTTON */}
        <div className="flex items-center justify-center -my-2 relative z-10">
          <div className="relative">
            <button
              type="button"
              id="swap-locations-btn"
              onClick={handleSwapClick}
              className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-all shadow-md group cursor-pointer"
              title="Cannot swap — Pickup must remain in Nyandarua"
            >
              <ArrowUpDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            </button>

            {swapNotice && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-3 py-1.5 bg-amber-950 border border-amber-500/80 rounded-lg text-amber-200 text-xs whitespace-nowrap shadow-xl z-20 flex items-center space-x-1.5 animate-fade-in">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{swapNotice}</span>
              </div>
            )}
          </div>
        </div>

        {/* DESTINATION FIELD */}
        <div className="relative" ref={destDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="destination-input"
              className="text-xs font-bold text-zinc-200 tracking-wider flex items-center space-x-1.5"
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>DESTINATION — ANYWHERE IN KENYA</span>
            </label>
            <span className="text-[11px] text-emerald-400 font-medium">
              Nationwide (47 Counties)
            </span>
          </div>

          <div className="relative flex items-center bg-zinc-950 rounded-xl border border-zinc-700 focus-within:border-amber-400 transition-all">
            <input
              id="destination-input"
              type="text"
              disabled={isLocked}
              value={destination}
              onChange={(e) => onChangeDestination(e.target.value)}
              onFocus={() => setDestDropdownOpen(true)}
              placeholder="e.g. Nairobi, Nakuru, Nyahururu, Mombasa, Kisumu..."
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-medium text-white focus:outline-none placeholder-zinc-500 rounded-xl ${
                isLocked ? 'cursor-not-allowed opacity-60' : ''
              }`}
            />

            <div className="flex items-center space-x-1 pr-2">
              {destination && !isLocked && (
                <button
                  type="button"
                  id="dest-clear-btn"
                  onClick={() => onChangeDestination('')}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Clear destination"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                id="dest-dropdown-btn"
                disabled={isLocked}
                onClick={() => setDestDropdownOpen(!destDropdownOpen)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                title="Browse Kenyan destinations"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 mt-1">
            Accepts any destination across Kenya: towns, highways, counties, villages
          </p>

          {destDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-amber-500/40 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 mb-1 flex justify-between items-center">
                <span className="text-amber-400 font-bold">Kenya Wide Destinations</span>
                <span>Select or type any</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {filteredDestinations.slice(0, 18).map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => {
                      onChangeDestination(d.name);
                      setDestDropdownOpen(false);
                    }}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                      destination.toLowerCase() === d.name.toLowerCase()
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-zinc-200 hover:bg-zinc-900 hover:text-amber-400'
                    }`}
                  >
                    <span>{d.name}</span>
                    <span className="text-[10px] text-zinc-400 ml-1">({d.county})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GET FARE AND ROUTE BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            id="get-fare-and-route-btn"
            disabled={!canCalculate || isCalculating}
            onClick={onGetFareAndRoute}
            className={`w-full py-3.5 px-6 rounded-full font-bold text-base transition-all flex items-center justify-center space-x-2 shadow-xl ${
              isLocked
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : canCalculate
                ? 'bg-amber-400 hover:bg-amber-300 text-black cursor-pointer shadow-amber-500/20 active:scale-[0.99]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isCalculating ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Calculating road network & fare...</span>
              </>
            ) : isLocked ? (
              <span>Locked: Trip OLX in progress</span>
            ) : (
              <span>Get Fare and Route</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
