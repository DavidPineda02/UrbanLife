/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — GASTOS ====================================== */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de gastos adicionales.
 * Conecta la vista HTML con el servicio de gastos del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza la tabla de gastos desde el API
 *  - Crear gasto (modal agregar → POST)
 *  - Ver detalle de gasto (modal detalle → GET por ID)
 *  - Búsqueda por descripción o ID en tiempo real (client-side)
 *  - Filtro por método de pago y período (client-side)
 *  - Formateo profesional de montos y fechas
 *
 * Nota: Los gastos son inmutables (sin editar/eliminar) por reglas de contabilidad.
 *
 * Dependencias:
 *  - gastos.service.js    → llamadas al API de gastos
 *  - alerts.js            → SweetAlert2 (éxito/error)
 *  - modal.js             → abrir/cerrar modales
 */

// Importar funciones del servicio de gastos
import {
    obtenerGastos,                                                              // GET todos los gastos
    obtenerGastoPorId,                                                          // GET gasto por ID
    crearGasto,                                                                 // POST nuevo gasto
} from '../api/services/gastos.service.js';

// Importar utilidades
import { mostrarAlertaExito, mostrarAlertaError } from '../../js/utils/alerts.js';
import { openModal, closeModal } from '../../js/utils/modal.js';
// Importar validaciones en tiempo real
import '../utils/realtimeValidations.js';                                      // Validaciones automáticas

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de gastos cargados desde el backend (cache local) */
let gastos = [];

/* -------------------------------------------------------------------------- */
/* ----- Utilidades de Formato ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD usando la zona horaria local.
 * Evita el bug de toISOString() que convierte a UTC y puede dar la fecha de mañana.
 * @returns {string} Fecha local en formato "YYYY-MM-DD"
 */
function obtenerFechaLocal() {
    /* Crear objeto Date con la hora local */
    const hoy = new Date();
    /* Obtener año, mes (0-based) y día en zona horaria local */
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    /* Retornar en formato YYYY-MM-DD */
    return `${anio}-${mes}-${dia}`;
}

/**
 * Formatea un valor numérico como precio en pesos colombianos.
 * @param {number} precio - Valor numérico a formatear
 * @returns {string} Precio formateado (ej: "$ 120.000")
 */
function formatearPrecio(precio) {
    /* Formatear con separador de miles y sin decimales */
    return '$ ' + Math.round(precio).toLocaleString('es-CO');
}

/**
 * Formatea una fecha en formato ISO a formato legible.
 * @param {string} fechaStr - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada (DD/MM/YYYY)
 */
function formatearFecha(fechaStr) {
    /* Validar que fechaStr exista y sea un string */
    if (!fechaStr || typeof fechaStr !== 'string') {
        return 'Fecha no disponible';
    }

    /* Separar la fecha en componentes [año, mes, día] */
    const [anio, mes, dia] = fechaStr.split('-');

    /* Validar que tenga los componentes esperados */
    if (!anio || !mes || !dia) {
        return 'Fecha inválida';
    }

    /* Retornar en formato DD/MM/YYYY */
    return `${dia}/${mes}/${anio}`;
}

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cuerpo de la tabla donde se renderizan las filas de gastos */
let tbody;

/** Input de búsqueda por descripción o ID de gasto */
let inputBusqueda;

/** Select de filtro por método de pago */
let selectMetodo;

/** Select de filtro por período de tiempo */
let selectPeriodo;

/** Botón "Agregar Gasto" para abrir el modal */
let btnAgregar;

/** Contenedor del modal de detalle de gasto */
let modalDetalle;

/** Formulario del modal agregar gasto */
let formAgregar;

/* -------------------------------------------------------------------------- */
/* ----- Cargar Gastos desde el Backend ------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los gastos del backend y los renderiza en la tabla.
 * @returns {Promise<void>}
 */
