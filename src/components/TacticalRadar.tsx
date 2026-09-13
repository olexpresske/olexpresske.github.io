import { useState, useEffect } from 'react';
import {
  Satellite,
  Radio,
  Car,
  MapPin,
  Phone,
  Compass,
  Zap,
  ShieldCheck,
  ChevronRight,
  X,
  Gauge,
  BatteryCharging,
} from 'lucide-react';

export interface FleetUnit {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  phone: string;
  town: string;
  x: number; // percentage in radar circle (-50 to +50 from center)
  y: number;
  status: 'Active Trip' | 'Standby' | 'Enroute';
  battery: number;
  speed: number;
  lat: number;
  lng: number;
}

const FLEET_UNITS: FleetUnit[] = [
  {
    id: 'OL-01',
    name: 'John Mwangi',
    vehicle: 'Toyota Axio (White)',
    plate: 'KDC 482J',
    phone: '0722 894 512',
    town: 'Ol Kalou Central Base',
    x: 0,
    y: 0,
    status: 'Active Trip',
    battery: 88,
    speed: 58,
    lat: -0.2721,
    lng: 36.3792,
  },
  {
    id: 'OL-02',
    name: 'Grace Wanjiku',
    vehicle: 'Toyota Fielder (Silver)',
    plate: 'KDE 910M',
    phone: '0711 345 678',
    town: 'Ol Joro Orok',
    x: 18,
    y: -30,
    status: 'Standby',
    battery: 94,
    speed: 0,
    lat: -0.1742,
    lng: 36.3524,
  },
  {
    id: 'OL-03',
    name: 'Peter Kariuki',
    vehicle: 'Nissan Note (Blue)',
    plate: 'KDA 220X',
    phone: '0733 987 123',
    town: 'Nyahururu Highway (B5)',
    x: 10,
    y: -65,
    status: 'Enroute',
    battery: 76,
    speed: 74,
    lat: 0.0421,
    lng: 36.3628,
  },
  {
    id: 'OL-04',
    name: 'Mary Njeri',
    vehicle: 'Mazda Demio (Red)',
    plate: 'KDF 108A',
    phone: '0799 441 223',
    town: 'Engineer Center',
    x: -25,
    y: 55,
    status: 'Standby',
    battery: 82,
    speed: 0,
    lat: -0.6384,
    lng: 36.5741,
  },
  {
    id: 'OL-05',
    name: 'David Kamau',
    vehicle: 'Toyota Wish (Black)',
    plate: 'KDB 780P',
    phone: '0702 119 445',
    town: 'Ndunyu Njeru Base',
    x: 35,
    y: 30,
    status: 'Active Trip',
    battery: 69,
    speed: 62,
    lat: -0.5189,
    lng: 36.6342,
  },
  {
    id: 'OL-06',
    name: 'Samuel Njoroge',
    vehicle: 'Toyota Vitz (Grey)',
    plate: 'KDH 554L',
    phone: '0724 667 890',
    town: 'Mairo Inya Junction',
    x: -15,
    y: -42,
    status: 'Standby',
    battery: 91,
    speed: 0,
    lat: -0.089,
    lng: 36.366,
  },
];

