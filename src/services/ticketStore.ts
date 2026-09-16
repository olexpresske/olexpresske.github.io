import { Ticket, TicketStatus } from '../types';
import { ref, set, update, onValue, remove } from "firebase/database";
import { db } from "./firebase";

const STORAGE_KEY = 'olexpress_tickets_v1';
const ACTIVE_TICKET_ID_KEY = 'olexpress_active_ticket_id';
const DRIVER_PROFILE_KEY = 'olexpress_driver_profile';

export interface DriverProfile {
  id: string; name: string; phone: string; vehicle: string; plate: string; isOnline: boolean;
}
export const DEFAULT_DRIVER: DriverProfile = {
  id: 'DRV-701', name: 'Mwangi Kamau', phone: '0722894512',
  vehicle: 'Toyota Fielder (Silver)', plate: 'KDC 482J', isOnline: true,
};
const INITIAL_TICKETS: Ticket[] = [];

class TicketStore {
  private tickets: Ticket[] = [];
  private activeTicketId: string | null = null;
  private driverProfile: DriverProfile = DEFAULT_DRIVER;
  private listeners: (() => void)[] = [];
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.loadFromStorage();
    this.listenFirebase();
    if (typeof window!== 'undefined') {
      try {
        this.channel = new BroadcastChannel('olexpress_sync_channel');
        this.channel.onmessage = () => { this.loadFromStorage(); this.notify(); };
      } catch {}
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) { this.loadFromStorage(); this.notify(); }
      });
      setInterval(() => this.checkAutoUnlockExpiry(), 2000);
    }
  }

  private listenFirebase() {
    try {
      onValue(ref(db, 'rides'), (snap) => {
        const val = snap.val(); if (!val) return;
        let changed = false;
        Object.keys(val).forEach((id) => {
          if (!this.tickets.find((t) => t.id === id)) {
            const r = val[id];
            const nt: any = {
              id: id, createdAt: new Date(r.ts || Date.now()).toISOString(),
              date: r.date || '', time: r.clock || '',
              pickup: r.from || r.pickup || 'Unknown',
              destination: r.to || r.destination || 'Unknown',
              pickupCoords: r.fromCoords? [r.fromCoords.lat, r.fromCoords.lng] : [0, 0],
              destCoords: r.toCoords? [r.toCoords.lat, r.toCoords.lng] : [0, 0],
              routeCoords: [], distanceKm: r.km || 0, estimatedTime: '',
              fare: r.fare || 0, mobile: r.phone || r.mobile || '',
              telephone: '', status: (r.status === 'pending'? 'Waiting for Driver' : r.status) as any,
              bookingUnlocked: false,
            };
            this.tickets.unshift(nt); changed = true;
          }
        });
        if (changed) { this.saveToStorage(); this.notify(); }
      });
    } catch (e) { console.log('Firebase fail', e); }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.tickets = JSON.parse(raw);
      this.activeTicketId = localStorage.getItem(ACTIVE_TICKET_ID_KEY);
      const dr = localStorage.getItem(DRIVER_PROFILE_KEY);
      if (dr) this.driverProfile = JSON.parse(dr);
    } catch {}
  }
  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tickets));
      if (this.activeTicketId) localStorage.setItem(ACTIVE_TICKET_ID_KEY, this.activeTicketId);
      else localStorage.removeItem(ACTIVE_TICKET_ID_KEY);
      localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(this.driverProfile));
      this.channel?.postMessage({ type: 'SYNC' });
    } catch {}
  }

  public subscribe(l: () => void) {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter((x) => x!== l); };
  }
  private notify() { for (const l of this.listeners) l(); }
  public getTickets(): Ticket[] { return [...this.tickets]; }
  public getTicket(id: string) { return this.tickets.find((t) => t.id === id); }
  public getActiveTicket() {
    if (!this.activeTicketId) return null;
    const t = this.tickets.find((x) => x.id === this.activeTicketId);
    if (!t) return null;
    if (t.bookingUnlocked || t.status === 'Cancelled') return null;
    return t;
  }
  public getActiveTicketId() { const a = this.getActiveTicket(); return a? a.id : null; }
  public getDriverProfile() { return {...this.driverProfile }; }
  public updateDriverProfile(u: Partial<DriverProfile>) {
    this.driverProfile = {...this.driverProfile,...u };
    this.saveToStorage(); this.notify();
  }

  public createTicket(params: any): Ticket {
    const id = `OLX-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    let h = now.getHours(); const ampm = h >= 12? 'PM' : 'AM'; h = h % 12 || 12;
    const time = `${h}:${String(now.getMinutes()).padStart(2, '0')} ${ampm}`;
    const newTicket: Ticket = {
      id, createdAt: now.toISOString(), date, time,
      pickup: params.pickup, destination: params.destination,
      pickupCoords: params.pickupCoords, destCoords: params.destCoords,
      routeCoords: params.routeCoords, distanceKm: params.distanceKm,
      estimatedTime: params.estimatedTime, fare: params.fare,
      rideClass: params.rideClass || 'Standard',
      mobile: params.mobile, telephone: params.telephone || '',
      status: 'Waiting for Driver', bookingUnlocked: false,
    } as any;
    this.tickets.unshift(newTicket);
    this.activeTicketId = id;
    this.saveToStorage(); this.notify();
    try {
      set(ref(db, 'rides/' + id), {
        id, from: params.pickup, to: params.destination,
        fromCoords: { lat: params.pickupCoords[0], lng: params.pickupCoords[1] },
        toCoords: { lat: params.destCoords[0], lng: params.destCoords[1] },
        pickup: params.pickup, destination: params.destination,
        km: params.distanceKm, fare: params.fare,
        phone: params.mobile, mobile: params.mobile,
        status: 'pending', ts: Date.now(), date, clock: time
      });
    } catch (e) { console.log('Firebase save failed', e); }
    return newTicket;
  }

  public cancelTicket(ticketId: string) {
    const t = this.getTicket(ticketId);
    if (!t || t.status!== 'Waiting for Driver') return false;
    t.status = 'Cancelled'; t.bookingUnlocked = true;
    if (this.activeTicketId === ticketId) this.activeTicketId = null;
    this.saveToStorage(); this.notify();
    try { update(ref(db, 'rides/' + ticketId), { status: 'cancelled' }); } catch {}
    return true;
  }
  public updateTicketStatus(ticketId: string, newStatus: TicketStatus, extra?: Partial<Ticket>) {
    const t = this.getTicket(ticketId); if (!t) return undefined;
    t.status = newStatus; if (extra) Object.assign(t, extra);
    if (newStatus === 'Completed' &&!t.completedAt) {
      t.completedAt = new Date().toISOString();
      t.reviewTimeoutAt = Date.now() + 5 * 60 * 1000;
      t.bookingUnlocked = false;
    }
    this.saveToStorage(); this.notify();
    try {
      let fb = newStatus.toLowerCase().replace(/ /g, '_');
      if (fb === 'waiting_for_driver') fb = 'pending';
      update(ref(db, 'rides/' + ticketId), { status: fb });
    } catch {}
    return t;
  }
  public submitReview(ticketId: string, rating: number, comment: string) {
    const t = this.getTicket(ticketId); if (!t) return false;
    t.review = { rating, comment, submittedAt: new Date().toISOString(), adminComments: [] } as any;
    t.bookingUnlocked = true;
    if (this.activeTicketId === ticketId) this.activeTicketId = null;
    this.saveToStorage(); this.notify();
    try { update(ref(db, 'rides/' + ticketId), { status: 'completed' }); } catch {}
    return true;
  }
  public skipReview(ticketId: string) {
    const t = this.getTicket(ticketId); if (!t) return false;
    if (!t.review) t.review = { rating: 0, comment: '', submittedAt: new Date().toISOString(), skipped: true } as any;
    else (t.review as any).skipped = true;
    t.bookingUnlocked = true;
    if (this.activeTicketId === ticketId) this.activeTicketId = null;
    this.saveToStorage(); this.notify(); return true;
  }
  public submitLateReview(ticketId: string, rating: number, comment: string) {
    const t = this.getTicket(ticketId); if (!t) return false;
    t.review = { rating, comment, submittedAt: new Date().toISOString(), adminComments: t.review?.adminComments || [], skipped: false } as any;
    this.saveToStorage(); this.notify(); return true;
  }
  public checkAutoUnlockExpiry() {
    let changed = false; const now = Date.now();
    for (const ticket of this.tickets) {
      if (ticket.status === 'Completed' &&!ticket.bookingUnlocked && ticket.reviewTimeoutAt && now >= ticket.reviewTimeoutAt) {
        ticket.bookingUnlocked = true;
        if (!ticket.review) ticket.review = { rating: 0, comment: '', submittedAt: new Date().toISOString(), skipped: true, autoUnlocked: true } as any;
        else (ticket.review as any).autoUnlocked = true;
        if (this.activeTicketId === ticket.id) this.activeTicketId = null;
        changed = true;
      }
    }
    if (changed) { this.saveToStorage(); this.notify(); }
    return changed;
  }
  public fastForwardTimeout(ticketId: string) {
    const t = this.getTicket(ticketId); if (!t || t.status!== 'Completed') return;
    t.reviewTimeoutAt = Date.now() - 1000; this.checkAutoUnlockExpiry();
  }
  public addAdminComment(ticketId: string, message: string, type: 'Response Required' | 'Info Only') {
    const t = this.getTicket(ticketId); if (!t) return false;
    if (!t.review) t.review = { rating: 0, comment: '', submittedAt: new Date().toISOString(), skipped: true, adminComments: [] } as any;
    if (!t.review.adminComments) t.review.adminComments = [];
    const cid = `ADM-${Math.floor(100 + Math.random() * 900)}`;
    t.review.adminComments.push({ id: cid, adminName: 'Dispatch', message, type, createdAt: new Date().toISOString(), isClosed: false } as any);
    this.saveToStorage(); this.notify(); return true;
  }
  public addDriverReply(ticketId: string, commentId: string, reply: string) {
    const t = this.getTicket(ticketId); if (!t ||!t.review ||!t.review.adminComments) return false;
    const c = t.review.adminComments.find((x: any) => x.id === commentId); if (!c) return false;
    (c as any).driverReply = reply; (c as any).repliedAt = new Date().toISOString();
    this.saveToStorage(); this.notify(); return true;
  }
  public closeAdminComment(ticketId: string, commentId: string) {
    const t = this.getTicket(ticketId); if (!t ||!t.review ||!t.review.adminComments) return false;
    const c = t.review.adminComments.find((x: any) => x.id === commentId); if (!c) return false;
    (c as any).isClosed = true; this.saveToStorage(); this.notify(); return true;
  }
  public deleteTicket(ticketId: string) {
    this.tickets = this.tickets.filter((t) => t.id!== ticketId);
    if (this.activeTicketId === ticketId) this.activeTicketId = null;
    this.saveToStorage(); this.notify();
    try { remove(ref(db, 'rides/' + ticketId)); } catch {}
    return true;
  }
  public resetLock() {
    this.activeTicketId = null;
    localStorage.removeItem(ACTIVE_TICKET_ID_KEY);
    this.saveToStorage(); this.notify();
  }
}
export const ticketStore = new TicketStore();
