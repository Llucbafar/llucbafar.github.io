/* =========================================================
   CONTROL DE VEHÍCULOS
   ========================================================= */


/* ---------------------------------------------------------
   CONFIGURACIÓN
   --------------------------------------------------------- */

const PEOPLE = [
    "Cristina",
    "Raúl",
    "Pau",
    "Lluc",
    "Mar"
];

const VEHICLES = {
    C3: {
        name: "C3",
        color: "blue",
        colorClass: "reservation-c3"
    },

    C4: {
        name: "C4",
        color: "grey",
        colorClass: "reservation-c4"
    },

    Laguna: {
        name: "Laguna",
        color: "dark-green",
        colorClass: "reservation-laguna"
    }
};

const STORAGE_KEY = "llucbafar_vehicle_reservations";


/* ---------------------------------------------------------
   ESTADO
   --------------------------------------------------------- */

const today = new Date();

let currentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
);

let selectedDate = formatDate(today);

let reservations = loadReservations();

let reservationToDelete = null;


/* ---------------------------------------------------------
   ELEMENTOS DOM
   --------------------------------------------------------- */

const monthTitle =
    document.getElementById("monthTitle");

const calendar =
    document.getElementById("calendar");

const selectedDateTitle =
    document.getElementById("selectedDateTitle");

const reservationsList =
    document.getElementById("reservationsList");

const previousMonthButton =
    document.getElementById("previousMonth");

const nextMonthButton =
    document.getElementById("nextMonth");

const todayButton =
    document.getElementById("todayButton");

const addReservationButton =
    document.getElementById("addReservationButton");

const reservationModal =
    document.getElementById("reservationModal");

const closeModalButton =
    document.getElementById("closeModalButton");

const modalOverlay =
    document.getElementById("modalOverlay");

const modalDateTitle =
    document.getElementById("modalDateTitle");

const reservationForm =
    document.getElementById("reservationForm");

const formError =
    document.getElementById("formError");

const deleteModal =
    document.getElementById("deleteModal");

const cancelDelete =
    document.getElementById("cancelDelete");

const confirmDelete =
    document.getElementById("confirmDelete");


/* ---------------------------------------------------------
   INICIO
   --------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    renderCalendar();
    renderSelectedDay();

});


/* ---------------------------------------------------------
   CALENDARIO
   --------------------------------------------------------- */

function renderCalendar() {

    calendar.innerHTML = "";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthName = currentMonth.toLocaleDateString(
        "es-ES",
        {
            month: "long",
            year: "numeric"
        }
    );

    monthTitle.textContent = capitalize(monthName);


    const firstDay = new Date(year, month, 1);

    /*
     * JavaScript empieza la semana en domingo.
     * Lo convertimos para que lunes sea 0.
     */
    let startingDay = firstDay.getDay();

    startingDay =
        startingDay === 0
            ? 6
            : startingDay - 1;


    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    // Espacios antes del primer día
    for (let i = 0; i < startingDay; i++) {

        const emptyDay =
            document.createElement("div");

        emptyDay.className =
            "calendar-day empty";

        calendar.appendChild(emptyDay);
    }


    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {

        const date =
            new Date(year, month, day);

        const dateString =
            formatDate(date);

        const button =
            document.createElement("button");

        button.className =
            "calendar-day";

        button.textContent =
            day;


        // Hoy
        if (dateString === formatDate(today)) {

            button.classList.add("today");

        }


        // Día seleccionado
        if (dateString === selectedDate) {

            button.classList.add("selected");

        }


        // Tiene reservas
        if (hasReservations(dateString)) {

            button.classList.add(
                "has-reservations"
            );

        }


        button.addEventListener(
            "click",
            () => {

                selectedDate = dateString;

                renderCalendar();
                renderSelectedDay();

            }
        );


        calendar.appendChild(button);
    }

}


/* ---------------------------------------------------------
   DÍA SELECCIONADO
   --------------------------------------------------------- */

function renderSelectedDay() {

    const date =
        parseDate(selectedDate);

    selectedDateTitle.textContent =
        date.toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );

    renderReservations();

}


/* ---------------------------------------------------------
   RESERVAS
   --------------------------------------------------------- */

function renderReservations() {

    reservationsList.innerHTML = "";

    const dayReservations =
        reservations
            .filter(
                reservation =>
                    reservation.date === selectedDate
            )
            .sort(
                (a, b) =>
                    a.startTime.localeCompare(
                        b.startTime
                    )
            );


    if (dayReservations.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-message";

        empty.innerHTML = `
            No hay reservas para este día.<br>
            Pulsa <strong>+</strong> para reservar un vehículo.
        `;

        reservationsList.appendChild(empty);

        return;
    }


    dayReservations.forEach(
        reservation => {

            const vehicle =
                VEHICLES[reservation.vehicle];


            const element =
                document.createElement("div");

            element.className =
                `reservation ${vehicle.colorClass}`;


            element.innerHTML = `

                <div class="vehicle-color"></div>

                <div class="reservation-content">

                    <div class="reservation-top">

                        <span class="reservation-vehicle">
                            ${escapeHtml(reservation.vehicle)}
                        </span>

                    </div>

                    <div class="reservation-person">
                        ${escapeHtml(reservation.person)}
                    </div>

                    <div class="reservation-time">
                        ${escapeHtml(reservation.startTime)}
                        –
                        ${escapeHtml(reservation.endTime)}
                    </div>

                </div>

                <button
                    class="delete-reservation"
                    aria-label="Eliminar reserva"
                    data-id="${reservation.id}"
                >
                    ×
                </button>
            `;


            const deleteButton =
                element.querySelector(
                    ".delete-reservation"
                );


            deleteButton.addEventListener(
                "click",
                () => {

                    openDeleteModal(
                        reservation.id
                    );

                }
            );


            reservationsList.appendChild(element);

        }
    );

}


