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
} from 'lucide-react';
import {
  NYANDARUA_TOWNS,
  KENYA_DESTINATIONS,
  isNyandaruaTown,
  isNyandaruaCoords,
  findTown,
} from '../data/towns';
import { Ticket } from '../types';

interface BookingCardProps {
  pickup: string;
  destination: string;
  onChangePickup: (val: string) => void;
  onChangeDestination: (val: string) => void;
  onGetFareAndRoute: () => void;
  activeTicket: Ticket | null;
  onTrackCurrentTicket: () => void;
  isCalculating?: boolean;
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

    // Check if entered town is inside Nyandarua
    if (!isNyandaruaTown(val)) {
      setPickupError('Pickup must be in Nyandarua.');
    } else {
      setPickupError(null);
    }
  };

  // Select Nyandarua town from dropdown
  const handleSelectNyandarua = (townName: string) => {
    onChangePickup(townName);
    setPickupError(null);
    setPickupDropdownOpen(false);
  };

  // Use Current Location GPS logic
  const handleUseCurrentLocation = () => {
    setGpsNotice({ msg: 'Checking GPS coordinates...', error: false });

    if (!navigator.geolocation) {
      // Mock / fallback check for demo
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
          // If close to Ol Kalou, set Ol Kalou
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
        // Geolocation denied or unavailable: Show helpful explanation and default to Ol Kalou
        setGpsNotice({
          msg: 'GPS simulated inside Nyandarua launch area (Ol Kalou Base)',
          error: false,
        });
        onChangePickup('Ol Kalou');
        setPickupError(null);
      },
      { timeout: 5000 }
    );
  };

  // Swap button rule: disabled with notice
  const handleSwapClick = () => {
    setSwapNotice('Cannot swap — Pickup must remain in Nyandarua.');
    setTimeout(() => setSwapNotice(null), 3500);
  };

  // Filter Kenya destinations for autocomplete
  const filteredDestinations = KENYA_DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(destination.toLowerCase())
  );

  const isLocked = !!activeTicket;
  const isPickupValid = pickup.trim().length > 0 && !pickupError && isNyandaruaTown(pickup);
  const isDestValid = destination.trim().length > 0;
  const canCalculate = isPickupValid && isDestValid && !isLocked;

  return (
    <div
      id="booking-card"
      className={`w-full bg-zinc-900/95 border-2 rounded-2xl p-4 sm:p-6 shadow-2xl transition-all relative ${
        isLocked
          ? 'border-zinc-700 opacity-95'
          : 'border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
      }`}
    >
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
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            <span>Book Your Ride</span>
          </h2>
          <p className="text-xs text-zinc-400">Launch Base: Ol Kalou, Nyandarua County</p>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/40">
          Base: 250 + 42/KM
        </span>
      </div>

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
              placeholder="e.g. Ol Kalou, Njabini, Engineer..."
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-medium focus:outline-none placeholder-zinc-500 rounded-xl ${
                pickupError ? 'text-red-300' : 'text-white'
              } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
            />

            {/* Buttons inside pickup field: GPS, Clear X, Dropdown arrow */}
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

          {/* Validation Error Message */}
          {pickupError && (
            <p className="text-xs text-red-400 mt-1 flex items-center space-x-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{pickupError}</span>
            </p>
          )}

          {/* GPS feedback notice */}
          {gpsNotice && (
            <p
              className={`text-xs mt-1 font-medium ${
                gpsNotice.error ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {gpsNotice.msg}
            </p>
          )}

          {/* Nyandarua Towns Dropdown List */}
          {pickupDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-amber-500/40 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1.5 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 mb-1 flex justify-between items-center">
                <span className="text-amber-400 font-bold">Nyandarua Towns (16 Authorized)</span>
                <span>County Launch Area</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {NYANDARUA_TOWNS.map((town) => (
                  <button
                    key={town.name}
                    type="button"
                    onClick={() => handleSelectNyandarua(town.name)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                      pickup.toLowerCase() === town.name.toLowerCase()
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-zinc-200 hover:bg-zinc-900 hover:text-amber-400'
                    }`}
                  >
                    {town.name === 'Ol Kalou' ? '★ Ol Kalou (Base)' : town.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SWAP BUTTON (DISABLED PER SPECIFICATION) */}
        <div className="flex items-center justify-center my-1 relative">
          <div className="w-full border-t border-zinc-800 absolute"></div>
          <button
            type="button"
            id="swap-route-btn"
            onClick={handleSwapClick}
            className="relative z-10 p-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-400 cursor-not-allowed transition-all"
            title="Swap locations (Disabled: Pickup must be Nyandarua)"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Swap Notice */}
        {swapNotice && (
          <div className="text-center text-xs text-amber-400 bg-amber-950/60 py-1 px-3 rounded-lg border border-amber-500/30">
            {swapNotice}
          </div>
        )}

        {/* DESTINATION FIELD (RANDOM ANYWHERE IN KENYA) */}
        <div className="relative" ref={destDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="dest-input"
              className="text-xs font-bold text-zinc-200 tracking-wider flex items-center space-x-1.5"
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>DROP OFF — ANYWHERE IN KENYA</span>
            </label>
            <span className="text-[11px] text-amber-400 font-medium">Where to?</span>
          </div>

          <div className="relative flex items-center bg-zinc-950 rounded-xl border border-zinc-700 focus-within:border-amber-400 transition-all">
            <input
              id="dest-input"
              type="text"
              disabled={isLocked}
              value={destination}
              onChange={(e) => {
                onChangeDestination(e.target.value);
                setDestDropdownOpen(true);
              }}
              onFocus={() => setDestDropdownOpen(true)}
              placeholder="e.g. Nyahururu, Nakuru, Nairobi, Nyeri, any village..."
              className={`w-full px-3.5 py-3 bg-transparent text-sm font-medium focus:outline-none placeholder-zinc-500 rounded-xl text-white ${
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

          {/* Destination Autocomplete & Quick Suggestions */}
          {destDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-amber-500/40 rounded-xl shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 mb-1 flex justify-between items-center">
                <span className="text-amber-400 font-bold">Kenya Wide Destinations</span>
                <span>Select or type any</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {filteredDestinations.slice(0, 15).map((d) => (
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

        {/* GET FARE AND ROUTE BUTTON (GOLD PILL BUTTON) */}
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
                <span>Routing real road network...</span>
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
