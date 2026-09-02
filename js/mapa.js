/* ============================================================
   CONFIGURACIÓN SUPABASE
   ============================================================ */

const SUPABASE_URL = 'https://wtcvawprxmblnuiauixp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Y3Zhd3ByeG1ibG51aWF1aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzA0MzgsImV4cCI6MjEwMzg0NjQzOH0.-tyDzGCQ6k1pJ5Kg-UX0rq9K7uQ_PV4FR2_0lgdRvr8';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* ============================================================
   CONFIGURACIÓN DE COCHES
   ============================================================ */

const COCHES = {
    C3: {
        nombre: "C3",
        clase: "c3"
    },

    C4: {
        nombre: "C4",
        clase: "c4"
    },

    Laguna: {
        nombre: "Laguna",
        clase: "laguna"
    }
};


/* ============================================================
   VARIABLES
   ============================================================ */

let mapa;
let cocheSeleccionado = "C3";
let marcadores = {};

let mensajeTimeout;


/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener("DOMContentLoaded", iniciar);


async function iniciar() {

    iniciarMapa();

    configurarBotones();

    await cargarCoches();

    escucharCambios();
}


/* ============================================================
   MAPA
   ============================================================ */

function iniciarMapa() {

    mapa = L.map("map");

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 20,
            attribution: '&copy; OpenStreetMap contributors'
        }
    ).addTo(mapa);

    intentarUbicacionUsuario();
}


/* ============================================================
   LOCALIZACIÓN INICIAL
   ============================================================ */

function intentarUbicacionUsuario() {

    if (!navigator.geolocation) {

        mapa.setView([39.95, -0.07], 12);

        return;
    }

    navigator.geolocation.getCurrentPosition(

        posicion => {

            const lat = posicion.coords.latitude;
            const lng = posicion.coords.longitude;

            mapa.setView([lat, lng], 16);
        },

        () => {

            mapa.setView([39.95, -0.07], 12);
        },

        {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 60000
        }
    );
}


/* ============================================================
   BOTONES DE COCHES
   ============================================================ */

function configurarBotones() {

    const botones = document.querySelectorAll(".coche-btn");

    botones.forEach(boton => {

        boton.addEventListener("click", () => {

            cocheSeleccionado = boton.dataset.coche;

            botones.forEach(b => {
                b.classList.remove("activo");
            });

            boton.classList.add("activo");

            document.getElementById("estado").innerHTML =
                `Coche seleccionado: <strong>${cocheSeleccionado}</strong>`;
        });
    });
}


/* ============================================================
   CARGAR POSICIONES
   ============================================================ */

async function cargarCoches() {

    const { data, error } = await supabaseClient
        .from("ubicaciones_coches")
        .select("*");

    if (error) {

        console.error(error);

        mostrarMensaje(
            "No se han podido cargar las posiciones"
        );

        return;
    }

    data.forEach(ubicacion => {

        colocarMarcador(ubicacion);
    });
}


/* ============================================================
   COLOCAR / ACTUALIZAR MARCADOR
   ============================================================ */

function colocarMarcador(ubicacion) {

    const coche = COCHES[ubicacion.coche];

    if (!coche) {
        return;
    }

    if (marcadores[ubicacion.coche]) {

        marcadores[ubicacion.coche].setLatLng([
            ubicacion.lat,
            ubicacion.lng
        ]);

        actualizarPopup(
            marcadores[ubicacion.coche],
            ubicacion
        );

        return;
    }

    const icono = L.divIcon({

        className: "",

        html: `
            <div class="pin-coche pin-${coche.clase}"></div>
        `,

        iconSize: [32, 42],

        iconAnchor: [16, 42],

        popupAnchor: [0, -40]
    });

    const marcador = L.marker(
        [ubicacion.lat, ubicacion.lng],
        {
            icon: icono,
            draggable: true
        }
    );

    marcador.addTo(mapa);

    actualizarPopup(marcador, ubicacion);

    marcador.on("dragend", async event => {

        const posicion = event.target.getLatLng();

        await actualizarPosicion(
            ubicacion.coche,
            posicion.lat,
            posicion.lng
        );
    });

    marcadores[ubicacion.coche] = marcador;
}


/* ============================================================
   POPUP
   ============================================================ */

function actualizarPopup(marcador, ubicacion) {

    const fecha = ubicacion.updated_at
        ? new Date(ubicacion.updated_at).toLocaleString("es-ES")
        : "Sin información";

    marcador.bindPopup(`
        <div class="popup-coche">

            <strong>${ubicacion.coche}</strong>

            <div class="popup-fecha">
                Actualizado:<br>
                ${fecha}
            </div>

            <div class="popup-mover">
                Puedes mantener pulsada la chincheta
                y moverla.
            </div>

        </div>
    `);
}


/* ============================================================
   CLIC EN EL MAPA
   ============================================================ */

mapaClickListener();


function mapaClickListener() {

    mapa.on("click", async event => {

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        await guardarPosicion(
            cocheSeleccionado,
            lat,
            lng
        );
    });
}


/* ============================================================
   GUARDAR POSICIÓN
   ============================================================ */

async function guardarPosicion(coche, lat, lng) {

    const { data, error } = await supabaseClient
        .from("ubicaciones_coches")
        .upsert(
            {
                coche: coche,
                lat: lat,
                lng: lng,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "coche"
            }
        )
        .select()
        .single();

    if (error) {

        console.error(error);

        mostrarMensaje(
            "Error al guardar la posición"
        );

        return;
    }

    colocarMarcador(data);

    mostrarMensaje(
        `${coche} colocado en el mapa`
    );
}


/* ============================================================
   MOVER POSICIÓN
   ============================================================ */

async function actualizarPosicion(coche, lat, lng) {

    const { data, error } = await supabaseClient
        .from("ubicaciones_coches")
        .update({
            lat: lat,
            lng: lng,
            updated_at: new Date().toISOString()
        })
        .eq("coche", coche)
        .select()
        .single();

    if (error) {

        console.error(error);

        mostrarMensaje(
            "No se ha podido actualizar"
        );

        return;
    }

    actualizarPopup(
        marcadores[coche],
        data
    );

    mostrarMensaje(
        `${coche} actualizado`
    );
}


/* ============================================================
   ACTUALIZACIÓN EN TIEMPO REAL
   ============================================================ */

function escucharCambios() {

    supabaseClient
        .channel("ubicaciones-coches")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "ubicaciones_coches"
            },
            payload => {

                if (payload.eventType === "DELETE") {

                    const coche =
                        payload.old.coche;

                    if (marcadores[coche]) {

                        mapa.removeLayer(
                            marcadores[coche]
                        );

                        delete marcadores[coche];
                    }

                    return;
                }

                if (payload.new) {

                    colocarMarcador(
                        payload.new
                    );
                }
            }
        )
        .subscribe();
}


/* ============================================================
   MENSAJES
   ============================================================ */

function mostrarMensaje(texto) {

    const elemento =
        document.getElementById("mensaje");

    elemento.textContent = texto;

    elemento.classList.add("visible");

    clearTimeout(mensajeTimeout);

    mensajeTimeout = setTimeout(() => {

        elemento.classList.remove("visible");

    }, 2500);
}