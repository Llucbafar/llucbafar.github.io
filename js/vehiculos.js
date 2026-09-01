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


/*
 * Vehículos físicos disponibles.
 *
 * "Any" NO se incluye aquí porque no es un vehículo real.
 * Es solamente una opción para que el sistema elija uno.
 */

const REAL_VEHICLES = [
    "C3",
    "C4",
    "Laguna"
];


const STORAGE_KEY =
    "llucbafar_vehicle_reservations";


/* ---------------------------------------------------------
   ESTADO
   --------------------------------------------------------- */

const today = new Date();

let currentMonth =
    new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

let selectedDate =
    formatDate(today);

let reservations =
    loadReservations();

let reservationToDelete =
    null;


/* ---------------------------------------------------------
   ELEMENTOS DOM
   --------------------------------------------------------- */

const monthTitle =
    document.getElementById(
        "monthTitle"
    );


const calendar =
    document.getElementById(
        "calendar"
    );


const selectedDateTitle =
    document.getElementById(
        "selectedDateTitle"
    );


const reservationsList =
    document.getElementById(
        "reservationsList"
    );


const previousMonthButton =
    document.getElementById(
        "previousMonth"
    );


const nextMonthButton =
    document.getElementById(
        "nextMonth"
    );


const todayButton =
    document.getElementById(
        "todayButton"
    );


const addReservationButton =
    document.getElementById(
        "addReservationButton"
    );


const reservationModal =
    document.getElementById(
        "reservationModal"
    );


const closeModalButton =
    document.getElementById(
        "closeModalButton"
    );


const modalOverlay =
    document.getElementById(
        "modalOverlay"
    );


const modalDateTitle =
    document.getElementById(
        "modalDateTitle"
    );


const reservationForm =
    document.getElementById(
        "reservationForm"
    );


const formError =
    document.getElementById(
        "formError"
    );


const deleteModal =
    document.getElementById(
        "deleteModal"
    );


const cancelDelete =
    document.getElementById(
        "cancelDelete"
    );


const confirmDelete =
    document.getElementById(
        "confirmDelete"
    );


/*
 * Nuevo control:
 * Reservar todo el día.
 */

const allDay =
    document.getElementById(
        "allDay"
    );


const startTimeInput =
    document.getElementById(
        "startTime"
    );


const endTimeInput =
    document.getElementById(
        "endTime"
    );


/* ---------------------------------------------------------
   INICIO
   --------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCalendar();

        renderSelectedDay();

    }
);


/* ---------------------------------------------------------
   CALENDARIO
   --------------------------------------------------------- */

function renderCalendar() {

    calendar.innerHTML = "";

    const year =
        currentMonth.getFullYear();

    const month =
        currentMonth.getMonth();


    const monthName =
        currentMonth.toLocaleDateString(
            "es-ES",
            {
                month: "long",
                year: "numeric"
            }
        );


    monthTitle.textContent =
        capitalize(monthName);


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    /*
     * JavaScript empieza la semana
     * en domingo.
     *
     * Lo convertimos para que
     * lunes sea 0.
     */

    let startingDay =
        firstDay.getDay();

    startingDay =
        startingDay === 0
            ? 6
            : startingDay - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    /* Espacios antes del primer día */

    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        const emptyDay =
            document.createElement(
                "div"
            );

        emptyDay.className =
            "calendar-day empty";

        calendar.appendChild(
            emptyDay
        );

    }


    /* Días del mes */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const dateString =
            formatDate(date);


        const button =
            document.createElement(
                "button"
            );


        button.className =
            "calendar-day";


        button.textContent =
            day;


        /* Hoy */

        if (
            dateString ===
            formatDate(today)
        ) {

            button.classList.add(
                "today"
            );

        }


        /* Día seleccionado */

        if (
            dateString ===
            selectedDate
        ) {

            button.classList.add(
                "selected"
            );

        }


        /*
         * Obtener los vehículos
         * reservados ese día.
         */

        const reservedVehicles =
            getReservedVehicles(
                dateString
            );


        reservedVehicles.forEach(
            vehicle => {

                if (
                    vehicle === "C3"
                ) {

                    button.classList.add(
                        "reserved-c3"
                    );

                }


                if (
                    vehicle === "C4"
                ) {

                    button.classList.add(
                        "reserved-c4"
                    );

                }


                if (
                    vehicle === "Laguna"
                ) {

                    button.classList.add(
                        "reserved-laguna"
                    );

                }

            }
        );


        /*
         * Seleccionar día.
         */

        button.addEventListener(
            "click",
            () => {

                selectedDate =
                    dateString;

                renderCalendar();

                renderSelectedDay();

            }
        );


        calendar.appendChild(
            button
        );

    }

}


