/* ========================================================================== */
/* ===== PÁGINA DE RECUPERACIÓN DE CONTRASEÑA ============================== */
/* ========================================================================== */

import { forgotPassword } from '../api/services/auth.service.js';

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

document.addEventListener('DOMContentLoaded', () => {

    const form      = document.querySelector('.formulario__form');
    const btnSubmit = document.getElementById('btn-recuperar');
    initValidacionVisual(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        form.querySelectorAll('.formulario__input--error').forEach(el => el.classList.remove('formulario__input--error'));

        btnSubmit.disabled = true;
        btnSubmit.classList.add('boton--cargando');
        btnSubmit.innerHTML = '<span class="boton__spinner"></span>Enviando enlace...';

        try {
            const data = await forgotPassword(
                form.querySelector('#email').value.trim(),
            );
            alert(data.message);
            window.location.href = '../index.html';

        } catch (error) {
            console.error('[ForgotPassword] Error:', error);
            alert(error.message || 'Error al procesar la solicitud');
            marcarError(form, '#email');
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('boton--cargando');
            btnSubmit.textContent = 'Enviar Enlace de Recuperación';
        }
    });

});
