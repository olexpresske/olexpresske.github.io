import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BookingCard } from './components/BookingCard';
import { DarkMap } from './components/DarkMap';
import { TicketCard } from './components/TicketCard';
import { TrackingView } from './components/TrackingView';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import {
  MyTicketsModal,
  AboutModal,
  SupportModal,
  TermsModal,
  GalaxyGlobeModal,
} from './components/Modals';
import { GalaxyGlobe3D } from './components/GalaxyGlobe3D';
import { Sparkles, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  findTown,
  calculateRoadRoute,
  RouteComputation,
  NYANDARUA_TOWNS,
} from './data/towns';
import { ticketStore } from './services/ticketStore';
import { Ticket } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'passenger' | 'driver' | 'admin'>('passenger');
  const [passengerSubView, setPassengerSubView] = useState<'booking' | 'tracking'>('booking');

  // Booking fields
  const [pickup, setPickup] = useState('Ol Kalou');
  const [destination, setDestination] = useState('Nyahururu');

  // Coords & calculated route
  const [pickupCoords, setPickupCoords] = useState<[number, number]>([-0.2721, 36.3792]);
  const [destCoords, setDestCoords] = useState<[number, number]>([0.0421, 36.3628]);
  const [routeData, setRouteData] = useState<RouteComputation | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Tickets store state
  const [tickets, setTickets] = useState<Ticket[]>(() => ticketStore.getTickets());
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(() => ticketStore.getActiveTicket());
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);

  // Modals state
  const [myTicketsOpen, setMyTicketsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [galaxyModalOpen, setGalaxyModalOpen] = useState(false);
  const [showHeroGalaxy, setShowHeroGalaxy] = useState(true);

  // Reference for scrolling to ticket card
  const ticketCardRef = useRef<HTMLDivElement>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = ticketStore.subscribe(() => {
      const allTickets = ticketStore.getTickets();
      const active = ticketStore.getActiveTicket();
      setTickets(allTickets);
      setActiveTicket(active);

      // If user is viewing a tracked ticket, keep it fresh
      if (trackedTicket) {
        const updated = allTickets.find((t) => t.id === trackedTicket.id);
        if (updated) {
          setTrackedTicket(updated);
        }
      }
    });

    // If query parameter specifies view or track id
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const trackIdParam = params.get('id');

    if (viewParam === 'driver') {
      setCurrentView('driver');
    } else if (viewParam === 'admin') {
      setCurrentView('admin');
    }

    if (trackIdParam) {
      const t = ticketStore.getTicket(trackIdParam);
      if (t) {
        setTrackedTicket(t);
        setCurrentView('passenger');
        setPassengerSubView('tracking');
      }
    } else {
      const currentActive = ticketStore.getActiveTicket();
      if (currentActive) {
        setTrackedTicket(currentActive);
        setPassengerSubView('tracking');
      }
    }

    return unsub;
  }, []);

  // Update pickup coordinates whenever pickup changes
  useEffect(() => {
    const town = findTown(pickup);
    if (town) {
      setPickupCoords(town.coords);
    }
  }, [pickup]);

  // Update dest coordinates whenever destination changes
  useEffect(() => {
    const town = findTown(destination);
    if (town) {
      setDestCoords(town.coords);
    }
  }, [destination]);

  // Get Fare and Route calculation
  const handleGetFareAndRoute = async () => {
    setIsCalculating(true);
    setRouteError(null);

    const pTown = findTown(pickup);
    const dTown = findTown(destination);

    if (!pTown) {
      setRouteError('Pickup location not found in Nyandarua County.');
      setIsCalculating(false);
      return;
    }

    if (!dTown) {
      setRouteError('Destination location not found in Kenya.');
      setIsCalculating(false);
      return;
    }

    try {
      const result = await calculateRoadRoute(pTown.name, dTown.name);
      if (!result) {
        setRouteError('No road route found between these locations.');
        setHasCalculated(false);
      } else {
        setRouteData(result);
        setPickupCoords(pTown.coords);
        setDestCoords(dTown.coords);
        setHasCalculated(true);

        // Smooth scroll to the ticket confirmation card
        setTimeout(() => {
          ticketCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } catch {
      setRouteError('Error calculating road route.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Confirm booking action (Section 4 & 5)
  const handleConfirmBooking = (mobile: string, telephone?: string) => {
    if (!routeData) return;

    const newTicket = ticketStore.createTicket({
      pickup,
      destination,
      pickupCoords,
      destCoords,
      routeCoords: routeData.routeCoords,
      distanceKm: routeData.distanceKm,
      estimatedTime: routeData.timeFormatted,
      fare: routeData.fare,
      mobile,
      telephone,
    });

    setTrackedTicket(newTicket);
    setPassengerSubView('tracking');
    setHasCalculated(false);
  };

  const handleEditRoute = () => {
    setHasCalculated(false);
  };

  const handleTrackCurrentTicket = () => {
    if (activeTicket) {
      setTrackedTicket(activeTicket);
      setPassengerSubView('tracking');
    }
  };

  const handleBookNewRide = () => {
    setPassengerSubView('booking');
    setHasCalculated(false);
    setTrackedTicket(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header (Section 1) */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === 'passenger' && activeTicket) {
            setPassengerSubView('tracking');
            setTrackedTicket(activeTicket);
          }
        }}
        onOpenMyTickets={() => setMyTicketsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenSupport={() => setSupportOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenGalaxy={() => setGalaxyModalOpen(true)}
        activeTicketCount={activeTicket ? 1 : 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {/* VIEW 1: PASSENGER PORTAL */}
        {currentView === 'passenger' && (
          <div>
            {passengerSubView === 'tracking' && trackedTicket ? (
              <TrackingView
                ticket={trackedTicket}
                onBackToHome={() => setPassengerSubView('booking')}
                onBookNewRide={handleBookNewRide}
              />
            ) : (
              <div className="space-y-6">
                {/* 3D GALAXY GLOBE HERO SHOWCASE */}
                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-zinc-950/80 shadow-2xl backdrop-blur-md">
                  {/* Top Bar for 3D Galaxy Banner */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/90 border-b border-zinc-800/80">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-xs font-bold text-amber-400 font-mono tracking-wider">
                        3D COSMIC GALAXY • NYANDARUA BASE
                      </span>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                        INTERACTIVE GLOBE
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setGalaxyModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1 transition-all"
                        title="Open Fullscreen Cosmic 3D Galaxy"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Immersive Fullscreen</span>
                      </button>

                      <button
                        onClick={() => setShowHeroGalaxy(!showHeroGalaxy)}
                        className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs transition-colors"
                        title={showHeroGalaxy ? 'Minimize 3D Galaxy' : 'Expand 3D Galaxy'}
                      >
                        {showHeroGalaxy ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3D Galaxy Globe Viewport */}
                  {showHeroGalaxy && (
                    <div className="relative w-full h-[320px] sm:h-[360px]">
                      <GalaxyGlobe3D
                        height={360}
                        interactive={true}
                        showControls={true}
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 2: BOOKING CARD */}
                <BookingCard
                  pickup={pickup}
                  destination={destination}
                  onChangePickup={setPickup}
                  onChangeDestination={setDestination}
                  onGetFareAndRoute={handleGetFareAndRoute}
                  activeTicket={activeTicket}
                  onTrackCurrentTicket={handleTrackCurrentTicket}
                  isCalculating={isCalculating}
                />

                {/* SECTION 3: LIVE DARK ROAD MAP */}
                <DarkMap
                  pickup={pickup}
                  destination={destination}
                  pickupCoords={pickupCoords}
                  destCoords={destCoords}
                  routeData={routeData}
                  hasCalculated={hasCalculated}
                  onEditRoute={handleEditRoute}
                  error={routeError}
                />

                {/* SECTION 4: TICKET CONFIRMATION & PHONE ENTRY CARD */}
                {hasCalculated && routeData && (
                  <div ref={ticketCardRef}>
                    <TicketCard
                      pickup={pickup}
                      destination={destination}
                      routeData={routeData}
                      onConfirmBooking={handleConfirmBooking}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DRIVER DASHBOARD (Section 7) */}
        {currentView === 'driver' && (
          <DriverDashboard
            onViewTicketOnMap={(ticket) => {
              setPickup(ticket.pickup);
              setDestination(ticket.destination);
              setPickupCoords(ticket.pickupCoords);
              setDestCoords(ticket.destCoords);
              setRouteData({
                distanceKm: ticket.distanceKm,
                timeFormatted: ticket.estimatedTime,
                fare: ticket.fare,
                routeCoords: ticket.routeCoords,
              });
              setHasCalculated(true);
              setPassengerSubView('booking');
              setCurrentView('passenger');
            }}
          />
        )}

        {/* VIEW 3: ADMIN DASHBOARD (Section 9) */}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="w-full bg-zinc-950 border-t border-zinc-900 py-4 px-4 text-center text-xs text-zinc-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 OlexPress — Your Ride Everywhere • Ol Kalou, Nyandarua County Base</p>
          <div className="flex items-center space-x-3 text-[11px]">
            <button onClick={() => setTermsOpen(true)} className="hover:text-amber-400">
              Nyandarua Launch Rules
            </button>
            <span>•</span>
            <button onClick={() => setSupportOpen(true)} className="hover:text-amber-400">
              Dispatch Hotline
            </button>
            <span>•</span>
            <button onClick={() => setAboutOpen(true)} className="hover:text-amber-400">
              About
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MyTicketsModal
        isOpen={myTicketsOpen}
        onClose={() => setMyTicketsOpen(false)}
        tickets={tickets}
        onSelectTicket={(ticket) => {
          setTrackedTicket(ticket);
          setCurrentView('passenger');
          setPassengerSubView('tracking');
        }}
      />

      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
      <GalaxyGlobeModal isOpen={galaxyModalOpen} onClose={() => setGalaxyModalOpen(false)} />
    </div>
  );
}
