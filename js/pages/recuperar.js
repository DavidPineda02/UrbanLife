/* ========================================================================== */
/* ===== PÁGINA DE RECUPERACIÓN DE CONTRASEÑA ============================== */
/* ========================================================================== */

/**
 * Controlador de la página de recuperación de contraseña.
 * Envía el correo al backend para que genere un enlace de recuperación.
 */

import { validateForm, initValidacionVisual } from '../utils/formValidation.js'; // Validación de formularios
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';     // Alertas SweetAlert2
import { forgotPassword } from '../api/services/auth.service.js';                // Servicio de recuperación

/* ========================================================================== */
/* ----- Helpers de validación visual -------------------------------------- */
/* ========================================================================== */

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

document.addEventListener('DOMContentLoaded', () => {

    const form      = document.querySelector('.formulario__form');  // Formulario de recuperación
    const btnSubmit = document.getElementById('btn-recuperar');     // Botón "Enviar Enlace"

    /* Activar validación visual en tiempo real */
    initValidacionVisual(form, {
        '#email': { email: true }, // Email: validar formato en tiempo real
    });

    /* Manejar envío del formulario */
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevenir recarga de la página

        /* Limpiar errores previos */
        form.querySelectorAll('.formulario__input--error').forEach(input => {
            input.classList.remove('formulario__input--error'); // Quitar clase de error
        });

        /* ----- Validación client-side ----- */
        const { valido, errores } = validateForm(form, {
            '#email': {
                required: true,                         // Campo obligatorio
                requiredMsg: 'El correo es requerido',  // Mensaje si está vacío
                email: true,                            // Validar formato de email
            },
        });

        if (!valido) {
            mostrarAlertaError('Campo inválido', errores.join('<br>')); // Mostrar errores en alerta
            return;                                                     // No enviar al backend
        }

        /* ----- Envío al backend ----- */
        btnSubmit.disabled = true;                                                         // Deshabilitar botón
        btnSubmit.classList.add('boton--cargando');                                         // Estado de carga
        btnSubmit.innerHTML = '<span class="boton__spinner"></span>Enviando enlace...';     // Spinner

        try {
            const data = await forgotPassword(                                             // Llamar servicio
                form.querySelector('#email').value.trim(),                                  // Email sin espacios
            );
            await mostrarAlertaExito(data.message || 'Enlace enviado correctamente');       // Alerta de éxito
            window.location.href = '../index.html';                                        // Redirigir al login

        } catch (error) {
            console.error('[ForgotPassword] Error:', error);                                           // Log en consola
            mostrarAlertaError('Error', error.message || 'No se pudo procesar la solicitud');           // Alerta de error
            marcarError(form, '#email');                                                                // Marcar input de email
            btnSubmit.disabled = false;                                                                // Rehabilitar botón
            btnSubmit.classList.remove('boton--cargando');                                              // Quitar estado de carga
            btnSubmit.textContent = 'Enviar Enlace de Recuperación';                                   // Restaurar texto
        }
    });

});
