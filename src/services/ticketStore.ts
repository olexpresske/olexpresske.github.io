// @ts-nocheck
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

function loadTickets(): any[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return [];
}
function saveTicketsLocal(tickets: any[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); }

export function getTickets(): any[] {
  return loadTickets().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export function getDriverProfile(): DriverProfile {
  try { const raw = localStorage.getItem(DRIVER_PROFILE_KEY); if (raw) return JSON.parse(raw); } catch {}
  return DEFAULT_DRIVER;
}
export function saveDriverProfile(p: DriverProfile) { localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(p)); }
export function getActiveTicketId(): string | null { return localStorage.getItem(ACTIVE_TICKET_ID_KEY); }
export function setActiveTicketId(id: string | null) { if (id) localStorage.setItem(ACTIVE_TICKET_ID_KEY, id); else localStorage.removeItem(ACTIVE_TICKET_ID_KEY); }

export function createTicket(data: any): any {
  const now = new Date().toISOString();
  const id = `OLX-${Date.now().toString().slice(-6)}`;
  const ticket = {...data, id, status: 'pending', createdAt: now, updatedAt: now };
  const tickets = loadTickets(); tickets.unshift(ticket); saveTicketsLocal(tickets); setActiveTicketId(id);
  try { set(ref(db, `rides/${id}`), ticket); } catch(e) {}
  return ticket;
}
export function updateTicketStatus(id: string, status: string, extra?: any) {
  const tickets = loadTickets(); const idx = tickets.findIndex((t: any) => t.id === id);
  if (idx >= 0) { tickets[idx] = {...tickets[idx], status,...extra, updatedAt: new Date().toISOString() }; saveTicketsLocal(tickets); }
  try { update(ref(db, `rides/${id}`), { status,...extra, updatedAt: new Date().toISOString() }); } catch(e) {}
  return tickets[idx];
}
export function getTicketById(id: string): any { return loadTickets().find((t: any) => t.id === id); }
export function getActiveTicket(): any { const id = getActiveTicketId(); if (!id) return null; return getTicketById(id) || null; }
export function clearActiveTicket() { localStorage.removeItem(ACTIVE_TICKET_ID_KEY); }
export function subscribeToTickets(callback: (tickets: any[]) => void) {
  return onValue(ref(db, 'rides'), (snap) => {
    const data = snap.val();
    if (data) {
      const fbTickets = Object.values(data) as any[];
      const local = loadTickets(); const map = new Map();
      [...local,...fbTickets].forEach((t: any) => map.set(t.id, t));
      const merged = Array.from(map.values()); saveTicketsLocal(merged);
      callback(merged.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else { callback(getTickets()); }
  });
}
export function deleteTicket(id: string) {
  saveTicketsLocal(loadTickets().filter((t: any) => t.id!== id));
  try { remove(ref(db, `rides/${id}`)); } catch {}
}
