import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Maximize2, Minimize2, Share2, Edit3, Navigation, AlertCircle } from 'lucide-react';
import { RouteComputation } from '../data/towns';

interface DarkMapProps {
  pickup: string;
  destination: string;
  pickupCoords: [number, number];
  destCoords: [number, number];
  routeData: RouteComputation | null;
  hasCalculated: boolean;
  onEditRoute: () => void;
  error?: string | null;
}

export function DarkMap({
  pickup,
  destination,
  pickupCoords,
  destCoords,
  routeData,
  hasCalculated,
  onEditRoute,
  error,
}: DarkMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet dark map
      const map = L.map(mapContainerRef.current, {
        center: pickupCoords || [-0.2721, 36.3792],
        zoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark theme tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add custom styled zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Invalidate size after layout shifts
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Clear previous markers & polylines
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Define custom pin icons
    const pickupIcon = L.divIcon({
      className: 'custom-pickup-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
          <div class="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_15px_#10b981] animate-pulse">
            <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
          </div>
          <div class="absolute -bottom-4 text-[10px] font-bold text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded border border-emerald-500/50 whitespace-nowrap">
            ${pickup || 'Pickup'}
          </div>
        </div>
      `,
      iconSize: [0, 0],
    });

    const destIcon = L.divIcon({
      className: 'custom-dest-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
          <div class="w-8 h-8 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_15px_#f59e0b]">
            <div class="w-3 h-3 rounded-full bg-amber-400"></div>
          </div>
          <div class="absolute -bottom-4 text-[10px] font-bold text-amber-400 bg-black/80 px-1.5 py-0.5 rounded border border-amber-500/50 whitespace-nowrap">
            ${destination || 'Destination'}
          </div>
        </div>
      `,
      iconSize: [0, 0],
    });

    // Add pins
    if (markersLayerRef.current) {
      L.marker(pickupCoords, { icon: pickupIcon }).addTo(markersLayerRef.current);
      L.marker(destCoords, { icon: destIcon }).addTo(markersLayerRef.current);
    }

    // If route data exists with coordinates, draw gold line on dark map following real road curve
    if (hasCalculated && routeData && routeData.routeCoords.length > 1) {
      // Gold road route line
      const polyline = L.polyline(routeData.routeCoords, {
        color: '#F59E0B', // Gold
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-gold-glow',
      }).addTo(map);

      // Add a subtle under-glow
      const polylineGlow = L.polyline(routeData.routeCoords, {
        color: '#FBBF24',
        weight: 10,
        opacity: 0.25,
      }).addTo(map);

      routeLayerRef.current = polyline;

      // Fit map to route bounds with padding
      const bounds = L.latLngBounds(routeData.routeCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      // Just fit the two markers
      const bounds = L.latLngBounds([pickupCoords, destCoords]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [pickupCoords, destCoords, routeData, hasCalculated, pickup, destination, isFullScreen]);

  // Handle WhatsApp Share
  const handleShareFare = () => {
    if (!routeData) return;
    const text = `🚖 *OlexPress Ride Details*\n` +
      `• *From:* ${pickup} (Nyandarua Base)\n` +
      `• *To:* ${destination}\n` +
      `• *Distance:* ${routeData.distanceKm} KM (via real road)\n` +
      `• *Est. Time:* ${routeData.timeFormatted}\n` +
      `• *Fare:* KSH ${routeData.fare.toLocaleString()}\n\n` +
      `Book your ride from Ol Kalou & Nyandarua at OlexPress!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShareNotice(true);
    setTimeout(() => setShareNotice(false), 3000);
  };

  return (
    <div className={`relative transition-all duration-300 ${
      isFullScreen ? 'fixed inset-0 z-50 bg-black p-4 flex flex-col' : 'w-full my-4'
    }`}>
      {/* Map Header Card */}
      <div className="flex items-center justify-between bg-zinc-950 px-4 py-2.5 rounded-t-xl border border-zinc-800 border-b-0">
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
            LIVE DARK ROAD MAP
          </span>
          <span className="text-[10px] bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Real Road Router
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            id="map-fullscreen-btn"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 text-xs flex items-center space-x-1"
            title={isFullScreen ? 'Exit Full Screen' : 'View Full Map'}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Close</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Full Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div
        ref={mapContainerRef}
        className={`w-full bg-zinc-950 border border-zinc-800 relative z-10 ${
          isFullScreen ? 'flex-1 rounded-none min-h-[400px]' : 'h-72 sm:h-80'
        }`}
      >
        {/* Faint Pins notice before calculation */}
        {!hasCalculated && (
          <div className="absolute top-3 left-3 z-[400] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-zinc-500 animate-ping"></span>
            <span>Map previewing approximate points. Press <strong>Get Fare and Route</strong>.</span>
          </div>
        )}

        {/* Error overlay if location or road not found */}
        {error && (
          <div className="absolute inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-red-500/60 p-4 rounded-xl max-w-sm text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-300 font-semibold text-sm">{error}</p>
              <p className="text-zinc-400 text-xs mt-1">Please adjust pickup or destination to a recognizable Kenyan location.</p>
              <button
                onClick={onEditRoute}
                className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs"
              >
                Edit Location
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Box Below Map (Matches Blueprint Section 3) */}
      {hasCalculated && routeData && (
        <div className="bg-zinc-950 border border-zinc-800 border-t-0 p-4 rounded-b-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {/* Route path */}
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 block font-mono">FROM / TO</span>
              <p className="font-semibold text-white truncate">
                From <span className="text-emerald-400">{pickup}</span> (Nyandarua)
              </p>
              <p className="font-semibold text-white truncate">
                To <span className="text-amber-400">{destination}</span>
              </p>
            </div>

            {/* Distance */}
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 block font-mono">REAL ROAD DISTANCE</span>
              <p className="text-xl font-bold text-amber-400">
                {routeData.distanceKm} <span className="text-xs font-normal text-zinc-300">KM via road</span>
              </p>
              <p className="text-[11px] text-zinc-400">Follows actual tarmac/murram curve</p>
            </div>

            {/* Time */}
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 block font-mono">ESTIMATED TIME</span>
              <p className="text-xl font-bold text-white">
                ~{routeData.timeFormatted}
              </p>
              <p className="text-[11px] text-zinc-400">Via road traffic & terrain</p>
            </div>

            {/* Fare */}
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent">
              <span className="text-[11px] text-amber-400 font-semibold block font-mono">
                CALCULATED FARE
              </span>
              <p className="text-2xl font-black text-amber-400">
                KSH {routeData.fare.toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-400">
                (250 base + 42 × {routeData.distanceKm} KM)
              </p>
            </div>
          </div>

          {/* Action Buttons Below Map */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/80">
            <button
              id="map-edit-route-btn"
              onClick={onEditRoute}
              className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-medium flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Edit Route</span>
            </button>

            <button
              id="map-view-fullscreen-btn"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-medium flex items-center space-x-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{isFullScreen ? 'Exit Full Screen' : 'View Full Map'}</span>
            </button>

            <button
              id="map-share-whatsapp-btn"
              onClick={handleShareFare}
              className="px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-900 transition-colors text-xs font-semibold flex items-center space-x-1.5 ml-auto"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Share Fare on WhatsApp</span>
            </button>
          </div>

          {shareNotice && (
            <p className="text-xs text-emerald-400 mt-2 text-right">
              WhatsApp share link generated!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
