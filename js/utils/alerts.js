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
