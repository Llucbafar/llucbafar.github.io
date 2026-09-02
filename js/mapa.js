/* 
const SUPABASE_URL = 'https://wtcvawprxmblnuiauixp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Y3Zhd3ByeG1ibG51aWF1aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzA0MzgsImV4cCI6MjEwMzg0NjQzOH0.-tyDzGCQ6k1pJ5Kg-UX0rq9K7uQ_PV4FR2_0lgdRvr8';

*/

/* =========================================================
   CONFIGURACIÓN SUPABASE
   ========================================================= */

const SUPABASE_URL = 'https://wtcvawprxmblnuiauixp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Y3Zhd3ByeG1ibG51aWF1aXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzA0MzgsImV4cCI6MjEwMzg0NjQzOH0.-tyDzGCQ6k1pJ5Kg-UX0rq9K7uQ_PV4FR2_0lgdRvr8';

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   COCHES
   ========================================================= */

const COCHES = {

    C3: {
        nombre: "C3",
        color: "Azul",
        clase: "c3",
        ultimaVezActualizado: null
    },

    C4: {
        nombre: "C4",
        color: "Gris",
        clase: "c4",
        ultimaVezActualizado: null
    },

    Laguna: {
        nombre: "Laguna",
        color: "Verde",
        clase: "laguna",
        ultimaVezActualizado: null
    },

    Vacio: {
        nombre: "Vacio",
        color: "Verde",
        clase: "vacio",
        ultimaVezActualizado: null
    }

};


/* =========================================================
   VARIABLES
   ========================================================= */

let mapa = null;

let cocheSeleccionado = "Vacio";

let marcadores = {};

let mensajeTimeout = null;


/* =========================================================
   INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);


async function iniciar() {

    iniciarMapa();

    configurarBotones();

    configurarBotonUbicacion();

    await cargarCoches();

    activarRealtime();

}


/* =========================================================
   CREAR MAPA
   ========================================================= */

function iniciarMapa() {

    mapa = L.map("map", {

        zoomControl: true,

        attributionControl: true

    });


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 20,

            minZoom: 3,

            attribution:
                '&copy; OpenStreetMap contributors'

        }
    ).addTo(mapa)

    mapa.setView(
        [39.889, -0.084], /* Pos Inicial Burriana*/
        14
    );


    mapa.on(
        "click",
        gestionarClickMapa
    );

    localizarUsuario(false);
}


/* =========================================================
   CLIC EN MAPA
   ========================================================= */

async function gestionarClickMapa(event) {

    const lat =
        event.latlng.lat;

    const lng =
        event.latlng.lng;


    await guardarPosicion(
        cocheSeleccionado,
        lat,
        lng
    );
}


/* =========================================================
   BOTONES DE COCHES
   ========================================================= */

function configurarBotones() {

    const botones =
        document.querySelectorAll(
            ".coche-btn"
        );


    botones.forEach(boton => {

        boton.addEventListener(
            "click",
            () => {

                cocheSeleccionado =
                    boton.dataset.coche;


                botones.forEach(
                    otro => {

                        otro.classList.remove(
                            "activo"
                        );

                    }
                );


                boton.classList.add(
                    "activo"
                );


                actualizarEstado();

            }
        );

    });


    actualizarEstado();
}


/* =========================================================
   ESTADO
   ========================================================= */

function actualizarEstado() {

    const texto =
        document.getElementById(
            "estadoTexto"
        );


    const coche =
        COCHES[cocheSeleccionado];


    texto.textContent =
        `${coche.nombre} seleccionado · toca el mapa para colocarlo`;
}


/* =========================================================
   CARGAR COCHES
   ========================================================= */

async function cargarCoches() {

    const {
        data,
        error
    } = await supabaseClient

        .from("ubicaciones_coches")

        .select("*");


    if (error) {

        console.error(
            "Error cargando coches:",
            error
        );


        mostrarMensaje(
            "No se han podido cargar las posiciones"
        );


        return;
    }


    data.forEach(
        colocarMarcador
    );


    /*
       Si hay coches guardados,
       encuadrarlos todos.
    */

    ajustarMapaACoches();
}


/* =========================================================
   GUARDAR POSICIÓN
   ========================================================= */

async function guardarPosicion(
    coche,
    lat,
    lng
) {

    const {

        data,

        error

    } = await supabaseClient

        .from("ubicaciones_coches")

        .upsert(

            {

                coche: coche,

                lat: lat,

                lng: lng,

                updated_at:
                    new Date().toISOString()

            },

            {

                onConflict: "coche"

            }

        )

        .select()

        .single();


    if (error) {

        console.error(
            "Error guardando posición:",
            error
        );


        mostrarMensaje(
            "No se ha podido guardar la posición"
        );


        return;
    }


    colocarMarcador(data);


    mostrarMensaje(
        `${coche} colocado correctamente`
    );
}


/* =========================================================
   CREAR MARCADOR
   ========================================================= */

function colocarMarcador(
    ubicacion
) {

    const coche =
        COCHES[ubicacion.coche];


    if (!coche) {
        return;
    }

    if (
        marcadores[
            ubicacion.coche
        ]
    ) {

        const marcador =
            marcadores[
                ubicacion.coche
            ];


        marcador.setLatLng([

            ubicacion.lat,

            ubicacion.lng

        ]);


        actualizarPopup(
            marcador,
            ubicacion
        );


        return;
    }

    const icono =
        crearIconoCoche(
            coche
        );


    const marcador =
        L.marker(

            [
                ubicacion.lat,
                ubicacion.lng
            ],

            {

                icon: icono,

                draggable: true,

                autoPan: true

            }

        );


    marcador.addTo(mapa);


    actualizarPopup(
        marcador,
        ubicacion
    );


    /*ARRRASTRAR MARCADOR*/

    marcador.on(
        "dragend",
        async event => {

            const posicion =
                event.target.getLatLng();


            await actualizarPosicion(

                ubicacion.coche,

                posicion.lat,

                posicion.lng

            );

        }
    );


    marcadores[
        ubicacion.coche
    ] = marcador;
}


