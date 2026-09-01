/* =========================================================
   CONTROL DE VEHÍCULOS
   ========================================================= */


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

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
        colorClass: "reservation-c3"
    },

    C4: {
        name: "C4",
        colorClass: "reservation-c4"
    },

    Laguna: {
        name: "Laguna",
        colorClass: "reservation-laguna"
    }

};


const STORAGE_KEY =
    "llucbafar_vehicle_reservations";


/* =========================================================
   ESTADO
   ========================================================= */

const today = new Date();


let currentMonth = new Date(
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


/* =========================================================
   DOM
   ========================================================= */

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


const recurringSection =
    document.getElementById(
        "recurringSection"
    );


const recurringList =
    document.getElementById(
        "recurringList"
    );


const multipleDaysSection =
    document.getElementById(
        "multipleDaysSection"
    );


const bookingPreview =
    document.getElementById(
        "bookingPreview"
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


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderCalendar();

        renderSelectedDay();

        setupEventListeners();

    }
);


/* =========================================================
   EVENTOS
   ========================================================= */

function setupEventListeners() {


    previousMonthButton.addEventListener(
        "click",
        previousMonth
    );


    nextMonthButton.addEventListener(
        "click",
        nextMonth
    );


    todayButton.addEventListener(
        "click",
        goToToday
    );


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
        createReservations
    );


    document
        .getElementById("person")
        .addEventListener(
            "change",
            updateRecurringSchedules
        );


    document
        .querySelectorAll(
            'input[name="repeatType"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateRepeatInterface
                );

            }
        );


    document
        .querySelectorAll(
            "#reservationForm input, #reservationForm select"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateBookingPreview
                );

                input.addEventListener(
                    "input",
                    updateBookingPreview
                );

            }
        );


    cancelDelete.addEventListener(
        "click",
        closeDeleteModal
    );


    confirmDelete.addEventListener(
        "click",
        deleteReservation
    );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeReservationModal();

                closeDeleteModal();

            }

        }
    );

}


/* =========================================================
   CALENDARIO
   ========================================================= */

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


    let startingDay =
        firstDay.getDay();


    /*
     * Convertimos domingo = 0
     * a lunes = 0.
     */

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


        if (
            dateString ===
            formatDate(today)
        ) {

            button.classList.add(
                "today"
            );

        }


        if (
            dateString ===
            selectedDate
        ) {

            button.classList.add(
                "selected"
            );

        }


        if (
            hasReservations(
                dateString
            )
        ) {

            button.classList.add(
                "has-reservations"
            );

        }


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


/* =========================================================
   DÍA
   ========================================================= */

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


