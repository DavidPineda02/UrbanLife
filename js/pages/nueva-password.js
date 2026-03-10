/* ========================================================================== */
/* ===== PÁGINA DE NUEVA CONTRASEÑA ======================================== */
/* ========================================================================== */

import { evaluarFuerzaPassword } from '../utils/formValidation.js';
import { validarTokenRecuperacion, resetPassword } from '../api/services/auth.service.js';

function marcarError(form, ...ids) {
    ids.forEach(id => {
        const el = form.querySelector(id);
        if (!el) return;
        el.classList.remove('formulario__input--valido');
        el.classList.add('formulario__input--error');
        el.addEventListener('input', () => el.classList.remove('formulario__input--error'), { once: true });
    });
}

function initValidacionVisual(form) {
    form.querySelectorAll('.formulario__campo').forEach(el => {
        el.addEventListener('blur', () => {
            if (el.value.trim() && !el.classList.contains('formulario__input--error')) {
                el.classList.add('formulario__input--valido');
            } else {
                el.classList.remove('formulario__input--valido');
            }
        });
        el.addEventListener('input', () => {
            if (el.classList.contains('formulario__input--error')) {
                el.classList.remove('formulario__input--valido');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    const form      = document.querySelector('.formulario__form');
    const btnSubmit = document.getElementById('btn-nueva-password');

    /* ------------------------------------------------------------------ */
    /* ----- Leer y validar el token de la URL -------------------------- */
    /* ------------------------------------------------------------------ */

    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    if (!token) {
        alert('Enlace de recuperación inválido. Solicita uno nuevo.');
        window.location.href = '../view/recuperar.html';
        return;
    }

    try {
        await validarTokenRecuperacion(token);
    } catch (error) {
        alert(error.message || 'El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.');
        window.location.href = '/view/recuperar.html';
        return;
    }

    initValidacionVisual(form);

    /* ------------------------------------------------------------------ */
    /* ----- Barra de fuerza de contraseña ------------------------------ */
    /* ------------------------------------------------------------------ */

    const passwordInput   = form.querySelector('#password');
    const fuerzaContainer = document.getElementById('fuerza-password');
    const fuerzaProgreso  = document.getElementById('fuerza-progreso');
    const fuerzaTexto     = document.getElementById('fuerza-texto');

    passwordInput.addEventListener('input', () => {
        const valor = passwordInput.value;

        if (!valor) {
            fuerzaContainer.style.display = 'none';
            return;
        }

        const { nivel, porcentaje, color } = evaluarFuerzaPassword(valor);
        fuerzaContainer.style.display   = 'block';
        fuerzaProgreso.style.width      = `${porcentaje}%`;
        fuerzaProgreso.style.background = color;
        fuerzaTexto.textContent         = nivel;
        fuerzaTexto.style.color         = color;
    });

    /* ------------------------------------------------------------------ */
    /* ----- Envío del formulario --------------------------------------- */
    /* ------------------------------------------------------------------ */

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        form.querySelectorAll('.formulario__input--error').forEach(el => el.classList.remove('formulario__input--error'));

        /* Única validación client-side: confirm-password (nunca llega al backend) */
        const pass    = form.querySelector('#password').value;
        const confirm = form.querySelector('#confirm-password').value;
        if (pass !== confirm) {
            alert('Las contraseñas no coinciden');
            marcarError(form, '#confirm-password');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.classList.add('boton--cargando');
        btnSubmit.innerHTML = '<span class="boton__spinner"></span>Restableciendo...';

        try {
            const data = await resetPassword(token, pass);
            alert(data.message);
            window.location.href = '/';

        } catch (error) {
            console.error('[ResetPassword] Error:', error);
            alert(error.message || 'Error al restablecer la contraseña');
            marcarError(form, '#password');
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('boton--cargando');
            btnSubmit.textContent = 'Restablecer Contraseña';
        }
    });

});