/* =========================================================
   ICONO
   ========================================================= */

function crearIconoCoche(
    coche
) {

    return L.divIcon({

        className:
            "icono-coche-wrapper",

        html: `

            <div
                class="
                    coche-marker
                    marker-${coche.clase}
                "
            >

                <div
                    class="
                        coche-marker-inner
                    "
                >
                    ${coche.nombre}
                </div>

            </div>

        `,

        iconSize: [
            46,
            46
        ],

        iconAnchor: [
            10,
            42
        ],

        popupAnchor: [
            13,
            -39
        ]

    });
}


/* =========================================================
   POPUP
   ========================================================= */

function actualizarPopup(
    marcador,
    ubicacion
) {

    const coche =
        COCHES[
            ubicacion.coche
        ];


    const fecha =
        ubicacion.updated_at

            ? new Date(
                ubicacion.updated_at
            ).toLocaleString(
                "es-ES",
                {

                    day: "2-digit",

                    month: "2-digit",

                    hour: "2-digit",

                    minute: "2-digit"

                }
            )

            : "Sin información";


    marcador.bindPopup(`

        <div class="popup">

            <div class="popup-nombre">
                ${coche.nombre}
            </div>

            <div class="popup-info">
                ${coche.color}
                <br>
                Actualizado: ${fecha}
            </div>

            <div class="popup-ayuda">
                Puedes arrastrar la chincheta
                para cambiar su ubicación.
            </div>

        </div>

    `);
}


/* =========================================================
   ACTUALIZAR POSICIÓN
   ========================================================= */

async function actualizarPosicion(
    coche,
    lat,
    lng
) {

    const {

        data,

        error

    } = await supabaseClient

        .from("ubicaciones_coches")

        .update({

            lat: lat,

            lng: lng,

            updated_at:
                new Date().toISOString()

        })

        .eq(
            "coche",
            coche
        )

        .select()

        .single();


    if (error) {

        console.error(
            "Error actualizando:",
            error
        );


        mostrarMensaje(
            "No se ha podido actualizar"
        );


        /*
           Si falla, volvemos a cargar
           la posición real.
        */

        await cargarCoches();

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


/* =========================================================
   REALTIME SUPABASE
   ========================================================= */

function activarRealtime() {

    supabaseClient

        .channel(
            "ubicaciones-coches"
        )

        .on(

            "postgres_changes",

            {

                event: "*",

                schema: "public",

                table:
                    "ubicaciones_coches"

            },

            payload => {


                /*
                   BORRADO
                */

                if (
                    payload.eventType ===
                    "DELETE"
                ) {

                    const coche =
                        payload.old.coche;


                    if (
                        marcadores[coche]
                    ) {

                        mapa.removeLayer(
                            marcadores[coche]
                        );


                        delete marcadores[
                            coche
                        ];

                    }


                    return;
                }


                /*
                   INSERT / UPDATE
                */

                if (payload.new) {

                    colocarMarcador(
                        payload.new
                    );

                }

            }

        )

        .subscribe();

}


/* =========================================================
   ENCUADRAR COCHES
   ========================================================= */

function ajustarMapaACoches() {

    const posiciones =
        Object.values(
            marcadores
        );


    if (
        posiciones.length === 0
    ) {

        return;

    }


    if (
        posiciones.length === 1
    ) {

        mapa.setView(
            posiciones[0].getLatLng(),
            16
        );

        return;
    }


    const bounds =
        L.latLngBounds([]);


    posiciones.forEach(
        marcador => {

            bounds.extend(
                marcador.getLatLng()
            );

        }
    );


    mapa.fitBounds(
        bounds,
        {

            padding: [
                60,
                60
            ],

            maxZoom: 16

        }
    );
}


/* =========================================================
   BOTÓN MI UBICACIÓN
   ========================================================= */

function configurarBotonUbicacion() {

    const boton =
        document.getElementById(
            "miUbicacion"
        );


    boton.addEventListener(
        "click",
        () => {

            localizarUsuario(true);

        }
    );
}


/* =========================================================
   GEOLOCALIZACIÓN
   ========================================================= */

function localizarUsuario(
    mostrarError
) {

    if (
        !navigator.geolocation
    ) {

        if (mostrarError) {

            mostrarMensaje(
                "Tu dispositivo no permite localizarte"
            );

        }

        return;
    }


    navigator.geolocation.getCurrentPosition(

        posicion => {

            const lat =
                posicion.coords.latitude;

            const lng =
                posicion.coords.longitude;


            mapa.setView(

                [
                    lat,
                    lng
                ],

                17

            );

        },

        () => {

            if (mostrarError) {

                mostrarMensaje(
                    "No se ha podido obtener tu ubicación"
                );

            }

        },

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000

        }

    );
}


/* =========================================================
   MENSAJES
   ========================================================= */

function mostrarMensaje(
    texto
) {

    const elemento =
        document.getElementById(
            "mensaje"
        );


    elemento.textContent =
        texto;


    elemento.classList.add(
        "visible"
    );


    clearTimeout(
        mensajeTimeout
    );


    mensajeTimeout =
        setTimeout(

            () => {

                elemento.classList.remove(
                    "visible"
                );

            },

            2500

        );
}