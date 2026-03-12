/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — CLIENTES ==================================== */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de clientes.
 * Conecta la vista HTML con el servicio de clientes del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza las tarjetas de clientes desde el API
 *  - Crear cliente (modal agregar → POST)
 *  - Editar cliente (modal editar → PUT)
 *  - Activar/Desactivar cliente (PATCH toggle estado)
 *  - Búsqueda por nombre, documento o correo en tiempo real (client-side)
 *  - Filtro por estado activo/inactivo (client-side)
 *
 * Dependencias:
 *  - clientes.service.js  → llamadas al API
 *  - alerts.js            → SweetAlert2 (éxito/error)
 *  - modal.js             → abrir/cerrar modales
 *  - notifications.js     → toasts informativos
 *  - formValidation.js    → validación de formularios
 */

// Importar funciones del servicio de clientes
import {
    obtenerClientes,                                                           // GET todos los clientes
    crearCliente,                                                              // POST nuevo cliente
    actualizarCliente,                                                         // PUT actualizar cliente
    toggleEstadoCliente,                                                       // PATCH activar/desactivar
} from '../api/services/clientes.service.js';

// Importar utilidades de UI
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';   // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                     // Sistema de modales
import { showNotification } from '../utils/notifications.js';                  // Toasts
import { validateForm, clearFormState } from '../utils/formValidation.js';     // Validación de formularios
import Swal from 'sweetalert2';                                                // SweetAlert2 para confirmaciones

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de clientes cargados desde el backend (cache local) */
let clientes = [];

/** ID del cliente que se está editando actualmente (null si no hay edición) */
let clienteEditandoId = null;

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Contenedor grid donde se renderizan las tarjetas de clientes */
const grid = document.querySelector('.contactos__grid');

/** Input de búsqueda por nombre, documento o correo */
const inputBusqueda = document.querySelector('.buscador__input');

/** Select de filtro por estado (activo/inactivo) */
const selectEstado = document.querySelector('[name="filtro-estado"]');

/* ----- Modal Agregar ----- */

/** Contenedor del modal de agregar cliente */
const modalAgregar = document.getElementById('modal-agregar-cliente');

/** Input del nombre en el modal de agregar */
const inputNombreAgregar = document.getElementById('agregar-cliente-nombre');

/** Input del documento en el modal de agregar */
const inputDocumentoAgregar = document.getElementById('agregar-cliente-documento');

/** Input del correo en el modal de agregar */
const inputCorreoAgregar = document.getElementById('agregar-cliente-correo');

/** Input del teléfono en el modal de agregar */
const inputTelefonoAgregar = document.getElementById('agregar-cliente-telefono');

/** Input de la ciudad en el modal de agregar */
const inputCiudadAgregar = document.getElementById('agregar-cliente-ciudad');

/** Input de la dirección en el modal de agregar */
const inputDireccionAgregar = document.getElementById('agregar-cliente-direccion');

/** Botón "Guardar" del modal de agregar */
const btnGuardar = document.getElementById('btn-guardar-cliente');

/* ----- Modal Editar ----- */

/** Contenedor del modal de editar cliente */
const modalEditar = document.getElementById('modal-editar-cliente');

/** Input del nombre en el modal de editar */
const inputNombreEditar = document.getElementById('editar-cliente-nombre');

/** Input del documento en el modal de editar */
const inputDocumentoEditar = document.getElementById('editar-cliente-documento');

/** Input del correo en el modal de editar */
const inputCorreoEditar = document.getElementById('editar-cliente-correo');

/** Input del teléfono en el modal de editar */
const inputTelefonoEditar = document.getElementById('editar-cliente-telefono');

/** Input de la ciudad en el modal de editar */
const inputCiudadEditar = document.getElementById('editar-cliente-ciudad');

/** Input de la dirección en el modal de editar */
const inputDireccionEditar = document.getElementById('editar-cliente-direccion');

/** Select del estado en el modal de editar */
const selectEstadoEditar = document.getElementById('editar-cliente-estado');

/** Botón "Actualizar" del modal de editar */
const btnActualizar = document.getElementById('btn-actualizar-cliente');

/* -------------------------------------------------------------------------- */
/* ----- Cargar Clientes desde el Backend ----------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los clientes del backend y los renderiza en el grid.
 * @returns {Promise<void>}
 */
