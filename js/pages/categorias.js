/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — CATEGORÍAS ================================= */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de categorías.
 * Conecta la vista HTML con el servicio de categorías del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza la tabla de categorías desde el API
 *  - Crear categoría (modal agregar → POST)
 *  - Editar categoría (modal editar → PUT)
 *  - Activar/Desactivar categoría (PATCH toggle estado)
 *  - Búsqueda por nombre en tiempo real (client-side)
 *  - Filtro por estado activo/inactivo (client-side)
 *
 * Dependencias:
 *  - categorias.service.js  → llamadas al API
 *  - alerts.js              → SweetAlert2 (éxito/error)
 *  - modal.js               → abrir/cerrar modales
 *  - notifications.js       → toasts informativos
 *  - formValidation.js      → validación de formularios
 */

import {
    obtenerCategorias,                                     // GET todas las categorías
    crearCategoria,                                        // POST nueva categoría
    actualizarCategoria,                                   // PUT actualizar categoría
    toggleEstadoCategoria,                                 // PATCH activar/desactivar
} from '../api/services/categorias.service.js';

import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';    // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                      // Sistema de modales
import { showNotification } from '../utils/notifications.js';                   // Toasts
import { validateForm, clearFormState } from '../utils/formValidation.js';      // Validación de formularios
import Swal from 'sweetalert2';                                                 // SweetAlert2 para confirmaciones

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de categorías cargadas desde el backend (cache local) */
let categorias = [];

/** ID de la categoría que se está editando actualmente (null si no hay edición) */
let categoriaEditandoId = null;

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cuerpo de la tabla donde se renderizan las filas de categorías */
const tbody = document.querySelector('.tabla__cuerpo');

/** Input de búsqueda por nombre */
const inputBusqueda = document.querySelector('.buscador__input');

/** Select de filtro por estado (activo/inactivo) */
const selectEstado = document.querySelector('.buscador__select');

/* ----- Modal Agregar ----- */

/** Contenedor del modal de agregar categoría */
const modalAgregar = document.getElementById('modal-agregar-categoria');

/** Input del nombre en el modal de agregar */
const inputNombreAgregar = document.getElementById('agregar-categoria-nombre');

/** Textarea de la descripción en el modal de agregar */
const inputDescAgregar = document.getElementById('agregar-categoria-descripcion');

/** Botón "Guardar" del modal de agregar */
const btnGuardar = document.getElementById('btn-guardar-categoria');

/* ----- Modal Editar ----- */

/** Contenedor del modal de editar categoría */
const modalEditar = document.getElementById('modal-editar-categoria');

/** Input del nombre en el modal de editar */
const inputNombreEditar = document.getElementById('editar-categoria-nombre');

/** Textarea de la descripción en el modal de editar */
const inputDescEditar = document.getElementById('editar-categoria-descripcion');

/** Select del estado en el modal de editar */
const selectEstadoEditar = document.getElementById('editar-categoria-estado');

/** Botón "Guardar cambios" del modal de editar */
const btnActualizar = document.getElementById('btn-actualizar-categoria');

/* -------------------------------------------------------------------------- */
/* ----- Cargar Categorías desde el Backend --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todas las categorías del backend y las renderiza en la tabla.
 * También aplica los filtros activos (búsqueda y estado).
 * @returns {Promise<void>}
 */
