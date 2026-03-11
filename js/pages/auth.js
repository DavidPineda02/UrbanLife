/* ========================================================================== */
/* ===== PÁGINA DE AUTENTICACIÓN =========================================== */
/* ========================================================================== */

import { evaluarFuerzaPassword } from '../utils/formValidation.js';
import { login, register, loginConGoogle } from '../api/services/auth.service.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ========================================================================== */
/* ----- Helpers de validación visual -------------------------------------- */
/* ========================================================================== */

/**
 * Bloquea el ingreso de espacios en un input.
 * Cubre: tecla Space, pegado con Ctrl+V y cualquier otro método de entrada.
 * @param {HTMLInputElement} input
 */
function bloquearEspacios(input) {
    if (!input) return;
    // Bloquear la tecla espacio directamente
    input.addEventListener('keydown', (e) => {
        if (e.key === ' ') e.preventDefault();
    });
    // Limpiar espacios en cualquier evento de entrada (pegado, autocompletar, etc.)
    input.addEventListener('input', () => {
        const pos = input.selectionStart;
        const sinEspacios = input.value.replace(/ /g, '');
        if (sinEspacios !== input.value) {
            input.value = sinEspacios;
            // Restaurar la posición del cursor ajustada por los espacios eliminados
            input.setSelectionRange(pos - 1, pos - 1);
        }
    });
}

/** Marca uno o más inputs en rojo y limpia el verde */
function marcarError(form, ...ids) {
    ids.forEach(id => {
        const el = form.querySelector(id);
        if (!el) return;
        el.classList.remove('formulario__input--valido');
        el.classList.add('formulario__input--error');
        el.addEventListener('input', () => {
            el.classList.remove('formulario__input--error');
        }, { once: true });
    });
}

/** Elimina todos los estados de error del formulario */
function limpiarErrores(form) {
    form.querySelectorAll('.formulario__input--error').forEach(el => {
        el.classList.remove('formulario__input--error');
    });
}

/**
 * Aplica feedback visual en tiempo real: verde al perder el foco si el campo
 * está completo y sin error; quita verde mientras el campo esté en error.
 */
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

/**
 * Mapea el mensaje de error del backend al/los input(s) correspondiente(s).
 * Cubre todos los mensajes posibles de AuthService y UserService.
 * @param {HTMLFormElement} form
 * @param {string} mensaje - Mensaje retornado por el backend
 */
function mapearErrorAInput(form, mensaje) {
    const msg = (mensaje || '').toLowerCase();

    /* ----- Nombre ----- */
    if (msg.includes('nombre') && !msg.includes('apellido')) {
        marcarError(form, '#nombre');
        return;
    }

    /* ----- Apellido ----- */
    if (msg.includes('apellido')) {
        marcarError(form, '#apellido');
        return;
    }

    /* ----- Correo ----- */
    if (msg.includes('correo') || msg.includes('email')) {
        marcarError(form, '#email');
        return;
    }

    /* ----- Contraseña ----- */
    if (msg.includes('contraseña') || msg.includes('password')) {
        marcarError(form, '#password');
        return;
    }

    /* ----- Credenciales inválidas (login: ambos campos) ----- */
    if (msg.includes('credenciales') || msg.includes('inválidas')) {
        marcarError(form, '#email', '#password');
        return;
    }

    /* ----- Cuenta Google / inactivo → solo correo ----- */
    if (msg.includes('google') || msg.includes('inactivo')) {
        marcarError(form, '#email');
        return;
    }

    /* ----- Fallback: marcar todos los campos disponibles ----- */
    const campos = ['#nombre', '#apellido', '#email', '#password'];
    const existentes = campos.filter(id => form.querySelector(id));
    marcarError(form, ...existentes);
}

/* ========================================================================== */
/* ----- Relay de token OAuth2 (se ejecuta dentro del popup de Google) ------ */
/* ========================================================================== */

/**
 * Cuando Google redirige el popup de vuelta a nuestro origen con #id_token=...,
 * este código detecta que estamos en el popup, envía el token a la ventana
 * principal con postMessage y cierra el popup automáticamente.
 */
(function relayGoogleToken() {
    if (!window.opener) return;

    const hash   = new URLSearchParams(window.location.hash.slice(1));
    const token  = hash.get('id_token');
    if (!token) return;

    window.opener.postMessage({ googleIdToken: token }, window.location.origin);
    window.close();
})();

/* ========================================================================== */
/* ----- Google Sign-In — popup real de selección de cuentas --------------- */
/* ========================================================================== */

