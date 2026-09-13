import { HashRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Header } from './components/Header'
import { BookingCard, RideClassType } from './components/BookingCard'
import { DarkMap } from './components/DarkMap'
import { TicketCard } from './components/TicketCard'
import { TrackingView } from './components/TrackingView'
import { DriverDashboard } from './components/DriverDashboard'
import { AdminDashboard } from './components/AdminDashboard'
import { MyTicketsModal, AboutModal, SupportModal, TermsModal, GalaxyGlobeModal } from './components/Modals'
import { GalaxyGlobe3D } from './components/GalaxyGlobe3D'
import { Sparkles, Maximize2, ChevronDown, ChevronUp } from 'lucide-react'
import { findTown, calculateRoadRoute, RouteComputation } from './data/towns'
import { ticketStore } from './services/ticketStore'
import { Ticket } from './types'

// PASSENGER PAGE - now independent at #/
function PassengerPage(){
  const [passengerSubView, setPassengerSubView] = useState<'booking' | 'tracking'>('booking')
  const [pickup, setPickup] = useState('Ol Kalou')
  const [destination, setDestination] = useState('Nyahururu')
  const [pickupCoords, setPickupCoords] = useState<[number, number]>([-0.2721, 36.3792])
  const [destCoords, setDestCoords] = useState<[number, number]>([0.0421, 36.3628])
  const [routeData, setRouteData] = useState<RouteComputation | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>(() => ticketStore.getTickets())
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(() => ticketStore.getActiveTicket())
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null)
  const [myTicketsOpen, setMyTicketsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [galaxyModalOpen, setGalaxyModalOpen] = useState(false)
  const [showHeroGalaxy, setShowHeroGalaxy] = useState(true)
  const [rideClass, setRideClass] = useState<RideClassType>('Standard')
  const ticketCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = ticketStore.subscribe(() => {
      setTickets(ticketStore.getTickets())
      setActiveTicket(ticketStore.getActiveTicket())
    })
    const cur = ticketStore.getActiveTicket()
    if (cur) { setTrackedTicket(cur); setPassengerSubView('tracking') }
    return unsub
  }, [])

  useEffect(() => { const t=findTown(pickup); if(t) setPickupCoords(t.coords) }, [pickup])
  useEffect(() => { const t=findTown(destination); if(t) setDestCoords(t.coords) }, [destination])

  const handleGetFareAndRoute = async () => {
    setIsCalculating(true); setRouteError(null)
    const pTown=findTown(pickup); const dTown=findTown(destination)
    if(!pTown||!dTown){ setRouteError('Town not found'); setIsCalculating(false); return }
    try{
      const result=await calculateRoadRoute(pTown.name,dTown.name)
      if(!result){ setRouteError('No route'); setHasCalculated(false) }
      else { setRouteData(result); setPickupCoords(pTown.coords); setDestCoords(dTown.coords); setHasCalculated(true); setTimeout(()=>ticketCardRef.current?.scrollIntoView({behavior:'smooth'}),150) }
    }catch{ setRouteError('Error calculating') } finally{ setIsCalculating(false) }
  }

  const handleConfirmBooking = (mobile:string, telephone?:string, finalFare?:number)=>{
    if(!routeData) return
    const newTicket=ticketStore.createTicket({ pickup, destination, pickupCoords, destCoords, routeCoords: routeData.routeCoords, distanceKm: routeData.distanceKm, estimatedTime: routeData.timeFormatted, fare: finalFare??routeData.fare, rideClass, mobile, telephone })
    setTrackedTicket(newTicket); setPassengerSubView('tracking'); setHasCalculated(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header currentView="passenger" onNavigate={()=>{}} onOpenMyTickets={()=>setMyTicketsOpen(true)} onOpenAbout={()=>setAboutOpen(true)} onOpenSupport={()=>setSupportOpen(true)} onOpenTerms={()=>setTermsOpen(true)} onOpenGalaxy={()=>setGalaxyModalOpen(true)} activeTicketCount={activeTicket?1:0} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
        {passengerSubView==='tracking' && trackedTicket? (
          <TrackingView ticket={trackedTicket} onBackToHome={()=>setPassengerSubView('booking')} onBookNewRide={()=>{setPassengerSubView('booking'); setTrackedTicket(null)}} />
        ):(
          <>
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-zinc-950">
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400 animate-pulse"/><span className="text-xs font-bold text-amber-400">3D COSMIC GALAXY • NYANDARUA</span></div>
                <button onClick={()=>setGalaxyModalOpen(true)} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs flex gap-1"><Maximize2 className="w-3 h-3"/>Fullscreen</button>
              </div>
              {showHeroGalaxy && <div className="h-[360px]"><GalaxyGlobe3D height={360} interactive showControls /></div>}
            </div>
            <BookingCard pickup={pickup} destination={destination} onChangePickup={setPickup} onChangeDestination={setDestination} onGetFareAndRoute={handleGetFareAndRoute} activeTicket={activeTicket} onTrackCurrentTicket={()=>{ if(activeTicket){setTrackedTicket(activeTicket); setPassengerSubView('tracking')} }} isCalculating={isCalculating} rideClass={rideClass} onChangeRideClass={setRideClass} />
            <DarkMap pickup={pickup} destination={destination} pickupCoords={pickupCoords} destCoords={destCoords} routeData={routeData} hasCalculated={hasCalculated} onEditRoute={()=>setHasCalculated(false)} error={routeError} />
            {hasCalculated && routeData && <div ref={ticketCardRef}><TicketCard pickup={pickup} destination={destination} routeData={routeData} onConfirmBooking={handleConfirmBooking} rideClass={rideClass} /></div>}
          </>
        )}
      </main>
      <MyTicketsModal isOpen={myTicketsOpen} onClose={()=>setMyTicketsOpen(false)} tickets={tickets} onSelectTicket={(t)=>{setTrackedTicket(t); setPassengerSubView('tracking')}} />
      <AboutModal isOpen={aboutOpen} onClose={()=>setAboutOpen(false)} />
      <SupportModal isOpen={supportOpen} onClose={()=>setSupportOpen(false)} />
      <TermsModal isOpen={termsOpen} onClose={()=>setTermsOpen(false)} />
      <GalaxyGlobeModal isOpen={galaxyModalOpen} onClose={()=>setGalaxyModalOpen(false)} />
    </div>
  )
}

// DRIVER PAGE - independent at #/driver
function DriverPage(){
  return <div className="min-h-screen bg-black text-white p-4"><h1 className="text-amber-400 font-bold mb-4">Driver Dashboard - Independent</h1><DriverDashboard onViewTicketOnMap={()=>{}} /></div>
}

// ADMIN PAGE - independent at #/admin
function AdminPage(){
  return <div className="min-h-screen bg-black text-white p-4"><h1 className="text-amber-400 font-bold mb-4">Admin Dashboard - Independent</h1><AdminDashboard /></div>
}

export default function App(){
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PassengerPage/>} />
        <Route path="/driver" element={<DriverPage/>} />
        <Route path="/admin" element={<AdminPage/>} />
      </Routes>
    </HashRouter>
  )
}
