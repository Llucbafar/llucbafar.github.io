// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN SUPABASE
// ==========================================
const SUPABASE_URL = 'https://wtcvawprxmblnuiauixp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Y3Zhd3ByeG1ibG51aWF1aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzA0MzgsImV4cCI6MjEwMzg0NjQzOH0.-tyDzGCQ6k1pJ5Kg-UX0rq9K7uQ_PV4FR2_0lgdRvr8';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================
const monthTitle = document.getElementById('monthTitle');
const calendar = document.getElementById('calendar');
const previousMonthBtn = document.getElementById('previousMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayButton = document.getElementById('todayButton');

const selectedDateTitle = document.getElementById('selectedDateTitle');
const reservationsList = document.getElementById('reservationsList');
const addReservationButton = document.getElementById('addReservationButton');

// Modal Reserva
const reservationModal = document.getElementById('reservationModal');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalButton = document.getElementById('closeModalButton');
const modalDateTitle = document.getElementById('modalDateTitle');
const reservationForm = document.getElementById('reservationForm');
const allDayCheckbox = document.getElementById('allDay');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const formError = document.getElementById('formError');

// Modal Eliminar
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Variables de estado local de la UI
let currentDate = new Date();
let selectedDate = new Date();
let reservationToDeleteId = null;

// ==========================================
// 3. FUNCIONES DE BASE DE DATOS (SUPABASE)
// ==========================================

// Cargar reservas de la fecha dada
async function fetchReservations(dateString) {
  const { data, error } = await supabaseClient
    .from('reservas')
    .select('*')
    .eq('date', dateString)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error al obtener reservas:', error.message);
    return [];
  }
  return data;
}

// Insertar una reserva nueva
async function saveReservation(reservationData) {
  const { data, error } = await supabaseClient
    .from('reservas')
    .insert([reservationData])
    .select();

  if (error) {
    console.error('Error al guardar reserva:', error.message);
    return null;
  }
  return data;
}

// Eliminar una reserva por ID
async function deleteReservationFromDB(id) {
  const { error } = await supabaseClient
    .from('reservas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar reserva:', error.message);
    return false;
  }
  return true;
}

// Escuchar cambios en tiempo real
function setupRealtimeListener() {
  supabaseClient
    .channel('public:reservas')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservas' },
      () => {
        // Al ocurrir un cambio en la BD, refrescamos el día actual
        renderDayReservations();
      }
    )
    .subscribe();
}

// ==========================================
// 4. LÓGICA DE LA INTERFAZ (UI) Y CALENDARIO
// ==========================================

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatPrettyDate(date) {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const str = date.toLocaleDateString('es-ES', options);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Renderizar el calendario de un mes
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  monthTitle.textContent = `${monthNames[month]} ${year}`;

  calendar.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Ajustar primer día de la semana (Lunes = 0)
  let startingDay = firstDay.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  // Huecos vacíos antes del día 1
  for (let i = 0; i < startingDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('calendar-day', 'empty');
    calendar.appendChild(emptyCell);
  }

  const today = new Date();

  // Días del mes
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day');
    dayCell.textContent = day;

    const thisDate = new Date(year, month, day);

    if (thisDate.toDateString() === today.toDateString()) {
      dayCell.classList.add('today');
    }
    if (thisDate.toDateString() === selectedDate.toDateString()) {
      dayCell.classList.add('selected');
    }

    dayCell.addEventListener('click', () => {
      selectedDate = thisDate;
      renderCalendar();
      renderDayReservations();
    });

    calendar.appendChild(dayCell);
  }
}

// Renderizar las reservas del día seleccionado cargando desde Supabase
async function renderDayReservations() {
  selectedDateTitle.textContent = formatPrettyDate(selectedDate);
  reservationsList.innerHTML = '<p class="loading">Cargando reservas...</p>';

  const dateStr = formatDate(selectedDate);
  const reservations = await fetchReservations(dateStr);

  reservationsList.innerHTML = '';

  if (reservations.length === 0) {
    reservationsList.innerHTML = '<p class="no-reservations">No hay reservas para este día.</p>';
    return;
  }

  reservations.forEach(res => {
    const card = document.createElement('div');
    card.classList.add('reservation-card', `vehicle-${res.vehicle.toLowerCase()}`);

    const timeText = res.all_day ? 'Todo el día (00:00 – 23:59)' : `${res.start_time.slice(0,5)} – ${res.end_time.slice(0,5)}`;

    card.innerHTML = `
      <div class="reservation-info">
        <h3>${res.person}</h3>
        <p><strong>${res.vehicle}</strong> • ${timeText}</p>
      </div>
      <button class="delete-btn" aria-label="Eliminar reserva">&times;</button>
    `;

    card.querySelector('.delete-btn').addEventListener('click', () => {
      reservationToDeleteId = res.id;
      deleteModal.classList.remove('hidden');
    });

    reservationsList.appendChild(card);
  });
}

// ==========================================
// 5. GESTIÓN DE MODALES Y FORMULARIOS
// ==========================================

function openModal() {
  modalDateTitle.textContent = formatPrettyDate(selectedDate);
  formError.textContent = '';
  reservationForm.reset();
  reservationModal.classList.remove('hidden');
}

function closeModal() {
  reservationModal.classList.add('hidden');
}

allDayCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    startTimeInput.value = '00:00';
    endTimeInput.value = '23:59';
    startTimeInput.disabled = true;
    endTimeInput.disabled = true;
  } else {
    startTimeInput.disabled = false;
    endTimeInput.disabled = false;
  }
});

// Guardar reserva desde el formulario
reservationForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const person = document.getElementById('person').value;
  const vehicleRadio = document.querySelector('input[name="vehicle"]:checked');
  const allDay = allDayCheckbox.checked;
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  if (!person || !vehicleRadio) {
    formError.textContent = 'Por favor, completa todos los campos.';
    return;
  }

  if (!allDay && startTime >= endTime) {
    formError.textContent = 'La hora de inicio debe ser anterior a la de fin.';
    return;
  }

  const newReservation = {
    person,
    vehicle: vehicleRadio.value,
    date: formatDate(selectedDate),
    start_time: startTime,
    end_time: endTime,
    all_day: allDay
  };

  const savedData = await saveReservation(newReservation);

  if (savedData) {
    closeModal();
    renderDayReservations();
  } else {
    formError.textContent = 'Hubo un error al guardar en el servidor.';
  }
});

// Eliminar reserva confirmada
confirmDeleteBtn.addEventListener('click', async () => {
  if (reservationToDeleteId !== null) {
    const deleted = await deleteReservationFromDB(reservationToDeleteId);
    if (deleted) {
      reservationToDeleteId = null;
      deleteModal.classList.add('hidden');
      renderDayReservations();
    }
  }
});

cancelDeleteBtn.addEventListener('click', () => {
  reservationToDeleteId = null;
  deleteModal.classList.add('hidden');
});

// NAVEGACIÓN DE MESES Y BOTÓN HOY
previousMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

todayButton.addEventListener('click', () => {
  currentDate = new Date();
  selectedDate = new Date();
  renderCalendar();
  renderDayReservations();
});

addReservationButton.addEventListener('click', openModal);
closeModalButton.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// ==========================================
// 6. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  renderDayReservations();
  setupRealtimeListener();
});
