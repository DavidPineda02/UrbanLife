/* ========================================================================== */
/* ===== PÁGINA DE NUEVA CONTRASEÑA ======================================== */
/* ========================================================================== */

/**
 * Controlador de la página para restablecer la contraseña.
 * Valida el token de recuperación de la URL, permite ingresar una nueva
 * contraseña y la envía al backend.
 */

import { validateForm, evaluarFuerzaPassword, initValidacionVisual } from '../utils/formValidation.js'; // Validación de formularios
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';                            // Alertas SweetAlert2
import { validarTokenRecuperacion, resetPassword } from '../api/services/auth.service.js';              // Servicios de recuperación
import { initPasswordToggle } from '../utils/auth.js';                                                  // Toggle mostrar/ocultar contraseña

/** 8-20 chars, al menos una mayúscula, una minúscula, un dígito, sin espacios */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{8,20}$/;

/* ========================================================================== */
/* ----- Helpers de validación visual -------------------------------------- */
/* ========================================================================== */

/**
 * Bloquea el ingreso de espacios en un input.
 * Cubre: tecla Space, pegado con Ctrl+V y cualquier otro método de entrada.
 * @param {HTMLInputElement} input - Campo al que se le bloquean los espacios
 */
function bloquearEspacios(input) {
    if (!input) return;                                       // Si no existe el input, salir

    /* Prevenir la tecla espacio */
    input.addEventListener('keydown', (e) => {
        if (e.key === ' ') e.preventDefault();                // Bloquear tecla Space
    });

    /* Limpiar espacios pegados con Ctrl+V u otro método */
    input.addEventListener('input', () => {
        const pos = input.selectionStart;                     // Guardar posición del cursor
        const sinEspacios = input.value.replace(/ /g, '');    // Eliminar todos los espacios
        if (sinEspacios !== input.value) {                    // Si había espacios
            input.value = sinEspacios;                        // Actualizar valor sin espacios
            input.setSelectionRange(pos - 1, pos - 1);       // Restaurar posición del cursor
        }
    });
}

/**
 * Marca uno o más inputs con borde rojo (estado de error).
 * Se auto-limpia cuando el usuario vuelve a escribir en el campo.
 * @param {HTMLFormElement} form - Formulario padre
 * @param {...string}       ids  - Selectores CSS de los inputs a marcar
 */
function marcarError(form, ...ids) {
    ids.forEach(id => {
        const input = form.querySelector(id);                                // Buscar el input por selector
        if (!input) return;                                                  // Si no existe, saltar
        input.classList.remove('formulario__input--valido');                  // Quitar estado válido
        input.classList.add('formulario__input--error');                      // Agregar estado de error
        input.addEventListener('input', () => {                              // Al volver a escribir
            input.classList.remove('formulario__input--error');               // Quitar estado de error
        }, { once: true });                                                  // Solo una vez
    });
}

