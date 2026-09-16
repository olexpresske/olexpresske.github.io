<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OlexPress Driver - XXX Fleet</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
<link rel="manifest" href="manifest.json"><meta name="theme-color" content="#0f172a">
<script>if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js');}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui}
body{background:#0f172a;color:white;padding:10px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:14px;margin:10px 0}
input{width:100%;padding:12px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:white;margin:6px 0}
button{padding:12px;border-radius:10px;border:0;font-weight:800;cursor:pointer;margin:4px 0}
#map{height:320px;border-radius:12px;border:2px solid #22c55e;margin:10px 0}
.ride{background:#0f172a;padding:12px;border-radius:10px;margin:8px 0;border:1px solid #334155;border-left:4px solid #22c55e}
</style>
</head>
<body>

<div style="background:linear-gradient(135deg,#16a34a,#15803d);border-radius:14px;padding:14px;display:flex;justify-content:space-between;align-items:center">
<div><div style="font-weight:900">🚕 OlexPress DRIVER - XXX Fleet</div><div style="font-size:11px;opacity:.9">See all tickets now - Login only to accept</div></div>
<div id="driverStatus" style="background:white;color:#16a34a;padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800">VIEW MODE</div>
</div>

<div class="card">
<div style="display:flex;gap:6px">
<input id="driverName" placeholder="Driver Name - For accepting">
<input id="driverPhone" placeholder="Phone 07... - For accepting">
</div>
<input id="vehicleNo" placeholder="Vehicle No KDA 123X (optional)">
<div style="display:flex;gap:6px">
<button onclick="goOnline()" style="background:#22c55e;color:white;flex:1">🟢 GO ONLINE - To Accept</button>
<button onclick="goOffline()" style="background:#334155;color:white;flex:1">🔴 OFFLINE</button>
</div>
<div id="loginInfo" style="font-size:10px;color:#4ade80;margin-top:6px">✅ You can see ALL tickets below even without login - Login only needed to click ACCEPT</div>
</div>

<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center">
<h3 style="font-size:13px">🗺️ Live Map - All Tickets</h3>
<div style="display:flex;gap:4px">
<button onclick="loadAllRides()" style="width:auto;padding:6px 10px;background:#16a34a;color:white;font-size:10px">🔄 Refresh</button>
<button onclick="centerMap()" style="width:auto;padding:6px 10px;background:#3b82f6;color:white;font-size:10px">Center</button>
</div>
</div>
<div id="map"></div>
<div id="mapInfo" style="font-size:10px;color:#94a3b8;background:#0f172a;padding:6px;border-radius:6px;margin-top:6px">Map auto shows all pickup pins - Tap pin for ticket</div>
</div>

<div id="activeRide" style="display:none" class="card"></div>

<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
<h3 style="font-size:13px">📋 All Tickets - Visible Now - No Login Needed</h3>
<select id="filterStatus" onchange="loadAllRides()" style="width:auto;padding:6px;font-size:11px;background:#0f172a;color:white;border:1px solid #334155"><option value="all">All</option><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="arrived">Arrived</option><option value="boarding_requested">Boarding</option><option value="boarded">On Trip</option><option value="pay_initiated">Pay</option><option value="paid">Paid</option><option value="completed">Done</option></select>
</div>
<div id="ridesList"><div style="text-align:center;padding:20px;color:#4ade80;font-size:11px">Loading all tickets... Check Firebase connection</div></div>
</div>

<script>
var firebaseConfig={apiKey:"AIzaSyD4...",authDomain:"olexpresske.firebaseapp.com",databaseURL:"https://olexpresske-default-rtdb.firebaseio.com",projectId:"olexpresske"};
firebase.initializeApp(firebaseConfig);var db=firebase.database();
let map, driverMarker, pickupMarker, destMarker, routeLine, markers=[];
let driverOnline=false, driverData=null, activeRideId=null;

function initMap(){
map=L.map('map').setView([-0.3,36.3],9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OlexPress'}).addTo(map);
}
initMap();
function centerMap(){map.setView([-0.3,36.3],9);}
function clearMarkers(){markers.forEach(m=>{try{map.removeLayer(m);}catch(e){}}); markers=[]; if(pickupMarker)try{map.removeLayer(pickupMarker);}catch(e){} if(destMarker)try{map.removeLayer(destMarker);}catch(e){} if(routeLine)try{map.removeLayer(routeLine);}catch(e){}}

function goOnline(){
let name=document.getElementById('driverName').value.trim();
let phone=document.getElementById('driverPhone').value.trim();
let vehicle=document.getElementById('vehicleNo').value.trim()||'KDA 123X';
if(!name){name=localStorage.getItem('last_driver_name')||'XXX Fleet Driver'; document.getElementById('driverName').value=name;}
if(!phone){phone=localStorage.getItem('last_driver_phone')||'0710000000'; document.getElementById('driverPhone').value=phone;}
driverData={name:name,phone:phone,vehicle:vehicle};
localStorage.setItem('olex_driver',JSON.stringify(driverData));
localStorage.setItem('last_driver_name',name);
localStorage.setItem('last_driver_phone',phone);
driverOnline=true;
document.getElementById('driverStatus').innerText='ONLINE - '+name;
document.getElementById('driverStatus').style.background='#22c55e';
document.getElementById('loginInfo').innerHTML=`✅ ONLINE as ${name} ${vehicle} - You can now ACCEPT tickets`;
loadAllRides();
if(navigator.geolocation){navigator.geolocation.watchPosition(p=>{if(driverMarker)map.removeLayer(driverMarker); driverMarker=L.marker([p.coords.latitude,p.coords.longitude],{icon:L.divIcon({html:'🚕',className:'',iconSize:[30,30]})}).addTo(map); if(activeRideId) db.ref('rides/'+activeRideId+'/driverLocation').set({lat:p.coords.latitude,lng:p.coords.longitude,ts:Date.now()});});}
}
function goOffline(){driverOnline=false; document.getElementById('driverStatus').innerText='VIEW MODE - See tickets'; document.getElementById('loginInfo').innerHTML='👁️ View mode - See all tickets - Go online to ACCEPT';}

function loadAllRides(){
// NO LOGIN BLOCK - Loads even offline!
let filter=document.getElementById('filterStatus').value;
db.ref('rides').once('value',snap=>{
let rides=[]; snap.forEach(c=>rides.push({id:c.key,data:c.val()}));
rides.sort((a,b)=>(b.data.ts||0)-(a.data.ts||0));
let html=''; let count=0; let bounds=[];
clearMarkers();
rides.forEach(r=>{
let v=r.data; 
if(filter!=='all'&&v.status!==filter) return;
count++;
if(v.fromCoords){
let m=L.marker([v.fromCoords.lat,v.fromCoords.lng]).addTo(map).bindPopup(`<b>🎫 ${r.id}</b><br>From: ${v.from}<br>To: ${v.to}<br>👤 ${v.name} ${v.phone}<br>KES ${v.fare}<br>Status: ${v.status}<br><button onclick="viewOnMap('${r.id}')">View</button>`);
markers.push(m); bounds.push([v.fromCoords.lat,v.fromCoords.lng]);
}
let col={pending:'#f59e0b',accepted:'#3b82f6',arrived:'#8b5cf6',boarding_requested:'#ec4899',boarded:'#06b6d4',pay_initiated:'#f97316',paid:'#22c55e',completed:'#16a34a'}[v.status]||'#64748b';
let isMy=activeRideId===r.id;
html+=`<div class="ride" style="border-left-color:${col};${isMy?'border:2px solid #22c55e;':''}"><div style="display:flex;justify-content:space-between"><b style="color:${col}">🎫 ${r.id}</b><span style="background:${col};color:white;padding:2px 8px;border-radius:10px;font-size:9px">${(v.status||'pending').toUpperCase()} • ${v.date||''} ${v.clock||''}</span></div><div style="font-size:12px;margin-top:6px"><b>From:</b> ${v.from}</div><div style="font-size:12px"><b>To:</b> ${v.to}</div><div style="display:flex;gap:6px;margin-top:6px"><div style="flex:1;background:#1e293b;padding:6px;border-radius:6px"><div style="font-size:9px;color:#94a3b8">Distance</div><div style="font-weight:800;color:#4ade80">${v.km}km</div></div><div style="flex:1;background:${col};color:white;padding:6px;border-radius:6px;text-align:center"><div style="font-size:9px">Fare</div><div style="font-weight:900">KES ${v.fare}</div></div></div><div style="font-size:11px;margin-top:6px">👤 ${v.name} - ${v.phone} ${v.driverName?'| 🚕 '+v.driverName+' '+v.vehicle:''}</div><div style="display:flex;gap:4px;margin-top:8px"><button onclick="viewOnMap('${r.id}')" style="background:#3b82f6;color:white;flex:1;padding:10px;font-size:11px">🗺️ Map</button>${v.status==='pending'?`<button onclick="acceptRide('${r.id}')" style="background:#22c55e;color:white;flex:1;padding:10px;font-size:11px">✅ ACCEPT</button>`:''}${v.status!=='pending'&&v.status!=='completed'?`<button onclick="openActive('${r.id}')" style="background:#f59e0b;color:white;flex:1;padding:10px;font-size:11px">⚡ ACT</button>`:''}</div></div>`;
});
if(bounds.length>0){try{map.fitBounds(bounds,{padding:[40,40]});}catch(e){}}
if(count===0){html='<div style="text-align:center;padding:20px;color:#f59e0b">⚠️ No tickets in Firebase<br><br>Check:<br>1. apiKey full? Your key shows ...<br>2. index.html booked any ride?<br>3. Firebase Rules allow read?<br><br><button onclick="loadAllRides()" style="background:#22c55e;color:white;padding:10px;width:auto">🔄 Try Again</button></div>';}
else{html=`<div style="font-size:11px;color:#4ade80;background:#0f172a;padding:8px;border-radius:8px;margin-bottom:8px">✅ ${count} tickets found - Visible without login - Login to ACCEPT<br>Tap 🗺️ Map to see pickup/destination on map</div>`+html;}
document.getElementById('ridesList').innerHTML=html;
document.getElementById('mapInfo').innerHTML=`🗺️ Showing ${count} tickets on map - ${filter} filter - ${new Date().toLocaleTimeString()}`;
},err=>{
document.getElementById('ridesList').innerHTML=`<div style="background:#fee2e2;color:#991b1b;padding:12px;border-radius:8px">❌ Firebase error: ${err.message}<br><br>Fix apiKey - Your config shows "AIzaSyD4..." with ... - Need full key from Firebase Console</div>`;
});
}

function viewOnMap(rideId){
db.ref('rides/'+rideId).once('value',snap=>{
let v=snap.val(); if(!v) return;
clearMarkers();
if(v.fromCoords){pickupMarker=L.marker([v.fromCoords.lat,v.fromCoords.lng]).addTo(map).bindPopup(`<b>From:</b> ${v.from}<br>🎫 ${rideId}<br>👤 ${v.name} ${v.phone}<br>KES ${v.fare}`).openPopup(); markers.push(pickupMarker); map.setView([v.fromCoords.lat,v.fromCoords.lng],14);}
if(v.toCoords){destMarker=L.marker([v.toCoords.lat,v.toCoords.lng]).addTo(map).bindPopup(`<b>To:</b> ${v.to}<br>🎫 ${rideId}`); markers.push(destMarker);}
if(v.fromCoords&&v.toCoords){routeLine=L.polyline([[v.fromCoords.lat,v.fromCoords.lng],[v.toCoords.lat,v.toCoords.lng]],{color:'#22c55e',weight:4,dashArray:'10,10'}).addTo(map); markers.push(routeLine); map.fitBounds([[v.fromCoords.lat,v.fromCoords.lng],[v.toCoords.lat,v.toCoords.lng]],{padding:[50,50]});}
document.getElementById('mapInfo').innerHTML=`📍 ${rideId}: ${v.from} → ${v.to} | KES ${v.fare} | ${v.name} ${v.phone} | ${v.status}`;
});
}
function acceptRide(rideId){
if(!driverOnline || !driverData){
let name=document.getElementById('driverName').value.trim()||localStorage.getItem('last_driver_name')||'XXX Fleet Driver';
let phone=document.getElementById('driverPhone').value.trim()||localStorage.getItem('last_driver_phone')||'0710000000';
if(!name||!phone){alert('Enter Driver Name & Phone first, then GO ONLINE, then ACCEPT'); return;}
goOnline();
}
db.ref('rides/'+rideId).once('value',snap=>{
let v=snap.val(); if(!v) return alert('Ticket not found'); if(v.status!=='pending') return alert('Already taken: '+v.status);
if(activeRideId) return alert('You have active '+activeRideId+' - Complete first');
db.ref('rides/'+rideId).update({status:'accepted',driverName:driverData.name,driverPhone:driverData.phone,vehicle:driverData.vehicle,acceptedAt:Date.now(),acceptedTime:new Date().toLocaleString('en-KE')}).then(()=>{activeRideId=rideId; localStorage.setItem('olex_driver_active',rideId); showActiveRide(rideId,{...v,status:'accepted',driverName:driverData.name}); viewOnMap(rideId); loadAllRides();});
});
}
function openActive(rideId){db.ref('rides/'+rideId).once('value',s=>{let v=s.val(); if(!v)return; activeRideId=rideId; localStorage.setItem('olex_driver_active',rideId); showActiveRide(rideId,v); viewOnMap(rideId);});}
function showActiveRide(rideId,data){
document.getElementById('activeRide').style.display='block';
document.getElementById('activeRide').innerHTML=`<div style="display:flex;justify-content:space-between"><b>🚕 Active ${rideId}</b><span style="background:#f59e0b;color:white;padding:4px 10px;border-radius:12px;font-size:10px" id="driverStatusBadge">${(data.status||'').toUpperCase()}</span></div><div style="background:#0f172a;padding:10px;border-radius:8px;margin-top:8px"><div style="font-size:12px"><b>From:</b> ${data.from}</div><div style="font-size:12px"><b>To:</b> ${data.to}</div><div style="font-size:11px;margin-top:6px">👤 ${data.name} ${data.phone} | KES ${data.fare} | ${data.km}km | ${data.date} ${data.clock}</div></div><div id="driverActions" style="margin-top:10px"></div><div id="driverSteps" style="margin-top:8px;background:#0f172a;padding:8px;border-radius:8px;font-size:10px;color:#94a3b8"></div>`;
trackDriverRide(rideId);
window.scrollTo(0,document.getElementById('activeRide').offsetTop);
}
function trackDriverRide(rideId){
db.ref('rides/'+rideId).on('value',snap=>{
let v=snap.val(); if(!v) return;
let badge=document.getElementById('driverStatusBadge'); if(badge) badge.innerText=(v.status||'').toUpperCase();
let actions=document.getElementById('driverActions');
let steps=document.getElementById('driverSteps');
if(steps) steps.innerHTML=`Status: ${v.status} | Fare KES ${v.fare} | Client ${v.name} ${v.phone}`;
let btn='';
if(v.status==='accepted') btn=`<button onclick="driverArrived('${rideId}')" style="background:#3b82f6;color:white;width:100%">📍 I HAVE ARRIVED AT PICKUP</button>`;
else if(v.status==='arrived') btn=`<button onclick="requestBoarding('${rideId}')" style="background:#f59e0b;color:white;width:100%">🎫 REQUEST BOARDING</button>`;
else if(v.status==='boarding_requested') btn=`<div style="background:#fffbeb;color:#0f172a;padding:10px;border-radius:8px;text-align:center">⏳ Waiting client to accept boarding...</div>`;
else if(v.status==='boarded') btn=`<button onclick="initiatePay('${rideId}')" style="background:#f97316;color:white;width:100%">💰 REACHED DESTINATION - REQUEST PAY KES ${v.fare}</button>`;
else if(v.status==='pay_initiated') btn=`<div style="background:#fffbeb;color:#0f172a;padding:10px;border-radius:8px;text-align:center">⏳ Waiting client to pay KES ${v.fare}...</div>`;
else if(v.status==='paid') btn=`<button onclick="completeRide('${rideId}')" style="background:#22c55e;color:white;width:100%">✅ COMPLETE RIDE - Allow new booking</button>`;
else if(v.status==='completed') btn=`<div style="background:#f0fdf4;color:#0f172a;padding:12px;border-radius:8px;text-align:center">✅ Completed ${v.feedback?`⭐ ${v.feedback.stars} - ${v.feedback.text}`:''}<br><button onclick="clearActive()" style="background:#334155;color:white;width:100%;margin-top:8px">Clear - Take New Tickets</button></div>`;
if(actions) actions.innerHTML=btn;
});
}
function driverArrived(id){db.ref('rides/'+id).update({status:'arrived',arrivedAt:Date.now()});}
function requestBoarding(id){db.ref('rides/'+id).update({status:'boarding_requested'});}
function initiatePay(id){db.ref('rides/'+id).update({status:'pay_initiated'});}
function completeRide(id){db.ref('rides/'+id).update({status:'completed',completedAt:Date.now()}).then(()=>clearActive());}
function clearActive(){activeRideId=null; localStorage.removeItem('olex_driver_active'); document.getElementById('activeRide').style.display='none'; loadAllRides();}
let saved=localStorage.getItem('olex_driver'); if(saved){let d=JSON.parse(saved); document.getElementById('driverName').value=d.name||''; document.getElementById('driverPhone').value=d.phone||''; document.getElementById('vehicleNo').value=d.vehicle||'';}
// AUTO LOAD TICKETS IMMEDIATELY - NO LOGIN NEEDED!
setTimeout(()=>{loadAllRides();},1000);
db.ref('rides').on('value',()=>{loadAllRides();});
</script>
</body>
</html>.
