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
  const isDriver = path.includes('driver')
  const isAdmin = path.includes('admin')

  if(isDriver){
    return <div className="min-h-screen bg-black text-white p-4"><DriverDashboard onViewTicketOnMap={()=>{}} /></div>
  }
  if(isAdmin){
    return <div className="min-h-screen bg-black text-white p-4"><AdminDashboard /></div>
  }

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
    const cur=ticketStore.getActiveTicket()
    if(cur) setTrackedTicket(cur)
    return unsub
  },[])

  const handleGetFare=async()=>{
    if(!destination.trim() || destination.trim().length < 2) return;
    setIsCalculating(true)
    try {
      const res = await calculateRoadRoute(pickup, destination)
      if(res){
        setRouteData(res)
        if(res.routeCoords && res.routeCoords.length >= 2){
          setPickupCoords(res.routeCoords[0])
          setDestCoords(res.routeCoords[res.routeCoords.length-1])
        } else {
          const p = findTown(pickup); if(p) setPickupCoords(p.coords)
          const d = findTown(destination); if(d) setDestCoords(d.coords)
        }
        setHasCalculated(true)
      }
    } catch {}
    setIsCalculating(false)
  }

  const handleConfirm=(mobile:string,telephone?:string,finalFare?:number)=>{
    if(!routeData) return
    const t=ticketStore.createTicket({
      pickup,
      destination,
      pickupCoords,
      destCoords,
      routeCoords:routeData.routeCoords,
      distanceKm:routeData.distanceKm,
      estimatedTime:routeData.timeFormatted,
      fare:finalFare??routeData.fare,
      rideClass,
      mobile,
      telephone
    })
    setTrackedTicket(t)
  }

  if(trackedTicket) return (
    <div className="min-h-screen bg-black p-4">
      <TrackingView ticket={trackedTicket} onBackToHome={()=>setTrackedTicket(null)} onBookNewRide={()=>setTrackedTicket(null)} />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO - BACKGROUND + WORDING BOTH VISIBLE */}
      <div className="relative min-h-[92vh] w-full overflow-hidden">
        <img 
          src="/hero-i-love-nyandarua.jpg" 
          alt="I Love Nyandarua" 
          className="absolute inset-0 w-full h-full object-cover object-[center_30%]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        
        <div className="relative z-10 max-w-5xl mx-auto p-4 pt-5 space-y-5">
          <div className="flex justify-between items-center">
            <img src="/logo.svg" alt="OlexPress" className="h-10 bg-white rounded-xl px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)]" />
            <div className="bg-amber-400 px-4 py-1.5 rounded-full text-[11px] font-black text-black tracking-widest shadow-[0_4px_20px_rgba(0,0,0,0.6)] border border-amber-300">
              OLEX PRESS KE
            </div>
          </div>

          <div className="pt-1">
            <h1 className="text-[32px] font-black text-white leading-none tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,1)] [text-shadow:_0_2px_20px_rgb(0_0_0_/_80%)]">
              Travel Nyandarua
            </h1>
            <div className="mt-2 inline-flex bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-1.5 shadow-xl">
              <p className="text-[12px] font-bold text-white tracking-wide">
                Ol Kalou • Engineer • Njabini • Nairobi • Egerton • Molo
              </p>
            </div>
          </div>

          <div className="bg-[#0a0e18]/90 backdrop-blur-2xl border border-amber-500/20 rounded-[20px] shadow-[0_20px_80px_rgba(0,0,0,0.9)] overflow-hidden">
            <BookingCard 
              pickup={pickup} 
              destination={destination} 
              onChangePickup={setPickup} 
              onChangeDestination={setDestination} 
              onGetFareAndRoute={handleGetFare} 
              activeTicket={activeTicket} 
              onTrackCurrentTicket={()=>{}} 
              isCalculating={isCalculating} 
              rideClass={rideClass} 
              onChangeRideClass={setRideClass} 
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6 -mt-8 relative z-20">
        <DarkMap pickup={pickup} destination={destination} pickupCoords={pickupCoords} destCoords={destCoords} routeData={routeData} hasCalculated={hasCalculated} onEditRoute={()=>setHasCalculated(false)} error={null} />
        {hasCalculated && routeData && <TicketCard pickup={pickup} destination={destination} routeData={routeData} onConfirmBooking={handleConfirm} rideClass={rideClass} />}
      </div>
    </div>
  )
}
