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

function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...INITIAL_TICKETS];
}
function saveTicketsLocal(tickets: Ticket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

export function getTickets(): Ticket[] {
  return loadTickets().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDriverProfile(): DriverProfile {
  try {
    const raw = localStorage.getItem(DRIVER_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_DRIVER;
}
export function saveDriverProfile(p: DriverProfile) {
  localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(p));
}

export function getActiveTicketId(): string | null {
  return localStorage.getItem(ACTIVE_TICKET_ID_KEY);
}
export function setActiveTicketId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_TICKET_ID_KEY, id);
  else localStorage.removeItem(ACTIVE_TICKET_ID_KEY);
}

export function createTicket(data: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Ticket {
  const now = new Date().toISOString();
  const id = `OLX-${Date.now().toString().slice(-6)}`;
  const ticket: Ticket = {
   ...data,
    id,
    status: 'pending' as TicketStatus,
    createdAt: now,
    updatedAt: now,
  } as Ticket;

  // Save locally
  const tickets = loadTickets();
  tickets.unshift(ticket);
  saveTicketsLocal(tickets);
  setActiveTicketId(id);

  // Save to Firebase for cross-phone sync
  try {
    const rideRef = ref(db, `rides/${id}`);
    set(rideRef, ticket);
  } catch (e) {
    console.error("Firebase save failed", e);
  }

  return ticket;
}

export function updateTicketStatus(id: string, status: TicketStatus, extra?: Partial<Ticket>) {
  const tickets = loadTickets();
  const idx = tickets.findIndex(t => t.id === id);
  if (idx >= 0) {
    tickets[idx] = {...tickets[idx], status,...extra, updatedAt: new Date().toISOString() };
    saveTicketsLocal(tickets);
  }
  // Update Firebase too
  try {
    const rideRef = ref(db, `rides/${id}`);
    update(rideRef, { status,...extra, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Firebase update failed", e);
  }
  return tickets[idx];
}

export function getTicketById(id: string): Ticket | undefined {
  return loadTickets().find(t => t.id === id);
}

export function getActiveTicket(): Ticket | null {
  const id = getActiveTicketId();
  if (!id) return null;
  return getTicketById(id) || null;
}

export function clearActiveTicket() {
  localStorage.removeItem(ACTIVE_TICKET_ID_KEY);
}

export function subscribeToTickets(callback: (tickets: Ticket[]) => void) {
  const ridesRef = ref(db, 'rides');
  return onValue(ridesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const fbTickets: Ticket[] = Object.values(data) as Ticket[];
      // Merge with local
      const local = loadTickets();
      const mergedMap = new Map<string, Ticket>();
      [...local,...fbTickets].forEach(t => mergedMap.set(t.id, t));
      const merged = Array.from(mergedMap.values());
      saveTicketsLocal(merged);
      callback(merged.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      callback(getTickets());
    }
  });
}

export function deleteTicket(id: string) {
  const tickets = loadTickets().filter(t => t.id!== id);
  saveTicketsLocal(tickets);
  try {
    const rideRef = ref(db, `rides/${id}`);
    remove(rideRef);
  } catch {}
}
