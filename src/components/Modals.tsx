import { useState } from 'react';
import {
  X,
  Ticket as TicketIcon,
  Star,
  Info,
  PhoneCall,
  FileText,
  Clock,
  MapPin,
  Flag,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Ticket } from '../types';
import { ticketStore } from '../services/ticketStore';
import { GalaxyGlobe3D } from './GalaxyGlobe3D';
import { OlexLogo } from './OlexLogo';

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export function MyTicketsModal({
  isOpen,
  onClose,
  tickets,
  onSelectTicket,
}: MyTicketsModalProps) {
  const [lateRatingTicketId, setLateRatingTicketId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [commentVal, setCommentVal] = useState('');

  if (!isOpen) return null;

  const handleLateRateSubmit = (ticketId: string) => {
    ticketStore.submitLateReview(ticketId, ratingVal, commentVal);
    setLateRatingTicketId(null);
    setCommentVal('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-amber-400 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <TicketIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">My OlexPress Tickets</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {tickets.length === 0 ? (
            <p className="text-zinc-400 text-xs text-center py-8">
              No tickets found yet. Book your first ride from Ol Kalou on the homepage!
            </p>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2 hover:border-amber-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{ticket.id}</span>
                    <span className="text-[11px] text-zinc-400">{ticket.date} • {ticket.time}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      ticket.status === 'Completed'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        : ticket.status === 'Cancelled'
                        ? 'bg-red-950 text-red-400 border-red-500/40'
                        : 'bg-amber-950 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <div className="text-xs text-zinc-300 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <span className="text-emerald-400">{ticket.pickup}</span>
                    <span>→</span>
                    <span className="text-amber-400">{ticket.destination}</span>
                    <span className="text-zinc-500">({ticket.distanceKm} KM)</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">
                    KSH {ticket.fare.toLocaleString()}
                  </span>
                </div>

                {/* Rating status or late rate button */}
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                  {ticket.review?.rating ? (
                    <div className="flex items-center space-x-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>Rated {ticket.review.rating}/5</span>
                      {ticket.review.comment && (
                        <span className="text-zinc-400 truncate max-w-[180px]">
                          - "{ticket.review.comment}"
                        </span>
                      )}
                    </div>
                  ) : ticket.status === 'Completed' ? (
                    <div>
                      {lateRatingTicketId === ticket.id ? (
                        <div className="space-y-2 mt-1 w-full bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setRatingVal(s)}
                                className="p-0.5"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    s <= ratingVal ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-amber-400 font-bold ml-2">{ratingVal}★</span>
                          </div>
                          <input
                            type="text"
                            value={commentVal}
                            onChange={(e) => setCommentVal(e.target.value)}
                            placeholder="Optional comment..."
                            className="w-full px-2 py-1 bg-black rounded text-xs text-white border border-zinc-700"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLateRateSubmit(ticket.id)}
                              className="px-3 py-1 rounded bg-amber-400 text-black font-bold text-[11px]"
                            >
                              Submit Rating
                            </button>
                            <button
                              onClick={() => setLateRatingTicketId(null)}
                              className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setLateRatingTicketId(ticket.id);
                            setRatingVal(5);
                            setCommentVal('');
                          }}
                          className="text-amber-400 hover:underline flex items-center space-x-1 text-[11px]"
                        >
                          <Star className="w-3 h-3" />
                          <span>Submit Late Rating</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[11px]">Trip in progress</span>
                  )}

                  <button
                    onClick={() => {
                      onClose();
                      onSelectTicket(ticket);
                    }}
                    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs ml-auto"
                  >
                    View Ticket & Track
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function AboutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-amber-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">About OlexPress</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <p>
            <strong className="text-amber-400">OlexPress — Your Ride Everywhere</strong> is the premier ride hailing and long-distance travel dispatch service born in{' '}
            <strong className="text-emerald-400">Ol Kalou, Nyandarua County</strong>.
          </p>

          <p>
            We bridge the gap for residents, business travelers, and visitors departing from any of Nyandarua's 16 authorized towns (Ol Kalou, Njabini, Engineer, Miharati, Wanjohi, Ol Joro Orok, Mairo Inya, Kasuku, Shamata, etc.) to <strong>anywhere in Kenya</strong>—from neighboring Nakuru, Nyahururu, and Nyeri, all the way to Nairobi, Mombasa, and beyond.
          </p>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1 font-mono text-[11px]">
            <p className="text-amber-400 font-bold">Key Operating Rules:</p>
            <p>• Pickup Base: Exclusively Nyandarua County</p>
            <p>• Drop Off: Any location in Kenya</p>
            <p>• Real Road Distance: Dynamic tarmac & murram road routing</p>
            <p>• Transparent Fare: KSH 250 base + KSH 42 per KM</p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-400 text-black font-bold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-cyan-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">OlexPress Support & Dispatch</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-zinc-300">
          <p>
            Our 24/7 Ol Kalou Central Dispatch team is ready to assist passengers and drivers across Nyandarua and nationwide.
          </p>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Ol Kalou Dispatch Hotline:</span>
              <a href="tel:+254700000000" className="font-bold text-emerald-400 font-mono">
                0722 894 512 / 0712 345 678
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">WhatsApp Support:</span>
              <a
                href="https://wa.me/254722894512"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-400"
              >
                Chat on WhatsApp
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Headquarters:</span>
              <span className="font-semibold text-white">Ol Kalou Town Centre, Nyandarua</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-white font-bold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function TermsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Terms of Service & Rules</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
          <div>
            <strong className="text-amber-400 block mb-0.5">1. Nyandarua Pickup Rule</strong>
            <p>
              All OlexPress trips MUST originate within Nyandarua County. Drop-off destinations can be located anywhere in Kenya. Swapping pickup outside Nyandarua is strictly prohibited.
            </p>
          </div>

          <div>
            <strong className="text-amber-400 block mb-0.5">2. Booking Locks (No Rebooking Rule)</strong>
            <p>
              Once a ticket is booked and active, no second ride may be booked until the current trip is marked Completed and either reviewed or the 5-minute timeout concludes.
            </p>
          </div>

          <div>
            <strong className="text-amber-400 block mb-0.5">3. Cancellation Policy</strong>
            <p>
              Passengers may cancel freely during the "Waiting for Driver" stage. Once a driver accepts the ride, in-app cancellation is locked to protect driver fuel and dispatch readiness.
            </p>
          </div>

          <div>
            <strong className="text-amber-400 block mb-0.5">4. Review & 5-Minute Auto-Unlock</strong>
            <p>
              Passenger reviews are shared directly with the Admin Dispatch team. After trip completion, the booking lock unlocks immediately upon submitting a review or skipping. If no action is taken, the system automatically unlocks after 5 minutes, and late ratings remain accessible in My Tickets.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-400 text-black font-bold rounded-xl text-xs"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

interface GalaxyGlobeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GalaxyGlobeModal({ isOpen, onClose }: GalaxyGlobeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-black border-2 border-emerald-500/50 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-950/90 border-b border-zinc-800/80 z-20">
          <div className="flex items-center space-x-3">
            <OlexLogo size={36} showGlow />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-wider text-amber-400 font-['Plus_Jakarta_Sans',sans-serif]">
                  OlexPress Cosmic 3D Globe
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
                  REAL-TIME 3D GALAXY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Launch Base: <strong className="text-emerald-400">Ol Kalou, Nyandarua</strong> (Lat -0.2721°, Lon 36.3792°)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-amber-400/50 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Galaxy Canvas */}
        <div className="flex-1 relative w-full h-full">
          <GalaxyGlobe3D
            height="100%"
            interactive={true}
            showControls={true}
            isFullScreen={true}
            onCloseFullScreen={onClose}
          />
        </div>

        {/* Cosmic Info Bar at bottom */}
        <div className="px-4 sm:px-6 py-2.5 bg-zinc-950/90 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 z-20">
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cosmic Satellite Link: <strong className="text-zinc-200">Active</strong></span>
            <span className="text-zinc-600">|</span>
            <span>Nyandarua Dispatch: <strong className="text-amber-400">Online 24/7</strong></span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-zinc-500">
            <span>• Drag to rotate</span>
            <span>• 3 Orbits: Gold, Emerald, Cyan</span>
            <span>• Moving starfield & meteor trails</span>
          </div>
        </div>
      </div>
    </div>
  );
}

