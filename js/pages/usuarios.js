/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — USUARIOS ==================================== */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de usuarios del sistema.
 * Conecta la vista HTML con el servicio de usuarios del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza las tarjetas de usuarios desde el API
 *  - Editar usuario (modal editar → PATCH parcial)
 *  - Activar/Desactivar usuario (PATCH toggle estado)
 *  - Búsqueda por nombre o correo en tiempo real (client-side)
 *  - Filtro por rol y estado (client-side)
 *
 * Nota: Los usuarios NO se crean desde esta página. Se registran por sí mismos.
 *
 * Dependencias:
 *  - usuarios.service.js  → llamadas al API
 *  - alerts.js            → SweetAlert2 (éxito/error)
 *  - modal.js             → abrir/cerrar modales
 *  - notifications.js     → toasts informativos
 *  - formValidation.js    → validación de formularios
 */

// Importar funciones del servicio de usuarios
import {
    obtenerUsuarios,                                                           // GET todos los usuarios
    actualizarParcialUsuario,                                                  // PATCH actualizar parcial
} from '../api/services/usuarios.service.js';

// Importar utilidades de UI
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';   // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                     // Sistema de modales
import { showNotification } from '../utils/notifications.js';                  // Toasts
import { validateForm, clearFormState } from '../utils/formValidation.js';     // Validación de formularios
import Swal from 'sweetalert2';                                                // SweetAlert2 para confirmaciones

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de usuarios cargados desde el backend (cache local) */
let usuarios = [];

/** ID del usuario que se está editando actualmente (null si no hay edición) */
let usuarioEditandoId = null;

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Contenedor grid donde se renderizan las tarjetas de usuarios */
let grid;

/** Input de búsqueda por nombre o correo */
let inputBusqueda;

/** Select de filtro por rol (admin/empleado) */
let selectRol;

/** Select de filtro por estado (activo/inactivo) */
let selectEstado;

/* ----- Modal Editar ----- */

/** Contenedor del modal de editar usuario */
let modalEditar;

/** Input del nombre en el modal de editar */
let inputNombreEditar;

/** Input del apellido en el modal de editar */
let inputApellidoEditar;

/** Input del correo en el modal de editar */
let inputCorreoEditar;

/** Select del estado en el modal de editar */
let selectEstadoEditar;

/** Botón "Actualizar" del modal de editar */
let btnActualizar;

/* -------------------------------------------------------------------------- */
/* ----- Cargar Usuarios desde el Backend ----------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los usuarios del backend y los renderiza en el grid.
 * @returns {Promise<void>}
 */