/* =========================================================
   RESERVAS DEL DÍA
   ========================================================= */

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


        empty.innerHTML =
            `
            No hay reservas para este día.<br>
            Pulsa <strong>+</strong>
            para reservar un vehículo.
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


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                `reservation
                 ${vehicle.colorClass}`;


            element.innerHTML =
                `

                <div class="vehicle-color"></div>

                <div class="reservation-content">

                    <div class="reservation-vehicle">
                        ${escapeHtml(
                            reservation.vehicle
                        )}
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


            element
                .querySelector(
                    ".delete-reservation"
                )
                .addEventListener(
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


/* =========================================================
   MODAL
   ========================================================= */

function openReservationModal() {

    reservationForm.reset();


    formError.textContent =
        "";


    bookingPreview.classList.add(
        "hidden"
    );


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


    /*
     * Por defecto:
     *
     * Desde = día seleccionado
     * Hasta = día seleccionado
     */

    document.getElementById(
        "rangeStart"
    ).value =
        selectedDate;


    document.getElementById(
        "rangeEnd"
    ).value =
        selectedDate;


    multipleDaysSection.classList.add(
        "hidden"
    );


    recurringSection.classList.add(
        "hidden"
    );


    reservationModal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CERRAR MODAL
   ========================================================= */

function closeReservationModal() {

    reservationModal.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   HORARIOS RECURRENTES
   ========================================================= */

function updateRecurringSchedules() {

    const person =
        document.getElementById(
            "person"
        ).value;


    recurringList.innerHTML =
        "";


    if (!person) {

        recurringSection.classList.add(
            "hidden"
        );

        return;

    }


    const schedules =
        getRecurringSchedules(
            person
        );


    if (
        schedules.length === 0
    ) {

        recurringSection.classList.add(
            "hidden"
        );

        return;

    }


    recurringSection.classList.remove(
        "hidden"
    );


    schedules.forEach(
        schedule => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "recurring-option";


            button.innerHTML =
                `
                <span class="recurring-main">

                    <strong>
                        ${escapeHtml(
                            schedule.vehicle
                        )}
                        ·
                        ${escapeHtml(
                            schedule.startTime
                        )}
                        –
                        ${escapeHtml(
                            schedule.endTime
                        )}
                    </strong>

                    <span>
                        ${vehicleColorName(
                            schedule.vehicle
                        )}
                    </span>

                </span>

                <span class="recurring-count">
                    ${schedule.count}
                    ${schedule.count === 1
                        ? "uso"
                        : "usos"}
                </span>
                `;


            button.addEventListener(
                "click",
                () => {

                    applyRecurringSchedule(
                        schedule
                    );

                }
            );


            recurringList.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   CALCULAR HORARIOS HABITUALES
   ========================================================= */

function getRecurringSchedules(
    person
) {

    const usage = {};


    reservations
        .filter(
            reservation =>
                reservation.person ===
                person
        )
        .forEach(
            reservation => {

                const key =
                    [
                        reservation.vehicle,
                        reservation.startTime,
                        reservation.endTime
                    ].join("|");


                if (!usage[key]) {

                    usage[key] = {

                        vehicle:
                            reservation.vehicle,

                        startTime:
                            reservation.startTime,

                        endTime:
                            reservation.endTime,

                        count:
                            0

                    };

                }


                usage[key].count++;

            }
        );


    return Object.values(
        usage
    )
        .sort(
            (a, b) =>
                b.count - a.count
        );

}


/* =========================================================
   APLICAR HORARIO RECURRENTE
   ========================================================= */

function applyRecurringSchedule(
    schedule
) {

    const vehicleInput =
        document.querySelector(
            `input[name="vehicle"][value="${schedule.vehicle}"]`
        );


    if (vehicleInput) {

        vehicleInput.checked =
            true;

    }


    document.getElementById(
        "startTime"
    ).value =
        schedule.startTime;


    document.getElementById(
        "endTime"
    ).value =
        schedule.endTime;


    updateBookingPreview();

}


/* =========================================================
   REPETICIÓN
   ========================================================= */

function updateRepeatInterface() {

    const repeatType =
        document.querySelector(
            'input[name="repeatType"]:checked'
        ).value;


    if (
        repeatType ===
        "multiple"
    ) {

        multipleDaysSection.classList.remove(
            "hidden"
        );

    } else {

        multipleDaysSection.classList.add(
            "hidden"
        );

    }


    updateBookingPreview();

}


/* =========================================================
   PREVISUALIZACIÓN
   ========================================================= */

function updateBookingPreview() {

    const repeatType =
        document.querySelector(
            'input[name="repeatType"]:checked'
        ).value;


    if (
        repeatType === "single"
    ) {

        bookingPreview.classList.add(
            "hidden"
        );

        return;

    }


    const vehicle =
        document.querySelector(
            'input[name="vehicle"]:checked'
        )?.value;


    const startDate =
        document.getElementById(
            "rangeStart"
        ).value;


    const endDate =
        document.getElementById(
            "rangeEnd"
        ).value;


    const startTime =
        document.getElementById(
            "startTime"
        ).value;


    const endTime =
        document.getElementById(
            "endTime"
        ).value;


    const weekdays =
        getSelectedWeekdays();


    if (
        !vehicle ||
        !startDate ||
        !endDate ||
        !startTime ||
        !endTime ||
        weekdays.length === 0
    ) {

        bookingPreview.classList.add(
            "hidden"
        );

        return;

    }


    if (
        startDate > endDate
    ) {

        bookingPreview.classList.add(
            "hidden"
        );

        return;

    }


    const dates =
        getDatesForWeekdays(
            startDate,
            endDate,
            weekdays
        );


    if (
        dates.length === 0
    ) {

        bookingPreview.classList.add(
            "hidden"
        );

        return;

    }


    const conflicts =
        dates.filter(
            date =>
                hasConflict(
                    date,
                    vehicle,
                    startTime,
                    endTime
                )
        );


    bookingPreview.classList.remove(
        "hidden"
    );


    let html =
        `
        <div class="preview-title">
            Resumen
        </div>

        Se crearán
        <strong>${dates.length}</strong>
        reservas para el
        <strong>${vehicle}</strong>
        de
        <strong>${startTime}</strong>
        a
        <strong