import { useState, useEffect, FormEvent } from 'react';
import QRCode from 'qrcode';
import { Phone, PhoneCall, ShieldCheck, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { RouteComputation } from '../data/towns';
import { RideClassType } from './BookingCard';

interface TicketCardProps {
  pickup: string;
  destination: string;
  routeData: RouteComputation;
  onConfirmBooking: (mobile: string, telephone?: string, finalFare?: number) => void;
  rideClass?: RideClassType;
}

export function TicketCard({
  pickup,
  destination,
  routeData,
  onConfirmBooking,
  rideClass = 'Standard',
}: TicketCardProps) {
  const [ticketPreviewId] = useState(() => `OLX-${Math.floor(100000 + Math.random() * 900000)}`);
  const [currentDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [currentTime] = useState(() => {
    const d = new Date();
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${ampm}`;
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [mobile, setMobile] = useState('');
  const [telephone, setTelephone] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Generate QR Code encoding Ticket ID
  useEffect(() => {
    QRCode.toDataURL(ticketPreviewId, {
      width: 160,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [ticketPreviewId]);

  // Validate Kenyan mobile number format (e.g. 07xx, 01xx, 2547xx)
  const isValidKenyanNumber = (num: string): boolean => {
    const clean = num.replace(/\s+/g, '');
    const regex = /^(?:07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/;
    return regex.test(clean);
  };

  const handleMobileChange = (val: string) => {
    setMobile(val);
    if (val.length >= 10) {
      if (!isValidKenyanNumber(val)) {
        setMobileError('Enter valid 10-digit Kenyan mobile (07... or 01...)');
      } else {
        setMobileError(null);
      }
    } else {
      setMobileError(null);
    }
  };

  const handleClearPhones = () => {
    setMobile('');
    setTelephone('');
    setMobileError(null);
  };

  const isFormValid = isValidKenyanNumber(mobile);

  const fareMultiplier =
    rideClass === 'VIP' ? 1.6 : rideClass === 'Express' ? 1.2 : rideClass === 'Cargo' ? 1.15 : 1.0;
  const finalFare = Math.round(routeData.fare * fareMultiplier);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setMobileError('Please enter a valid M-Pesa mobile number (e.g. 0712345678)');
      return;
    }
    onConfirmBooking(mobile.trim(), telephone.trim() || undefined, finalFare);
  };

  return (
    <div className="w-full bg-zinc-900 border-2 border-amber-500/70 rounded-2xl p-4 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-300 relative overflow-hidden">
      {/* Decorative Gold Header Ribbon */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
          <span className="text-xs font-mono font-bold text-amber-400 tracking-wider uppercase">
            CONFIRM RIDE TICKET & PHONE ENTRY
          </span>
        </div>
        <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
          ID: <strong className="text-white">{ticketPreviewId}</strong>
        </span>
      </div>

      {/* Ticket summary layout */}
      <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/80 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Ride particulars */}
          <div className="flex-1 space-y-2 text-sm w-full">
            <div className="flex justify-between items-center py-1 border-b border-zinc-900">
              <span className="text-xs text-zinc-400">Date & Time</span>
              <span className="font-mono text-zinc-200 text-xs">
                {currentDate} • {currentTime}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-zinc-900">
              <span className="text-xs text-zinc-400">Pickup Base</span>
              <span className="font-semibold text-emerald-400">{pickup} (Nyandarua)</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-zinc-900">
              <span className="text-xs text-zinc-400">Destination</span>
              <span className="font-semibold text-amber-400">{destination}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-zinc-900">
              <span className="text-xs text-zinc-400">Real Road Distance</span>
              <span className="font-mono text-zinc-200">
                {routeData.distanceKm} KM <span className="text-[11px] text-zinc-500">(~{routeData.timeFormatted})</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-zinc-900">
              <span className="text-xs text-zinc-400">Ride Tier</span>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                {rideClass} {fareMultiplier > 1 ? `(${fareMultiplier}x)` : ''}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 text-base">
              <span className="font-semibold text-zinc-300">Total Fare</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                KSH {finalFare.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right: QR Code encoding ticket ID */}
          <div className="flex flex-col items-center bg-white p-2.5 rounded-xl shadow-inner border border-zinc-300">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Ticket QR Code"
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
              />
            ) : (
              <div className="w-28 h-28 bg-zinc-200 animate-pulse rounded" />
            )}
            <span className="text-[10px] font-mono text-black font-bold mt-1">
              {ticketPreviewId}
            </span>
          </div>
        </div>
      </div>

      {/* Phone entry form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mobile Number M-Pesa (Required) */}
          <div>
            <label
              htmlFor="ticket-mobile-input"
              className="block text-xs font-semibold text-zinc-200 mb-1 flex items-center space-x-1"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Mobile Number M-Pesa</span>
              <span className="text-red-400 text-xs">* (Required)</span>
            </label>
            <div className="relative">
              <input
                id="ticket-mobile-input"
                type="tel"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                placeholder="0712345678"
                className={`w-full px-3.5 py-2.5 bg-zinc-950 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                  mobileError
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : isValidKenyanNumber(mobile)
                    ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    : 'border-zinc-700 focus:border-amber-400'
                }`}
                required
              />
              {isValidKenyanNumber(mobile) && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
              )}
            </div>
            {mobileError ? (
              <p className="text-[11px] text-red-400 mt-1">{mobileError}</p>
            ) : (
              <p className="text-[10px] text-zinc-400 mt-1">Used for driver calls & M-Pesa payment</p>
            )}
          </div>

          {/* Alternative Telephone (Optional) */}
          <div>
            <label
              htmlFor="ticket-tel-input"
              className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center space-x-1"
            >
              <PhoneCall className="w-3.5 h-3.5 text-zinc-400" />
              <span>Alternative Telephone Number</span>
              <span className="text-zinc-400 text-[10px]">(Optional)</span>
            </label>
            <input
              id="ticket-tel-input"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="07... or 01..."
              className="w-full px-3.5 py-2.5 bg-zinc-950 rounded-xl border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-all"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Backup contact in case primary is busy</p>
          </div>
        </div>

        {/* Clear phone button & helper */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            id="ticket-clear-phones-btn"
            onClick={handleClearPhones}
            className="text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Phone</span>
          </button>
          <span className="text-[11px] text-zinc-400 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Nyandarua dispatch network</span>
          </span>
        </div>

        {/* Accept and Confirm Book Ride button — main gold button */}
        <button
          type="submit"
          id="confirm-book-ride-btn"
          disabled={!isFormValid}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center space-x-2 shadow-xl ${
            isFormValid
              ? 'bg-amber-400 hover:bg-amber-300 text-black cursor-pointer shadow-amber-500/20 active:scale-[0.99]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
          }`}
        >
          <span>Accept and Confirm Book Ride</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