async function cargarUsuarios() {
    try {
        /* Petición GET al backend */
        usuarios = await obtenerUsuarios();

        /* Renderizar las tarjetas con los datos obtenidos */
        renderizarGrid();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar los usuarios', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar usuarios:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Formatear Nombre de Rol -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Convierte el nombre del rol del backend a un formato legible.
 * @param {string} rol - Nombre del rol (SUPER_ADMIN, ADMIN, EMPLEADO)
 * @returns {string} Nombre formateado del rol
 */
function formatearRol(rol) {
    /* Mapa de roles del backend a nombres legibles */
    const roles = {
        'SUPER_ADMIN': 'Super Admin',                                          // Desarrollador
        'ADMIN': 'Administrador',                                              // Dueño del negocio
        'EMPLEADO': 'Empleado',                                                // Operativo
    };

    /* Retornar el nombre formateado o el original si no se encuentra */
    return roles[rol] || rol;
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Grid de Tarjetas ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza las tarjetas de usuarios aplicando los filtros.
 * Se llama cada vez que cambian los datos o los filtros.
 */
function renderizarGrid() {
    /* Obtener el texto de búsqueda en minúsculas */
    const busqueda = inputBusqueda.value.trim().toLowerCase();

    /* Obtener el valor del filtro de rol */
    const filtroRol = selectRol.value;

    /* Obtener el valor del filtro de estado */
    const filtroEstado = selectEstado.value;

    /* Filtrar los usuarios según búsqueda, rol y estado */
    const filtrados = usuarios.filter(usr => {
        /* Verificar si el nombre o correo coinciden con la búsqueda */
        const coincideBusqueda = usr.nombre.toLowerCase().includes(busqueda)
            || (usr.apellido && usr.apellido.toLowerCase().includes(busqueda))
            || usr.correo.toLowerCase().includes(busqueda);

        /* Verificar si el rol coincide con el filtro seleccionado */
        const coincideRol = filtroRol === ''                                   // Sin filtro → todos
            || (filtroRol === 'admin' && usr.rol === 'ADMIN')                  // Solo admins
            || (filtroRol === 'empleado' && usr.rol === 'EMPLEADO');           // Solo empleados

        /* Verificar si el estado coincide con el filtro seleccionado */
        const coincideEstado = filtroEstado === ''                             // Sin filtro → todos
            || (filtroEstado === 'activo' && usr.estado === true)              // Solo activos
            || (filtroEstado === 'inactivo' && usr.estado === false);          // Solo inactivos

        /* El usuario pasa el filtro si cumple todas las condiciones */
        return coincideBusqueda && coincideRol && coincideEstado;
    });

    /* Construir el HTML de todas las tarjetas filtradas */
    grid.innerHTML = filtrados.map(usr => {
        /* Determinar la clase CSS del badge según el estado */
        const badgeClase = usr.estado ? 'contacto__badge--activo' : 'contacto__badge--inactivo';

        /* Determinar el texto del badge según el estado */
        const badgeTexto = usr.estado ? 'Activo' : 'Inactivo';

        /* Determinar el ícono del avatar según el rol */
        const iconoAvatar = usr.rol === 'ADMIN' || usr.rol === 'SUPER_ADMIN'
            ? 'fa-user-shield'                                                 // Ícono de admin
            : 'fa-user';                                                       // Ícono de empleado

        /* Determinar el ícono y texto del método de acceso */
        const iconoAcceso = usr.tieneGoogle ? 'fa-brands fa-google' : 'fa-solid fa-key';
        const textoAcceso = usr.tieneGoogle && usr.tieneContrasena
            ? 'Google + Contraseña'                                            // Ambos métodos
            : usr.tieneGoogle
                ? 'Google'                                                     // Solo Google
                : 'Contraseña';                                                // Solo contraseña

        /* Retornar el HTML de la tarjeta con la misma estructura del diseño original */
        return `
            <article class="contacto">
                <div class="contacto__header">
                    <div class="contacto__avatar">
                        <i class="fa-solid ${iconoAvatar}"></i>
                    </div>
                    <div class="contacto__acciones">
                        <button type="button" class="producto__accion producto__accion--editar" title="Editar"
                                data-accion="editar" data-id="${usr.idUsuario}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="producto__accion producto__accion--eliminar" title="${usr.estado ? 'Desactivar' : 'Activar'}"
                                data-accion="toggle" data-id="${usr.idUsuario}" data-estado="${usr.estado}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="contacto__info">
                    <h3 class="contacto__nombre">${usr.nombre}${usr.apellido ? ' ' + usr.apellido : ''}</h3>
                    <span class="contacto__badge ${badgeClase}">${badgeTexto}</span>
                </div>
                <div class="contacto__detalles">
                    <div class="contacto__campo">
                        <i class="fa-solid fa-shield-halved"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Rol</span>
                            <span class="contacto__campo-valor">${formatearRol(usr.rol)}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="fa-solid fa-envelope"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Correo</span>
                            <span class="contacto__campo-valor">${usr.correo}</span>
                        </div>
                    </div>
                    <div class="contacto__campo">
                        <i class="${iconoAcceso}"></i>
                        <div class="contacto__campo-info">
                            <span class="contacto__campo-etiqueta">Acceso</span>
                            <span class="contacto__campo-valor">${textoAcceso}</span>
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
                No se encontraron usuarios
            </div>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Abrir Modal de Edición --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Abre el modal de edición pre-llenando los campos con los datos del usuario.
 * @param {number} id - ID del usuario a editar
 */
function abrirModalEditar(id) {
    /* Buscar el usuario en el cache local por su ID */
    const usr = usuarios.find(u => u.idUsuario === id);

    /* Si no se encuentra, mostrar error y salir */
    if (!usr) {
        showNotification('Usuario no encontrado', 'error');
        return;
    }

    /* Guardar el ID del usuario que se está editando */
    usuarioEditandoId = id;

    /* Pre-llenar los inputs con los valores actuales */
    inputNombreEditar.value = usr.nombre;
    inputApellidoEditar.value = usr.apellido || '';
    inputCorreoEditar.value = usr.correo;
    selectEstadoEditar.value = String(usr.estado);

    /* Limpiar los estados visuales de validación previos */
    const form = modalEditar.querySelector('.modal__formulario');
    clearFormState(form);

    /* Abrir el modal de edición */
    openModal('modal-editar-usuario');
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Usuario (Modal Editar) ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Actualizar" del modal de editar.
 * Valida el formulario, envía PATCH al backend y recarga las tarjetas.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleActualizar(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Verificar que hay un usuario seleccionado para editar */
    if (!usuarioEditandoId) return;

    /* Obtener el formulario contenedor para validar */
    const form = modalEditar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#editar-usuario-nombre': {
            required: true,                                                    // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                           // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#editar-usuario-apellido': {
            required: true,                                                    // El apellido es obligatorio
            requiredMsg: 'El apellido es obligatorio',                         // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#editar-usuario-correo': {
            required: true,                                                    // El correo es obligatorio
            requiredMsg: 'El correo es obligatorio',                           // Mensaje personalizado
            email: true,                                                       // Validar formato email
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores actualizados de los inputs */
    const nombre = inputNombreEditar.value.trim();                             // Nombre del usuario
    const apellido = inputApellidoEditar.value.trim();                         // Apellido del usuario
    const correo = inputCorreoEditar.value.trim();                             // Correo actualizado
    const estado = selectEstadoEditar.value === 'true';                        // Estado convertido a boolean

    try {
        /* Enviar petición PATCH al backend para actualizar parcialmente el usuario */
        const respuesta = await actualizarParcialUsuario(usuarioEditandoId, {
            nombre, apellido, correo, estado,
        });

        /* Cerrar el modal de edición */
        closeModal('modal-editar-usuario');

        /* Reiniciar el ID de edición */
        usuarioEditandoId = null;

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarUsuarios();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al actualizar el usuario');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una confirmación y luego activa o desactiva el usuario.
 * @param {number} id - ID del usuario
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
        title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`, // Título capitalizado
        text: estadoActual
            ? 'El usuario no podrá acceder al sistema.'                        // Mensaje para desactivar
            : 'El usuario podrá acceder al sistema nuevamente.',               // Mensaje para activar
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
        const respuesta = await actualizarParcialUsuario(id, { estado: !estadoActual });

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || `Usuario ${accionPasada} exitosamente`);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarUsuarios();
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

    /* Obtener la acción y el ID del usuario desde los data attributes */
    const accion = boton.dataset.accion;                                       // 'editar' o 'toggle'
    const id = parseInt(boton.dataset.id);                                     // ID del usuario

    /* Ejecutar la acción correspondiente */
    if (accion === 'editar') {
        /* Abrir el modal de edición con los datos del usuario */
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
 * Punto de entrada de la página de usuarios (SPA).
 * Consulta los elementos del DOM, conecta los event listeners,
 * reinicia el estado local y carga los datos iniciales.
 * @returns {Promise<void>}
 */
export async function inicializar() {

    /* ===== Reiniciar Estado Local ===== */

    /* Vaciar el cache local de usuarios */
    usuarios = [];
    /* Limpiar el ID de usuario en edición */
    usuarioEditandoId = null;

    /* ===== Consultar Elementos del DOM ===== */

    /* Obtener el contenedor grid de tarjetas */
    grid = document.querySelector('.contactos__grid');
    /* Obtener el input de búsqueda */
    inputBusqueda = document.querySelector('.buscador__input');
    /* Obtener el select de filtro por rol */
    selectRol = document.querySelector('[name="filtro-rol"]');
    /* Obtener el select de filtro por estado */
    selectEstado = document.querySelector('[name="filtro-estado"]');
    /* Obtener el contenedor del modal de editar */
    modalEditar = document.getElementById('modal-editar-usuario');
    /* Obtener el input de nombre del modal de editar */
    inputNombreEditar = document.getElementById('editar-usuario-nombre');
    /* Obtener el input de apellido del modal de editar */
    inputApellidoEditar = document.getElementById('editar-usuario-apellido');
    /* Obtener el input de correo del modal de editar */
    inputCorreoEditar = document.getElementById('editar-usuario-correo');
    /* Obtener el select de estado del modal de editar */
    selectEstadoEditar = document.getElementById('editar-usuario-estado');
    /* Obtener el botón "Actualizar" del modal de editar */
    btnActualizar = document.getElementById('btn-actualizar-usuario');

    /* ===== Event Listeners del Modal Editar ===== */

    /* Botón "Actualizar" del modal de editar → actualizar usuario */
    btnActualizar.addEventListener('click', handleActualizar);

    /* ===== Event Listeners del Grid ===== */

    /* Delegación de eventos para los botones de acción en las tarjetas */
    grid.addEventListener('click', handleAccionesGrid);

    /* ===== Event Listeners de Búsqueda y Filtro ===== */

    /* Filtrar las tarjetas en tiempo real mientras el usuario escribe en el buscador */
    inputBusqueda.addEventListener('input', renderizarGrid);

    /* Filtrar las tarjetas cuando cambia el select de rol */
    selectRol.addEventListener('change', renderizarGrid);

    /* Filtrar las tarjetas cuando cambia el select de estado */
    selectEstado.addEventListener('change', renderizarGrid);

    /* ===== Carga Inicial de Datos ===== */

    /* Cargar los usuarios desde el backend y renderizar las tarjetas */
    await cargarUsuarios();
}
