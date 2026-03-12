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
 *  - Editar gasto (modal editar → PUT)
 *  - Eliminar gasto (confirmación SweetAlert → DELETE lógico)
 *  - Búsqueda por descripción o ID en tiempo real (client-side)
 *  - Filtro por tipo de gasto y período (client-side)
 *  - Carga dinámica de tipos de gasto para el select
 *  - Formateo profesional de montos y fechas
 *
 * Dependencias:
 *  - gastos.service.js    → llamadas al API de gastos
 *  - alerts.js            → SweetAlert2 (éxito/error)
 *  - modal.js             → abrir/cerrar modales
 *  - notifications.js     → toasts informativos
 */

// Importar funciones del servicio de gastos
import {
    obtenerGastos,                                                              // GET todos los gastos
    obtenerGastoPorId,                                                          // GET gasto por ID
    crearGasto,                                                                 // POST nuevo gasto
    actualizarGasto,                                                            // PUT actualizar gasto
    eliminarGasto,                                                              // DELETE eliminar gasto
    obtenerTiposGasto,                                                          // GET tipos de gasto
} from '../api/services/gastos.service.js';

// Importar utilidades de UI
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';   // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                     // Sistema de modales
import { showNotification } from '../utils/notifications.js';                  // Toasts

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de gastos cargados desde el backend (cache local) */
let gastos = [];

/** Array de tipos de gasto cargados desde el backend (para selects) */
let tiposGasto = [];

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cuerpo de la tabla donde se renderizan las filas de gastos */
const tbody = document.querySelector('.tabla__cuerpo');

/** Input de búsqueda por descripción o ID de gasto */
const inputBusqueda = document.querySelector('.buscador__input');

/** Select de filtro por tipo de gasto */
const selectTipo = document.querySelector('[name="filtro-tipo"]');

/** Select de filtro por período de tiempo */
const selectPeriodo = document.querySelector('[name="filtro-periodo"]');

/** Botón "Agregar Gasto" para abrir el modal */
const btnAgregar = document.querySelector('[data-modal-open="modal-gasto"]');

/* ----- Modal Agregar Gasto ----- */

/** Formulario del modal agregar gasto */
const formAgregar = document.getElementById('form-agregar-gasto');

/** Select de tipo de gasto en el modal agregar */
const selectTipoAgregar = document.getElementById('gasto-tipo');

/** Input de descripción en el modal agregar */
const inputDescripcionAgregar = document.getElementById('gasto-descripcion');

/** Input de monto en el modal agregar */
const inputMontoAgregar = document.getElementById('gasto-monto');

/** Input de fecha en el modal agregar */
const inputFechaAgregar = document.getElementById('gasto-fecha');

/** Botón "Guardar" en el modal agregar */
const btnGuardarAgregar = document.getElementById('btn-guardar-gasto');

/* ----- Modal Editar Gasto ----- */

/** Contenedor del modal de editar gasto */
const modalEditar = document.getElementById('modal-editar-gasto');

/** Formulario del modal editar gasto */
const formEditar = document.getElementById('form-editar-gasto');

/** Select de tipo de gasto en el modal editar */
const selectTipoEditar = document.getElementById('editar-gasto-tipo');

/** Input de descripción en el modal editar */
const inputDescripcionEditar = document.getElementById('editar-gasto-descripcion');

/** Input de monto en el modal editar */
const inputMontoEditar = document.getElementById('editar-gasto-monto');

/** Input de fecha en el modal editar */
const inputFechaEditar = document.getElementById('editar-gasto-fecha');

/** Botón "Actualizar" en el modal editar */
const btnActualizar = document.getElementById('btn-actualizar-gasto');

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
        renderizarTabla();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar los gastos', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar gastos:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Cargar Tipos de Gasto ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los tipos de gasto del backend y llena los selects.
 * @returns {Promise<void>}
 */
