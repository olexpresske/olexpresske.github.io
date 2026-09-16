// @ts-nocheck
const STORAGE_KEY='olexpress_tickets_v1';
const ACTIVE_TICKET_ID_KEY='olexpress_active_ticket_id';
const DRIVER_PROFILE_KEY='olexpress_driver_profile';
export const DEFAULT_DRIVER={id:'DRV-701',name:'Mwangi Kamau',phone:'0722894512',vehicle:'Toyota Fielder (Silver)',plate:'KDC 482J',isOnline:true};
function loadTickets():any[]{try{const r=localStorage.getItem(STORAGE_KEY);if(r)return JSON.parse(r);}catch{}return[];}
function saveTicketsLocal(t:any[]){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(t));}catch{}}
export function getTickets(){return loadTickets().sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());}
export function getDriverProfile(){try{const r=localStorage.getItem(DRIVER_PROFILE_KEY);if(r)return JSON.parse(r);}catch{}return DEFAULT_DRIVER;}
export function saveDriverProfile(p:any){localStorage.setItem(DRIVER_PROFILE_KEY,JSON.stringify(p));}
export function getActiveTicketId(){return localStorage.getItem(ACTIVE_TICKET_ID_KEY);}
export function setActiveTicketId(id:string|null){if(id)localStorage.setItem(ACTIVE_TICKET_ID_KEY,id);else localStorage.removeItem(ACTIVE_TICKET_ID_KEY);}
export function getTicketById(id:string){return loadTickets().find((t:any)=>t.id===id);}
export function getActiveTicket(){const id=getActiveTicketId();if(!id)return null;return getTicketById(id)||null;}
export function clearActiveTicket(){localStorage.removeItem(ACTIVE_TICKET_ID_KEY);}
export function createTicket(data:any){const now=new Date().toISOString();const id=`OLX-${Date.now().toString().slice(-6)}`;const ticket={...data,id,status:'pending',createdAt:now,updatedAt:now};const t=loadTickets();t.unshift(ticket);saveTicketsLocal(t);setActiveTicketId(id);return ticket;}
export function updateTicketStatus(id:string,status:string,extra?:any){const t=loadTickets();const i=t.findIndex((x:any)=>x.id===id);if(i>=0){t[i]={...t[i],status,...extra,updatedAt:new Date().toISOString()};saveTicketsLocal(t);}return t[i];}
export function deleteTicket(id:string){saveTicketsLocal(loadTickets().filter((t:any)=>t.id!==id));}
export function subscribeToTickets(cb:(t:any[])=>void){cb(getTickets());return()=>{};}
export const ticketStore={getTickets,getDriverProfile,saveDriverProfile,getActiveTicketId,setActiveTicketId,createTicket,updateTicketStatus,getTicketById,getActiveTicket,clearActiveTicket,subscribeToTickets,deleteTicket};
export default ticketStore;
