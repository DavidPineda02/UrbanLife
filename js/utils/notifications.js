/* ========================================================================== */
/* ===== SISTEMA DE NOTIFICACIONES TOAST ==================================== */
/* ========================================================================== */

/**
 * Muestra notificaciones tipo toast en la esquina superior derecha.
 * - Tipos: 'success', 'error', 'info'
 * - Se auto-cierra después de 4 segundos
 * - Apila múltiples notificaciones
 * - Animación de entrada y salida suave
 */

/* -------------------------------------------------------------------------- */
/* ----- Contenedor de Notificaciones --------------------------------------- */
/* -------------------------------------------------------------------------- */

let contenedor = null;

/**
 * Crea o retorna el contenedor principal de notificaciones.
 * Se inserta una sola vez en el DOM.
 */
function getContenedor() {
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.className = 'notificaciones';
        document.body.appendChild(contenedor);
    }
    return contenedor;
}

/* -------------------------------------------------------------------------- */
/* ----- Iconos por Tipo ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const ICONOS = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-exclamation',
    info: 'fa-solid fa-circle-info'
};

/* -------------------------------------------------------------------------- */
/* ----- Mostrar Notificación ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una notificación toast.
 * @param {string} mensaje - Texto a mostrar
 * @param {string} tipo - 'success' | 'error' | 'info'
 * @param {number} duracion - Milisegundos antes de auto-cerrar (default: 4000)
 */
export function showNotification(mensaje, tipo = 'info', duracion = 4000) {
    const cont = getContenedor();

    /* Crear el elemento de notificación */
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion--${tipo}`;

    notificacion.innerHTML = `
        <div class="notificacion__icono">
            <i class="${ICONOS[tipo] || ICONOS.info}"></i>
        </div>
        <p class="notificacion__mensaje">${mensaje}</p>
        <button class="notificacion__cerrar" type="button" aria-label="Cerrar">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    /* Insertar al principio del contenedor (arriba) */
    cont.prepend(notificacion);

    /* Animar entrada */
    requestAnimationFrame(() => {
        notificacion.classList.add('notificacion--visible');
    });

    /* Botón de cerrar */
    const btnCerrar = notificacion.querySelector('.notificacion__cerrar');
    btnCerrar.addEventListener('click', () => cerrarNotificacion(notificacion));

    /* Auto-cerrar después de la duración */
    setTimeout(() => cerrarNotificacion(notificacion), duracion);
}

/* -------------------------------------------------------------------------- */
/* ----- Cerrar Notificación ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

function cerrarNotificacion(notificacion) {
    if (!notificacion || notificacion._cerrando) return;
    notificacion._cerrando = true;

    /* Animar salida */
    notificacion.classList.add('notificacion--saliendo');

    /* Remover del DOM después de la animación */
    notificacion.addEventListener('animationend', () => {
        notificacion.remove();
    });
}
