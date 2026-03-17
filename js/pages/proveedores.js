/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — PROVEEDORES ================================= */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de proveedores.
 * Conecta la vista HTML con el servicio de proveedores del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza las tarjetas de proveedores desde el API
 *  - Crear proveedor (modal agregar → POST)
 *  - Editar proveedor (modal editar → PUT)
 *  - Activar/Desactivar proveedor (PATCH toggle estado)
 *  - Búsqueda por nombre, NIT o razón social en tiempo real (client-side)
 *  - Filtro por estado activo/inactivo (client-side)
 *
 * Dependencias:
 *  - proveedores.service.js → llamadas al API
 *  - alerts.js              → SweetAlert2 (éxito/error)
 *  - modal.js               → abrir/cerrar modales
 *  - notifications.js       → toasts informativos
 *  - formValidation.js      → validación de formularios
 */

// Importar funciones del servicio de proveedores
import {
    obtenerProveedores,                                                        // GET todos los proveedores
    crearProveedor,                                                            // POST nuevo proveedor
    actualizarProveedor,                                                       // PUT actualizar proveedor
    toggleEstadoProveedor,                                                     // PATCH activar/desactivar
} from '../api/services/proveedores.service.js';

// Importar utilidades de UI
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';   // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                     // Sistema de modales
import { showNotification } from '../utils/notifications.js';                  // Toasts
import { validateForm, clearFormState } from '../utils/formValidation.js';     // Validación de formularios
import Swal from 'sweetalert2';                                                // SweetAlert2 para confirmaciones

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de proveedores cargados desde el backend (cache local) */
let proveedores = [];

/** ID del proveedor que se está editando actualmente (null si no hay edición) */
let proveedorEditandoId = null;

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Contenedor grid donde se renderizan las tarjetas de proveedores */
let grid;

/** Input de búsqueda por nombre, NIT o razón social */
let inputBusqueda;

/** Select de filtro por estado (activo/inactivo) */
let selectEstado;

/* ----- Modal Agregar ----- */

/** Contenedor del modal de agregar proveedor */
let modalAgregar;

/** Input del nombre en el modal de agregar */
let inputNombreAgregar;

/** Input de la razón social en el modal de agregar */
let inputRazonSocialAgregar;

/** Input del NIT en el modal de agregar */
let inputNitAgregar;

/** Input del correo en el modal de agregar */
let inputCorreoAgregar;

/** Input del teléfono en el modal de agregar */
let inputTelefonoAgregar;

/** Input de la ciudad en el modal de agregar */
let inputCiudadAgregar;

/** Input de la dirección en el modal de agregar */
let inputDireccionAgregar;

/** Botón "Guardar" del modal de agregar */
let btnGuardar;

/* ----- Modal Editar ----- */

/** Contenedor del modal de editar proveedor */
let modalEditar;

/** Input del nombre en el modal de editar */
let inputNombreEditar;

/** Input de la razón social en el modal de editar */
let inputRazonSocialEditar;

/** Input del NIT en el modal de editar */
let inputNitEditar;

/** Input del correo en el modal de editar */
let inputCorreoEditar;

/** Input del teléfono en el modal de editar */
let inputTelefonoEditar;

/** Input de la ciudad en el modal de editar */
let inputCiudadEditar;

/** Input de la dirección en el modal de editar */
let inputDireccionEditar;

/** Select del estado en el modal de editar */
let selectEstadoEditar;

/** Botón "Actualizar" del modal de editar */
let btnActualizar;

/* -------------------------------------------------------------------------- */
/* ----- Cargar Proveedores desde el Backend -------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los proveedores del backend y los renderiza en el grid.
 * @returns {Promise<void>}
 */
