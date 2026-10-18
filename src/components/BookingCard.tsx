import { useState, useEffect, useRef } from 'react';
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
    { name: 'Naivasha', desc: '78 km • Lakeside Express' }
  ];

  return (
    <div
      id="booking-card"
      className={`w-full rounded-[32px] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 relative backdrop-blur-xl ${
        isLocked
          ? 'bg-black/5 border border-white/5 opacity-90'
          : 'bg-black/15 border border-white/20'
      }`}
    >
      {/* GLARIFIED REFRACTIVE EDGE LINE LAYER */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* CARD HEADER SECTION MATCHING PICTURE SPECIFICATIONS */}
      <div className="text-center mb-8 mt-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white/95">
          Book Your Ride
        </h2>
      </div>

      {/* INPUT FORM SCHEMES CONTROLS */}
      <div className="space-y-5 relative z-10">
        
        {/* PICKUP HOVER CARD LAYOUT EXPANSION WRAPPER */}
        <div className="relative group" ref={pickupDropdownRef}>
          <label className="absolute left-4 top-2 text-[10px] font-medium tracking-wide text-white/40 uppercase font-mono z-10">
            Pickup
          </label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-4 bottom-3.5 w-4 h-4 text-white/50" />
            <input
              type="text"
              value={pickup}
              onFocus={() => setPickupDropdownOpen(true)}
              onChange={(e) => handlePickupChange(e.target.value)}
              disabled={isLocked}
              placeholder="Select Nyandarua Hub node..."
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] pl-11 pr-24 pt-6 pb-2.5 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition duration-200"
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocked}
              className="absolute right-2 bottom-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[9px] uppercase tracking-wider flex items-center space-x-1 border border-white/10 transition"
            >
              <Crosshair className="w-3 h-3 text-emerald-400" />
              <span>GPS Lock</span>
            </button>
          </div>

          {pickupError && (
            <div className="mt-1.5 flex items-center space-x-1.5 text-xs text-red-400 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pickupError}</span>
            </div>
          )}

          {gpsNotice && (
            <div className="mt-1 font-mono text-[10px] text-emerald-400">// {gpsNotice.msg}</div>
          )}

          {/* Pickup Selection Overlay List Dropdown */}
          {pickupDropdownOpen && !isLocked && (
            <div className="absolute left-0 right-0 mt-1 z-50 rounded-2xl bg-zinc-950/95 border border-white/10 shadow-2xl p-2 max-h-40 overflow-y-auto font-mono text-xs">
              {NYANDARUA_TOWNS.map((t) => (
                <div
                  key={t.name}
                  onClick={() => handleSelectNyandarua(t.name)}
                  className="px-3 py-2 rounded-xl hover:bg-white/10 text-stone-200 cursor-pointer transition flex justify-between"
                >
                  <span>{t.name}</span>
                  <span className="text-[10px] text-stone-500">{t.region}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REVERSED VECTOR CONNECTOR ROW */}
        <div className="flex justify-center -my-3.5 relative z-20">
          <button
            type="button"
            onClick={handleSwapClick}
            className="p-1 rounded-xl bg-black/40 border border-white/10 text-white hover:bg-black/60 transition shadow-md"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-white/60" />
          </button>
          {swapNotice && (
            <div className="absolute left-1/2 -translate-x-1/2 -top-7 bg-zinc-950 text-red-400 text-[9px] font-mono border border-white/10 px-2 py-0.5 rounded whitespace-nowrap shadow-xl">
              {swapNotice}
            </div>
          )}
        </div>

        {/* DROPOFF DROPDOWN CONTAINER WRAPPER LAYOUT */}
        <div className="relative group" ref={destDropdownRef}>
          <label className="absolute left-4 top-2 text-[10px] font-medium tracking-wide text-white/40 uppercase font-mono z-10">
            Dropoff
          </label>
          <div className="relative flex items-center">
            <Flag className="absolute left-4 bottom-3.5 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={destination}
              onFocus={() => setDestDropdownOpen(true)}
              onChange={(e) => { onChangeDestination(e.target.value); setDestDropdownOpen(true); }}
              disabled={isLocked}
              placeholder="Where to?"
              className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 pt-6 pb-2.5 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition duration-200"
            />
