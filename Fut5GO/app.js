/* ---------- App state & storage ---------- */
const STORAGE_KEY = 'fut5go_v1';
let DB = {
  perfil: null,
  partidos: [],
  reservas: [],
  chats: []
};

function saveDB(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }
function loadDB(){ const raw = localStorage.getItem(STORAGE_KEY); if(raw) DB = JSON.parse(raw); }

/* ---------- Utilities ---------- */
const $ = id => document.getElementById(id);
function toast(text, ms = 3000){
  const container = $('toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  container.appendChild(t);
  setTimeout(()=> t.remove(), ms);
}

/* ---------- Navigation & UI helpers ---------- */
function showScreen(screenId){
  // hide splash & login
  document.querySelectorAll('.screenPage').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  // three kinds: screen-perfil, screen-calendario etc OR login/app-level screens (#login, #app)
  const el = $(`screen-${screenId}`) || $(`screen-${screenId}`);
  // we use specific naming below; instead simpler:
  // hide all screen pages, then unhide desired
  document.querySelectorAll('.screenPage').forEach(n => n.classList.add('hidden'));
  const wanted = $(`screen-${screenId}`);
  if(wanted) wanted.classList.remove('hidden');
}

/* Simpler navigation for the sidebar buttons and back buttons */
function hideAllPages(){ document.querySelectorAll('.screenPage').forEach(s => s.classList.add('hidden')); }
function goToMenu(){ hideAllPages(); /* show menu UI by just keeping main area blank or show a welcome card */ renderWelcome(); }
function renderWelcome(){
  // simple welcome card inserted if no page open
  const content = document.querySelector('.content');
  // remove existing welcome
  const existing = document.getElementById('welcomeCard');
  if(existing) existing.remove();
  const card = document.createElement('div');
  card.id = 'welcomeCard';
  card.className = 'card';
  card.innerHTML = `<h2>Bienvenido${DB.perfil? ', ' + DB.perfil.nombre : ''}</h2>
  <p class="muted">Selecciona una opción del menú para comenzar.</p>`;
  content.prepend(card);
}

/* ---------- Profile ---------- */
function renderProfileToForm(){
  if(!DB.perfil) return;
  $('p_nombre').value = DB.perfil.nombre || '';
  $('p_edad').value = DB.perfil.edad || '';
  $('p_posicion').value = DB.perfil.posicion || '';
  $('p_nivel').value = DB.perfil.nivel || '1';
  $('miniUser').textContent = DB.perfil.nombre || 'Invitado';
  $('userHeader').textContent = DB.perfil.nombre || 'Invitado';
}
function saveProfile(){
  const nombre = $('p_nombre').value.trim();
  if(!nombre){ toast('El nombre es obligatorio'); return; }
  DB.perfil = {
    nombre,
    edad: $('p_edad').value,
    posicion: $('p_posicion').value,
    nivel: $('p_nivel').value
  };
  saveDB();
  renderProfileToForm();
  toast('Perfil guardado');
}
// --- Botón cerrar sesión ---
document.getElementById("btnCerrarSesion").addEventListener("click", function () {

    // Eliminar datos del usuario guardados
    localStorage.removeItem("usuarioNombre");
    localStorage.removeItem("usuarioCorreo");
    localStorage.removeItem("usuarioID");

    // Cambiar textos de perfil a "Invitado"
    document.getElementById("miniUser").textContent = "Invitado";

    // Mostrar pantalla de login
    document.getElementById("loginScreen").classList.remove("hidden");

    // Ocultar la app
    document.getElementById("app").classList.add("hidden");

    alert("Sesión cerrada correctamente.");
});

/* ---------- Partidos (calendario) ---------- */
function renderPartidos(){
  const wrap = $('matchesList');
  if(!wrap) return;
  wrap.innerHTML = '';
  if(DB.partidos.length === 0){
    wrap.innerHTML = `<div class="card muted">No hay partidos programados</div>`;
    return;
  }
  DB.partidos.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'card';
    const date = new Date(m.fecha).toLocaleString();
    div.innerHTML = `<strong>${m.titulo}</strong><div class="muted">${date} · ${m.lugar} · Nivel ${m.nivel}</div>
      <div style="margin-top:8px"><button class="btn" onclick="joinMatch(${i})">Unirme</button></div>`;
    wrap.appendChild(div);
  });
}
function openCreateMatchModal(){
  showModal(`<h3>Crear Partido</h3>
    <input id="m_titulo" placeholder="Título (Atlético vs Deportivo)" />
    <input id="m_fecha" type="datetime-local" />
    <input id="m_lugar" placeholder="Cancha / Dirección" />
    <select id="m_nivel"><option value="1">Nivel 1</option><option value="2">Nivel 2</option><option value="3">Nivel 3</option></select>
    <div style="margin-top:10px"><button class="btn primary" id="createMatchConfirm">Crear</button></div>`);
  $('createMatchConfirm').onclick = () => {
    const titulo = $('m_titulo').value.trim() || 'Partido amistoso';
    const fecha = $('m_fecha').value ? new Date($('m_fecha').value).getTime() : Date.now();
    const lugar = $('m_lugar').value.trim() || 'Cancha local';
    const nivel = $('m_nivel').value || 1;
    DB.partidos.push({ titulo, fecha, lugar, nivel, asistentes: [] });
    saveDB();
    closeModal();
    renderPartidos();
    toast('Partido creado');
  };
}
function joinMatch(i){
  const match = DB.partidos[i];
  const usuario = DB.perfil?.nombre || prompt('Tu nombre para unirte') || 'Anon';
  if(!match.asistentes.includes(usuario)) match.asistentes.push(usuario);
  saveDB();
  toast(`Te uniste a ${match.titulo}`);
  renderPartidos();
}

