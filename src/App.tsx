import { useState } from 'react'
import BookingCard from './components/BookingCard'
import DriverDashboard from './components/DriverDashboard'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [activeTab, setActiveTab] = useState('customer')

  return (
    <div>
      <div style={{display:'flex', gap:'10px', padding:'10px', background:'#000', justifyContent:'center'}}>
        <button onClick={()=>setActiveTab('customer')} style={{padding:'10px', background: activeTab==='customer' ? '#FFC107' : '#fff', fontWeight:'bold'}}>CUSTOMER</button>
        <button onClick={()=>setActiveTab('driver')} style={{padding:'10px', background: activeTab==='driver' ? '#FFC107' : '#fff', fontWeight:'bold'}}>DRIVER</button>
        <button onClick={()=>setActiveTab('admin')} style={{padding:'10px', background: activeTab==='admin' ? '#FFC107' : '#fff', fontWeight:'bold'}}>ADMIN</button>
      </div>

      <div style={{padding:'20px'}}>
        {activeTab === 'customer' && <BookingCard />}
        {activeTab === 'driver' && <DriverDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
      </div>
    </div>
  )
}

export default App
