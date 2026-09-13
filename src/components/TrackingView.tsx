import { useState, useEffect, FormEvent } from 'react';
import QRCode from 'qrcode';
import {
  Clock,
  MapPin,
  Flag,
  Phone,
  PhoneCall,
  Share2,
  AlertOctagon,
  CheckCircle2,
  ShieldCheck,
  Star,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CreditCard,
  Banknote,
  FastForward,
} from 'lucide-react';
import { Ticket, TicketStatus } from '../types';
import { ticketStore } from '../services/ticketStore';

interface TrackingViewProps {
  ticket: Ticket;
  onBackToHome: () => void;
  onBookNewRide: () => void;
}

const STATUS_STEPS: TicketStatus[] = [
  'Waiting for Driver',
  'Accepted',
  'Enroute to Pickup',
  'Arrived at Pickup',
  'Boarded',
  'Enroute to Drop Off',
  'Arrived at Drop Off',
  'Payment Pending',
  'Completed',
];

export function TrackingView({ ticket, onBackToHome, onBookNewRide }: TrackingViewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [hasPaid, setHasPaid] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [copiedShare, setCopiedShare] = useState(false);

  // Generate QR
  useEffect(() => {
    QRCode.toDataURL(ticket.id, {
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' },
    }).then(setQrDataUrl);
  }, [ticket.id]);

  // 5-minute timer countdown for review after End Trip
  useEffect(() => {
    if (ticket.status !== 'Completed' || ticket.bookingUnlocked) return;

    const interval = setInterval(() => {
      if (ticket.reviewTimeoutAt) {
        const diff = Math.max(0, Math.floor((ticket.reviewTimeoutAt - Date.now()) / 1000));
        setRemainingSeconds(diff);
        if (diff <= 0) {
          ticketStore.checkAutoUnlockExpiry();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket.status, ticket.bookingUnlocked, ticket.reviewTimeoutAt]);

  const currentStepIndex = STATUS_STEPS.indexOf(ticket.status);

  // Handlers
  const handleCancelRequest = () => {
    if (ticket.status !== 'Waiting for Driver') return;
    const ok = window.confirm('Are you sure you want to cancel this ride request?');
    if (ok) {
      ticketStore.cancelTicket(ticket.id);
      onBackToHome();
    }
  };

  const handleCallDriver = () => {
    const phone = ticket.driverPhone || '0722894512';
    window.open(`tel:${phone}`);
  };

  const handleWhatsAppDriver = () => {
    const phone = ticket.driverPhone || '254722894512';
    const text = `Hello driver, I am passenger for OlexPress ticket ${ticket.id} (${ticket.pickup} to ${ticket.destination}).`;
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTicket = () => {
    const text = `🚖 *OlexPress Ticket Details*\n` +
      `• Ticket ID: ${ticket.id}\n` +
      `• From: ${ticket.pickup} (Nyandarua)\n` +
      `• To: ${ticket.destination}\n` +
      `• Status: ${ticket.status}\n` +
      `• Fare: KSH ${ticket.fare.toLocaleString()}\n` +
      `• Track live at: ${window.location.origin}`;

    if (navigator.share) {
      navigator.share({ title: 'OlexPress Ticket', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleSubmitReview = (e: FormEvent) => {
    e.preventDefault();
    ticketStore.submitReview(ticket.id, rating, comment);
  };

  const handleSkipReview = () => {
    ticketStore.skipReview(ticket.id);
  };

  const handleFastForwardTimer = () => {
    ticketStore.fastForwardTimeout(ticket.id);
  };

  const isDriverAccepted = ticket.status !== 'Waiting for Driver' && ticket.status !== 'Cancelled';
  const minutesLeft = Math.floor(remainingSeconds / 60);
  const secondsLeft = remainingSeconds % 60;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Top Banner with Back or New Ride */}
      <div className="flex items-center justify-between">
        <button
          id="tracking-back-home-btn"
          onClick={onBackToHome}
          className="text-xs text-zinc-400 hover:text-amber-400 flex items-center space-x-1 transition-colors"
        >
          <span>← Back to Home / Map</span>
        </button>
        {ticket.bookingUnlocked && (
          <button
            id="tracking-book-new-ride-btn"
            onClick={onBookNewRide}
            className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-all shadow-md flex items-center space-x-1"
          >
            <span>Book Return / New Ride</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Ticket Tracking Card */}
      <div className="bg-zinc-900 border-2 border-amber-500/70 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Ticket Header & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-wider">
                {ticket.id}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {ticket.date} • {ticket.time}
              </span>
            </div>
            <p className="text-xs text-zinc-300">OlexPress Nyandarua Base Dispatch</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span
              id="ticket-status-badge"
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 border ${
                ticket.status === 'Completed'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                  : ticket.status === 'Cancelled'
                  ? 'bg-red-950 text-red-400 border-red-500/50'
                  : ticket.status === 'Waiting for Driver'
                  ? 'bg-amber-950 text-amber-400 border-amber-500/50 animate-pulse'
                  : 'bg-cyan-950 text-cyan-400 border-cyan-500/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>{ticket.status}</span>
            </span>
          </div>
        </div>

        {/* Status Timeline Bar */}
        <div className="py-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
            <span>DISPATCH PROGRESS</span>
            <span>
              Stage {Math.max(1, currentStepIndex + 1)} of {STATUS_STEPS.length}
            </span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800 flex">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${
                  ticket.status === 'Completed'
                    ? 100
                    : ticket.status === 'Cancelled'
                    ? 0
                    : Math.max(10, ((currentStepIndex + 1) / STATUS_STEPS.length) * 100)
                }%`,
              }}
            />
          </div>

          {/* Current stage headline */}
          <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-white">
                  {ticket.status === 'Waiting for Driver' && 'Searching for Nyandarua driver...'}
                  {ticket.status === 'Accepted' && 'Driver accepted! Preparing vehicle.'}
                  {ticket.status === 'Enroute to Pickup' && `Driver on the way to ${ticket.pickup}!`}
                  {ticket.status === 'Arrived at Pickup' && `Driver has arrived at ${ticket.pickup}! Please board.`}
                  {ticket.status === 'Boarded' && `Boarded! Heading to ${ticket.destination}.`}
                  {ticket.status === 'Enroute to Drop Off' && `On the road to ${ticket.destination}.`}
                  {ticket.status === 'Arrived at Drop Off' && `Arrived at ${ticket.destination}. Please proceed to payment.`}
                  {ticket.status === 'Payment Pending' && `Fare: KSH ${ticket.fare.toLocaleString()} — Awaiting payment confirmation.`}
                  {ticket.status === 'Payment Confirmed' && 'Payment confirmed! Finalizing trip.'}
                  {ticket.status === 'Completed' && 'Trip successfully completed. Thank you for riding with OlexPress!'}
                  {ticket.status === 'Cancelled' && 'Ride request was cancelled.'}
                </p>
                <p className="text-xs text-zinc-400">
                  {ticket.driverName ? `Assigned Driver: ${ticket.driverName} (${ticket.driverVehicle || 'Toyota Fielder'} • ${ticket.driverPlate || 'KDC 482J'})` : 'Dispatching closest driver in Ol Kalou / Nyandarua'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6 LOCK RULE BANNER: No Cancel when Driver Accepts */}
        {isDriverAccepted && ticket.status !== 'Completed' && (
          <div className="my-2 bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-300">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-400">Ride accepted — Cancel disabled.</p>
              <p className="text-zinc-300">
                Please call driver directly or contact support if you have an urgent change.
              </p>
            </div>
          </div>
        )}

        {/* Ride Details & QR Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="sm:col-span-2 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
              <span className="text-zinc-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pickup:</span>
              </span>
              <span className="font-bold text-emerald-400">{ticket.pickup} (Nyandarua Base)</span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
              <span className="text-zinc-400 flex items-center space-x-1">
                <Flag className="w-3.5 h-3.5 text-amber-400" />
                <span>Drop Off:</span>
              </span>
              <span className="font-bold text-amber-400">{ticket.destination}</span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
              <span className="text-zinc-400">Road Distance:</span>
              <span className="font-mono text-zinc-200">{ticket.distanceKm} KM (~{ticket.estimatedTime})</span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
              <span className="text-zinc-400 flex items-center space-x-1">
                <Phone className="w-3 h-3 text-zinc-400" />
                <span>Client Mobile (M-Pesa):</span>
              </span>
              <span className="font-mono font-bold text-white">{ticket.mobile}</span>
            </div>

            {ticket.telephone && (
              <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                <span className="text-zinc-400 flex items-center space-x-1">
                  <PhoneCall className="w-3 h-3 text-zinc-400" />
                  <span>Alt Telephone:</span>
                </span>
                <span className="font-mono text-zinc-300">{ticket.telephone}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-zinc-300 text-sm">Fare:</span>
              <span className="font-mono font-black text-amber-400 text-xl">
                KSH {ticket.fare.toLocaleString()}
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-white p-2 rounded-xl text-black">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Boarding QR" className="w-24 h-24 object-contain" />
            ) : (
              <div className="w-24 h-24 bg-zinc-200 animate-pulse rounded" />
            )}
            <span className="text-[10px] font-mono font-bold mt-1 text-center">
              BOARDING QR
            </span>
          </div>
        </div>

        {/* Action Buttons: Cancel vs Call/WhatsApp Driver */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
          {ticket.status === 'Waiting for Driver' && (
            <button
              id="cancel-request-btn"
              onClick={handleCancelRequest}
              className="px-4 py-2.5 rounded-xl bg-red-950/80 border border-red-600/60 text-red-300 hover:bg-red-900 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Request</span>
            </button>
          )}

          {isDriverAccepted && ticket.status !== 'Completed' && (
            <>
              <button
                id="call-driver-btn"
                onClick={handleCallDriver}
                className="px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 hover:bg-emerald-900 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver ({ticket.driverPhone || '0722894512'})</span>
              </button>

              <button
                id="whatsapp-driver-btn"
                onClick={handleWhatsAppDriver}
                className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/40 text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <span>WhatsApp Driver</span>
              </button>
            </>
          )}

          <button
            id="share-ticket-btn"
            onClick={handleShareTicket}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 ml-auto transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{copiedShare ? 'Copied Ticket Info!' : 'Share Ticket'}</span>
          </button>
        </div>

        {/* PAYMENT CARD (When Driver requests payment / Payment Pending) */}
        {(ticket.status === 'Payment Pending' || ticket.status === 'Arrived at Drop Off') && (
          <div className="mt-5 bg-zinc-950 border-2 border-emerald-500/80 rounded-xl p-4 shadow-xl animate-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-white">PAY NOW — FARE KSH {ticket.fare.toLocaleString()}</span>
              </div>
              <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 font-mono">
                M-Pesa Till: 892341
              </span>
            </div>

            <p className="text-xs text-zinc-300 mb-3">
              Driver has arrived at destination. Choose payment mode:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setHasPaid(true)}
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay with M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setHasPaid(true)}
                className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center space-x-1.5 border border-zinc-700 transition-colors"
              >
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>Pay with Cash</span>
              </button>
            </div>

            <button
              type="button"
              id="i-have-paid-btn"
              onClick={() => {
                setHasPaid(true);
                ticketStore.updateTicketStatus(ticket.id, 'Payment Confirmed');
              }}
              className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Have Paid (Notify Driver)</span>
            </button>

            {hasPaid && (
              <p className="text-xs text-emerald-400 mt-2 text-center">
                ✓ Payment submitted. Awaiting driver confirmation.
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECTION 8: REVIEW FLOW POPUP (With 5-Minute Timer & Auto-Unlock) */}
      {ticket.status === 'Completed' && !ticket.bookingUnlocked && (
        <div className="bg-zinc-900 border-2 border-amber-400 rounded-2xl p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
          {/* Header with 5-min Countdown */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Rate Your Ride Experience</span>
              </h3>
              <p className="text-xs text-zinc-400">Driver: {ticket.driverName || 'Mwangi Kamau'}</p>
            </div>

            {/* Countdown Badge & Fast Forward Test Tool */}
            <div className="flex items-center space-x-2">
              <div
                className="text-xs font-mono font-bold bg-zinc-950 px-2.5 py-1 rounded-lg border border-amber-500/50 text-amber-400"
                title="Auto-unlocks booking after 5 minutes"
              >
                Auto-Unlock: {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
              </div>
              <button
                type="button"
                onClick={handleFastForwardTimer}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center space-x-0.5 border border-zinc-700"
                title="Fast forward 5 minutes (Test Mode)"
              >
                <FastForward className="w-3 h-3 text-amber-400" />
                <span>Test Fast-Forward</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-300 mb-4">
            Your review is sent directly to <strong>Admin Dispatch</strong> (not to driver) to maintain service excellence. Booking unlocks immediately upon review or after 5 minutes.
          </p>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Star Rating 1 to 5 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Rate Driver (1 to 5 Stars)
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-bold text-amber-400 ml-2">{rating} / 5 Stars</span>
              </div>
            </div>

            {/* Comment Box */}
            <div>
              <label
                htmlFor="review-comment-input"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                How was the ride? (Comment)
              </label>
              <textarea
                id="review-comment-input"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (punctuality, driving comfort, Ol Kalou route)..."
                className="w-full px-3 py-2 bg-zinc-950 rounded-xl border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Buttons: Submit Review vs Skip */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                id="submit-review-btn"
                className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Submit Review (Unlock Now)
              </button>

              <button
                type="button"
                id="skip-review-btn"
                onClick={handleSkipReview}
                className="py-3 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm border border-zinc-700 transition-all"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UNLOCKED NOTICE (After submit, skip, or 5 min auto-unlock) */}
      {ticket.bookingUnlocked && (
        <div className="bg-emerald-950/60 border border-emerald-500/70 rounded-xl p-4 text-center animate-in fade-in">
          <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold text-sm mb-1">
            <CheckCircle2 className="w-5 h-5" />
            <span>Booking Unlocked</span>
          </div>
          <p className="text-xs text-zinc-200">
            You can now book your next ride from Ol Kalou.
            {!ticket.review?.rating && (
              <span className="block mt-1 text-zinc-400">
                You can still submit a rating later from <strong>My Tickets</strong>.
              </span>
            )}
          </p>
          <div className="mt-3 flex justify-center space-x-3">
            <button
              onClick={onBookNewRide}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-all shadow-md"
            >
              Book New Ride Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
