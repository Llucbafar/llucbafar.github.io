/* ================= MAPA DE COCHES - SUPABASE ================= */

const SUPABASE_URL = 'https://wtcvawprxmblnuiauixp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Y3Zhd3ByeG1ibG51aWF1aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzA0MzgsImV4cCI6MjEwMzg0NjQzOH0.-tyDzGCQ6k1pJ5Kg-UX0rq9K7uQ_PV4FR2_0lgdRvr8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


const COCHES = {
  C3: { nombre:'C3', color:'Azul', clase:'c3' },
  C4: { nombre:'C4', color:'Gris', clase:'c4' },
  Laguna: { nombre:'Laguna', color:'Verde', clase:'laguna' }
};

let mapa = null;
let cocheSeleccionado = 'C3';
let editando = false;
let marcadores = {};
let posicionesOriginales = {};
let posicionPendiente = null;
let mensajeTimeout = null;

const editarBtn = document.getElementById('editarBtn');
const ayudaEdicion = document.getElementById('ayudaEdicion');
const estadoTexto = document.getElementById('estadoTexto');
const botonesCoche = document.querySelectorAll('.coche-btn');
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmTitle = document.getElementById('confirmTitle');
const cancelConfirm = document.getElementById('cancelConfirm');
const acceptConfirm = document.getElementById('acceptConfirm');
const VIEW_KEY = 'mapaCochesViewport';

document.addEventListener('DOMContentLoaded', iniciar);

/* ================= INICIO ================= */

async function iniciar() {
  iniciarMapa();
  configurarBotonesCoche();
  configurarEditar();
  configurarUbicacion();
  configurarConfirmacion();
  actualizarEstado();
  await cargarCoches();
  await actualizarEstadoReservas();
  activarRealtime();
  setInterval(actualizarEstadoReservas, 30000);
}

/* ================= MAPA ================= */

function iniciarMapa() {
  mapa = L.map('map', {
    zoomControl: true,
    attributionControl: true,
    dragging: true,
    touchZoom: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
    tap: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:20,
    minZoom:3,
    attribution:'&copy; OpenStreetMap contributors'
  }).addTo(mapa);

  const guardada = leerViewport();
  if (guardada) mapa.setView([guardada.lat, guardada.lng], guardada.zoom);
  else mapa.setView([39.889, -0.084], 14);

  mapa.on('moveend zoomend', guardarViewport);
  mapa.on('click', gestionarClickMapa);
}

function guardarViewport() {
  if (!mapa) return;
  const centro = mapa.getCenter();
  localStorage.setItem(VIEW_KEY, JSON.stringify({
    lat: centro.lat,
    lng: centro.lng,
    zoom: mapa.getZoom()
  }));
}

function leerViewport() {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY));
    if (v && Number.isFinite(v.lat) && Number.isFinite(v.lng) && Number.isFinite(v.zoom)) return v;
  } catch (_) {}
  return null;
}


/* ================= EDITAR ================= */

function configurarEditar() {
  editarBtn.addEventListener('click', () => {
    editando = !editando;
    editarBtn.classList.toggle('activo', editando);
    editarBtn.setAttribute('aria-pressed', String(editando));
    editarBtn.textContent = editando ? 'Terminar' : 'Editar';
    ayudaEdicion.textContent = editando
      ? 'Editando: solo podrás mover el coche seleccionado.'
      : 'Activa Editar para poder cambiar una posición.';
    actualizarDraggable();
    actualizarEstado();
  });
}

function actualizarDraggable() {
  Object.entries(marcadores).forEach(([coche, marcador]) => {
    if (editando && coche === cocheSeleccionado) marcador.dragging.enable();
    else marcador.dragging.disable();
  });
}


/* ================= CONFIGURAR BOTONES SELECCION COCHES ================= */

function configurarBotonesCoche() {
  botonesCoche.forEach(boton => {
    boton.addEventListener('click', () => {
      cocheSeleccionado = boton.dataset.coche;
      botonesCoche.forEach(otro => otro.classList.remove('activo'));
      boton.classList.add('activo');
      actualizarDraggable();
      actualizarEstado();
      moverACocheSeleccionado();

    });
  });
}

function actualizarEstado() {
  const coche = COCHES[cocheSeleccionado];
  if (!coche) return;
  estadoTexto.textContent = editando
    ? `${coche.nombre} seleccionado · arrástralo para moverlo`
    : `${coche.nombre} seleccionado · activa Editar para cambiar su posición`;
}

function moverACocheSeleccionado() {
    const marcador = marcadores[cocheSeleccionado];

    if (marcador) {
        mapa.flyTo(marcador.getLatLng(), 16, {
            duration: 1.2
        });
    }
}


/* ================= CARGAR UBICACIONES COCHES ================= */