/* ---------------------------------------------------------
   MODAL NUEVA RESERVA
   --------------------------------------------------------- */

function openReservationModal() {

    reservationForm.reset();

    formError.textContent = "";

    modalDateTitle.textContent =
        parseDate(selectedDate).toLocaleDateString(
            "es-ES",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );


    reservationModal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

}


function closeReservationModal() {

    reservationModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


/* ---------------------------------------------------------
   CREAR RESERVA
   --------------------------------------------------------- */

function createReservation(event) {

    event.preventDefault();

    formError.textContent = "";


    const person =
        document.getElementById("person").value;

    const vehicleElement =
        document.querySelector(
            'input[name="vehicle"]:checked'
        );

    const startTime =
        document.getElementById("startTime").value;

    const endTime =
        document.getElementById("endTime").value;


    if (!person || !vehicleElement) {

        formError.textContent =
            "Completa todos los campos.";

        return;

    }


    const vehicle =
        vehicleElement.value;


    if (startTime >= endTime) {

        formError.textContent =
            "La hora de finalización debe ser posterior a la hora de inicio.";

        return;

    }


    /*
     * Comprobar si existe otra reserva
     * del mismo vehículo con solapamiento.
     */
    const conflict =
        reservations.some(
            reservation => {

                if (
                    reservation.date !== selectedDate
                ) {
                    return false;
                }


                if (
                    reservation.vehicle !== vehicle
                ) {
                    return false;
                }


                return (
                    startTime < reservation.endTime &&
                    endTime > reservation.startTime
                );

            }
        );


    if (conflict) {

        formError.textContent =
            `El ${vehicle} ya está reservado durante ese horario.`;

        return;

    }


    const newReservation = {

        id:
            Date.now().toString(),

        date:
            selectedDate,

        person:
            person,

        vehicle:
            vehicle,

        startTime:
            startTime,

        endTime:
            endTime

    };


    reservations.push(
        newReservation
    );


    saveReservations();


    closeReservationModal();

    renderCalendar();

    renderSelectedDay();

}


/* ---------------------------------------------------------
   ELIMINAR RESERVA
   --------------------------------------------------------- */

function openDeleteModal(id) {

    reservationToDelete =
        id;

    deleteModal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeDeleteModal() {

    deleteModal.classList.add(
        "hidden"
    );

    reservationToDelete =
        null;

    document.body.style.overflow =
        "";

}


function deleteReservation() {

    if (!reservationToDelete) {
        return;
    }


    reservations =
        reservations.filter(
            reservation =>
                reservation.id !==
                reservationToDelete
        );


    saveReservations();

    closeDeleteModal();

    renderCalendar();

    renderSelectedDay();

}


/* ---------------------------------------------------------
   NAVEGACIÓN DEL CALENDARIO
   --------------------------------------------------------- */

previousMonthButton.addEventListener(
    "click",
    () => {

        currentMonth =
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            );

        renderCalendar();

    }
);


nextMonthButton.addEventListener(
    "click",
    () => {

        currentMonth =
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            );

        renderCalendar();

    }
);


todayButton.addEventListener(
    "click",
    () => {

        currentMonth =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        selectedDate =
            formatDate(today);

        renderCalendar();

        renderSelectedDay();

    }
);


/* ---------------------------------------------------------
   BOTONES MODAL
   --------------------------------------------------------- */

addReservationButton.addEventListener(
    "click",
    openReservationModal
);


closeModalButton.addEventListener(
    "click",
    closeReservationModal
);


modalOverlay.addEventListener(
    "click",
    closeReservationModal
);


reservationForm.addEventListener(
    "submit",
    createReservation
);


cancelDelete.addEventListener(
    "click",
    closeDeleteModal
);


confirmDelete.addEventListener(
    "click",
    deleteReservation
);


/* ---------------------------------------------------------
   TECLA ESC
   --------------------------------------------------------- */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        closeReservationModal();

        closeDeleteModal();

    }
);


/* ---------------------------------------------------------
   LOCAL STORAGE
   --------------------------------------------------------- */

function loadReservations() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {
            return [];
        }


        const parsed =
            JSON.parse(saved);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Error cargando reservas:",
            error
        );

        return [];

    }

}


function saveReservations() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reservations)
    );

}


/* ---------------------------------------------------------
   UTILIDADES
   --------------------------------------------------------- */

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function parseDate(dateString) {

    const [
        year,
        month,
        day
    ] = dateString.split("-").map(Number);


    return new Date(
        year,
        month - 1,
        day
    );

}


function hasReservations(dateString) {

    return reservations.some(
        reservation =>
            reservation.date ===
            dateString
    );

}


function capitalize(text) {

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}


/*
 * Evita insertar texto introducido
 * por el usuario directamente en HTML.
 */
function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}