async function cargarClientes() {
    try {
        /* Petición GET al backend */
        clientes = await obtenerClientes();

        /* Renderizar las tarjetas con los datos obtenidos */
        renderizarGrid();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar los clientes', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar clientes:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Grid de Tarjetas ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza las tarjetas de clientes aplicando los filtros de búsqueda y estado.
 * Se llama cada vez que cambian los datos o los filtros.
 */
function renderizarGrid() {
    /* Obtener el texto de búsqueda en minúsculas para comparar sin importar mayúsculas */
    const busqueda = inputBusqueda.value.trim().toLowerCase();

    /* Obtener el valor del filtro de estado: '', 'activo' o 'inactivo' */
    const filtroEstado = selectEstado.value;

    /* Filtrar los clientes según búsqueda y estado */
    const filtrados = clientes.filter(cli => {
        /* Verificar si el nombre, documento o correo coinciden con la búsqueda */
        const coincideBusqueda = cli.nombre.toLowerCase().includes(busqueda)
            || String(cli.documento).includes(busqueda)
            || (cli.correo && cli.correo.toLowerCase().includes(busqueda));

        /* Verificar si el estado coincide con el filtro seleccionado */
        const coincideEstado = filtroEstado === ''                              // Sin filtro → todos
            || (filtroEstado === 'activo' && cli.estado === true)               // Solo activos
            || (filtroEstado === 'inactivo' && cli.estado === false);           // Solo inactivos

        /* El cliente pasa el filtro si cumple ambas condiciones */
        return coincideBusqueda && coincideEstado;
    });

    /* Construir el HTML de todas las tarjetas filtradas */
    grid.innerHTML = filtrados.map(cli => {
        /* Determinar la clase CSS del badge según el estado */
        const badgeClase = cli.estado ? 'contacto__badge--activo' : 'contacto__badge--inactivo';

        /* Determinar el texto del badge según el estado */
        const badgeTexto = cli.estado ? 'Activo' : 'Inactivo';

        /* Retornar el HTML de la tarjeta con la misma estructura del diseño original */
        return `
            <article class="contacto">
                <div class="contacto__header">
                    <div class="contacto__avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div class="contacto__acciones">
                        <button type="button" class="producto__accion producto__accion--editar" title="Editar"
                                data-accion="editar" data-id="${cli.idCliente}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="producto__accion producto__accion--eliminar" title="${cli.estado ? 'Desactivar' : 'Activar'}"
                                data-accion="toggle" data-id="${cli.idCliente}" data-estado="${cli.estado}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="contacto__info">
                    <h3 class="contacto__nombre">${cli.nombre}</h3>
                    <span class="contacto__badge ${badgeClase}">${badgeTexto}</span>
                </div>
                <div class="contacto__detalles">
                    <div class="contacto__campo">
                        <i class="fa-solid fa-id-card"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Documento</span>
                            <span class="contacto__campo-valor">${cli.documento || '—'}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="fa-solid fa-envelope"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Correo</span>
                            <span class="contacto__campo-valor">${cli.correo || '—'}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="fa-solid fa-phone"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Teléfono</span>
                            <span class="contacto__campo-valor">${cli.telefono || '—'}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="fa-solid fa-location-dot"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Dirección</span>
                            <span class="contacto__campo-valor">${cli.direccion ? cli.direccion + (cli.ciudad ? ', ' + cli.ciudad : '') : (cli.ciudad || '—')}</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');                                                                // Unir todas las tarjetas en un solo string

    /* Si no hay resultados, mostrar un mensaje vacío */
    if (filtrados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-texto-suave);">
                No se encontraron clientes
            </div>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Cliente (Modal Agregar) -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Guardar" del modal de agregar.
 * Valida el formulario, envía POST al backend y recarga las tarjetas.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleCrear(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Obtener el formulario contenedor para validar */
    const form = modalAgregar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#agregar-cliente-nombre': {
            required: true,                                                    // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                           // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#agregar-cliente-documento': {
            required: true,                                                    // El documento es obligatorio
            requiredMsg: 'El documento es obligatorio',                        // Mensaje personalizado
            pattern: { regex: /^\d{6,10}$/, mensaje: 'Cédula colombiana: 6 a 10 dígitos' },
        },
        '#agregar-cliente-correo': {
            email: true,                                                       // Validar formato email
        },
        '#agregar-cliente-telefono': {
            phone: true,                                                       // Validar formato teléfono
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores de los inputs */
    const nombre = inputNombreAgregar.value.trim();                            // Nombre del cliente
    const documento = parseInt(inputDocumentoAgregar.value.trim());            // Documento como número
    const correo = inputCorreoAgregar.value.trim() || null;                    // Correo (null si vacío)
    const telefono = inputTelefonoAgregar.value.trim() || null;                // Teléfono (null si vacío)
    const ciudad = inputCiudadAgregar.value.trim() || null;                    // Ciudad (null si vacía)
    const direccion = inputDireccionAgregar.value.trim() || null;              // Dirección (null si vacía)

    try {
        /* Enviar petición POST al backend para crear el cliente */
        const respuesta = await crearCliente({ nombre, documento, correo, telefono, direccion, ciudad });

        /* Cerrar el modal de agregar */
        closeModal('modal-agregar-cliente');

        /* Limpiar los campos del formulario para el próximo uso */
        inputNombreAgregar.value = '';
        inputDocumentoAgregar.value = '';
        inputCorreoAgregar.value = '';
        inputTelefonoAgregar.value = '';
        inputCiudadAgregar.value = '';
        inputDireccionAgregar.value = '';
        clearFormState(form);

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarClientes();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al crear el cliente');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Abrir Modal de Edición --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Abre el modal de edición pre-llenando los campos con los datos del cliente.
 * @param {number} id - ID del cliente a editar
 */
function abrirModalEditar(id) {
    /* Buscar el cliente en el cache local por su ID */
    const cli = clientes.find(c => c.idCliente === id);

    /* Si no se encuentra, mostrar error y salir */
    if (!cli) {
        showNotification('Cliente no encontrado', 'error');
        return;
    }

    /* Guardar el ID del cliente que se está editando */
    clienteEditandoId = id;

    /* Pre-llenar los inputs con los valores actuales */
    inputNombreEditar.value = cli.nombre || '';
    inputDocumentoEditar.value = cli.documento || '';
    inputCorreoEditar.value = cli.correo || '';
    inputTelefonoEditar.value = cli.telefono || '';
    inputCiudadEditar.value = cli.ciudad || '';
    inputDireccionEditar.value = cli.direccion || '';
    selectEstadoEditar.value = String(cli.estado);

    /* Limpiar los estados visuales de validación previos */
    const form = modalEditar.querySelector('.modal__formulario');
    clearFormState(form);

    /* Abrir el modal de edición */
    openModal('modal-editar-cliente');
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Cliente (Modal Editar) ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Actualizar" del modal de editar.
 * Valida el formulario, envía PUT al backend y recarga las tarjetas.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleActualizar(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Verificar que hay un cliente seleccionado para editar */
    if (!clienteEditandoId) return;

    /* Obtener el formulario contenedor para validar */
    const form = modalEditar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#editar-cliente-nombre': {
            required: true,                                                    // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                           // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#editar-cliente-documento': {
            required: true,                                                    // El documento es obligatorio
            requiredMsg: 'El documento es obligatorio',                        // Mensaje personalizado
            pattern: { regex: /^\d{6,10}$/, mensaje: 'Cédula colombiana: 6 a 10 dígitos' },
        },
        '#editar-cliente-correo': {
            email: true,                                                       // Validar formato email
        },
        '#editar-cliente-telefono': {
            phone: true,                                                       // Validar formato teléfono
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores actualizados de los inputs */
    const nombre = inputNombreEditar.value.trim();                             // Nombre actualizado
    const documento = parseInt(inputDocumentoEditar.value.trim());             // Documento actualizado
    const correo = inputCorreoEditar.value.trim() || null;                     // Correo actualizado
    const telefono = inputTelefonoEditar.value.trim() || null;                 // Teléfono actualizado
    const ciudad = inputCiudadEditar.value.trim() || null;                     // Ciudad actualizada
    const direccion = inputDireccionEditar.value.trim() || null;               // Dirección actualizada
    const estado = selectEstadoEditar.value === 'true';                        // Estado convertido a boolean

    try {
        /* Enviar petición PUT al backend para actualizar el cliente */
        const respuesta = await actualizarCliente(clienteEditandoId, {
            nombre, documento, correo, telefono, direccion, ciudad, estado,
        });

        /* Cerrar el modal de edición */
        closeModal('modal-editar-cliente');

        /* Reiniciar el ID de edición */
        clienteEditandoId = null;

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarClientes();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al actualizar el cliente');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una confirmación y luego activa o desactiva el cliente.
 * @param {number} id - ID del cliente
 * @param {boolean} estadoActual - Estado actual (true = activo)
 * @returns {Promise<void>}
 */
async function handleToggleEstado(id, estadoActual) {
    /* Determinar la acción a realizar para los textos del diálogo */
    const accion = estadoActual ? 'desactivar' : 'activar';                    // Texto de la acción
    const accionPasada = estadoActual ? 'desactivado' : 'activado';            // Texto en pasado

    /* Mostrar diálogo de confirmación con SweetAlert2 */
    const resultado = await Swal.fire({
        icon: 'warning',                                                       // Ícono de advertencia
        iconColor: '#E42727',                                                  // Color rojo del ícono
        title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} cliente?`, // Título capitalizado
        text: estadoActual
            ? 'El cliente dejará de estar disponible.'                          // Mensaje para desactivar
            : 'El cliente volverá a estar disponible.',                         // Mensaje para activar
        showCancelButton: true,                                                // Mostrar botón cancelar
        confirmButtonText: accion.charAt(0).toUpperCase() + accion.slice(1),   // Texto del botón confirmar
        cancelButtonText: 'Cancelar',                                          // Texto del botón cancelar
        reverseButtons: true,                                                  // Cancelar a la izquierda
        customClass: {
            confirmButton: 'swal-btn swal-btn--confirmar',                     // Clase CSS del botón confirmar
            cancelButton: 'swal-btn swal-btn--cancelar',                       // Clase CSS del botón cancelar
            popup: 'swal-popup swal-popup--eliminar',                          // Clase CSS del popup
        },
        buttonsStyling: false,                                                 // Usar CSS personalizado
    });

    /* Si el usuario canceló, no hacer nada */
    if (!resultado.isConfirmed) return;

    try {
        /* Enviar PATCH al backend con el nuevo estado (invertido) */
        const respuesta = await toggleEstadoCliente(id, !estadoActual);

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || `Cliente ${accionPasada} exitosamente`);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarClientes();
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cambiar el estado');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Delegación de Eventos en el Grid ----------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja los clics en los botones de acción de las tarjetas (editar y toggle).
 * Usa delegación de eventos en el grid para manejar tarjetas dinámicas.
 * @param {Event} e - Evento de clic
 */
function handleAccionesGrid(e) {
    /* Buscar el botón de acción más cercano al clic */
    const boton = e.target.closest('[data-accion]');

    /* Si no se hizo clic en un botón de acción, salir */
    if (!boton) return;

    /* Obtener la acción y el ID del cliente desde los data attributes */
    const accion = boton.dataset.accion;                                       // 'editar' o 'toggle'
    const id = parseInt(boton.dataset.id);                                     // ID del cliente

    /* Ejecutar la acción correspondiente */
    if (accion === 'editar') {
        /* Abrir el modal de edición con los datos del cliente */
        abrirModalEditar(id);
    } else if (accion === 'toggle') {
        /* Obtener el estado actual y ejecutar el toggle */
        const estadoActual = boton.dataset.estado === 'true';
        handleToggleEstado(id, estadoActual);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página de clientes.
 * Se ejecuta cuando el DOM está completamente cargado.
 * Conecta todos los event listeners y carga los datos iniciales.
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ===== Event Listeners del Modal Agregar ===== */

    /* Botón "Guardar" del modal de agregar → crear cliente */
    btnGuardar.addEventListener('click', handleCrear);

    /* ===== Event Listeners del Modal Editar ===== */

    /* Botón "Actualizar" del modal de editar → actualizar cliente */
    btnActualizar.addEventListener('click', handleActualizar);

    /* ===== Event Listeners del Grid ===== */

    /* Delegación de eventos para los botones de acción en las tarjetas */
    grid.addEventListener('click', handleAccionesGrid);

    /* ===== Event Listeners de Búsqueda y Filtro ===== */

    /* Filtrar las tarjetas en tiempo real mientras el usuario escribe en el buscador */
    inputBusqueda.addEventListener('input', renderizarGrid);

    /* Filtrar las tarjetas cuando cambia el select de estado */
    selectEstado.addEventListener('change', renderizarGrid);

    /* ===== Carga Inicial de Datos ===== */

    /* Cargar los clientes desde el backend y renderizar las tarjetas */
    cargarClientes();
});
