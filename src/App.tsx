import { useState, useEffect } from 'react'

function CustomerPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [phone, setPhone] = useState('')
  const book = () => {
    const all = JSON.parse(localStorage.getItem('olexpress') || '[]')
    all.push({ from, to, phone, time: Date.now() })
    localStorage.setItem('olexpress', JSON.stringify(all))
    alert('Booked! Now open /#/driver')
    window.location.hash = '#/driver'
  }
  return (
    <div style={{padding:20, maxWidth:380, margin:'auto', fontFamily:'sans-serif'}}>
      <h1 style={{background:'#000', color:'#FFC107', padding:12, textAlign:'center'}}>OLEX PRESS</h1>
      <h3>Customer Booking</h3>
      <input value={from} onChange={e=>setFrom(e.target.value)} placeholder="From" style={{width:'100%', padding:10, margin:'6px 0'}} />
      <input value={to} onChange={e=>setTo(e.target.value)} placeholder="To" style={{width:'100%', padding:10, margin:'6px 0'}} />
      <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mpesa Phone" style={{width:'100%', padding:10, margin:'6px 0'}} />
      <button onClick={book} style={{width:'100%', padding:14, background:'#FFC107', fontWeight:'bold', border:'none'}}>BOOK TICKET</button>
    </div>
  )
}

function DriverPage() {
  const [list, setList] = useState<any[]>([])
  useEffect(()=>{ setList(JSON.parse(localStorage.getItem('olexpress') || '[]')) },[])
  return (
    <div style={{padding:20}}>
      <h1>Driver - Independent</h1>
      <button onClick={()=>window.location.hash='#/'}>← Customer</button>
      <button onClick={()=>window.location.hash='#/admin'} style={{marginLeft:10}}>Admin →</button>
      <h3>Tickets:</h3>
      {list.map((t,i)=><div key={i} style={{border:'1px solid black', padding:10, margin:8}}>{t.from} → {t.to} | {t.phone}</div>)}
      {list.length===0 && <p>No tickets</p>}
    </div>
  )
}

function AdminPage() {
  return <div style={{padding:20}}><h1>Admin - Independent</h1><button onClick={()=>window.location.hash='#/'}>← Customer</button></div>
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(()=>{
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return ()=>window.removeEventListener('hashchange', onHash)
  },[])

  if (hash === '#/driver') return <DriverPage />
  if (hash === '#/admin') return <AdminPage />
  return <CustomerPage />
}