async function cargarCoches() {
  const { data, error } = await supabaseClient.from('ubicaciones_coches').select('*');
  if (error) {
    console.error(error);
    mostrarMensaje('No se han podido cargar las posiciones');
    return;
  }
  data.forEach(colocarMarcador);
  actualizarDraggable();
  ajustarMapaACoches();
}


/* ================= GESTIONAR CLICK EN EL MAPA ================= */

function gestionarClickMapa(event) {
  // El mapa sigue siendo completamente libre. Un toque sobre el mapa solo mueve
  // un coche si Editar está activo y hay un coche seleccionado.
  if (!editando) return;
  pedirConfirmacion(cocheSeleccionado, event.latlng.lat, event.latlng.lng, null);
}


/* ================= MARCADORES ================= */

function colocarMarcador(ubicacion) {
  const coche = COCHES[ubicacion.coche];
  if (!coche) return;

  if (marcadores[ubicacion.coche]) {
    // Si el usuario está arrastrando ese marcador, no lo recolocamos desde Realtime.
    if (!marcadores[ubicacion.coche].isDragging || !marcadores[ubicacion.coche].isDragging()) {
      marcadores[ubicacion.coche].setLatLng([ubicacion.lat, ubicacion.lng]);
    }
    actualizarPopup(marcadores[ubicacion.coche], ubicacion);
    return;
  }

  const marcador = L.marker([ubicacion.lat, ubicacion.lng], {
    icon: crearIconoCoche(coche),
    draggable: false,
    autoPan: false
  }).addTo(mapa);

  posicionesOriginales[ubicacion.coche] = { lat:ubicacion.lat, lng:ubicacion.lng };
  actualizarPopup(marcador, ubicacion);

  marcador.on('dragstart', () => {
    if (!editando || cocheSeleccionado !== ubicacion.coche) {
      restaurarPosicion(ubicacion.coche);
      return;
    }
    posicionesOriginales[ubicacion.coche] = {
      lat: marcador.getLatLng().lat,
      lng: marcador.getLatLng().lng
    };
  });

  marcador.on('dragend', () => {
    if (!editando || cocheSeleccionado !== ubicacion.coche) {
      restaurarPosicion(ubicacion.coche);
      return;
    }
    const nueva = marcador.getLatLng();
    pedirConfirmacion(ubicacion.coche, nueva.lat, nueva.lng, marcador);
  });

  marcadores[ubicacion.coche] = marcador;
}

function crearIconoCoche(coche) {
  return L.divIcon({
    className:'icono-coche-wrapper',
    html:`<div class="coche-marker marker-${coche.clase}"><div class="coche-marker-inner">${coche.nombre}</div></div>`,
    iconSize:[48,48],
    iconAnchor:[10,43],
    popupAnchor:[14,-39]
  });
}

function actualizarPopup(marcador, ubicacion) {
  const coche = COCHES[ubicacion.coche];
  const fecha = ubicacion.updated_at
    ? new Date(ubicacion.updated_at).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    : 'Sin información';
  marcador.bindPopup(`
    <div class="popup">
      <div class="popup-ubicacion">
        <a href="https://www.google.com/maps/search/?api=1&query=${ubicacion.lat},${ubicacion.lng}" target="_blank" rel="noopener noreferrer">¿Cómo llegar al ${coche.nombre}?</a>
      </div>
      <div class="popup-info"><br>Actualizado: ${fecha}</div>
      <div class="popup-ayuda">${editando && cocheSeleccionado === coche.nombre ? 'Arrástralo para cambiar su ubicación.' : 'Activa Editar y selecciona este coche para moverlo.'}</div>
    </div>`);
}

/* ================= POPUP CONFIRMACION MOVER COCHE ================= */

function pedirConfirmacion(coche, lat, lng, marcador) {
  if (!editando || coche !== cocheSeleccionado) {
    if (marcador) restaurarPosicion(coche);
    return;
  }
  posicionPendiente = { coche, lat, lng, marcador };
  confirmTitle.textContent = `¿Seguro que quieres mover aquí el coche ${coche}?`;
  confirmOverlay.classList.remove('hidden');
  confirmOverlay.setAttribute('aria-hidden', 'false');
}

function configurarConfirmacion() {
  cancelConfirm.addEventListener('click', cancelarMovimiento);
  acceptConfirm.addEventListener('click', confirmarMovimiento);
  confirmOverlay.addEventListener('click', event => {
    if (event.target === confirmOverlay) cancelarMovimiento();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !confirmOverlay.classList.contains('hidden')) cancelarMovimiento();
  });
}

function cancelarMovimiento() {
  if (posicionPendiente?.marcador) restaurarPosicion(posicionPendiente.coche);
  posicionPendiente = null;
  confirmOverlay.classList.add('hidden');
  confirmOverlay.setAttribute('aria-hidden', 'true');
}

