import { Ticket, TicketStatus, AdminComment, TicketReview } from '../types';

const STORAGE_KEY = 'olexpress_tickets_v1';
const ACTIVE_TICKET_ID_KEY = 'olexpress_active_ticket_id';
const DRIVER_PROFILE_KEY = 'olexpress_driver_profile';

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  isOnline: boolean;
}

export const DEFAULT_DRIVER: DriverProfile = {
  id: 'DRV-701',
  name: 'Mwangi Kamau',
  phone: '0722894512',
  vehicle: 'Toyota Fielder (Silver)',
  plate: 'KDC 482J',
  isOnline: true,
};

// Initial sample historical tickets for realistic admin/driver dashboard
const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'OLX-739102',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    date: '12/09/2026',
    time: '02:15 PM',
    pickup: 'Ol Kalou',
    destination: 'Nyahururu',
    pickupCoords: [-0.2721, 36.3792],
    destCoords: [0.0421, 36.3628],
    routeCoords: [
      [-0.2721, 36.3792],
      [-0.1746, 36.3571],
      [-0.1189, 36.3640],
      [0.0421, 36.3628],
    ],
    distanceKm: 47.4,
    estimatedTime: '1h 10m',
    fare: 2242,
    mobile: '0712345678',
    telephone: '0101234567',
    status: 'Completed',
    driverId: 'DRV-701',
    driverName: 'Mwangi Kamau',
    driverPhone: '0722894512',
    driverPlate: 'KDC 482J',
    driverVehicle: 'Toyota Fielder (Silver)',
    completedAt: new Date(Date.now() - 82000000).toISOString(),
    bookingUnlocked: true,
    review: {
      rating: 5,
      comment: 'Very smooth ride from Ol Kalou. Great driver on the Nyahururu road.',
      submittedAt: new Date(Date.now() - 81900000).toISOString(),
      adminComments: [
        {
          id: 'ADM-101',
          adminName: 'Dispatch Central',
          message: 'Excellent feedback received. Keep up the high standard.',
          type: 'Info Only',
          createdAt: new Date(Date.now() - 80000000).toISOString(),
          isClosed: true,
        },
      ],
    },
  },
  {
    id: 'OLX-629481',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    date: '13/09/2026',
    time: '09:40 AM',
    pickup: 'Engineer',
    destination: 'Nairobi',
    pickupCoords: [-0.6481, 36.5786],
    destCoords: [-1.2921, 36.8219],
    routeCoords: [
      [-0.6481, 36.5786],
      [-0.7247, 36.6575],
      [-1.0396, 37.0900],
      [-1.2921, 36.8219],
    ],
    distanceKm: 88.5,
    estimatedTime: '2h 05m',
    fare: 3967,
    mobile: '0799887766',
    status: 'Completed',
    driverId: 'DRV-701',
    driverName: 'Mwangi Kamau',
    driverPhone: '0722894512',
    driverPlate: 'KDC 482J',
    driverVehicle: 'Toyota Fielder (Silver)',
    completedAt: new Date(Date.now() - 36000000).toISOString(),
    bookingUnlocked: true,
    review: {
      rating: 4,
      comment: 'Driver was punctual. Arrived safely at Nairobi CBD.',
      submittedAt: new Date(Date.now() - 35800000).toISOString(),
    },
  },
];