export function TacticalRadar() {
  const [selectedUnit, setSelectedUnit] = useState<FleetUnit | null>(null);
  const [radarAngle, setRadarAngle] = useState(0);

  // Sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-950 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                NYANDARUA TACTICAL SATELLITE RADAR
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
                LIVE GPS ORBIT
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Center: Ol Kalou Base (-0.2721°, 36.3792°) • Radius 75 KM County Coverage
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            <span className="text-emerald-400 font-bold">6 Cabs Tracked</span>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300">Sweep 360°</span>
        </div>
      </div>

      {/* Radar Main Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Radar Scope Visual (Left 2 cols) */}
        <div className="lg:col-span-2 relative flex items-center justify-center p-2">
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-zinc-950 border-2 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)] overflow-hidden flex items-center justify-center">
            {/* Concentric rings */}
            <div className="absolute w-[80%] h-[80%] rounded-full border border-emerald-500/20 pointer-events-none"></div>
            <div className="absolute w-[60%] h-[60%] rounded-full border border-emerald-500/25 pointer-events-none"></div>
            <div className="absolute w-[40%] h-[40%] rounded-full border border-emerald-500/30 pointer-events-none"></div>
            <div className="absolute w-[20%] h-[20%] rounded-full border border-emerald-500/40 pointer-events-none"></div>

            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-emerald-500/20 pointer-events-none"></div>
            <div className="absolute h-full w-[1px] bg-emerald-500/20 pointer-events-none"></div>

            {/* Range distance labels */}
            <span className="absolute top-2 text-[9px] font-mono text-emerald-500/60 font-bold">75 KM (Nyahururu / Aberdares)</span>
            <span className="absolute bottom-2 text-[9px] font-mono text-emerald-500/60 font-bold">SOUTH (Njabini / Kinangop)</span>

            {/* Rotating Radar Sweep Line */}
            <div
              className="absolute w-full h-full origin-center pointer-events-none"
              style={{
                transform: `rotate(${radarAngle}deg)`,
                background: 'conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0.28) 0deg, rgba(16, 185, 129, 0) 65deg, transparent 65deg)',
              }}
            ></div>

            {/* Center Beacon: Ol Kalou Base */}
            <div className="absolute z-10 flex flex-col items-center pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-black shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse"></div>
              <span className="text-[8px] font-mono font-bold text-amber-300 bg-black/80 px-1 rounded mt-0.5 whitespace-nowrap">
                OL KALOU (BASE)
              </span>
            </div>

            {/* Fleet units blips */}
            {FLEET_UNITS.map((unit) => {
              // Convert x, y percentage (-50 to +50) to px offset from center
              // Center is 50%, 50%
              const leftPercent = 50 + (unit.x * 0.75);
              const topPercent = 50 + (unit.y * 0.75);
              const isSelected = selectedUnit?.id === unit.id;

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnit(unit)}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-20 group transition-transform cursor-pointer p-1 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                  title={`${unit.id}: ${unit.name} (${unit.town})`}
                >
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`w-3 h-3 rounded-full border-2 border-black ${
                        unit.status === 'Active Trip'
                          ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]'
                          : unit.status === 'Enroute'
                          ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                          : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                      }`}
                    ></span>

                    <span
                      className={`absolute w-5 h-5 rounded-full animate-ping opacity-40 ${
                        unit.status === 'Active Trip' ? 'bg-cyan-400' : 'bg-emerald-400'
                      }`}
                    ></span>
                  </div>

                  <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black/90 border border-emerald-500/40 rounded text-[9px] font-mono text-white whitespace-nowrap z-40">
                    {unit.id} • {unit.town}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactical Fleet List & Selected Unit Panel (Right 1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-1.5">
            <span className="text-zinc-200 font-bold uppercase">Nyandarua Fleet Units</span>
            <span>Tap blip or list</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {FLEET_UNITS.map((unit) => {
              const isSelected = selectedUnit?.id === unit.id;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnit(unit)}
                  className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-amber-400">{unit.id}</span>
                    <div>
                      <div className="text-xs font-bold truncate">{unit.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{unit.town}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      unit.status === 'Active Trip'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : unit.status === 'Enroute'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {unit.status}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Unit Detailed Telemetry Card */}
          {selectedUnit ? (
            <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/50 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-mono font-bold text-amber-400">{selectedUnit.id}</span>
                  <span className="text-xs font-bold text-white">{selectedUnit.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUnit(null)}
                  className="text-zinc-500 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                  <span className="text-zinc-500 block">Vehicle:</span>
                  <span className="text-zinc-200">{selectedUnit.vehicle}</span>
                </div>
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                  <span className="text-zinc-500 block">Plate:</span>
                  <span className="text-zinc-200">{selectedUnit.plate}</span>
                </div>
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                  <span className="text-zinc-500 block">Speed:</span>
                  <span className="text-emerald-400 font-bold">{selectedUnit.speed} KM/H</span>
                </div>
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                  <span className="text-zinc-500 block">Battery:</span>
                  <span className="text-emerald-400 font-bold">{selectedUnit.battery}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-400 font-mono">Tel: {selectedUnit.phone}</span>
                <a
                  href={`tel:${selectedUnit.phone.replace(/\s+/g, '')}`}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold flex items-center space-x-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Driver</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center text-xs text-zinc-400 font-mono">
              Tap any vehicle blip on radar for live speed & telemetry
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