async function confirmarMovimiento() {
  if (!posicionPendiente) return;
  const pendiente = posicionPendiente;
  posicionPendiente = null;
  confirmOverlay.classList.add('hidden');
  confirmOverlay.setAttribute('aria-hidden', 'true');
  await guardarPosicion(pendiente.coche, pendiente.lat, pendiente.lng);
}

function restaurarPosicion(coche) {
  const original = posicionesOriginales[coche];
  const marcador = marcadores[coche];
  if (original && marcador) marcador.setLatLng([original.lat, original.lng]);
}


/* ================= GUARDAR POSICION ================= */

async function guardarPosicion(coche, lat, lng) {
  const { data, error } = await supabaseClient.from('ubicaciones_coches').upsert({
    coche, lat, lng, updated_at:new Date().toISOString()
  }, { onConflict:'coche' }).select().single();

  if (error) {
    console.error(error);
    restaurarPosicion(coche);
    mostrarMensaje('No se ha podido guardar la posición');
    return;
  }
  posicionesOriginales[coche] = { lat:data.lat, lng:data.lng };
  colocarMarcador(data);
  actualizarDraggable();
  mostrarMensaje(`${coche} se ha movido correctamente`);
}


/* ================= RESERVAS DE COCHES, LECTURA DE BASE DE DATOS ================= */

async function actualizarEstadoReservas() {
  const hoy = fechaLocal(new Date());
  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  const { data, error } = await supabaseClient.from('reservas')
    .select('vehicle, start_time, end_time, all_day').eq('date', hoy);
  if (error) return;

  const enUso = { C3:false, C4:false, Laguna:false };
  data.forEach(reserva => {
    const vehiculo = reserva.vehicle;
    if (!Object.prototype.hasOwnProperty.call(enUso, vehiculo)) return;
    if (reserva.all_day) { enUso[vehiculo] = true; return; }
    const inicio = minutosHora(reserva.start_time);
    const fin = minutosHora(reserva.end_time);
    if (inicio !== null && fin !== null && minutosActuales >= inicio && minutosActuales <= fin) enUso[vehiculo] = true;
  });

  botonesCoche.forEach(boton => {
    const coche = boton.dataset.coche;
    const small = boton.querySelector('.coche-estado');
    boton.classList.toggle('en-uso', enUso[coche]);
    small.textContent = enUso[coche] ? 'En uso' : COCHES[coche].color;
  });
}

function minutosHora(hora) {
  if (!hora) return null;
  const partes = String(hora).slice(0,5).split(':');
  if (partes.length !== 2) return null;
  return Number(partes[0]) * 60 + Number(partes[1]);
}

function fechaLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}


/* ================= REALTIME ================= */

function activarRealtime() {
  supabaseClient.channel('mapa-ubicaciones')
    .on('postgres_changes', { event:'*', schema:'public', table:'ubicaciones_coches' }, payload => {
      if (payload.eventType === 'DELETE') {
        const coche = payload.old?.coche;
        if (coche && marcadores[coche]) {
          mapa.removeLayer(marcadores[coche]);
          delete marcadores[coche];
        }
        return;
      }
      if (payload.new) {
        colocarMarcador(payload.new);
        posicionesOriginales[payload.new.coche] = { lat:payload.new.lat, lng:payload.new.lng };
        actualizarDraggable();
      }
    }).subscribe();

  supabaseClient.channel('mapa-reservas')
    .on('postgres_changes', { event:'*', schema:'public', table:'reservas' }, actualizarEstadoReservas)
    .subscribe();
}

function configurarUbicacion() {
  document.getElementById('miUbicacion').addEventListener('click', () => {
    if (!navigator.geolocation) return mostrarMensaje('Tu dispositivo no permite localizarte');
    navigator.geolocation.getCurrentPosition(
      posicion => mapa.setView([posicion.coords.latitude, posicion.coords.longitude], 17),
      () => mostrarMensaje('No se ha podido obtener tu ubicación'),
      { enableHighAccuracy:true, timeout:10000, maximumAge:60000 }
    );
  });
}



function ajustarMapaACoches() {
    const posiciones = Object.values(marcadores);
    if (!posiciones.length) return;
    if (posiciones.length === 1) {
        mapa.setView(posiciones[0].getLatLng(), 16);

        return;
    }
    const bounds = L.latLngBounds([]);
    posiciones.forEach(marcador => bounds.extend(marcador.getLatLng()));
    mapa.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
}



/* ================= MENSAJITO ================= */

function mostrarMensaje(texto) {
  const elemento = document.getElementById('mensaje');
  elemento.textContent = texto;
  elemento.classList.add('visible');
  clearTimeout(mensajeTimeout);
  mensajeTimeout = setTimeout(() => elemento.classList.remove('visible'), 2500);
}
