import { useState, useEffect } from 'react'
import { BookingCard, RideClassType } from './components/BookingCard'
import { DarkMap } from './components/DarkMap'
import { TicketCard } from './components/TicketCard'
import { TrackingView } from './components/TrackingView'
import { DriverDashboard } from './components/DriverDashboard'
import { AdminDashboard } from './components/AdminDashboard'
import { calculateRoadRoute, RouteComputation, findTown } from './data/towns'
import { ticketStore } from './services/ticketStore'
import { Ticket } from './types'

export default function App(){
  const path = (window.location.pathname + window.location.hash).toLowerCase()
  if(path.includes('driver')) return <div className="min-h-screen bg-black text-white p-4"><DriverDashboard onViewTicketOnMap={()=>{}} /></div>
  if(path.includes('admin')) return <div className="min-h-screen bg-black text-white p-4"><AdminDashboard /></div>

  const [pickup,setPickup]=useState('Ol Kalou')
  const [destination,setDestination]=useState('Nyahururu')
  const [pickupCoords,setPickupCoords]=useState<[number,number]>([-0.2721,36.3792])
  const [destCoords,setDestCoords]=useState<[number,number]>([0.0421,36.3628])
  const [routeData,setRouteData]=useState<RouteComputation|null>(null)
  const [hasCalculated,setHasCalculated]=useState(false)
  const [isCalculating,setIsCalculating]=useState(false)
  const [activeTicket,setActiveTicket]=useState<Ticket|null>(()=>ticketStore.getActiveTicket())
  const [trackedTicket,setTrackedTicket]=useState<Ticket|null>(null)
  const [rideClass,setRideClass]=useState<RideClassType>('Standard')

  useEffect(()=>{
    const unsub=ticketStore.subscribe(()=>{ setActiveTicket(ticketStore.getActiveTicket()) })
    const cur=ticketStore.getActiveTicket(); if(cur) setTrackedTicket(cur)
    return unsub
  },[])

  const handleGetFare=async()=>{
    if(!destination.trim() || destination.trim().length < 2) return;
    setIsCalculating(true)
    try {
      const res = await calculateRoadRoute(pickup, destination)
      if(res){
        setRouteData(res)
        if(res.routeCoords?.length >= 2){
          setPickupCoords(res.routeCoords[0])
          setDestCoords(res.routeCoords[res.routeCoords.length-1])
        }
        setHasCalculated(true)
      }
    } catch {}
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
      {/* HERO - BACKGROUND 100% BRIGHT, NOT DIM */}
      <div className="relative w-full overflow-hidden">
        {/* Image - FULL BRIGHTNESS, NO FILTER */}
        <img 
          src="/hero-i-love-nyandarua.jpg" 
          alt="I Love Nyandarua" 
          className="absolute inset-0 w-full h-full object-cover object-[center_25%]" 
        />
        {/* ONLY bottom fade for map transition - NO dim on top/middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-0% via-transparent via-70% to-black to-100%" />
        
        <div className="relative z-10 max-w-5xl mx-auto p-4 pt-5 pb-12 space-y-5">
          <div className="flex justify-between items-center">
            <div className="bg-white rounded-xl px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2">
              <img src="/logo.svg" alt="OlexPress" className="h-6" />
              <span className="font-black text-black text-sm">OLEX</span>
            </div>
            <div className="bg-amber-400 px-4 py-1.5 rounded-full text-[11px] font-black text-black shadow-[0_4px_20px_rgba(0,0,0,0.5)]">OLEX PRESS KE</div>
          </div>

          <div className="pt-1">
            {/* Title with black outline so visible on BRIGHT green */}
            <h1 className="text-[36px] font-black leading-none text-white [text-shadow:_2px_2px_0_rgb(0_0_0),_-2px_-2px_0_rgb(0_0_0),_2px_-2px_0_rgb(0_0_0),_-2px_2px_0_rgb(0_0_0),_0_4px_20px_rgba(0,0,0,0.9)]">Travel Nyandarua</h1>
            <div className="mt-3 inline-flex bg-black border-2 border-white rounded-full px-4 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              <p className="text-[12px] font-black text-white tracking-wide">Ol Kalou • Engineer • Njabini • Nairobi • Egerton • Molo</p>
            </div>
          </div>

          {/* Card - SOLID BLACK so wording visible on bright bg */}
          <div className="bg-black border-2 border-white rounded-[20px] shadow-[0_20px_80px_rgba(0,0,0,1)] overflow-hidden">
            <BookingCard pickup={pickup} destination={destination} onChangePickup={setPickup} onChangeDestination={setDestination} onGetFareAndRoute={handleGetFare} activeTicket={activeTicket} onTrackCurrentTicket={()=>{}} isCalculating={isCalculating} rideClass={rideClass} onChangeRideClass={setRideClass} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6 relative z-20 bg-black">
        <DarkMap pickup={pickup} destination={destination} pickupCoords={pickupCoords} destCoords={destCoords} routeData={routeData} hasCalculated={hasCalculated} onEditRoute={()=>setHasCalculated(false)} error={null} />
        {hasCalculated && routeData && <TicketCard pickup={pickup} destination={destination} routeData={routeData} onConfirmBooking={handleConfirm} rideClass={rideClass} />}
      </div>
    </div>
  )
}
