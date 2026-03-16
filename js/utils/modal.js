/* ========================================================================== */
/* ===== SISTEMA DE MODALES (Reemplaza CSS :target) ========================= */
/* ========================================================================== */

/**
 * Controlador universal de modales.
 * - Abre/cierra modales con la clase .modal--activo
 * - Auto-conecta atributos data-modal-open y data-modal-close
 * - Cierra con clic en overlay y tecla Escape
 * - Previene scroll del body mientras el modal está abierto
 */

/* -------------------------------------------------------------------------- */
/* ----- Abrir Modal -------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

export function openModal(modalId) {
    /* Cierra cualquier modal abierto antes de abrir el nuevo */
    closeAllModals();

    const modal = document.getElementById(modalId);
    if (!modal) return;

    /* Agrega clase activa para mostrar el modal */
    modal.classList.add('modal--activo');

    /* Previene scroll del body */
    document.body.style.overflow = 'hidden';

    /* Guarda el elemento que tenía foco para restaurarlo al cerrar */
    modal._previousFocus = document.activeElement;

    /* Enfoca el primer elemento interactivo dentro del modal */
    const primerEnfocable = modal.querySelector(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
    );
    if (primerEnfocable) {
        setTimeout(() => primerEnfocable.focus(), 100);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Cerrar Modal ------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    /* Limpia estilos de validación de todos los inputs del modal */
    limpiarValidacionesModal(modal);

    /* Remueve clase activa para ocultar el modal */
    modal.classList.remove('modal--activo');

    /* Restaura scroll del body */
    document.body.style.overflow = '';

    /* Restaura foco al elemento anterior */
    if (modal._previousFocus) {
        modal._previousFocus.focus();
        modal._previousFocus = null;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Limpiar Validaciones del Modal ------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Limpia todos los estilos de validación dentro de un modal.
 * Remueve clases error/valid, estilos inline y mensajes de error.
 * @param {HTMLElement} modal - Elemento modal a limpiar
 */
function limpiarValidacionesModal(modal) {
    /* Limpiar inputs, selects y textareas */
    modal.querySelectorAll('input, select, textarea').forEach(input => {
        /* Remover clases de validación */
        input.classList.remove('error', 'valid', 'shake');

        /* Remover estilos inline de borde y animación */
        input.style.borderColor = '';
        input.style.animation = '';
    });

    /* Limpiar contenedores de grupo */
    modal.querySelectorAll('.formulario__grupo').forEach(grupo => {
        /* Remover clases de estado del grupo */
        grupo.classList.remove('has-error', 'has-success');
    });

    /* Remover mensajes de error */
    modal.querySelectorAll('.field-error').forEach(error => {
        error.remove();
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Cerrar Todos los Modales ------------------------------------------- */
/* -------------------------------------------------------------------------- */

export function closeAllModals() {
    const modalesActivos = document.querySelectorAll('.modal--activo');
    modalesActivos.forEach(modal => {
        /* Limpia validaciones antes de cerrar */
        limpiarValidacionesModal(modal);
        modal.classList.remove('modal--activo');
    });
    document.body.style.overflow = '';
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización Automática ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Conecta todos los disparadores de modales en la página.
 * Debe llamarse una vez al cargar el DOM (DOMContentLoaded).
 * 
 * Atributos HTML esperados:
 * - data-modal-open="id-del-modal"  → abre el modal al hacer clic
 * - data-modal-close                → cierra el modal padre al hacer clic
 */
export function initModals() {

    /* ===== Botones que ABREN modales ===== */
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-modal-open]');
        if (trigger) {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal-open');
            openModal(modalId);
        }
    });

    /* ===== Botones que CIERRAN modales ===== */
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-modal-close]');
        if (closeBtn) {
            e.preventDefault();
            const modal = closeBtn.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        }
    });

    /* ===== Clic en overlay cierra el modal ===== */
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal__overlay')) {
            e.preventDefault();
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        }
    });

    /* ===== Tecla Escape cierra el modal activo ===== */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modalActivo = document.querySelector('.modal--activo');
            if (modalActivo) {
                closeModal(modalActivo.id);
            }
        }
    });
}
