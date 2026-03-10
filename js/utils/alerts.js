/* ========================================================================== */
/* ===== SISTEMA DE ALERTAS CON SWEETALERT2 ================================= */
/* ========================================================================== */

/**
 * Maneja alertas de confirmación y éxito usando SweetAlert2.
 *
 * Atributos HTML esperados:
 * - data-swal-ok="Mensaje"    → cierra el modal activo y muestra éxito
 * - data-swal-delete          → muestra confirmación de eliminación
 */

import Swal from 'sweetalert2';
import { closeAllModals } from './modal.js';

/* -------------------------------------------------------------------------- */
/* ----- Configuración base de Swal ---------------------------------------- */
/* -------------------------------------------------------------------------- */

const SWAL_BASE = {
    customClass: {
        confirmButton: 'swal-btn swal-btn--confirmar',
        cancelButton:  'swal-btn swal-btn--cancelar',
    },
    buttonsStyling: false,
};

/* -------------------------------------------------------------------------- */
/* ----- Inicialización ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* ----- Alerta de Éxito ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una alerta de éxito con el mensaje recibido.
 * Se auto-cierra después de 1.8 segundos.
 * @param {string} titulo - Mensaje a mostrar (usa el `message` del backend)
 * @returns {Promise} Resuelve cuando el Swal se cierra
 */
export function mostrarAlertaExito(titulo) {
    return Swal.fire({
        ...SWAL_BASE,
        customClass: {
            ...SWAL_BASE.customClass,
            popup: 'swal-popup swal-popup--exito',
        },
        icon: 'success',
        iconColor: '#00b894',
        title: titulo,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Alerta de Error ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una alerta de error con el mensaje recibido.
 * Requiere confirmación del usuario para cerrar.
 * @param {string}      titulo - Título principal del alert
 * @param {string|null} html   - Contenido HTML opcional (ej: lista de errores de validación)
 * @returns {Promise} Resuelve cuando el usuario confirma
 */
export function mostrarAlertaError(titulo, html = null) {
    return Swal.fire({
        ...SWAL_BASE,
        customClass: {
            ...SWAL_BASE.customClass,
            popup: 'swal-popup swal-popup--eliminar',
        },
        icon: 'error',
        iconColor: '#E42727',
        title: titulo,
        ...(html ? { html } : {}),
        confirmButtonText: 'Entendido',
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización (data attributes) ----------------------------------- */
/* -------------------------------------------------------------------------- */

export function initAlerts() {
    document.addEventListener('click', async (e) => {

        /* ===== Botón de GUARDAR / ACTUALIZAR → éxito ===== */
        const okBtn = e.target.closest('[data-swal-ok]');
        if (okBtn) {
            e.preventDefault();
            const mensaje = okBtn.getAttribute('data-swal-ok');
            closeAllModals();
            Swal.fire({
                ...SWAL_BASE,
                customClass: {
                    ...SWAL_BASE.customClass,
                    popup: 'swal-popup swal-popup--exito',
                },
                icon: 'success',
                iconColor: '#00b894',
                title: mensaje,
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
            });
            return;
        }

        /* ===== Botón de ELIMINAR → confirmación ===== */
        const delBtn = e.target.closest('[data-swal-delete]');
        if (delBtn) {
            e.preventDefault();
            const titulo = delBtn.getAttribute('data-swal-delete-titulo') || '¿Eliminar este registro?';
            const texto  = delBtn.getAttribute('data-swal-delete-texto')  || 'Esta acción no se puede deshacer.';

            const result = await Swal.fire({
                ...SWAL_BASE,
                customClass: {
                    ...SWAL_BASE.customClass,
                    popup: 'swal-popup swal-popup--eliminar',
                },
                icon: 'warning',
                iconColor: '#E42727',
                title: titulo,
                text: texto,
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
            });

            if (result.isConfirmed) {
                Swal.fire({
                    ...SWAL_BASE,
                    customClass: {
                        ...SWAL_BASE.customClass,
                        popup: 'swal-popup swal-popup--exito',
                    },
                    icon: 'success',
                    iconColor: '#00b894',
                    title: '¡Eliminado con éxito!',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                });
            }
        }
    });
}
