import { useState, useEffect, FormEvent } from 'react';
import {
  Car,
  Power,
  RotateCw,
  Phone,
  PhoneCall,
  MapPin,
  Flag,
  Navigation,
  QrCode,
  Check,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Send,
  MessageSquare,
  Lock,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';
import { Ticket, TicketStatus } from '../types';
import { ticketStore, DriverProfile } from '../services/ticketStore';

interface DriverDashboardProps {
  onViewTicketOnMap?: (ticket: Ticket) => void;
}

export function DriverDashboard({ onViewTicketOnMap }: DriverDashboardProps) {
  const [driver, setDriver] = useState<DriverProfile>(() => ticketStore.getDriverProfile());
  const [tickets, setTickets] = useState<Ticket[]>(() => ticketStore.getTickets());
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');

  // Boarding verification state
  const [boardingModalTicket, setBoardingModalTicket] = useState<Ticket | null>(null);
  const [inputTicketId, setInputTicketId] = useState('');
  const [boardingError, setBoardingError] = useState<string | null>(null);
  const [isQrScanning, setIsQrScanning] = useState(false);

  // Driver reply to admin comment state
  const [selectedAdminComment, setSelectedAdminComment] = useState<{
    ticketId: string;
    commentId: string;
    message: string;
    type: string;
  } | null>(null);
  const [replyText, setReplyText] = useState('');

  // Decline modal
  const [declineTicket, setDeclineTicket] = useState<Ticket | null>(null);
  const [declineReason, setDeclineReason] = useState('Too far from current location');

  useEffect(() => {
    const unsub = ticketStore.subscribe(() => {
      setTickets(ticketStore.getTickets());
      setDriver(ticketStore.getDriverProfile());
    });
    return unsub;
  }, []);

  const handleToggleOnline = () => {
    const next = !driver.isOnline;
    ticketStore.updateDriverProfile({ isOnline: next });
  };

  const handleRefresh = () => {
    setTickets(ticketStore.getTickets());
  };

  // Ticket categories
  const pendingTickets = tickets.filter((t) => t.status === 'Waiting for Driver');
  const activeTickets = tickets.filter(
    (t) =>
      t.status !== 'Waiting for Driver' &&
      t.status !== 'Completed' &&
      t.status !== 'Cancelled'
  );
  const historyTickets = tickets.filter(
    (t) => t.status === 'Completed' || t.status === 'Cancelled'
  );

  // Total earnings
  const totalEarnings = historyTickets
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.fare, 0);

  // Driver lifecycle actions
  const handleAccept = (ticket: Ticket) => {
    ticketStore.updateTicketStatus(ticket.id, 'Accepted', {
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverPlate: driver.plate,
      driverVehicle: driver.vehicle,
    });
    setActiveTab('active');
  };

  const handleDeclineConfirm = () => {
    if (!declineTicket) return;
    ticketStore.updateTicketStatus(declineTicket.id, 'Cancelled', {
      driverId: driver.id,
    });
    setDeclineTicket(null);
  };

  const handleStartTrip = (ticket: Ticket) => {
    ticketStore.updateTicketStatus(ticket.id, 'Enroute to Pickup');
  };

  const handleArrivedAtPickup = (ticket: Ticket) => {
    ticketStore.updateTicketStatus(ticket.id, 'Arrived at Pickup');
    // Simulate mobile vibration if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const handleOpenBoardingModal = (ticket: Ticket) => {
    setBoardingModalTicket(ticket);
    setInputTicketId('');
    setBoardingError(null);
    setIsQrScanning(false);
  };

  const handleVerifyAndConfirmBoarding = () => {
    if (!boardingModalTicket) return;
    const clean = inputTicketId.trim().toUpperCase();
    if (clean !== boardingModalTicket.id.toUpperCase()) {
      setBoardingError(`Ticket ID does not match. Expected ${boardingModalTicket.id}`);
      return;
    }

    ticketStore.updateTicketStatus(boardingModalTicket.id, 'Boarded');
    setBoardingModalTicket(null);
  };

  const handleSimulateQrScan = () => {
    if (!boardingModalTicket) return;
    setIsQrScanning(true);
    setTimeout(() => {
      setInputTicketId(boardingModalTicket.id);
      setIsQrScanning(false);
      setBoardingError(null);
    }, 1200);
  };

  const handleStartJourneyToDropoff = (ticket: Ticket) => {
    ticketStore.updateTicketStatus(ticket.id, 'Enroute to Drop Off');
  };

  const handleArrivedAtDropoff = (ticket: Ticket) => {
    ticketStore.updateTicketStatus(ticket.id, 'Arrived at Drop Off');
  };

  const handleRequestPayment = (ticket: Ticket) => {
    ticketStore.updateTicketStatus(ticket.id, 'Payment Pending');
  };

  const handleConfirmPaymentReceived = (ticket: Ticket, mode: 'M-Pesa' | 'Cash') => {
    ticketStore.updateTicketStatus(ticket.id, 'Payment Confirmed', {
      paymentMethod: mode,
    });
  };

  const handleEndTrip = (ticket: Ticket) => {
    ticketStore.updateTicketStatus(ticket.id, 'Completed');
    setActiveTab('history');
  };

  const handleSendDriverReply = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAdminComment || !replyText.trim()) return;
    ticketStore.addDriverReply(
      selectedAdminComment.ticketId,
      selectedAdminComment.commentId,
      replyText.trim()
    );
    setSelectedAdminComment(null);
    setReplyText('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Driver Status Card */}
      <div className="bg-zinc-900 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">{driver.name}</h2>
                <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                  {driver.plate}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {driver.vehicle} • Base: Ol Kalou • Tel: {driver.phone}
              </p>
            </div>
          </div>

          {/* Controls: Go Online / Go Offline & Refresh */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              id="driver-toggle-online-btn"
              onClick={handleToggleOnline}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md cursor-pointer ${
                driver.isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{driver.isOnline ? 'ONLINE (Receiving Rides)' : 'GO ONLINE'}</span>
            </button>

            <button
              id="driver-refresh-btn"
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Refresh tickets"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Driver Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-zinc-800/80 text-center">
          <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase font-mono">Pending Rides</span>
            <p className="text-lg font-bold text-amber-400 font-mono">{pendingTickets.length}</p>
          </div>
          <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase font-mono">Active Trips</span>
            <p className="text-lg font-bold text-cyan-400 font-mono">{activeTickets.length}</p>
          </div>
          <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase font-mono">Total Earnings</span>
            <p className="text-lg font-bold text-emerald-400 font-mono">
              KSH {totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <span>Pending Requests</span>
          {pendingTickets.length > 0 && (
            <span className="bg-black text-amber-400 px-1.5 py-0.2 text-[10px] rounded-full">
              {pendingTickets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'active'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <span>Active Trips</span>
          {activeTickets.length > 0 && (
            <span className="bg-black text-emerald-400 px-1.5 py-0.2 text-[10px] rounded-full">
              {activeTickets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === 'history'
              ? 'bg-zinc-200 text-black shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <span>Trip History & Admin Notes</span>
        </button>
      </div>

      {/* SECTION 7: PENDING SECTION */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {!driver.isOnline ? (
            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl text-center">
              <Power className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-zinc-300 font-bold text-sm">You are currently offline</p>
              <p className="text-zinc-400 text-xs mt-1">
                Press "GO ONLINE" to receive incoming dispatch tickets from Nyandarua.
              </p>
              <button
                onClick={handleToggleOnline}
                className="mt-3 px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl text-xs"
              >
                Go Online Now
              </button>
            </div>
          ) : pendingTickets.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl text-center">
              <Car className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-pulse" />
              <p className="text-zinc-200 font-bold text-sm">No Pending Ride Requests</p>
              <p className="text-zinc-400 text-xs mt-1">
                Standing by for passengers booking from Ol Kalou & Nyandarua County towns...
              </p>
            </div>
          ) : (
            pendingTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-zinc-900 border-2 border-amber-500/80 rounded-2xl p-5 shadow-2xl space-y-3 animate-in slide-in-from-top-3"
              >
                {/* Header info matching blueprint specification */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      NEW INCOMING TICKET: {ticket.id}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {ticket.date} • {ticket.time}
                  </span>
                </div>

                {/* Card text formatted as specified in blueprint:
                    Client Mobile 07..., Tel 01... logged ticket OLX-... to be picked in Ol Kalou and dropped in Nyahururu, Date ..., Time ..., 47.4 KM, KSH 2,242, Status Pending */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-sm space-y-2">
                  <p className="text-zinc-200 leading-relaxed">
                    Client Mobile <strong className="text-emerald-400 font-mono">{ticket.mobile}</strong>
                    {ticket.telephone ? (
                      <>
                        , Tel <strong className="text-zinc-300 font-mono">{ticket.telephone}</strong>
                      </>
                    ) : null}{' '}
                    logged ticket <strong className="text-amber-400 font-mono">{ticket.id}</strong> to be picked in{' '}
                    <strong className="text-white">{ticket.pickup}</strong> (Nyandarua) and dropped in{' '}
                    <strong className="text-white">{ticket.destination}</strong>, Date{' '}
                    <span className="font-mono">{ticket.date}</span> Time{' '}
                    <span className="font-mono">{ticket.time}</span>,{' '}
                    <strong className="text-amber-400 font-mono">{ticket.distanceKm} KM</strong>,{' '}
                    <strong className="text-emerald-400 font-mono">
                      KSH {ticket.fare.toLocaleString()}
                    </strong>
                    , Status <span className="text-amber-400 font-bold">Pending</span>.
                  </p>
                </div>

                {/* Buttons: View on Map, Call Mobile, Call Telephone, WhatsApp Client, Decline with reason, Accept */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
                  {onViewTicketOnMap && (
                    <button
                      onClick={() => onViewTicketOnMap(ticket)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center space-x-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>View on Map</span>
                    </button>
                  )}

                  <a
                    href={`tel:${ticket.mobile}`}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-medium flex items-center space-x-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Mobile</span>
                  </a>

                  {ticket.telephone && (
                    <a
                      href={`tel:${ticket.telephone}`}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center space-x-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Tel</span>
                    </a>
                  )}

                  <a
                    href={`https://wa.me/${ticket.mobile.replace(/^0/, '254')}?text=Hello%20from%20OlexPress%20driver`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 text-xs font-medium flex items-center space-x-1"
                  >
                    <span>WhatsApp Client</span>
                  </a>

                  <button
                    onClick={() => setDeclineTicket(ticket)}
                    className="px-3 py-2 rounded-xl bg-red-950/50 border border-red-700/50 text-red-300 hover:bg-red-900 text-xs font-medium ml-auto"
                  >
                    Decline
                  </button>

                  {/* Main Accept button */}
                  <button
                    id="driver-accept-ride-btn"
                    onClick={() => handleAccept(ticket)}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept Ride</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 7: ACTIVE RIDES LIFE CYCLE */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeTickets.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl text-center">
              <Car className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-zinc-300 font-bold text-sm">No Active Trips</p>
              <p className="text-zinc-400 text-xs mt-1">
                Accepted rides move here to guide you through the complete trip cycle.
              </p>
            </div>
          ) : (
            activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-zinc-900 border-2 border-emerald-500/70 rounded-2xl p-5 shadow-2xl space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-lg font-bold text-white font-mono">{ticket.id}</span>
                    <p className="text-xs text-zinc-400">
                      {ticket.pickup} → {ticket.destination} ({ticket.distanceKm} KM)
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                    {ticket.status}
                  </span>
                </div>

                {/* Client Contact Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-zinc-400 block">Mobile (M-Pesa):</span>
                    <a href={`tel:${ticket.mobile}`} className="font-bold text-emerald-400 font-mono">
                      {ticket.mobile}
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Alt Phone:</span>
                    <span className="font-mono text-zinc-300">{ticket.telephone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Fare:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      KSH {ticket.fare.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Est Time:</span>
                    <span className="font-mono text-white">~{ticket.estimatedTime}</span>
                  </div>
                </div>

                {/* PROGRESSIVE STAGES ACCORDING TO SPECIFICATION */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                  {/* Stage 1: Accepted -> Start Trip */}
                  {ticket.status === 'Accepted' && (
                    <div>
                      <p className="text-xs text-zinc-300 mb-2">
                        You have accepted this trip. Press <strong>Start Trip</strong> when ready to move towards {ticket.pickup}.
                      </p>
                      <button
                        id="driver-start-trip-btn"
                        onClick={() => handleStartTrip(ticket)}
                        className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm flex items-center justify-center space-x-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Start Trip (Enroute to Pickup)</span>
                      </button>
                    </div>
                  )}

                  {/* Stage 2: Enroute to Pickup -> Arrived at Pickup */}
                  {ticket.status === 'Enroute to Pickup' && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-300">
                        Driving to pickup at <strong className="text-emerald-400">{ticket.pickup}</strong>.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            ticket.pickup + ', Nyandarua, Kenya'
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <Navigation className="w-4 h-4 text-emerald-400" />
                          <span>Navigate to Pickup ({ticket.pickup})</span>
                        </a>

                        <a
                          href={`tel:${ticket.mobile}`}
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call Mobile</span>
                        </a>

                        <button
                          id="driver-arrived-pickup-btn"
                          onClick={() => handleArrivedAtPickup(ticket)}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm ml-auto"
                        >
                          Arrived at Pickup
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stage 3: Arrived at Pickup -> Request Boarding / Verify QR */}
                  {ticket.status === 'Arrived at Pickup' && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-200">
                        You have arrived at <strong className="text-emerald-400">{ticket.pickup}</strong>. Passenger has been notified to proceed to pickup point.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`tel:${ticket.mobile}`}
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Call Client</span>
                        </a>

                        <button
                          id="driver-request-boarding-btn"
                          onClick={() => handleOpenBoardingModal(ticket)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm flex items-center space-x-1.5 ml-auto"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Request Boarding (Scan QR / Enter Ticket ID)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stage 4: Boarded -> Start Journey to Drop Off */}
                  {ticket.status === 'Boarded' && (
                    <div className="space-y-2">
                      <p className="text-xs text-emerald-400 font-semibold">
                        ✓ Boarding verified! Passenger is in vehicle.
                      </p>
                      <button
                        id="driver-start-dropoff-btn"
                        onClick={() => handleStartJourneyToDropoff(ticket)}
                        className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm flex items-center justify-center space-x-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Start Journey to Drop Off ({ticket.destination})</span>
                      </button>
                    </div>
                  )}

                  {/* Stage 5: Enroute to Drop Off -> Arrived at Drop Off */}
                  {ticket.status === 'Enroute to Drop Off' && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-300">
                        Driving towards destination: <strong className="text-amber-400">{ticket.destination}</strong> ({ticket.distanceKm} KM).
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            ticket.destination + ', Kenya'
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center space-x-1.5"
                        >
                          <Navigation className="w-4 h-4 text-amber-400" />
                          <span>Navigate to Drop Off ({ticket.destination})</span>
                        </a>

                        <button
                          onClick={() => alert('Live driver location broadcast enabled.')}
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                        >
                          Share Live Location
                        </button>

                        <button
                          id="driver-arrived-dropoff-btn"
                          onClick={() => handleArrivedAtDropoff(ticket)}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm ml-auto"
                        >
                          Arrived at Drop Off
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stage 6: Arrived at Drop Off -> Request Payment */}
                  {ticket.status === 'Arrived at Drop Off' && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-200">
                        Vehicle safely arrived at destination {ticket.destination}. Press <strong>Request Payment</strong> to show passenger fare and Till.
                      </p>
                      <button
                        id="driver-request-payment-btn"
                        onClick={() => handleRequestPayment(ticket)}
                        className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center space-x-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Request Payment (KSH {ticket.fare.toLocaleString()})</span>
                      </button>
                    </div>
                  )}

                  {/* Stage 7: Payment Pending -> Confirm Payment Received */}
                  {(ticket.status === 'Payment Pending' || ticket.status === 'Payment Confirmed') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                        <div>
                          <span className="text-[11px] text-zinc-400 block font-mono">FARE DUE</span>
                          <p className="text-xl font-black text-amber-400 font-mono">
                            KSH {ticket.fare.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-zinc-400 block font-mono">M-PESA TILL</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">892341 (OlexPress)</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          id="driver-confirm-mpesa-btn"
                          onClick={() => handleConfirmPaymentReceived(ticket, 'M-Pesa')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm M-Pesa Received</span>
                        </button>

                        <button
                          id="driver-confirm-cash-btn"
                          onClick={() => handleConfirmPaymentReceived(ticket, 'Cash')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center space-x-1 border border-zinc-700"
                        >
                          <span>Cash Received</span>
                        </button>
                      </div>

                      {/* End Trip button */}
                      <button
                        id="driver-end-trip-btn"
                        onClick={() => handleEndTrip(ticket)}
                        className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm flex items-center justify-center space-x-2 shadow-lg"
                      >
                        <Check className="w-5 h-5" />
                        <span>End Trip (Complete)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 7 & 8: HISTORY & ADMIN COMMENTS TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyTickets.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl text-center">
              <p className="text-zinc-400 text-xs">No completed trips yet.</p>
            </div>
          ) : (
            historyTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div>
                    <span className="font-mono font-bold text-amber-400 text-base">{ticket.id}</span>
                    <p className="text-xs text-zinc-400">
                      {ticket.pickup} → {ticket.destination} ({ticket.distanceKm} KM)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-400 text-base">
                      +KSH {ticket.fare.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-zinc-400">{ticket.date}</span>
                  </div>
                </div>

                {/* Section 8: Admin comments attached to this ticket */}
                {ticket.review?.adminComments && ticket.review.adminComments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase font-bold">
                      Admin Dispatch Feedback
                    </span>
                    {ticket.review.adminComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-xl border text-xs ${
                          comment.type === 'Response Required' && !comment.driverReply
                            ? 'bg-red-950/40 border-red-500/80 text-red-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-amber-400 flex items-center space-x-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{comment.adminName}</span>
                          </span>

                          {comment.type === 'Response Required' ? (
                            <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                              Admin Comment — Response Required
                            </span>
                          ) : (
                            <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full">
                              Info Only
                            </span>
                          )}
                        </div>

                        <p className="text-zinc-200 mt-1">{comment.message}</p>

                        {/* Driver Reply Section */}
                        {comment.driverReply ? (
                          <div className="mt-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                            <span className="text-emerald-400 font-bold block">
                              Your Reply to Admin ({comment.repliedAt ? new Date(comment.repliedAt).toLocaleTimeString() : ''}):
                            </span>
                            <p className="text-zinc-200 mt-0.5">{comment.driverReply}</p>
                          </div>
                        ) : comment.type === 'Response Required' ? (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                setSelectedAdminComment({
                                  ticketId: ticket.id,
                                  commentId: comment.id,
                                  message: comment.message,
                                  type: comment.type,
                                });
                                setReplyText('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1"
                            >
                              <span>Reply to Admin</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-400 mt-1 flex items-center space-x-1">
                            <Lock className="w-3 h-3 text-zinc-400" />
                            <span>Notice is marked Info Only (Read-Only)</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: Request Boarding (Scan QR / Enter Ticket ID) */}
      {boardingModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Verify Passenger Boarding</h3>
              </div>
              <button
                onClick={() => setBoardingModalTicket(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 mb-4">
              Ask client for their OlexPress ticket QR or Ticket ID to confirm authorized boarding for{' '}
              <strong className="text-amber-400">{boardingModalTicket.id}</strong>.
            </p>

            <div className="space-y-4">
              {/* Scan Camera Simulation */}
              <button
                type="button"
                onClick={handleSimulateQrScan}
                disabled={isQrScanning}
                className="w-full py-3 px-4 rounded-xl bg-zinc-950 border border-zinc-700 hover:border-emerald-400 text-zinc-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>
                  {isQrScanning ? 'Scanning camera lens...' : 'Scan QR via Camera'}
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-zinc-800 absolute"></div>
                <span className="relative z-10 bg-zinc-900 px-3 text-[11px] text-zinc-400 font-mono">
                  OR ENTER MANUALLY
                </span>
              </div>

              {/* Enter Ticket ID */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-mono">
                  Ticket ID (e.g. {boardingModalTicket.id})
                </label>
                <input
                  type="text"
                  value={inputTicketId}
                  onChange={(e) => {
                    setInputTicketId(e.target.value);
                    setBoardingError(null);
                  }}
                  placeholder="OLX-..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 rounded-xl border border-zinc-700 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 uppercase"
                />
              </div>

              {boardingError && (
                <p className="text-xs text-red-400 font-medium">{boardingError}</p>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBoardingModalTicket(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-boarding-btn"
                  onClick={handleVerifyAndConfirmBoarding}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex-1 flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Boarding</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Driver Reply to Admin */}
      {selectedAdminComment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-2">Reply to Dispatch Central</h3>
            <p className="text-xs text-zinc-400 mb-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              Admin comment: "{selectedAdminComment.message}"
            </p>

            <form onSubmit={handleSendDriverReply} className="space-y-3">
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your explanation or response to admin..."
                className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedAdminComment(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex-1 flex items-center justify-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Decline Reason */}
      {declineTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-red-500 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-2">Decline Ride Request</h3>
            <p className="text-xs text-zinc-300 mb-3">
              Select decline reason for ticket <span className="font-mono text-amber-400">{declineTicket.id}</span>:
            </p>

            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white mb-4"
            >
              <option value="Too far from current location">Too far from current location</option>
              <option value="Vehicle refueling / maintenance">Vehicle refueling / maintenance</option>
              <option value="End of driver shift">End of driver shift</option>
              <option value="Passenger destination inaccessible">Passenger destination inaccessible</option>
            </select>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setDeclineTicket(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold flex-1"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleDeclineConfirm}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex-1"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
