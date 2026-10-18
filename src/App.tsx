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
    <div className="min-h-screen bg-black text-white">
      {/* HERO WITH YOUR UPLOADED IMAGE */}
      <div className="relative min-h-[85vh] w-full overflow-hidden">
        <img src="/hero-i-love-nyandarua.jpg" alt="I Love Nyandarua" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" />
        
        <div className="relative z-10 max-w-5xl mx-auto p-4 pt-6 space-y-6">
          <div className="flex justify-between items-center">
            <img src="/logo.svg" alt="OlexPress" className="h-9 bg-white rounded-lg px-2 py-1" />
            <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black text-green-700 tracking-wide">OLEX PRESS KE</div>
          </div>

          <div className="pt-4">
            <h1 className="text-3xl font-black drop-shadow-lg">Travel Nyandarua</h1>
            <p className="text-white/80 text-sm mt-1">Ol Kalou • Engineer • Njabini • Nairobi</p>
          </div>

          <BookingCard pickup={pickup} destination={destination} onChangePickup={setPickup} onChangeDestination={setDestination} onGetFareAndRoute={handleGetFare} activeTicket={activeTicket} onTrackCurrentTicket={()=>{}} isCalculating={isCalculating} rideClass={rideClass} onChangeRideClass={setRideClass} />
        </div>
      </div>

      {/* MAP + TICKET BELOW HERO */}
      <div className="max-w-5xl mx-auto p-4 space-y-6 -mt-6 relative z-20">
        <DarkMap pickup={pickup} destination={destination} pickupCoords={pickupCoords} destCoords={destCoords} routeData={routeData} hasCalculated={hasCalculated} onEditRoute={()=>setHasCalculated(false)} error={null} />
        {hasCalculated && routeData && <TicketCard pickup={pickup} destination={destination} routeData={routeData} onConfirmBooking={handleConfirm} rideClass={rideClass} />}
      </div>
    </div>
  )
}