async function cargarTiposGasto() {
    try {
        /* Petición GET al backend para obtener tipos de gasto */
        tiposGasto = await obtenerTiposGasto();

        /* Llenar los selects de tipo de gasto en ambos modales */
        const opciones = '<option value="">Seleccionar tipo</option>' +
            tiposGasto.map(tipo => `<option value="${tipo.idTipoGasto}">${tipo.nombre}</option>`).join('');

        /* Llenar select del modal agregar */
        if (selectTipoAgregar) {
            selectTipoAgregar.innerHTML = opciones;
        }

        /* Llenar select del modal editar */
        if (selectTipoEditar) {
            selectTipoEditar.innerHTML = opciones;
        }
    } catch (error) {
        /* Log del error si falla la carga de tipos de gasto */
        console.error('Error al cargar tipos de gasto:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Nombre de Tipo de Gasto ------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Busca el nombre de un tipo de gasto por su ID en el cache local.
 * @param {number} tipoId - ID del tipo de gasto
 * @returns {string} Nombre del tipo o 'Sin tipo'
 */
function obtenerNombreTipoGasto(tipoId) {
    /* Buscar el tipo de gasto en el cache por su ID */
    const tipo = tiposGasto.find(t => t.idTipoGasto === tipoId);

    /* Retornar el nombre o un texto por defecto */
    return tipo ? tipo.nombre : 'Sin tipo';
}

/* -------------------------------------------------------------------------- */
/* ----- Formatear Monto ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Formatea un número como monto colombiano con separador de miles.
 * @param {number} monto - Valor numérico a formatear
 * @returns {string} Monto formateado (ej: "$ 1.200.000")
 */
function formatearMonto(monto) {
    /* Formatear con separador de miles y sin decimales */
    return '$ ' + Math.round(monto).toLocaleString('es-CO');
}

/* -------------------------------------------------------------------------- */
/* ----- Formatear Fecha --------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Convierte una fecha de formato YYYY-MM-DD a DD/MM/YYYY.
 * @param {string} fechaStr - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada (DD/MM/YYYY)
 */
function formatearFecha(fechaStr) {
    /* Separar la fecha en componentes [año, mes, día] */
    const [anio, mes, dia] = fechaStr.split('-');

    /* Retornar en formato DD/MM/YYYY */
    return `${dia}/${mes}/${anio}`;
}

/* -------------------------------------------------------------------------- */
/* ----- Filtrar por Período ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Verifica si una fecha pertenece al período seleccionado.
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @param {string} periodo - Período seleccionado (today, week, month, year)
 * @returns {boolean} true si la fecha está dentro del período
 */
function filtrarPorPeriodo(fechaStr, periodo) {
    /* Si no hay filtro de período, todos pasan */
    if (periodo === '') return true;

    /* Crear objeto Date a partir del string (forzar hora local) */
    const fecha = new Date(fechaStr + 'T00:00:00');
    /* Obtener la fecha de hoy sin hora */
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    /* Comparar según el período seleccionado */
    if (periodo === 'today') {
        /* Verificar si la fecha es hoy */
        return fecha.toDateString() === hoy.toDateString();
    } else if (periodo === 'week') {
        /* Calcular el inicio de la semana actual (domingo) */
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        /* Verificar si la fecha es posterior al inicio de la semana */
        return fecha >= inicioSemana;
    } else if (periodo === 'month') {
        /* Verificar si la fecha está en el mismo mes y año */
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    } else if (periodo === 'year') {
        /* Verificar si la fecha está en el mismo año */
        return fecha.getFullYear() === hoy.getFullYear();
    }

    /* Por defecto, la fecha pasa el filtro */
    return true;
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Tabla de Gastos ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza las filas de la tabla aplicando los filtros activos.
 * Se llama cada vez que cambian los datos o los filtros.
 */
function renderizarTabla() {
    /* Obtener el texto de búsqueda en minúsculas */
    const busqueda = inputBusqueda.value.trim().toLowerCase();

    /* Obtener el valor del filtro de tipo de gasto */
    const filtroTipo = selectTipo.value;

    /* Obtener el valor del filtro de período */
    const filtroPeriodo = selectPeriodo.value;

    /* Filtrar los gastos según todos los criterios */
    const filtrados = gastos.filter(gasto => {
        /* Verificar si la descripción coincide con la búsqueda */
        const coincideBusqueda = gasto.descripcion.toLowerCase().includes(busqueda)
            || String(gasto.idGasto).includes(busqueda);

        /* Verificar si el tipo de gasto coincide con el filtro */
        const coincideTipo = filtroTipo === ''
            || String(gasto.tipoGastoId) === filtroTipo;

        /* Verificar si la fecha está dentro del período seleccionado */
        const coincidePeriodo = filtrarPorPeriodo(gasto.fechaGasto, filtroPeriodo);

        /* El gasto pasa si cumple todas las condiciones */
        return coincideBusqueda && coincideTipo && coincidePeriodo;
    });

    /* Construir el HTML de todas las filas filtradas */
    tbody.innerHTML = filtrados.map(gasto => {
        /* Determinar la clase CSS del badge según el tipo de gasto */
        const nombreTipo = obtenerNombreTipoGasto(gasto.tipoGastoId);

        /* Retornar el HTML de la fila con la misma estructura del diseño original */
        return `
            <tr class="tabla__fila">
                <td class="tabla__td">${gasto.idGasto}</td>
                <td class="tabla__td">${formatearFecha(gasto.fechaGasto)}</td>
                <td class="tabla__td">${gasto.descripcion}</td>
                <td class="tabla__td">${nombreTipo}</td>
                <td class="tabla__td tabla__td--monto">${formatearMonto(gasto.monto)}</td>
                <td class="tabla__td tabla__td--acciones">
                    <button type="button" class="tabla__accion tabla__accion--ver" title="Ver Detalle"
                            data-accion="ver" data-id="${gasto.idGasto}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');                                                                // Unir todas las filas en un solo string

    /* Si no hay resultados, mostrar un mensaje vacío */
    if (filtrados.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-texto-suave);">
                No se encontraron gastos
            </td></tr>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Gasto (Modal Agregar) ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Guardar" del modal de agregar.
 * Valida el formulario, envía POST al backend y recarga la tabla.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleCrearGasto(e) {
    /* Prevenir la navegación del enlace */
    e.preventDefault();

    /* Validar que se hayan completado todos los campos requeridos */
    if (!selectTipoAgregar.value) {
        mostrarAlertaError('Seleccione un tipo de gasto');
        return;
    }

    if (!inputDescripcionAgregar.value.trim()) {
        mostrarAlertaError('Ingrese una descripción');
        return;
    }

    if (!inputMontoAgregar.value || inputMontoAgregar.value <= 0) {
        mostrarAlertaError('Ingrese un monto válido');
        return;
    }

    if (!inputFechaAgregar.value) {
        mostrarAlertaError('Ingrese la fecha del gasto');
        return;
    }

    try {
        /* Construir el objeto con los datos del gasto */
        const datos = {
            tipoGastoId: parseInt(selectTipoAgregar.value),
            descripcion: inputDescripcionAgregar.value.trim(),
            monto: parseFloat(inputMontoAgregar.value),
            fechaGasto: inputFechaAgregar.value,
        };

        /* Enviar petición POST al backend */
        const respuesta = await crearGasto(datos);

        /* Cerrar el modal */
        closeModal('modal-gasto');

        /* Limpiar el formulario */
        formAgregar.reset();

        /* Establecer la fecha de hoy como valor por defecto */
        inputFechaAgregar.value = new Date().toISOString().split('T')[0];

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || 'Gasto registrado exitosamente');

        /* Recargar la tabla de gastos */
        await cargarGastos();
    } catch (error) {
        /* Mostrar el mensaje de error del backend */
        mostrarAlertaError(error.message || 'Error al registrar el gasto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Editar Gasto ------------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Carga los datos de un gasto existente en el modal de edición.
 * @param {number} id - ID del gasto a editar
 * @returns {Promise<void>}
 */
async function handleEditarGasto(id) {
    try {
        /* Petición GET al backend para obtener el gasto */
        const gasto = await obtenerGastoPorId(id);

        /* Guardar el ID del gasto en el modal para referencia */
        modalEditar.dataset.id = id;

        /* Actualizar el título del modal */
        const titulo = modalEditar.querySelector('.modal__titulo');
        titulo.textContent = `Editar Gasto #${gasto.idGasto}`;

        /* Llenar los campos del formulario con los datos del gasto */
        selectTipoEditar.value = gasto.tipoGastoId;
        inputDescripcionEditar.value = gasto.descripcion;
        inputMontoEditar.value = gasto.monto;
        inputFechaEditar.value = gasto.fechaGasto;

        /* Abrir el modal de edición */
        openModal('modal-editar-gasto');
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cargar los datos del gasto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Gasto (Confirmar Edición) -------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Envía los datos actualizados del gasto al backend.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleActualizarGasto(e) {
    /* Prevenir la navegación del enlace */
    e.preventDefault();

    /* Obtener el ID del gasto desde el dataset del modal */
    const id = parseInt(modalEditar.dataset.id);
    if (!id) {
        mostrarAlertaError('ID de gasto no encontrado');
        return;
    }

    /* Validar que se hayan completado todos los campos requeridos */
    if (!selectTipoEditar.value) {
        mostrarAlertaError('Seleccione un tipo de gasto');
        return;
    }

    if (!inputDescripcionEditar.value.trim()) {
        mostrarAlertaError('Ingrese una descripción');
        return;
    }

    if (!inputMontoEditar.value || inputMontoEditar.value <= 0) {
        mostrarAlertaError('Ingrese un monto válido');
        return;
    }

    if (!inputFechaEditar.value) {
        mostrarAlertaError('Ingrese la fecha del gasto');
        return;
    }

    try {
        /* Construir el objeto con los datos actualizados */
        const datos = {
            tipoGastoId: parseInt(selectTipoEditar.value),
            descripcion: inputDescripcionEditar.value.trim(),
            monto: parseFloat(inputMontoEditar.value),
            fechaGasto: inputFechaEditar.value,
        };

        /* Enviar petición PUT al backend */
        const respuesta = await actualizarGasto(id, datos);

        /* Cerrar el modal */
        closeModal('modal-editar-gasto');

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || 'Gasto actualizado exitosamente');

        /* Recargar la tabla de gastos */
        await cargarGastos();
    } catch (error) {
        /* Mostrar el mensaje de error del backend */
        mostrarAlertaError(error.message || 'Error al actualizar el gasto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Gasto ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra confirmación y elimina un gasto lógicamente.
 * @param {number} id - ID del gasto a eliminar
 * @returns {Promise<void>}
 */
async function handleEliminarGasto(id) {
    try {
        /* Mostrar confirmación con SweetAlert */
        const resultado = await Swal.fire({
            title: '¿Eliminar este gasto?',
            text: 'Esta acción no se puede deshacer. El gasto se marcará como inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        /* Si el usuario confirma, proceder con la eliminación */
        if (resultado.isConfirmed) {
            /* Enviar petición DELETE al backend */
            const respuesta = await eliminarGasto(id);

            /* Mostrar alerta de éxito */
            await mostrarAlertaExito(respuesta.message || 'Gasto eliminado exitosamente');

            /* Recargar la tabla de gastos */
            await cargarGastos();
        }
    } catch (error) {
        /* Mostrar el mensaje de error del backend */
        mostrarAlertaError(error.message || 'Error al eliminar el gasto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Ver Detalle de Gasto ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra los detalles de un gasto en un modal.
 * @param {number} id - ID del gasto a consultar
 * @returns {Promise<void>}
 */
async function handleVerDetalle(id) {
    try {
        /* Petición GET al backend para obtener el gasto */
        const gasto = await obtenerGastoPorId(id);

        /* Crear un modal simple para mostrar los detalles */
        const modalHTML = `
            <div class="modal modal--detalle" id="modal-detalle-gasto">
                <a href="#" class="modal__overlay" title="Cerrar"></a>
                <div class="modal__contenedor">
                    <div class="modal__header">
                        <h2 class="modal__titulo">Detalle de Gasto #${gasto.idGasto}</h2>
                        <a href="#" class="modal__cerrar" data-modal-close title="Cerrar">
                            <i class="fa-solid fa-xmark"></i>
                        </a>
                    </div>
                    <div class="modal__cuerpo">
                        <div class="detalle__info">
                            <div class="detalle__fila">
                                <span class="detalle__label">Fecha:</span>
                                <span class="detalle__valor">${formatearFecha(gasto.fechaGasto)}</span>
                            </div>
                            <div class="detalle__fila">
                                <span class="detalle__label">Tipo:</span>
                                <span class="detalle__valor">${obtenerNombreTipoGasto(gasto.tipoGastoId)}</span>
                            </div>
                            <div class="detalle__fila">
                                <span class="detalle__label">Descripción:</span>
                                <span class="detalle__valor">${gasto.descripcion}</span>
                            </div>
                            <div class="detalle__fila">
                                <span class="detalle__label">Monto:</span>
                                <span class="detalle__valor">${formatearMonto(gasto.monto)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal__acciones">
                        <a href="#" class="boton-accion boton-accion--secundario" data-modal-close title="Cerrar">Cerrar</a>
                    </div>
                </div>
            </div>
        `;

        /* Insertar el modal en el DOM */
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        /* Abrir el modal */
        openModal('modal-detalle-gasto');

        /* Configurar el cierre del modal para eliminarlo del DOM */
        const modal = document.getElementById('modal-detalle-gasto');
        modal.addEventListener('modal:closed', () => {
            modal.remove();
        });
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cargar los datos del gasto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Delegación de Eventos en la Tabla ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja los clics en los botones de acción de la tabla (editar, eliminar).
 * Usa delegación de eventos en el tbody para manejar filas dinámicas.
 * @param {Event} e - Evento de clic
 */
function handleAccionesTabla(e) {
    /* Buscar el botón de acción más cercano al clic */
    const boton = e.target.closest('[data-accion]');

    /* Si no se hizo clic en un botón de acción, salir */
    if (!boton) return;

    /* Obtener la acción y el ID del gasto desde los data attributes */
    const accion = boton.dataset.accion;                                       // 'ver'
    const id = parseInt(boton.dataset.id);                                     // ID del gasto

    /* Ejecutar la acción correspondiente */
    if (accion === 'ver') {
        /* Abrir el modal de detalle con los datos del gasto */
        handleVerDetalle(id);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página de gastos.
 * Se ejecuta cuando el DOM está completamente cargado.
 * Conecta todos los event listeners y carga los datos iniciales.
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ===== Event Listeners de la Tabla ===== */

    /* Delegación de eventos para los botones de acción en la tabla */
    tbody.addEventListener('click', handleAccionesTabla);

    /* ===== Event Listeners de Búsqueda y Filtro ===== */

    /* Filtrar la tabla en tiempo real mientras el usuario escribe en el buscador */
    inputBusqueda.addEventListener('input', renderizarTabla);

    /* Filtrar la tabla cuando cambia el select de tipo de gasto */
    selectTipo.addEventListener('change', renderizarTabla);

    /* Filtrar la tabla cuando cambia el select de período */
    selectPeriodo.addEventListener('change', renderizarTabla);

    /* ===== Event Listeners del Modal Agregar ===== */

    /* Botón "Guardar" → crear nuevo gasto */
    if (btnGuardarAgregar) {
        btnGuardarAgregar.addEventListener('click', handleCrearGasto);
    }

    /* ===== Event Listeners del Modal Editar ===== */

    /* Botón "Actualizar" → confirmar edición */
    if (btnActualizar) {
        btnActualizar.addEventListener('click', handleActualizarGasto);
    }

    /* ===== Carga Inicial de Datos ===== */

    /* Establecer la fecha de hoy como valor por defecto en ambos modales */
    const hoy = new Date().toISOString().split('T')[0];
    if (inputFechaAgregar) inputFechaAgregar.value = hoy;
    if (inputFechaEditar) inputFechaEditar.value = hoy;

    /* Cargar los tipos de gasto para los selects */
    cargarTiposGasto();

    /* Cargar los gastos desde el backend y renderizar la tabla */
    cargarGastos();
});