function initGoogleSignIn() {
    const btnGoogle = document.getElementById('btn-google');
    if (!btnGoogle || !GOOGLE_CLIENT_ID) return;

    window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        if (!event.data?.googleIdToken) return;
        await handleGoogleCredential({ credential: event.data.googleIdToken });
    });

    btnGoogle.addEventListener('click', () => {
        const nonce  = Math.random().toString(36).substring(2, 18);
        const params = new URLSearchParams({
            client_id:     GOOGLE_CLIENT_ID,
            redirect_uri:  window.location.origin + '/',
            response_type: 'id_token',
            scope:         'openid email profile',
            nonce,
        });

        const ancho  = 500;
        const alto   = 600;
        const left   = Math.round((screen.width  - ancho) / 2);
        const top    = Math.round((screen.height - alto)  / 2);

        window.open(
            `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
            'google-oauth',
            `width=${ancho},height=${alto},left=${left},top=${top},resizable=yes,scrollbars=yes`,
        );
    });
}

async function handleGoogleCredential(response) {
    try {
        const data = await loginConGoogle(response.credential);
        alert(data.message || '¡Bienvenido!');
        window.location.href = '/view/home.html';
    } catch (error) {
        console.error('[Google Auth] Error:', error);
        alert(error.message || 'Error al autenticar con Google');
    }
}

/* ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    initGoogleSignIn();

    /* ------------------------------------------------------------------ */
    /* ----- Formulario de Login ---------------------------------------- */
    /* ------------------------------------------------------------------ */

    const btnLogin = document.getElementById('btn-login');

    if (btnLogin) {
        const form = document.querySelector('.formulario__form');
        initValidacionVisual(form);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            limpiarErrores(form);

            btnLogin.disabled = true;
            btnLogin.classList.add('boton--cargando');
            btnLogin.innerHTML = '<span class="boton__spinner"></span>Iniciando sesión...';

            try {
                const data = await login(
                    form.querySelector('#email').value.trim(),
                    form.querySelector('#password').value,
                );
                alert(data.message || '¡Bienvenido!');
                window.location.href = '/view/home.html';

            } catch (error) {
                console.error('[Login] Error:', error);
                alert(error.message || 'Credenciales incorrectas');
                mapearErrorAInput(form, error.message);
                btnLogin.disabled = false;
                btnLogin.classList.remove('boton--cargando');
                btnLogin.textContent = 'Iniciar Sesión';
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /* ----- Formulario de Registro ------------------------------------- */
    /* ------------------------------------------------------------------ */

    const btnRegister = document.getElementById('btn-register');

    if (btnRegister) {
        const form = document.querySelector('.formulario__form');
        initValidacionVisual(form);

        /* ----- Bloquear espacios en nombre, apellido y contraseñas ----- */
        bloquearEspacios(form.querySelector('#nombre'));
        bloquearEspacios(form.querySelector('#apellido'));
        bloquearEspacios(form.querySelector('#password'));
        bloquearEspacios(form.querySelector('#confirm-password'));

        /* ----- Barra de fuerza de contraseña ----- */
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
            fuerzaContainer.style.display = 'block';
            fuerzaProgreso.style.width      = `${porcentaje}%`;
            fuerzaProgreso.style.background = color;
            fuerzaTexto.textContent         = nivel;
            fuerzaTexto.style.color         = color;
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            limpiarErrores(form);

            /* Única validación client-side: las contraseñas deben coincidir */
            const pass    = form.querySelector('#password').value;
            const confirm = form.querySelector('#confirm-password').value;
            if (pass !== confirm) {
                alert('Las contraseñas no coinciden');
                marcarError(form, '#confirm-password');
                return;
            }

            btnRegister.disabled = true;
            btnRegister.classList.add('boton--cargando');
            btnRegister.innerHTML = '<span class="boton__spinner"></span>Creando cuenta...';

            try {
                const data = await register(
                    form.querySelector('#nombre').value.trim(),
                    form.querySelector('#apellido').value.trim(),
                    form.querySelector('#email').value.trim(),
                    pass,
                );
                alert(data.message || '¡Cuenta creada!');
                window.location.href = '/view/home.html';

            } catch (error) {
                console.error('[Register] Error:', error);
                alert(error.message || 'No se pudo crear la cuenta');
                mapearErrorAInput(form, error.message);
                btnRegister.disabled = false;
                btnRegister.classList.remove('boton--cargando');
                btnRegister.textContent = 'Crear Cuenta';
            }
        });
    }

});