async function cargarGastos() {
    try {
        /* Petición GET al backend */
        gastos = await obtenerGastos();

        /* Renderizar la tabla con los datos obtenidos */
        renderizarGastos();
    } catch (error) {
        /* Mostrar alerta de error si falla la carga */
        mostrarAlertaError('Error al cargar los gastos');
        /* Log del error para depuración */
        console.error('Error al cargar gastos:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Gastos en la Tabla -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza la tabla de gastos con los datos del array local.
 * Aplica filtros de búsqueda y período si están activos.
 */
function renderizarGastos() {
    /* Obtener valores de los filtros */
    const busqueda = inputBusqueda.value.toLowerCase().trim();
    const metodoFiltro = selectMetodo.value;
    const periodoFiltro = selectPeriodo.value;

    /* Filtrar los gastos según todos los criterios */
    const filtradas = gastos.filter(gasto => {
        /* Verificar si la descripción o el ID coinciden con la búsqueda */
        const coincideBusqueda = busqueda === '' || 
            gasto.descripcion.toLowerCase().includes(busqueda) ||
            gasto.idGastosAdic.toString().includes(busqueda);

        /* Verificar si coincide el filtro de método */
        const coincideMetodo = metodoFiltro === '' || gasto.metodoPago === metodoFiltro;

        /* Verificar si coincide el filtro de período */
        let coincidePeriodo = true;
        if (periodoFiltro !== '') {
            const fechaGasto = new Date(gasto.fechaRegistro);
            const hoy = new Date();
            
            switch (periodoFiltro) {
                case 'today':
                    coincidePeriodo = fechaGasto.toDateString() === hoy.toDateString();
                    break;
                case 'week':
                    const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
                    coincidePeriodo = fechaGasto >= semanaAtras;
                    break;
                case 'month':
                    coincidePeriodo = fechaGasto.getMonth() === hoy.getMonth() && 
                                   fechaGasto.getFullYear() === hoy.getFullYear();
                    break;
                case 'year':
                    coincidePeriodo = fechaGasto.getFullYear() === hoy.getFullYear();
                    break;
            }
        }

        /* Retornar true si cumple todos los filtros */
        return coincideBusqueda && coincideMetodo && coincidePeriodo;
    });

    /* Construir el HTML de todas las filas */
    tbody.innerHTML = filtradas.map(gasto => {
        /* Determinar clase CSS para el badge según método de pago */
        const badgeClase = gasto.metodoPago === 'Efectivo'
            ? 'tabla__badge--efectivo'
            : 'tabla__badge--transferencia';

        /* Retornar el HTML de la fila */
        return `
            <tr class="tabla__fila">
                <td class="tabla__td">${formatearFecha(gasto.fechaRegistro)}</td>
                <td class="tabla__td">
                    <span class="tabla__badge ${badgeClase}">${gasto.metodoPago}</span>
                </td>
                <td class="tabla__td">${gasto.descripcion}</td>
                <td class="tabla__td tabla__td--precio">${formatearPrecio(gasto.monto)}</td>
                <td class="tabla__td tabla__td--acciones">
                    <button type="button" class="tabla__accion tabla__accion--ver" title="Ver Detalle"
                            data-accion="ver" data-id="${gasto.idGastosAdic}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    /* Si no hay resultados, mostrar un mensaje vacío */
    if (filtradas.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-texto-suave);">
                No se encontraron gastos
            </td></tr>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Nuevo Gasto --------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el envío del formulario para crear un nuevo gasto.
 * @param {Event} e - Evento de submit del formulario
 * @returns {Promise<void>}
 */
async function handleCrearGasto(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Obtener los datos del formulario */
    const formData = new FormData(formAgregar);
    const fecha = formData.get('fecha');
    const monto = parseFloat(formData.get('monto'));
    const descripcion = formData.get('descripcion');
    const metodoPago = formData.get('metodo_pago');

    /* Validaciones básicas */
    if (!fecha || !monto || !descripcion || !metodoPago) {
        mostrarAlertaError('Por favor, complete todos los campos');
        return;
    }

    if (monto <= 0) {
        mostrarAlertaError('El monto debe ser mayor a 0');
        return;
    }

    try {
            /* Enviar petición POST al backend (usuarioId se obtiene del JWT en el backend) */
            const nuevoGasto = await crearGasto({
                monto: monto,
                descripcion: descripcion,
                fechaRegistro: fecha,
                metodoPago: metodoPago,
            });

        /* Cerrar el modal */
        closeModal('modal-gasto');

        /* Limpiar el formulario */
        formAgregar.reset();

        /* Recargar la lista de gastos */
        await cargarGastos();

        /* Mostrar mensaje de éxito */
        mostrarAlertaExito('¡Gasto registrado correctamente!');

    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al registrar el gasto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Ver Detalle de Gasto ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga los detalles de un gasto desde el backend y los muestra en el modal.
 * @param {number} id - ID del gasto a consultar
 * @returns {Promise<void>}
 */
async function handleVerDetalle(id) {
    try {
        /* Petición GET al backend para obtener el gasto */
        const gasto = await obtenerGastoPorId(id);

        /* Actualizar el título del modal con el ID del gasto */
        const titulo = modalDetalle.querySelector('.modal__titulo');
        if (titulo) {
            titulo.textContent = `Detalle de Gasto #${gasto.idGastosAdic}`;
        }

        /* Actualizar el subtítulo con fecha y método */
        const subtitulo = modalDetalle.querySelector('.modal__subtitulo');
        if (subtitulo) {
            subtitulo.innerHTML = `${formatearFecha(gasto.fechaRegistro)} &bull; ${gasto.metodoPago}`;
        }

        /* Mostrar información del gasto */
        const contenido = modalDetalle.querySelector('.modal__contenido');
        if (contenido) {
            contenido.innerHTML = `
                <div class="detalle__info">
                    <div class="detalle__fila">
                        <span class="detalle__label">Descripción:</span>
                        <span class="detalle__valor">${gasto.descripcion}</span>
                    </div>
                    <div class="detalle__fila">
                        <span class="detalle__label">Monto:</span>
                        <span class="detalle__valor">${formatearPrecio(gasto.monto)}</span>
                    </div>
                    <div class="detalle__fila">
                        <span class="detalle__label">Fecha:</span>
                        <span class="detalle__valor">${formatearFecha(gasto.fechaRegistro)}</span>
                    </div>
                    <div class="detalle__fila">
                        <span class="detalle__label">Método de Pago:</span>
                        <span class="detalle__valor">${gasto.metodoPago}</span>
                    </div>
                </div>
            `;
        }

        /* Abrir el modal de detalle */
        openModal('modal-detalle-gasto');
        
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cargar el detalle del gasto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Funciones Auxiliares ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* ----- Event Listeners ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja los clics en los botones de acción de la tabla (ver detalle).
 * Usa delegación de eventos en el tbody para manejar filas dinámicas.
 * @param {Event} e - Evento de clic
 */
async function handleAccionesTabla(e) {
    /* Encontrar el botón clickeado */
    const boton = e.target.closest('button');
    if (!boton) return;

    /* Obtener la acción y el ID del gasto */
    const accion = boton.dataset.accion;
    const idGasto = parseInt(boton.dataset.id);

    /* Ejecutar la acción correspondiente */
    switch (accion) {
        case 'ver':
            await handleVerDetalle(idGasto);  // ID correcto
            break;
    }
}

/**
 * Configura todos los event listeners necesarios para la página.
 */
function configurarEventListeners() {
    /* Event listeners para filtros (búsqueda y selects) */
    inputBusqueda?.addEventListener('input', renderizarGastos);
    selectMetodo?.addEventListener('change', renderizarGastos);
    selectPeriodo?.addEventListener('change', renderizarGastos);

    /* Event listener para clics en la tabla (delegación de eventos) */
    tbody?.addEventListener('click', handleAccionesTabla);

    /* Event listener para el formulario de agregar gasto */
    formAgregar?.addEventListener('submit', handleCrearGasto);
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización de la Página ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página de gastos (SPA).
 * Consulta los elementos del DOM, conecta los event listeners,
 * reinicia el estado local y carga los datos iniciales.
 * @returns {Promise<void>}
 */
export async function inicializar() {
    try {
        /* ===== Reiniciar Estado Local ===== */

        /* Vaciar el cache local de gastos */
        gastos = [];

        /* ===== Consultar Elementos del DOM ===== */

        /* Obtener el cuerpo de la tabla de gastos */
        tbody = document.querySelector('.tabla__cuerpo');
        /* Obtener el input de búsqueda */
        inputBusqueda = document.querySelector('.buscador__input');
        /* Obtener el select de filtro por método de pago */
        selectMetodo = document.querySelector('[name="filtro-metodo"]');
        /* Obtener el select de filtro por período */
        selectPeriodo = document.querySelector('[name="filtro-periodo"]');
        /* Obtener el botón de agregar gasto */
        btnAgregar = document.querySelector('[data-modal-open="modal-gasto"]');
        /* Obtener el modal de detalle de gasto */
        modalDetalle = document.getElementById('modal-detalle-gasto');
        /* Obtener el formulario del modal agregar gasto */
        formAgregar = document.querySelector('#modal-gasto .modal__formulario');

        /* ===== Configurar Event Listeners ===== */

        /* Configurar event listeners primero */
        configurarEventListeners();

        /* Establecer la fecha de hoy como valor por defecto */
        const inputFecha = document.querySelector('#modal-gasto input[name="fecha"]');
        if (inputFecha) {
            inputFecha.value = obtenerFechaLocal();
        }

        /* Cargar los gastos desde el backend y renderizar la tabla */
        await cargarGastos();
    } catch (error) {
        mostrarAlertaError('Error al cargar la página. Por favor, recargue.');
    }
}