async function cargarCategorias() {
    try {
        /* Petición GET al backend */
        categorias = await obtenerCategorias();

        /* Renderizar la tabla con los datos obtenidos */
        renderizarTabla();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar las categorías', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar categorías:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Tabla de Categorías ------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza las filas de la tabla aplicando los filtros de búsqueda y estado.
 * Se llama cada vez que cambian los datos o los filtros.
 */
function renderizarTabla() {
    /* Obtener el texto de búsqueda en minúsculas para comparar sin importar mayúsculas */
    const busqueda = inputBusqueda.value.trim().toLowerCase();

    /* Obtener el valor del filtro de estado: '', 'activo' o 'inactivo' */
    const filtroEstado = selectEstado.value;

    /* Filtrar las categorías según búsqueda y estado */
    const filtradas = categorias.filter(cat => {
        /* Verificar si el nombre coincide con la búsqueda (búsqueda parcial) */
        const coincideNombre = cat.nombre.toLowerCase().includes(busqueda);

        /* Verificar si el estado coincide con el filtro seleccionado */
        const coincideEstado = filtroEstado === ''                                 // Sin filtro → todas
            || (filtroEstado === 'activo' && cat.estado === true)                  // Solo activas
            || (filtroEstado === 'inactivo' && cat.estado === false);              // Solo inactivas

        /* La categoría pasa el filtro si cumple ambas condiciones */
        return coincideNombre && coincideEstado;
    });

    /* Construir el HTML de todas las filas filtradas */
    tbody.innerHTML = filtradas.map((cat, index) => {
        /* Determinar la clase CSS del badge según el estado */
        const badgeClase = cat.estado ? 'tabla__badge--activo' : 'tabla__badge--inactivo';

        /* Determinar el texto del badge según el estado */
        const badgeTexto = cat.estado ? 'Activo' : 'Inactivo';

        /* Retornar el HTML de la fila con la misma estructura de las demás vistas */
        return `
            <tr class="tabla__fila">
                <td class="tabla__td">${index + 1}</td>
                <td class="tabla__td">${cat.nombre}</td>
                <td class="tabla__td">${cat.descripcion || '—'}</td>
                <td class="tabla__td">
                    <span class="tabla__badge ${badgeClase}">${badgeTexto}</span>
                </td>
                <td class="tabla__td tabla__td--acciones">
                    <button type="button" class="tabla__accion tabla__accion--editar" title="Editar"
                            data-accion="editar" data-id="${cat.idCategoria}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="tabla__accion tabla__accion--eliminar" title="Eliminar"
                            data-accion="toggle" data-id="${cat.idCategoria}" data-estado="${cat.estado}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');                                                                    // Unir todas las filas en un solo string

    /* Si no hay resultados, mostrar un mensaje de tabla vacía */
    if (filtradas.length === 0) {
        tbody.innerHTML = `
            <tr class="tabla__fila">
                <td class="tabla__td" colspan="5" style="text-align: center; padding: 2rem;">
                    No se encontraron categorías
                </td>
            </tr>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Categoría (Modal Agregar) ------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Guardar" del modal de agregar.
 * Valida el formulario, envía POST al backend y recarga la tabla.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleCrear(e) {
    /* Prevenir la navegación del enlace */
    e.preventDefault();

    /* Obtener el formulario contenedor para validar */
    const form = modalAgregar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#agregar-categoria-nombre': {
            required: true,                                                        // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                               // Mensaje personalizado
            minLength: 2,                                                          // Mínimo 2 caracteres
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores de los inputs */
    const nombre = inputNombreAgregar.value.trim();                                // Nombre de la categoría
    const descripcion = inputDescAgregar.value.trim() || null;                     // Descripción (null si vacía)

    try {
        /* Enviar petición POST al backend para crear la categoría */
        const respuesta = await crearCategoria({ nombre, descripcion });

        /* Cerrar el modal de agregar */
        closeModal('modal-agregar-categoria');

        /* Limpiar los campos del formulario para el próximo uso */
        inputNombreAgregar.value = '';
        inputDescAgregar.value = '';
        clearFormState(form);

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar la tabla con los datos actualizados */
        await cargarCategorias();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al crear la categoría');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Abrir Modal de Edición --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Abre el modal de edición pre-llenando los campos con los datos de la categoría.
 * @param {number} id - ID de la categoría a editar
 */
function abrirModalEditar(id) {
    /* Buscar la categoría en el cache local por su ID */
    const cat = categorias.find(c => c.idCategoria === id);

    /* Si no se encuentra, mostrar error y salir */
    if (!cat) {
        showNotification('Categoría no encontrada', 'error');
        return;
    }

    /* Guardar el ID de la categoría que se está editando */
    categoriaEditandoId = id;

    /* Pre-llenar el input de nombre con el valor actual */
    inputNombreEditar.value = cat.nombre;

    /* Pre-llenar el textarea de descripción con el valor actual */
    inputDescEditar.value = cat.descripcion || '';

    /* Pre-llenar el select de estado con el valor actual (convertir boolean a string) */
    selectEstadoEditar.value = String(cat.estado);

    /* Limpiar los estados visuales de validación previos */
    const form = modalEditar.querySelector('.modal__formulario');
    clearFormState(form);

    /* Abrir el modal de edición */
    openModal('modal-editar-categoria');
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Categoría (Modal Editar) -------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Guardar cambios" del modal de editar.
 * Valida el formulario, envía PUT al backend y recarga la tabla.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleActualizar(e) {
    /* Prevenir la navegación del enlace */
    e.preventDefault();

    /* Verificar que hay una categoría seleccionada para editar */
    if (!categoriaEditandoId) return;

    /* Obtener el formulario contenedor para validar */
    const form = modalEditar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#editar-categoria-nombre': {
            required: true,                                                        // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                               // Mensaje personalizado
            minLength: 2,                                                          // Mínimo 2 caracteres
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores actualizados de los inputs */
    const nombre = inputNombreEditar.value.trim();                                 // Nombre actualizado
    const descripcion = inputDescEditar.value.trim() || null;                      // Descripción actualizada
    const estado = selectEstadoEditar.value === 'true';                            // Estado convertido a boolean

    try {
        /* Enviar petición PUT al backend para actualizar la categoría */
        const respuesta = await actualizarCategoria(categoriaEditandoId, {
            nombre,
            descripcion,
            estado,
        });

        /* Cerrar el modal de edición */
        closeModal('modal-editar-categoria');

        /* Reiniciar el ID de edición */
        categoriaEditandoId = null;

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar la tabla con los datos actualizados */
        await cargarCategorias();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al actualizar la categoría');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una confirmación y luego activa o desactiva la categoría.
 * @param {number} id - ID de la categoría
 * @param {boolean} estadoActual - Estado actual (true = activo)
 * @returns {Promise<void>}
 */
async function handleToggleEstado(id, estadoActual) {
    /* Determinar la acción a realizar para los textos del diálogo */
    const accion = estadoActual ? 'desactivar' : 'activar';                        // Texto de la acción
    const accionPasada = estadoActual ? 'desactivada' : 'activada';                // Texto en pasado para éxito

    /* Mostrar diálogo de confirmación con SweetAlert2 */
    const resultado = await Swal.fire({
        icon: 'warning',                                                           // Ícono de advertencia
        iconColor: '#E42727',                                                      // Color rojo del ícono
        title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} categoría?`,  // Título capitalizado
        text: estadoActual
            ? 'La categoría dejará de estar disponible.'                            // Mensaje para desactivar
            : 'La categoría volverá a estar disponible.',                           // Mensaje para activar
        showCancelButton: true,                                                    // Mostrar botón cancelar
        confirmButtonText: accion.charAt(0).toUpperCase() + accion.slice(1),       // Texto del botón confirmar
        cancelButtonText: 'Cancelar',                                              // Texto del botón cancelar
        reverseButtons: true,                                                      // Cancelar a la izquierda
        customClass: {
            confirmButton: 'swal-btn swal-btn--confirmar',                         // Clase CSS del botón confirmar
            cancelButton: 'swal-btn swal-btn--cancelar',                           // Clase CSS del botón cancelar
            popup: 'swal-popup swal-popup--eliminar',                              // Clase CSS del popup
        },
        buttonsStyling: false,                                                     // Usar CSS personalizado
    });

    /* Si el usuario canceló, no hacer nada */
    if (!resultado.isConfirmed) return;

    try {
        /* Enviar PATCH al backend con el nuevo estado (invertido) */
        const respuesta = await toggleEstadoCategoria(id, !estadoActual);

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || `Categoría ${accionPasada} exitosamente`);

        /* Recargar la tabla con los datos actualizados */
        await cargarCategorias();
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cambiar el estado');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Delegación de Eventos en la Tabla ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja los clics en los botones de acción de la tabla (editar y toggle).
 * Usa delegación de eventos en el tbody para manejar filas dinámicas.
 * @param {Event} e - Evento de clic
 */
function handleAccionesTabla(e) {
    /* Buscar el enlace de acción más cercano al clic */
    const boton = e.target.closest('[data-accion]');

    /* Si no se hizo clic en un botón de acción, salir */
    if (!boton) return;

    /* Obtener la acción y el ID de la categoría desde los data attributes */
    const accion = boton.dataset.accion;                                           // 'editar' o 'toggle'
    const id = parseInt(boton.dataset.id);                                         // ID de la categoría

    /* Ejecutar la acción correspondiente */
    if (accion === 'editar') {
        /* Abrir el modal de edición con los datos de la categoría */
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
 * Punto de entrada de la página de categorías.
 * Se ejecuta cuando el DOM está completamente cargado.
 * Conecta todos los event listeners y carga los datos iniciales.
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ===== Event Listeners del Modal Agregar ===== */

    /* Botón "Guardar" del modal de agregar → crear categoría */
    btnGuardar.addEventListener('click', handleCrear);

    /* ===== Event Listeners del Modal Editar ===== */

    /* Botón "Guardar cambios" del modal de editar → actualizar categoría */
    btnActualizar.addEventListener('click', handleActualizar);

    /* ===== Event Listeners de la Tabla ===== */

    /* Delegación de eventos para los botones de acción en las filas */
    tbody.addEventListener('click', handleAccionesTabla);

    /* ===== Event Listeners de Búsqueda y Filtro ===== */

    /* Filtrar la tabla en tiempo real mientras el usuario escribe en el buscador */
    inputBusqueda.addEventListener('input', renderizarTabla);

    /* Filtrar la tabla cuando cambia el select de estado */
    selectEstado.addEventListener('change', renderizarTabla);

    /* ===== Carga Inicial de Datos ===== */

    /* Cargar las categorías desde el backend y renderizar la tabla */
    cargarCategorias();
});