class TicketStore {
  private tickets: Ticket[] = [];
  private activeTicketId: string | null = null;
  private driverProfile: DriverProfile = DEFAULT_DRIVER;
  private listeners: (() => void)[] = [];
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('olexpress_sync_channel');
        this.channel.onmessage = () => {
          this.loadFromStorage();
          this.notify();
        };
      } catch {
        // Fallback for browsers without BroadcastChannel
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY || e.key === ACTIVE_TICKET_ID_KEY) {
          this.loadFromStorage();
          this.notify();
        }
      });

      // Periodically check for 5-minute auto-unlock expiry
      setInterval(() => {
        this.checkAutoUnlockExpiry();
      }, 2000);
    }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.tickets = JSON.parse(raw);
      } else {
        this.tickets = INITIAL_TICKETS;
        this.saveToStorage();
      }

      this.activeTicketId = localStorage.getItem(ACTIVE_TICKET_ID_KEY);

      const driverRaw = localStorage.getItem(DRIVER_PROFILE_KEY);
      if (driverRaw) {
        this.driverProfile = JSON.parse(driverRaw);
      }
    } catch {
      this.tickets = INITIAL_TICKETS;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tickets));
      if (this.activeTicketId) {
        localStorage.setItem(ACTIVE_TICKET_ID_KEY, this.activeTicketId);
      } else {
        localStorage.removeItem(ACTIVE_TICKET_ID_KEY);
      }
      localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(this.driverProfile));
      this.channel?.postMessage({ type: 'SYNC' });
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getTickets(): Ticket[] {
    return [...this.tickets];
  }

  public getTicket(id: string): Ticket | undefined {
    return this.tickets.find((t) => t.id === id);
  }

  public getActiveTicket(): Ticket | null {
    if (!this.activeTicketId) return null;
    const ticket = this.tickets.find((t) => t.id === this.activeTicketId);
    if (!ticket) return null;

    // If ticket is completed and booking is unlocked, it's no longer locking new bookings
    if (ticket.bookingUnlocked || ticket.status === 'Cancelled') {
      return null;
    }

    return ticket;
  }

  public getActiveTicketId(): string | null {
    const active = this.getActiveTicket();
    return active ? active.id : null;
  }

  public getDriverProfile(): DriverProfile {
    return { ...this.driverProfile };
  }

  public updateDriverProfile(updates: Partial<DriverProfile>) {
    this.driverProfile = { ...this.driverProfile, ...updates };
    this.saveToStorage();
    this.notify();
  }

  /**
   * Creates a new ticket and immediately locks bookings
   */
  public createTicket(params: {
    pickup: string;
    destination: string;
    pickupCoords: [number, number];
    destCoords: [number, number];
    routeCoords: [number, number][];
    distanceKm: number;
    estimatedTime: string;
    fare: number;
    mobile: string;
    telephone?: string;
  }): Ticket {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const id = `OLX-${randomDigits}`;

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()}`;

    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeFormatted = `${hours}:${minutes} ${ampm}`;

    const newTicket: Ticket = {
      id,
      createdAt: now.toISOString(),
      date: dateFormatted,
      time: timeFormatted,
      pickup: params.pickup,
      destination: params.destination,
      pickupCoords: params.pickupCoords,
      destCoords: params.destCoords,
      routeCoords: params.routeCoords,
      distanceKm: params.distanceKm,
      estimatedTime: params.estimatedTime,
      fare: params.fare,
      mobile: params.mobile,
      telephone: params.telephone || '',
      status: 'Waiting for Driver',
      bookingUnlocked: false,
    };

    this.tickets.unshift(newTicket);
    this.activeTicketId = id;
    this.saveToStorage();
    this.notify();
    return newTicket;
  }

  /**
   * User can cancel ONLY in 'Waiting for Driver' stage.
   * After driver accepts, cancel is disabled!
   */
  public cancelTicket(ticketId: string): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return false;

    if (ticket.status !== 'Waiting for Driver') {
      return false; // Forbidden: Cannot cancel after driver accepts
    }

    ticket.status = 'Cancelled';
    ticket.bookingUnlocked = true;
    if (this.activeTicketId === ticketId) {
      this.activeTicketId = null;
    }
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Update status during ride lifecycle
   */
  public updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
    extra?: Partial<Ticket>
  ): Ticket | undefined {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return undefined;

    ticket.status = newStatus;
    if (extra) {
      Object.assign(ticket, extra);
    }

    // If End Trip / Completed
    if (newStatus === 'Completed' && !ticket.completedAt) {
      ticket.completedAt = new Date().toISOString();
      // 5 minutes from now for review timeout
      ticket.reviewTimeoutAt = Date.now() + 5 * 60 * 1000;
      ticket.bookingUnlocked = false; // Remains locked until review or 5 mins
    }

    this.saveToStorage();
    this.notify();
    return ticket;
  }

  /**
   * Submits user review (Scenario A)
   */
  public submitReview(
    ticketId: string,
    rating: number,
    comment: string
  ): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return false;

    ticket.review = {
      rating,
      comment,
      submittedAt: new Date().toISOString(),
      adminComments: [],
    };
    // Unlock booking immediately upon review submission
    ticket.bookingUnlocked = true;
    if (this.activeTicketId === ticketId) {
      this.activeTicketId = null;
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Skips user review (Scenario A variant)
   */
  public skipReview(ticketId: string): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return false;

    if (!ticket.review) {
      ticket.review = {
        rating: 0,
        comment: '',
        submittedAt: new Date().toISOString(),
        skipped: true,
      };
    } else {
      ticket.review.skipped = true;
    }

    ticket.bookingUnlocked = true;
    if (this.activeTicketId === ticketId) {
      this.activeTicketId = null;
    }

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Late rating from My Tickets (when user skipped or timed out)
   */
  public submitLateReview(
    ticketId: string,
    rating: number,
    comment: string
  ): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return false;

    ticket.review = {
      rating,
      comment,
      submittedAt: new Date().toISOString(),
      adminComments: ticket.review?.adminComments || [],
      skipped: false,
    };

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Check if 5 minutes expired without review (Scenario B)
   */
  public checkAutoUnlockExpiry(): boolean {
    let changed = false;
    const now = Date.now();

    for (const ticket of this.tickets) {
      if (
        ticket.status === 'Completed' &&
        !ticket.bookingUnlocked &&
        ticket.reviewTimeoutAt &&
        now >= ticket.reviewTimeoutAt
      ) {
        // Auto unlock!
        ticket.bookingUnlocked = true;
        if (!ticket.review) {
          ticket.review = {
            rating: 0,
            comment: '',
            submittedAt: new Date().toISOString(),
            skipped: true,
            autoUnlocked: true,
          };
        } else {
          ticket.review.autoUnlocked = true;
        }

        if (this.activeTicketId === ticket.id) {
          this.activeTicketId = null;
        }
        changed = true;
      }
    }

    if (changed) {
      this.saveToStorage();
      this.notify();
    }
    return changed;
  }

  /**
   * Test tool: fast-forward 5 minutes to test auto-unlock immediately
   */
  public fastForwardTimeout(ticketId: string) {
    const ticket = this.getTicket(ticketId);
    if (!ticket || ticket.status !== 'Completed') return;

    ticket.reviewTimeoutAt = Date.now() - 1000;
    this.checkAutoUnlockExpiry();
  }

  /**
   * Admin adds comment to driver via ticket
   */
  public addAdminComment(
    ticketId: string,
    message: string,
    type: 'Response Required' | 'Info Only'
  ): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return false;

    if (!ticket.review) {
      ticket.review = {
        rating: 0,
        comment: '',
        submittedAt: new Date().toISOString(),
        skipped: true,
        adminComments: [],
      };
    }
    if (!ticket.review.adminComments) {
      ticket.review.adminComments = [];
    }

    const commentId = `ADM-${Math.floor(100 + Math.random() * 900)}`;
    ticket.review.adminComments.push({
      id: commentId,
      adminName: 'Dispatch Central Admin',
      message,
      type,
      createdAt: new Date().toISOString(),
      isClosed: false,
    });

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Driver replies to admin comment
   */
  public addDriverReply(ticketId: string, commentId: string, reply: string): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket || !ticket.review || !ticket.review.adminComments) return false;

    const comment = ticket.review.adminComments.find((c) => c.id === commentId);
    if (!comment) return false;

    comment.driverReply = reply;
    comment.repliedAt = new Date().toISOString();

    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Admin closes review thread
   */
  public closeAdminComment(ticketId: string, commentId: string): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket || !ticket.review || !ticket.review.adminComments) return false;

    const comment = ticket.review.adminComments.find((c) => c.id === commentId);
    if (!comment) return false;

    comment.isClosed = true;
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Admin deletes ticket
   */
  public deleteTicket(ticketId: string): boolean {
    this.tickets = this.tickets.filter((t) => t.id !== ticketId);
    if (this.activeTicketId === ticketId) {
      this.activeTicketId = null;
    }
    this.saveToStorage();
    this.notify();
    return true;
  }

  /**
   * Clear active lock manually (e.g. for testing reset)
   */
  public resetLock() {
    this.activeTicketId = null;
    localStorage.removeItem(ACTIVE_TICKET_ID_KEY);
    this.saveToStorage();
    this.notify();
  }
}

export const ticketStore = new TicketStore();