/* ---------------------------------------------------------
   DÍA SELECCIONADO
   --------------------------------------------------------- */

function renderSelectedDay() {

    const date =
        parseDate(
            selectedDate
        );


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
   RESERVAS DEL DÍA
   --------------------------------------------------------- */

function renderReservations() {

    reservationsList.innerHTML =
        "";


    const dayReservations =
        reservations
            .filter(
                reservation =>
                    reservation.date ===
                    selectedDate
            )
            .sort(
                (a, b) =>
                    a.startTime.localeCompare(
                        b.startTime
                    )
            );


    if (
        dayReservations.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-message";


        empty.innerHTML = `
            No hay reservas para este día.<br>
            Pulsa <strong>+</strong> para reservar un vehículo.
        `;


        reservationsList.appendChild(
            empty
        );


        return;

    }


    dayReservations.forEach(
        reservation => {

            const vehicle =
                VEHICLES[
                    reservation.vehicle
                ];


            /*
             * Por seguridad, si existiese
             * una reserva antigua con un
             * vehículo desconocido,
             * no romper la interfaz.
             */

            if (!vehicle) {
                return;
            }


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                `reservation ${vehicle.colorClass}`;


            element.innerHTML = `

                <div class="vehicle-color"></div>

                <div class="reservation-content">

                    <div class="reservation-top">

                        <span class="reservation-vehicle">
                            ${escapeHtml(
                                reservation.vehicle
                            )}
                        </span>

                    </div>


                    <div class="reservation-person">
                        ${escapeHtml(
                            reservation.person
                        )}
                    </div>


                    <div class="reservation-time">
                        ${escapeHtml(
                            reservation.startTime
                        )}
                        –
                        ${escapeHtml(
                            reservation.endTime
                        )}
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


            reservationsList.appendChild(
                element
            );

        }
    );

}


/* ---------------------------------------------------------
   MODAL NUEVA RESERVA
   --------------------------------------------------------- */

function openReservationModal() {

    reservationForm.reset();


    formError.textContent =
        "";


    /*
     * Restablecer el modo
     * "Reservar todo el día".
     */

    if (allDay) {

        allDay.checked =
            false;

    }


    if (startTimeInput) {

        startTimeInput.disabled =
            false;

    }


    if (endTimeInput) {

        endTimeInput.disabled =
            false;

    }


    modalDateTitle.textContent =
        parseDate(
            selectedDate
        ).toLocaleDateString(
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


/* ---------------------------------------------------------
   CERRAR MODAL
   --------------------------------------------------------- */

function closeReservationModal() {

    reservationModal.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";

}


/* ---------------------------------------------------------
   RESERVAR TODO EL DÍA
   --------------------------------------------------------- */

if (allDay) {

    allDay.addEventListener(
        "change",
        () => {

            if (
                allDay.checked
            ) {

                /*
                 * Todo el día:
                 *
                 * 00:00 hasta 23:59
                 */

                startTimeInput.value =
                    "00:00";

                endTimeInput.value =
                    "23:59";


                /*
                 * Desactivamos los
                 * campos para evitar
                 * cambios accidentales.
                 */

                startTimeInput.disabled =
                    true;

                endTimeInput.disabled =
                    true;

            } else {

                /*
                 * Volver al modo
                 * horario manual.
                 */

                startTimeInput.disabled =
                    false;

                endTimeInput.disabled =
                    false;


                startTimeInput.value =
                    "";

                endTimeInput.value =
                    "";

            }

        }
    );

}


/* ---------------------------------------------------------
   CREAR RESERVA
   --------------------------------------------------------- */

function createReservation(event) {

    event.preventDefault();


    formError.textContent =
        "";


    const person =
        document.getElementById(
            "person"
        ).value;


    const vehicleElement =
        document.querySelector(
            'input[name="vehicle"]:checked'
        );


    let startTime =
        startTimeInput.value;


    let endTime =
        endTimeInput.value;


    /* -----------------------------------------------------
       COMPROBACIONES BÁSICAS
       ----------------------------------------------------- */

    if (
        !person ||
        !vehicleElement
    ) {

        formError.textContent =
            "Completa todos los campos.";

        return;

    }


    /*
     * Si está activado "Reservar todo
     * el día", forzamos las horas.
     */

    if (
        allDay &&
        allDay.checked
    ) {

        startTime =
            "00:00";

        endTime =
            "23:59";

    }


    /*
     * Comprobamos que haya horas.
     */

    if (
        !startTime ||
        !endTime
    ) {

        formError.textContent =
            "Indica la hora de inicio y la hora de finalización.";

        return;

    }


    /*
     * La hora de finalización debe
     * ser posterior a la inicial.
     */

    if (
        startTime >= endTime
    ) {

        formError.textContent =
            "La hora de finalización debe ser posterior a la hora de inicio.";

        return;

    }


    /*
     * Valor seleccionado:
     *
     * C3
     * C4
     * Laguna
     * Any
     */

    const selectedVehicle =
        vehicleElement.value;


    /* -----------------------------------------------------
       CUALQUIER COCHE
       ----------------------------------------------------- */

    let vehicle =
        selectedVehicle;


    if (
        selectedVehicle === "Any"
    ) {

        /*
         * Buscar un vehículo libre.
         *
         * Se prueban en este orden:
         *
         * C3
         * C4
         * Laguna
         */

        const availableVehicle =
            REAL_VEHICLES.find(
                possibleVehicle =>
                    !hasConflict(
                        possibleVehicle,
                        startTime,
                        endTime
                    )
            );


        /*
         * Los tres están ocupados.
         */

        if (
            !availableVehicle
        ) {

            formError.textContent =
                "No hay ningún coche disponible durante ese horario.";

            return;

        }


        /*
         * Convertimos "Any" en el
         * vehículo real seleccionado.
         */

        vehicle =
            availableVehicle;

    }


    /* -----------------------------------------------------
       COMPROBAR CONFLICTO
       ----------------------------------------------------- */

    const conflict =
        hasConflict(
            vehicle,
            startTime,
            endTime
        );


    if (conflict) {

        formError.textContent =
            `El ${vehicle} ya está reservado durante ese horario.`;

        return;

    }


    /* -----------------------------------------------------
       CREAR RESERVA
       ----------------------------------------------------- */

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
   COMPROBAR CONFLICTO
   --------------------------------------------------------- */

function hasConflict(
    vehicle,
    startTime,
    endTime
) {

    return reservations.some(
        reservation => {

            /*
             * Solo nos interesan las
             * reservas del día seleccionado.
             */

            if (
                reservation.date !==
                selectedDate
            ) {

                return false;

            }


            /*
             * Solo nos interesan las
             * reservas del mismo vehículo.
             */

            if (
                reservation.vehicle !==
                vehicle
            ) {

                return false;

            }


            /*
             * Comprobar solapamiento.
             *
             * Ejemplo:
             *
             * Reserva existente:
             * 10:00 – 14:00
             *
             * Nueva:
             * 12:00 – 16:00
             *
             * Hay conflicto.
             */

            return (
                startTime <
                reservation.endTime
            ) &&
            (
                endTime >
                reservation.startTime
            );

        }
    );

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

    if (
        !reservationToDelete
    ) {

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
   BOTONES DEL MODAL
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

        if (
            event.key !==
            "Escape"
        ) {

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
            JSON.parse(
                saved
            );


        return Array.isArray(
            parsed
        )
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
        JSON.stringify(
            reservations
        )
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
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function parseDate(
    dateString
) {

    const [
        year,
        month,
        day
    ] =
        dateString
            .split("-")
            .map(Number);


    return new Date(
        year,
        month - 1,
        day
    );

}


/* ---------------------------------------------------------
   VEHÍCULOS RESERVADOS EN UN DÍA
   --------------------------------------------------------- */

function getReservedVehicles(
    dateString
) {

    return [
        ...new Set(

            reservations
                .filter(
                    reservation =>
                        reservation.date ===
                        dateString
                )
                .map(
                    reservation =>
                        reservation.vehicle
                )

        )
    ];

}


/* ---------------------------------------------------------
   CAPITALIZAR
   --------------------------------------------------------- */

function capitalize(text) {

    return (
        text.charAt(0).toUpperCase()
        +
        text.slice(1)
    );

}


/* ---------------------------------------------------------
   SEGURIDAD HTML
   --------------------------------------------------------- */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}