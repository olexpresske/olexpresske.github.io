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
      className={`w-full bg-white/[0.88] backdrop-blur-[20px] border-[3px] border-white rounded-[28px] p-4 sm:p-6 shadow-[0_10px_0_0_#000,0_30px_80px_rgba(0,0,0,0.45)] transition-all relative ${
        isLocked
          ? 'opacity-90'
          : ''
      }`}
    >
      {/* COSMIC TELEMETRY STATUS BAR - BLACK GLASS FOR CONTRAST ON WHITE CARD */}
      <div className="mb-4 -mt-1 p-2.5 rounded-xl bg-black/85 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono backdrop-blur">
        <div className="flex items-center space-x-1.5 text-zinc-200">
          <Satellite className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">GPS Orbit: <strong className="text-white">L1/L5 Lock</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-zinc-200">
          <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
          <span className="truncate">Fleet: <strong className="text-emerald-300">18 Cabs Active</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-zinc-200">
          <CloudSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Weather: <strong className="text-amber-300">17°C Mountain Air</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-zinc-200">
          <Thermometer className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="truncate">Elev: <strong className="text-violet-200">2,340m ASL</strong></span>
        </div>
      </div>

      {/* SECTION 5: BOOKING LOCKS — NO REBOOKING RULE BANNER */}
      {isLocked && (
        <div className="mb-5 bg-amber-100 border-2 border-black rounded-xl p-3.5 sm:p-4 text-center shadow-[0_4px_0_0_#000]">
          <div className="flex items-center justify-center space-x-2 text-black mb-1">
            <Lock className="w-5 h-5 animate-pulse" />
            <span className="font-black text-sm tracking-wide">ACTIVE TRIP IN PROGRESS</span>
          </div>
          <p className="text-xs sm:text-sm text-black font-bold">
            You have current ticket <strong className="bg-black text-amber-400 font-mono px-1.5 rounded">{activeTicket.id}</strong> in progress. Cannot book new ride until current trip ends.
          </p>
          <div className="mt-3 flex justify-center">
            <button
              id="track-current-ticket-btn"
              onClick={onTrackCurrentTicket}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-900 text-white font-black text-xs sm:text-sm shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Track Current Ticket ({activeTicket.id})</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Header - VISIBILITY: BLACK TEXT */}
      <div className="flex items-center justify-between border-b-2 border-black/10 pb-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-black flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            <span>Book Your Ride — Nyandarua Base</span>
          </h2>
          <p className="text-xs text-black/70 font-bold">Originate from Ol Kalou & Nyandarua County to any point in Kenya</p>
        </div>
        <span className="text-[11px] font-mono font-black text-white bg-black px-2.5 py-1 rounded-full border border-white shadow">
          Base: KES 250 + 42/KM
        </span>
      </div>

      {/* QUICK PRESET POPULAR CORRIDORS - VISIBILITY: BLACK TEXT ON WHITE GLASS */}
      {!isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black text-black uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-600" />
              <span>Popular Corridors from Ol Kalou</span>
            </span>
            <span className="text-[10px] text-black/50 font-mono font-bold">One-Tap Route</span>
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
                className={`px-2.5 py-1.5 rounded-xl border-2 text-left transition-all group ${
                  destination.toLowerCase() === c.name.toLowerCase()
                    ? 'border-black bg-black text-white shadow-[0_3px_0_0_#000]'
                    : 'border-black/15 bg-white/70 text-black hover:border-black hover:bg-white'
                }`}
              >
                <div className="text-xs font-black flex items-center justify-between">
                  <span>{c.name}</span>
                  <span className="text-[9px]">⚡</span>
                </div>
                <div className="text-[9px] font-bold opacity-70 truncate">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VEHICLE CLASS SELECTOR - VISIBILITY: BLACK ON WHITE */}
      {!isLocked && onChangeRideClass && (
        <div className="mb-4 p-3 rounded-xl bg-black/[0.04] border-2 border-black/10">
          <label className="text-[11px] font-black text-black uppercase tracking-wider block mb-2">
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
                  className={`p-2 rounded-lg border-2 text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-[0_3px_0_0_#000]'
                      : 'border-black/15 bg-white/60 text-black hover:text-black hover:border-black hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-black'}`} />
                    <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-amber-400 text-black' : 'bg-black text-white'}`}>{tier.rate}</span>
                  </div>
                  <div className="text-xs font-black">{tier.label}</div>
                  <div className="text-[9px] font-bold opacity-70 truncate">{tier.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* PICKUP FIELD - VISIBILITY: WHITE INPUT + BLACK TEXT */}
        <div className="relative" ref={pickupDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="pickup-input"
              className="text-xs font-black text-black tracking-wider flex items-center space-x-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>PICKUP — NYANDARUA BASE</span>
            </label>
            <span className="text-[11px] text-white font-black bg-emerald-600 px-2 py-0.5 rounded-full">
              Pickup must be in Nyandarua County
            </span>
          </div>

          <div
            className={`relative flex items-center bg-white rounded-xl border-2 shadow-[0_3px_0_0_#000] transition-all ${
              pickupError
                ? 'border-red-600 ring-2 ring-red-200'
                : 'border-black focus-within:border-emerald-600'
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
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-black focus:outline-none placeholder-zinc-500 rounded-xl ${
                pickupError ? 'text-red-700' : 'text-black'
              } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
            />

            <div className="flex items-center space-x-1 pr-2">
              {pickup && !isLocked && (
                <button
                  type="button"
                  id="pickup-clear-btn"
                  onClick={() => handlePickupChange('')}
                  className="p-1.5 rounded-full bg-zinc-100 text-black hover:bg-black hover:text-white transition-colors"
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
                className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors flex items-center space-x-1 text-xs font-black"
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
                className="p-1.5 rounded-full bg-black text-white hover:bg-zinc-800 transition-colors"
                title="Select town in Nyandarua"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${pickupDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {pickupError && (
            <p className="text-xs text-red-700 mt-1 flex items-center space-x-1 font-black bg-red-100 border border-red-300 px-3 py-1 rounded-full w-fit">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{pickupError}</span>
            </p>
          )}

          {gpsNotice && (
            <p
              className={`text-xs mt-1 font-black px-3 py-1 rounded-full w-fit border-2 ${
                gpsNotice.error ? 'text-red-700 bg-red-100 border-red-300' : 'text-emerald-800 bg-emerald-100 border-emerald-300'
              }`}
            >
              <span>{gpsNotice.msg}</span>
            </p>
          )}

          {pickupDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-black rounded-xl shadow-[0_10px_0_0_#000] p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-black font-mono text-white bg-black rounded-full mb-1 w-fit">
                Nyandarua Towns & Hubs — Select pickup
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {NYANDARUA_TOWNS.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleSelectNyandarua(t.name)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-black border-2 transition-colors truncate ${
                      pickup.toLowerCase() === t.name.toLowerCase()
                        ? 'bg-black text-white border-black'
                        : 'text-black bg-zinc-50 border-black/10 hover:bg-white hover:border-black'
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
              className="p-2 rounded-full bg-white text-black border-2 border-black shadow-[0_3px_0_0_#000] hover:shadow-[0_4px_0_0_#000] hover:-translate-y-0.5 transition-all group cursor-pointer"
              title="Cannot swap — Pickup must remain in Nyandarua"
            >
              <ArrowUpDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            </button>

            {swapNotice && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-3 py-1.5 bg-amber-200 border-2 border-black rounded-full text-black text-xs font-black whitespace-nowrap shadow-[0_3px_0_0_#000] z-20 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-black shrink-0" />
                <span>{swapNotice}</span>
              </div>
            )}
          </div>
        </div>

        {/* DESTINATION FIELD - VISIBILITY: WHITE INPUT + BLACK TEXT */}
        <div className="relative" ref={destDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="destination-input"
              className="text-xs font-black text-black tracking-wider flex items-center space-x-1.5"
            >
              <Flag className="w-3.5 h-3.5 text-amber-600" />
              <span>DESTINATION — ANYWHERE IN KENYA</span>
            </label>
            <span className="text-[11px] text-white font-black bg-black px-2 py-0.5 rounded-full">
              Nationwide (47 Counties)
            </span>
          </div>

          <div className="relative flex items-center bg-white rounded-xl border-2 border-black shadow-[0_3px_0_0_#000] focus-within:border-amber-500 transition-all">
            <input
              id="destination-input"
              type="text"
              disabled={isLocked}
              value={destination}
              onChange={(e) => onChangeDestination(e.target.value)}
              onFocus={() => setDestDropdownOpen(true)}
              placeholder="e.g. Nairobi, Nakuru, Nyahururu, Mombasa, Kisumu..."
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-black text-black focus:outline-none placeholder-zinc-500 rounded-xl ${
                isLocked ? 'cursor-not-allowed opacity-60' : ''
              }`}
            />

            <div className="flex items-center space-x-1 pr-2">
              {destination && !isLocked && (
                <button
                  type="button"
                  id="dest-clear-btn"
                  onClick={() => onChangeDestination('')}
                  className="p-1.5 rounded-full bg-zinc-100 text-black hover:bg-black hover:text-white transition-colors"
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
                className="p-1.5 rounded-full bg-amber-400 text-black border border-black hover:bg-amber-300 transition-colors"
                title="Browse Kenyan destinations"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-black/60 mt-1 font-bold">
            Accepts any destination across Kenya: towns, highways, counties, villages
          </p>

          {destDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-black rounded-xl shadow-[0_10px_0_0_#000] p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-black font-mono text-white bg-black rounded-full mb-1 w-fit">
                Kenya Wide Destinations — Select or type any
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
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-black border-2 transition-colors truncate ${
                      destination.toLowerCase() === d.name.toLowerCase()
                        ? 'bg-black text-white border-black'
                        : 'text-black bg-zinc-50 border-black/10 hover:bg-white hover:border-black'
                    }`}
                  >
                    <span>{d.name}</span>
                    <span className="text-[10px] opacity-60 ml-1">({d.county})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GET FARE AND ROUTE BUTTON - VISIBILITY: AMBER + BLACK */}
        <div className="pt-2">
          <button
            type="button"
            id="get-fare-and-route-btn"
            disabled={!canCalculate || isCalculating}
            onClick={onGetFareAndRoute}
            className={`w-full py-3.5 px-6 rounded-full font-black text-base transition-all flex items-center justify-center space-x-2 border-2 border-black shadow-[0_6px_0_0_#000] active:shadow-[0_2px_0_0_#000] active:translate-y-1 ${
              isLocked
                ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                : canCalculate
                ? 'bg-amber-400 hover:bg-amber-300 text-black cursor-pointer'
                : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
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
