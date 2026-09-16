// @ts-nocheck
import { ref, set, update, onValue, remove } from "firebase/database";
import { db } from "./firebase";

const STORAGE_KEY = 'olexpress_tickets_v1';
const ACTIVE_TICKET_ID_KEY = 'olexpress_active_ticket_id';
const DRIVER_PROFILE_KEY = 'olexpress_driver_profile';

export interface DriverProfile { id: string; name: string; phone: string; vehicle: string; plate: string; isOnline: boolean; }
export const DEFAULT_DRIVER: DriverProfile = { id: 'DRV-701', name: 'Mwangi Kamau', phone: '0722894512', vehicle: 'Toyota Fielder (Silver)', plate: 'KDC 482J', isOnline: true };

function loadTickets(): any[] { try { const r = localStorage.getItem(STORAGE_KEY); if(r) return JSON.parse(r); } catch {} return []; }
function saveTicketsLocal(t: any[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {} }

export function getTickets(): any[] { return loadTickets().sort((a,b)=> new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()); }
export function getDriverProfile(): DriverProfile { try{ const r=localStorage.getItem(DRIVER_PROFILE_KEY); if(r) return JSON.parse(r);}catch{} return DEFAULT_DRIVER; }
export function saveDriverProfile(p:DriverProfile){ localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(p)); }
export function getActiveTicketId(){ return localStorage.getItem(ACTIVE_TICKET_ID_KEY); }
export function setActiveTicketId(id:string|null){ if(id) localStorage.setItem(ACTIVE_TICKET_ID_KEY,id); else localStorage.removeItem(ACTIVE_TICKET_ID_KEY); }
export function getTicketById(id:string){ return loadTickets().find((t:any)=>t.id===id); }
export function getActiveTicket(){ const id=getActiveTicketId(); if(!id) return null; return getTicketById(id)||null; }
export function clearActiveTicket(){ localStorage.removeItem(ACTIVE_TICKET_ID_KEY); }

export function createTicket(data:any){
  const now=new Date().toISOString(); const id=`OLX-${Date.now().toString().slice(-6)}`;
  const ticket={...data,id,status:'pending',createdAt:now,updatedAt:now};
  const tickets=loadTickets(); tickets.unshift(ticket); saveTicketsLocal(tickets); setActiveTicketId(id);
  try{ if(db) set(ref(db,`rides/${id}`),ticket); }catch{}
  return ticket;
}
export function updateTicketStatus(id:string,status:string,extra?:any){
  const tickets=loadTickets(); const idx=tickets.findIndex((t:any)=>t.id===id);
  if(idx>=0){ tickets[idx]={...tickets[idx],status,...extra,updatedAt:new Date().toISOString()}; saveTicketsLocal(tickets); }
  try{ if(db) update(ref(db,`rides/${id}`),{status,...extra,updatedAt:new Date().toISOString()}); }catch{}
  return tickets[idx];
}
export function deleteTicket(id:string){ saveTicketsLocal(loadTickets().filter((t:any)=>t.id!==id)); try{ if(db) remove(ref(db,`rides/${id}`)); }catch{} }

export function subscribeToTickets(callback:(tickets:any[])=>void){
  try{
    if(!db) { callback(getTickets()); return ()=>{}; }
    const ridesRef = ref(db,'rides');
    const unsub = onValue(ridesRef,(snap)=>{
      try{
        const data=snap.val();
        if(data){
          const fbTickets=Object.values(data) as any[];
          const local=loadTickets(); const m=new Map();
          [...local,...fbTickets].forEach((t:any)=>m.set(t.id,t));
          const merged=Array.from(m.values()); saveTicketsLocal(merged);
          callback(merged.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));
        } else { callback(getTickets()); }
      } catch { callback(getTickets()); }
    }, (err)=>{ console.log("FB read blocked, using local",err); callback(getTickets()); });
    return unsub;
  } catch(e){ console.log("FB not available",e); callback(getTickets()); return ()=>{}; }
}

export const ticketStore={ getTickets,getDriverProfile,saveDriverProfile,getActiveTicketId,setActiveTicketId,createTicket,updateTicketStatus,getTicketById,getActiveTicket,clearActiveTicket,subscribeToTickets,deleteTicket };
export default ticketStore;