/* ========================================================================== */
/* ----- Inicialización al cargar el DOM ----------------------------------- */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {

    const form      = document.querySelector('.formulario__form');  // Formulario de nueva contraseña
    const btnSubmit = document.getElementById('btn-nueva-password'); // Botón "Restablecer Contraseña"

    /* ================================================================== */
    /* ----- Leer y validar el token de la URL -------------------------- */
    /* ================================================================== */

    const params = new URLSearchParams(window.location.search); // Leer query params de la URL
    const token  = params.get('token');                         // Extraer el token de recuperación

    /* Si no hay token en la URL, redirigir a la página de recuperación */
    if (!token) {
        await mostrarAlertaError('Enlace inválido', 'Enlace de recuperación inválido. Solicita uno nuevo.'); // Alerta
        window.location.href = '../view/recuperar.html';                                                      // Redirigir
        return;                                                                                               // Detener ejecución
    }

    /* Validar que el token sea válido y no haya expirado */
    try {
        await validarTokenRecuperacion(token);                  // Llamar al backend para validar
    } catch (error) {
        await mostrarAlertaError('Enlace expirado', error.message || 'El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.');
        window.location.href = '/view/recuperar.html';          // Redirigir a recuperación
        return;                                                 // Detener ejecución
    }

    /* ----- Inicializar componentes de la página ----- */
    initPasswordToggle(); // Activar toggle de mostrar/ocultar contraseña

    /* Activar validación visual en tiempo real */
    initValidacionVisual(form, {
        '#password':         { regex: PASSWORD_REGEX }, // Contraseña: validar con regex
        '#confirm-password': { match: '#password' },    // Confirmación: debe coincidir
    });

    /* ----- Bloquear espacios en ambos campos de contraseña ----- */
    bloquearEspacios(form.querySelector('#password'));         // Sin espacios en contraseña
    bloquearEspacios(form.querySelector('#confirm-password')); // Sin espacios en confirmación

    /* ================================================================== */
    /* ----- Barra de fuerza de contraseña ------------------------------ */
    /* ================================================================== */

    const passwordInput   = form.querySelector('#password');            // Input de contraseña
    const fuerzaContainer = document.getElementById('fuerza-password'); // Contenedor de la barra
    const fuerzaProgreso  = document.getElementById('fuerza-progreso'); // Barra de progreso
    const fuerzaTexto     = document.getElementById('fuerza-texto');    // Texto de nivel

    /* Evaluar fuerza en cada tecla */
    passwordInput.addEventListener('input', () => {
        const valor = passwordInput.value;                              // Obtener valor actual

        if (!valor) {                                                   // Si está vacío
            fuerzaContainer.style.display = 'none';                     // Ocultar barra de fuerza
            return;
        }

        const { nivel, porcentaje, color } = evaluarFuerzaPassword(valor); // Evaluar fuerza
        fuerzaContainer.style.display   = 'block';                         // Mostrar contenedor
        fuerzaProgreso.style.width      = `${porcentaje}%`;                // Ancho de la barra
        fuerzaProgreso.style.background = color;                           // Color según nivel
        fuerzaTexto.textContent         = nivel;                           // Texto: Débil/Media/Fuerte
        fuerzaTexto.style.color         = color;                           // Color del texto
    });

    /* ================================================================== */
    /* ----- Envío del formulario --------------------------------------- */
    /* ================================================================== */

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevenir recarga de la página

        /* Limpiar errores previos */
        form.querySelectorAll('.formulario__input--error').forEach(input => {
            input.classList.remove('formulario__input--error'); // Quitar clase de error
        });

        /* ----- Validación client-side (coincide con el backend) ----- */
        const { valido, errores } = validateForm(form, {
            '#password': {
                required: true,                             // Campo obligatorio
                requiredMsg: 'La contraseña es requerida',  // Mensaje si está vacío
                pattern: {
                    regex: PASSWORD_REGEX,                   // Regex de contraseña segura
                    mensaje: 'La contraseña debe tener entre 8 y 20 caracteres, sin espacios, una mayúscula, una minúscula y un número',
                },
            },
            '#confirm-password': {
                required: true,                                     // Campo obligatorio
                requiredMsg: 'Confirmar la contraseña es requerido', // Mensaje si está vacío
                match: '#password',                                 // Debe coincidir con password
                matchMsg: 'Las contraseñas no coinciden',           // Mensaje si no coinciden
            },
        });

        if (!valido) {
            mostrarAlertaError('Campos inválidos', errores.join('<br>')); // Mostrar errores en alerta
            return;                                                       // No enviar al backend
        }

        /* ----- Envío al backend ----- */
        btnSubmit.disabled = true;                                                          // Deshabilitar botón
        btnSubmit.classList.add('boton--cargando');                                          // Estado de carga
        btnSubmit.innerHTML = '<span class="boton__spinner"></span>Restableciendo...';       // Spinner

        try {
            const data = await resetPassword(token, form.querySelector('#password').value);  // Enviar nueva contraseña
            await mostrarAlertaExito(data.message || '¡Contraseña restablecida!');           // Alerta de éxito
            window.location.href = '/';                                                     // Redirigir al login

        } catch (error) {
            console.error('[ResetPassword] Error:', error);                                             // Log en consola
            mostrarAlertaError('Error', error.message || 'No se pudo restablecer la contraseña');        // Alerta de error
            marcarError(form, '#password');                                                              // Marcar input de contraseña
            btnSubmit.disabled = false;                                                                 // Rehabilitar botón
            btnSubmit.classList.remove('boton--cargando');                                               // Quitar estado de carga
            btnSubmit.textContent = 'Restablecer Contraseña';                                           // Restaurar texto
        }
    });

});