/* ---------- Reservas ---------- */
function renderReservas(){
  const wrap = $('reservasList');
  if(!wrap) return;
  wrap.innerHTML = '';
  if(DB.reservas.length === 0){ wrap.innerHTML = '<div class="muted">No hay reservas</div>'; return; }
  DB.reservas.forEach((r,i)=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<strong>${r.cancha}</strong><div class="muted">${r.fecha} · ${r.hora}</div>`;
    wrap.appendChild(el);
  });
}
function createReserva(){
  const cancha = $('r_cancha').value.trim() || '';
  const fecha = $('r_fecha').value || '';
  const hora = $('r_hora').value || '';
  if(!cancha || !fecha || !hora){ toast('Completa cancha, fecha y hora'); return; }
  DB.reservas.push({ cancha, fecha, hora, user: DB.perfil?.nombre || 'Anon' });
  saveDB();
  renderReservas();
  toast('Reserva creada');
}

/* ---------- Chats ---------- */
function renderChatsList(){
  const wrap = $('chatsList');
  wrap.innerHTML = '';
  if(DB.chats.length === 0){ wrap.innerHTML = `<div class="muted">No hay grupos. Crea uno.</div>`; return; }
  DB.chats.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = 'chatItem';
    item.innerHTML = `<strong>${c.nombre}</strong><div class="muted">${(c.mensajes?.length||0)} mensajes</div>`;
    item.onclick = () => openChat(i);
    wrap.appendChild(item);
  });
}
let currentChatIndex = null;
function createChat(){
  const nombre = prompt('Nombre del chat (ej: Los Amigos)') || '';
  if(!nombre) return;
  DB.chats.push({ nombre, miembros: [DB.perfil?.nombre || 'Anon'], mensajes: [] });
  saveDB();
  renderChatsList();
  toast('Grupo creado');
}
function openChat(i){
  currentChatIndex = i;
  const chat = DB.chats[i];
  $('chatWindow').classList.remove('hidden');
  $('chatTitle').textContent = chat.nombre;
  renderChatMessages();
}
function renderChatMessages(){
  const box = $('chatMessages'); box.innerHTML = '';
  const chat = DB.chats[currentChatIndex];
  (chat.mensajes||[]).forEach(m => {
    const el = document.createElement('div'); el.className = 'msg';
    el.textContent = `${m.autor}: ${m.text}`;
    box.appendChild(el);
  });
  box.scrollTop = box.scrollHeight;
}
function sendChatMsg(){
  const text = $('chatMsgInput').value.trim(); if(!text) return;
  const autor = DB.perfil?.nombre || 'Anon';
  const chat = DB.chats[currentChatIndex];
  chat.mensajes.push({ autor, text, ts: Date.now() });
  chat.ultMsg = { text, ts: Date.now() };
  saveDB();
  $('chatMsgInput').value = '';
  renderChatMessages();
  renderChatsList();
}

/* ---------- Map (Leaflet) ---------- */
let map, markersLayer;
function initMap(){
  try{
    map = L.map('map').setView([9.93, -84.08], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
    refreshMap();
  }catch(e){ console.warn('Mapa no iniciado', e); $('map').textContent = 'Mapa no disponible'; }
}
function refreshMap(){
  if(!markersLayer) return;
  markersLayer.clearLayers();
  const canchas = [
    { nombre: 'Cancha Central', lat: 9.9335, lng: -84.0816 },
    { nombre: 'Polideportivo Norte', lat: 9.9370, lng: -84.0672 }
  ];
  canchas.forEach(c => L.marker([c.lat,c.lng]).addTo(markersLayer).bindPopup(`<strong>${c.nombre}</strong>`));
  toast('Mapa actualizado');
}

/* ---------- Modal helpers ---------- */
function showModal(html){
  const root = $('modalRoot');
  root.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}<div style="margin-top:10px"><button class="btn" id="closeModal">Cerrar</button></div></div></div>`;
  $('closeModal').onclick = closeModal;
}
function closeModal(){ $('modalRoot').innerHTML = ''; }

/* ---------- Initial UI wiring ---------- */
function wireUI(){
  // login/register tabs
  $('tabLogin').onclick = ()=>{ $('loginForm').classList.remove('hidden'); $('registerForm').classList.add('hidden'); $('tabLogin').classList.add('active'); $('tabRegister').classList.remove('active'); };
  $('tabRegister').onclick = ()=>{ $('registerForm').classList.remove('hidden'); $('loginForm').classList.add('hidden'); $('tabRegister').classList.add('active'); $('tabLogin').classList.remove('active'); };

  // auth
  $('loginBtn').onclick = ()=> {
    const name = $('loginName').value.trim();
    if(!name) return toast('Pon tu nombre');
    DB.perfil = { nombre: name }; saveDB();
    startApp();
  };
  $('guestBtn').onclick = ()=> { DB.perfil = { nombre: 'Invitado' }; saveDB(); startApp(); };
  $('regBtn').onclick = ()=> {
    const name = $('regName').value.trim(); const email = $('regEmail').value.trim();
    if(!name||!email) return toast('Nombre y correo requeridos');
    DB.perfil = { nombre: name, email }; saveDB(); startApp();
  };

  // sidebar nav
  $('btnMenuPerfil').onclick = ()=> { hideWelcome(); hideAllPages(); $('screen-perfil').classList.remove('hidden'); renderProfileToForm(); };
  $('btnMenuCalendario').onclick = ()=> { hideWelcome(); hideAllPages(); $('screen-calendario').classList.remove('hidden'); renderPartidos(); };
  $('btnMenuCanchas').onclick = ()=> { hideWelcome(); hideAllPages(); $('screen-canchas').classList.remove('hidden'); setTimeout(()=> initMap(), 50); };
  $('btnMenuChat').onclick = ()=> { hideWelcome(); hideAllPages(); $('screen-chat').classList.remove('hidden'); renderChatsList(); };
  $('btnMenuApartar').onclick = ()=> { hideWelcome(); hideAllPages(); $('screen-apartar').classList.remove('hidden'); renderReservas(); };

  // back buttons
  document.querySelectorAll('.backMenu').forEach(b => b.onclick = ()=> { hideAllPages(); renderWelcome(); });

  // profile save
  $('saveProfile').onclick = saveProfile;

  // create match
  $('openCreateMatch').onclick = openCreateMatchModal;

  // reservations
  $('createReserva').onclick = createReserva;

  // map refresh
  $('refreshMap').onclick = refreshMap;

  // chat
  $('createChatBtn').onclick = createChat;
  $('chatSendBtn').onclick = ()=> { if(currentChatIndex===null) return toast('Abre un chat'); sendChatMsg(); };
}

/* ---------- Helpers for page visibility ---------- */
function hideAllPages(){ document.querySelectorAll('.screenPage').forEach(s => s.classList.add('hidden')); }
function hideWelcome(){ const w = $('welcomeCard'); if(w) w.remove(); }

/* ---------- App start ---------- */
function startApp(){
  $('splash').style.display = 'none';
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  renderProfileToForm();
  renderWelcome();
}

/* ---------- Boot sequence ---------- */
window.addEventListener('load', ()=>{
  loadDB();
  wireUI();

  // simple splash timeout
  setTimeout(()=>{
    $('splash').style.display = 'none';
    // if we have profile, go to app, else show login
    if(DB.perfil && DB.perfil.nombre){
      $('app').classList.remove('hidden'); renderProfileToForm(); renderWelcome();
    } else {
      $('login').classList.remove('hidden');
    }
  }, 1000);
});
