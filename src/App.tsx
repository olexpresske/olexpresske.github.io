import { useState, useEffect } from 'react'
import { BookingCard, RideClassType } from './components/BookingCard'
import { DarkMap } from './components/DarkMap'
import { TicketCard } from './components/TicketCard'
import { TrackingView } from './components/TrackingView'
import { DriverDashboard } from './components/DriverDashboard'
import { AdminDashboard } from './components/AdminDashboard'
import { findTown, calculateRoadRoute, RouteComputation } from './data/towns'
import { ticketStore } from './services/ticketStore'
import { Ticket } from './types'

export default function App(){
  const path = (window.location.pathname + window.location.hash).toLowerCase()
  const isDriver = path.includes('driver')
  const isAdmin = path.includes('admin')

  if(isDriver){
    return <div className="min-h-screen bg-black text-white p-4"><DriverDashboard onViewTicketOnMap={()=>{}} /></div>
  }
  if(isAdmin){
    return <div className="min-h-screen bg-black text-white p-4"><AdminDashboard /></div>
  }

  // PASSENGER ONLY
  const [pickup,setPickup]=useState('Ol Kalou')
  const [destination,setDestination]=useState('Nyahururu')
  const [pickupCoords,setPickupCoords]=useState<[number,number]>([-0.2721,36.3792])
  const [destCoords,setDestCoords]=useState<[number,number]>([0.0421,36.3628])
  const [routeData,setRouteData]=useState<RouteComputation|null>(null)
  const [hasCalculated,setHasCalculated]=useState(false)
  const [isCalculating,setIsCalculating]=useState(false)
  const [tickets,setTickets]=useState<Ticket[]>(()=>ticketStore.getTickets())
  const [activeTicket,setActiveTicket]=useState<Ticket|null>(()=>ticketStore.getActiveTicket())
  const [trackedTicket,setTrackedTicket]=useState<Ticket|null>(null)
  const [rideClass,setRideClass]=useState<RideClassType>('Standard')

  useEffect(()=>{
    const unsub=ticketStore.subscribe(()=>{setTickets(ticketStore.getTickets()); setActiveTicket(ticketStore.getActiveTicket())})
    const cur=ticketStore.getActiveTicket()
    if(cur) setTrackedTicket(cur)
    return unsub
  },[])

  const handleGetFare=async()=>{
    setIsCalculating(true)
    const p=findTown(pickup); const d=findTown(destination)
    if(!p||!d){ setIsCalculating(false); return }
    const res=await calculateRoadRoute(p.name,d.name)
    if(res){ setRouteData(res); setPickupCoords(p.coords); setDestCoords(d.coords); setHasCalculated(true) }
    setIsCalculating(false)
  }

  const handleConfirm=(mobile:string,telephone?:string,finalFare?:number)=>{
    if(!routeData) return
    const t=ticketStore.createTicket({pickup,destination,pickupCoords,destCoords,routeCoords:routeData.routeCoords,distanceKm:routeData.distanceKm,estimatedTime:routeData.timeFormatted,fare:finalFare??routeData.fare,rideClass,mobile,telephone})
    setTrackedTicket(t)
  }

  if(trackedTicket) return <div className="min-h-screen bg-black p-4"><TrackingView ticket={trackedTicket} onBackToHome={()=>setTrackedTicket(null)} onBookNewRide={()=>setTrackedTicket(null)} /></div>

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-amber-400 font-bold text-xl">OlexPress - Passenger</h1>
      <BookingCard pickup={pickup} destination={destination} onChangePickup={setPickup} onChangeDestination={setDestination} onGetFareAndRoute={handleGetFare} activeTicket={activeTicket} onTrackCurrentTicket={()=>{}} isCalculating={isCalculating} rideClass={rideClass} onChangeRideClass={setRideClass} />
      <DarkMap pickup={pickup} destination={destination} pickupCoords={pickupCoords} destCoords={destCoords} routeData={routeData} hasCalculated={hasCalculated} onEditRoute={()=>setHasCalculated(false)} error={null} />
      {hasCalculated && routeData && <TicketCard pickup={pickup} destination={destination} routeData={routeData} onConfirmBooking={handleConfirm} rideClass={rideClass} />}
    </div>
  )
}