async function cargarProveedores() {
    try {
        /* Petición GET al backend */
        proveedores = await obtenerProveedores();

        /* Renderizar las tarjetas con los datos obtenidos */
        renderizarGrid();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar los proveedores', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar proveedores:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Grid de Tarjetas ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza las tarjetas de proveedores aplicando los filtros de búsqueda y estado.
 * Se llama cada vez que cambian los datos o los filtros.
 */
function renderizarGrid() {
    /* Obtener el texto de búsqueda en minúsculas */
    const busqueda = inputBusqueda.value.trim().toLowerCase();

    /* Obtener el valor del filtro de estado */
    const filtroEstado = selectEstado.value;

    /* Filtrar los proveedores según búsqueda y estado */
    const filtrados = proveedores.filter(prov => {
        /* Verificar si el nombre, NIT o razón social coinciden con la búsqueda */
        const coincideBusqueda = prov.nombre.toLowerCase().includes(busqueda)
            || (prov.nit && prov.nit.toLowerCase().includes(busqueda))
            || (prov.razonSocial && prov.razonSocial.toLowerCase().includes(busqueda));

        /* Verificar si el estado coincide con el filtro seleccionado */
        const coincideEstado = filtroEstado === ''                              // Sin filtro → todos
            || (filtroEstado === 'activo' && prov.estado === true)              // Solo activos
            || (filtroEstado === 'inactivo' && prov.estado === false);          // Solo inactivos

        /* El proveedor pasa el filtro si cumple ambas condiciones */
        return coincideBusqueda && coincideEstado;
    });

    /* Ordenar: activos primero, inactivos al final */
    filtrados.sort((a, b) => b.estado - a.estado);

    /* Construir el HTML de todas las tarjetas filtradas */
    grid.innerHTML = filtrados.map(prov => {
        /* Determinar la clase CSS del badge según el estado */
        const badgeClase = prov.estado ? 'contacto__badge--activo' : 'contacto__badge--inactivo';

        /* Determinar el texto del badge según el estado */
        const badgeTexto = prov.estado ? 'Activo' : 'Inactivo';

        /* Retornar el HTML de la tarjeta con la misma estructura del diseño original */
        return `
            <article class="contacto">
                <div class="contacto__header">
                    <div class="contacto__avatar">
                        <i class="fa-solid fa-truck"></i>
                    </div>
                    <div class="contacto__acciones">
                        <button type="button" class="producto__accion producto__accion--editar" title="Editar"
                                data-accion="editar" data-id="${prov.idProveedor}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="producto__accion producto__accion--eliminar" title="${prov.estado ? 'Desactivar' : 'Activar'}"
                                data-accion="toggle" data-id="${prov.idProveedor}" data-estado="${prov.estado}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="contacto__info">
                    <h3 class="contacto__nombre">${prov.nombre}</h3>
                    <span class="contacto__badge ${badgeClase}">${badgeTexto}</span>
                </div>
                <div class="contacto__detalles">
                    <div class="contacto__campo">
                        <i class="fa-solid fa-building"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Empresa</span>
                            <span class="contacto__campo-valor">${prov.razonSocial || '—'}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="fa-solid fa-hashtag"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">NIT</span>
                            <span class="contacto__campo-valor">${prov.nit || '—'}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="fa-solid fa-phone"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Teléfono</span>
                            <span class="contacto__campo-valor">${prov.telefono || '—'}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="fa-solid fa-envelope"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Correo</span>
                            <span class="contacto__campo-valor">${prov.correo || '—'}</span>
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
                No se encontraron proveedores
            </div>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Proveedor (Modal Agregar) ------------------------------------ */
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
        '#agregar-proveedor-nombre': {
            required: true,                                                    // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                           // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#agregar-proveedor-razon-social': {
            required: true,                                                    // La razón social es obligatoria
            requiredMsg: 'La razón social es obligatoria',                     // Mensaje personalizado
        },
        '#agregar-proveedor-nit': {
            required: true,                                                    // El NIT es obligatorio
            requiredMsg: 'El NIT es obligatorio',                              // Mensaje personalizado
        },
        '#agregar-proveedor-correo': {
            email: true,                                                       // Validar formato email
        },
        '#agregar-proveedor-telefono': {
            phone: true,                                                       // Validar formato teléfono
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores de los inputs */
    const nombre = inputNombreAgregar.value.trim();                            // Nombre del contacto
    const razonSocial = inputRazonSocialAgregar.value.trim();                  // Razón social de la empresa
    const nit = inputNitAgregar.value.trim();                                  // NIT del proveedor
    const correo = inputCorreoAgregar.value.trim() || null;                    // Correo (null si vacío)
    const telefono = inputTelefonoAgregar.value.trim() || null;                // Teléfono (null si vacío)
    const ciudad = inputCiudadAgregar.value.trim() || null;                    // Ciudad (null si vacía)
    const direccion = inputDireccionAgregar.value.trim() || null;              // Dirección (null si vacía)

    try {
        /* Enviar petición POST al backend para crear el proveedor */
        const respuesta = await crearProveedor({ nombre, razonSocial, nit, correo, telefono, direccion, ciudad });

        /* Cerrar el modal de agregar */
        closeModal('modal-agregar-proveedor');

        /* Limpiar los campos del formulario para el próximo uso */
        inputNombreAgregar.value = '';
        inputRazonSocialAgregar.value = '';
        inputNitAgregar.value = '';
        inputCorreoAgregar.value = '';
        inputTelefonoAgregar.value = '';
        inputCiudadAgregar.value = '';
        inputDireccionAgregar.value = '';
        clearFormState(form);

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarProveedores();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al crear el proveedor');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Abrir Modal de Edición --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Abre el modal de edición pre-llenando los campos con los datos del proveedor.
 * @param {number} id - ID del proveedor a editar
 */
function abrirModalEditar(id) {
    /* Buscar el proveedor en el cache local por su ID */
    const prov = proveedores.find(p => p.idProveedor === id);

    /* Si no se encuentra, mostrar error y salir */
    if (!prov) {
        showNotification('Proveedor no encontrado', 'error');
        return;
    }

    /* Guardar el ID del proveedor que se está editando */
    proveedorEditandoId = id;

    /* Pre-llenar los inputs con los valores actuales */
    inputNombreEditar.value = prov.nombre || '';
    inputRazonSocialEditar.value = prov.razonSocial || '';
    inputNitEditar.value = prov.nit || '';
    inputCorreoEditar.value = prov.correo || '';
    inputTelefonoEditar.value = prov.telefono || '';
    inputCiudadEditar.value = prov.ciudad || '';
    inputDireccionEditar.value = prov.direccion || '';
    selectEstadoEditar.value = String(prov.estado);

    /* Limpiar los estados visuales de validación previos */
    const form = modalEditar.querySelector('.modal__formulario');
    clearFormState(form);

    /* Abrir el modal de edición */
    openModal('modal-editar-proveedor');
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Proveedor (Modal Editar) -------------------------------- */
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

    /* Verificar que hay un proveedor seleccionado para editar */
    if (!proveedorEditandoId) return;

    /* Obtener el formulario contenedor para validar */
    const form = modalEditar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#editar-proveedor-nombre': {
            required: true,                                                    // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                           // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#editar-proveedor-razon-social': {
            required: true,                                                    // La razón social es obligatoria
            requiredMsg: 'La razón social es obligatoria',                     // Mensaje personalizado
        },
        '#editar-proveedor-nit': {
            required: true,                                                    // El NIT es obligatorio
            requiredMsg: 'El NIT es obligatorio',                              // Mensaje personalizado
        },
        '#editar-proveedor-correo': {
            email: true,                                                       // Validar formato email
        },
        '#editar-proveedor-telefono': {
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
    const razonSocial = inputRazonSocialEditar.value.trim();                   // Razón social actualizada
    const nit = inputNitEditar.value.trim();                                   // NIT actualizado
    const correo = inputCorreoEditar.value.trim() || null;                     // Correo actualizado
    const telefono = inputTelefonoEditar.value.trim() || null;                 // Teléfono actualizado
    const ciudad = inputCiudadEditar.value.trim() || null;                     // Ciudad actualizada
    const direccion = inputDireccionEditar.value.trim() || null;               // Dirección actualizada
    const estado = selectEstadoEditar.value === 'true';                        // Estado convertido a boolean

    try {
        /* Enviar petición PUT al backend para actualizar el proveedor */
        const respuesta = await actualizarProveedor(proveedorEditandoId, {
            nombre, razonSocial, nit, correo, telefono, direccion, ciudad, estado,
        });

        /* Cerrar el modal de edición */
        closeModal('modal-editar-proveedor');

        /* Reiniciar el ID de edición */
        proveedorEditandoId = null;

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarProveedores();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al actualizar el proveedor');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una confirmación y luego activa o desactiva el proveedor.
 * @param {number} id - ID del proveedor
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
        title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} proveedor?`, // Título capitalizado
        text: estadoActual
            ? 'El proveedor dejará de estar disponible.'                        // Mensaje para desactivar
            : 'El proveedor volverá a estar disponible.',                       // Mensaje para activar
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
        const respuesta = await toggleEstadoProveedor(id, !estadoActual);

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || `Proveedor ${accionPasada} exitosamente`);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarProveedores();
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

    /* Obtener la acción y el ID del proveedor desde los data attributes */
    const accion = boton.dataset.accion;                                       // 'editar' o 'toggle'
    const id = parseInt(boton.dataset.id);                                     // ID del proveedor

    /* Ejecutar la acción correspondiente */
    if (accion === 'editar') {
        /* Abrir el modal de edición con los datos del proveedor */
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
 * Punto de entrada de la página de proveedores (SPA).
 * Consulta los elementos del DOM, conecta los event listeners
 * y carga los datos iniciales.
 * @returns {Promise<void>}
 */
export async function inicializar() {

    /* ===== Resetear Estado del Módulo ===== */

    /* Vaciar el cache local de proveedores */
    proveedores = [];

    /* Reiniciar el ID del proveedor en edición */
    proveedorEditandoId = null;

    /* ===== Consultar Referencias al DOM ===== */

    /* Contenedor grid donde se renderizan las tarjetas de proveedores */
    grid = document.querySelector('.contactos__grid');

    /* Input de búsqueda por nombre, NIT o razón social */
    inputBusqueda = document.querySelector('.buscador__input');

    /* Select de filtro por estado (activo/inactivo) */
    selectEstado = document.querySelector('[name="filtro-estado"]');

    /* Contenedor del modal de agregar proveedor */
    modalAgregar = document.getElementById('modal-agregar-proveedor');

    /* Input del nombre en el modal de agregar */
    inputNombreAgregar = document.getElementById('agregar-proveedor-nombre');

    /* Input de la razón social en el modal de agregar */
    inputRazonSocialAgregar = document.getElementById('agregar-proveedor-razon-social');

    /* Input del NIT en el modal de agregar */
    inputNitAgregar = document.getElementById('agregar-proveedor-nit');

    /* Input del correo en el modal de agregar */
    inputCorreoAgregar = document.getElementById('agregar-proveedor-correo');

    /* Input del teléfono en el modal de agregar */
    inputTelefonoAgregar = document.getElementById('agregar-proveedor-telefono');

    /* Input de la ciudad en el modal de agregar */
    inputCiudadAgregar = document.getElementById('agregar-proveedor-ciudad');

    /* Input de la dirección en el modal de agregar */
    inputDireccionAgregar = document.getElementById('agregar-proveedor-direccion');

    /* Botón "Guardar" del modal de agregar */
    btnGuardar = document.getElementById('btn-guardar-proveedor');

    /* Contenedor del modal de editar proveedor */
    modalEditar = document.getElementById('modal-editar-proveedor');

    /* Input del nombre en el modal de editar */
    inputNombreEditar = document.getElementById('editar-proveedor-nombre');

    /* Input de la razón social en el modal de editar */
    inputRazonSocialEditar = document.getElementById('editar-proveedor-razon-social');

    /* Input del NIT en el modal de editar */
    inputNitEditar = document.getElementById('editar-proveedor-nit');

    /* Input del correo en el modal de editar */
    inputCorreoEditar = document.getElementById('editar-proveedor-correo');

    /* Input del teléfono en el modal de editar */
    inputTelefonoEditar = document.getElementById('editar-proveedor-telefono');

    /* Input de la ciudad en el modal de editar */
    inputCiudadEditar = document.getElementById('editar-proveedor-ciudad');

    /* Input de la dirección en el modal de editar */
    inputDireccionEditar = document.getElementById('editar-proveedor-direccion');

    /* Select del estado en el modal de editar */
    selectEstadoEditar = document.getElementById('editar-proveedor-estado');

    /* Botón "Actualizar" del modal de editar */
    btnActualizar = document.getElementById('btn-actualizar-proveedor');

    /* ===== Event Listeners del Modal Agregar ===== */

    /* Botón "Guardar" del modal de agregar → crear proveedor */
    btnGuardar.addEventListener('click', handleCrear);

    /* ===== Event Listeners del Modal Editar ===== */

    /* Botón "Actualizar" del modal de editar → actualizar proveedor */
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

    /* Cargar los proveedores desde el backend y renderizar las tarjetas */
    await cargarProveedores();
}
