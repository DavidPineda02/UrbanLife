/* ========================================================================== */
/* ===== PÁGINA DE AUTENTICACIÓN =========================================== */
/* ========================================================================== */

/**
 * Controlador de las páginas de Login y Registro.
 * Maneja validación en tiempo real, envío al backend, Google Sign-In
 * y feedback visual con SweetAlert2.
 */

import { validateForm, evaluarFuerzaPassword, initValidacionVisual } from '../utils/formValidation.js'; // Validación de formularios
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';                            // Alertas SweetAlert2
import { login, register, loginConGoogle } from '../api/services/auth.service.js';                      // Servicios de autenticación
import { initPasswordToggle } from '../utils/auth.js';                                                  // Toggle mostrar/ocultar contraseña

/** ID de cliente de Google OAuth 2.0 desde las variables de entorno */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/* ========================================================================== */
/* ----- Regex que coinciden con el backend (ValidationHelper.java) --------- */
/* ========================================================================== */

/** Solo letras (incluye acentos y ñ), sin espacios ni números */
const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+$/;

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
 * Mapea el mensaje de error del backend al/los input(s) correspondiente(s).
 * Analiza el texto del mensaje para determinar qué campo marcar en rojo.
 * @param {HTMLFormElement} form    - Formulario que contiene los inputs
 * @param {string}          mensaje - Mensaje retornado por el backend
 */
function mapearErrorAInput(form, mensaje) {
    const msg = (mensaje || '').toLowerCase(); // Convertir a minúsculas para comparación

    /* ----- Nombre ----- */
    if (msg.includes('nombre') && !msg.includes('apellido')) {
        marcarErrorVisual(form, '#nombre');    // Marcar solo nombre
        return;                                // Salir después del primer match
    }

    /* ----- Apellido ----- */
    if (msg.includes('apellido')) {
        marcarErrorVisual(form, '#apellido');  // Marcar solo apellido
        return;
    }

    /* ----- Correo ----- */
    if (msg.includes('correo') || msg.includes('email')) {
        marcarErrorVisual(form, '#email');     // Marcar campo de correo
        return;
    }

    /* ----- Contraseña ----- */
    if (msg.includes('contraseña') || msg.includes('password')) {
        marcarErrorVisual(form, '#password');  // Marcar campo de contraseña
        return;
    }

    /* ----- Credenciales inválidas (login: ambos campos) ----- */
    if (msg.includes('credenciales') || msg.includes('inválidas')) {
        marcarErrorVisual(form, '#email', '#password'); // Marcar email y contraseña
        return;
    }

    /* ----- Cuenta Google / inactivo → solo correo ----- */
    if (msg.includes('google') || msg.includes('inactivo')) {
        marcarErrorVisual(form, '#email');     // Marcar solo correo
        return;
    }

    /* ----- Fallback: marcar todos los campos disponibles ----- */
    const campos = ['#nombre', '#apellido', '#email', '#password'];   // Todos los campos posibles
    const existentes = campos.filter(id => form.querySelector(id));   // Filtrar los que existen en el form
    marcarErrorVisual(form, ...existentes);                           // Marcar todos los existentes
}

/**
 * Marca uno o más inputs con borde rojo (estado de error).
 * Se auto-limpia cuando el usuario vuelve a escribir en el campo.
 * @param {HTMLFormElement} form   - Formulario padre
 * @param {...string}       ids    - Selectores CSS de los inputs a marcar
 */
function marcarErrorVisual(form, ...ids) {
    ids.forEach(id => {
        const input = form.querySelector(id);                          // Buscar el input por selector
        if (!input) return;                                            // Si no existe, saltar
        input.classList.remove('formulario__input--valido');            // Quitar estado válido
        input.classList.add('formulario__input--error');                // Agregar estado de error
        input.addEventListener('input', () => {                        // Al volver a escribir
            input.classList.remove('formulario__input--error');         // Quitar estado de error
        }, { once: true });                                            // Solo una vez
    });
}

/**
 * Elimina todos los estados de error del formulario.
 * @param {HTMLFormElement} form - Formulario a limpiar
 */
function limpiarErrores(form) {
    form.querySelectorAll('.formulario__input--error').forEach(input => { // Buscar todos los inputs con error
        input.classList.remove('formulario__input--error');               // Quitar clase de error
    });
}

/* ========================================================================== */
/* ----- Relay de token OAuth2 (se ejecuta dentro del popup de Google) ------ */
/* ========================================================================== */

/**
 * IIFE que detecta si esta página se abrió como popup de Google OAuth.
 * Si es así, extrae el id_token del hash de la URL, lo envía a la ventana
 * padre mediante postMessage y cierra el popup.
 */
(function relayGoogleToken() {
    if (!window.opener) return;                                                  // No es un popup, salir

    const hash  = new URLSearchParams(window.location.hash.slice(1));            // Parsear el hash de la URL
    const token = hash.get('id_token');                                          // Extraer el id_token de Google
    if (!token) return;                                                          // Si no hay token, salir

    window.opener.postMessage({ googleIdToken: token }, window.location.origin); // Enviar token a la ventana padre
    window.close();                                                              // Cerrar el popup
})();

/* ========================================================================== */
/* ----- Google Sign-In — popup real de selección de cuentas --------------- */
/* ========================================================================== */

/**
 * Inicializa el flujo de Google Sign-In mediante popup OAuth 2.0.
 * Escucha mensajes del popup con el id_token y lo procesa.
 */
function initGoogleSignIn() {
    const btnGoogle = document.getElementById('btn-google');   // Botón "Continuar con Google"
    if (!btnGoogle || !GOOGLE_CLIENT_ID) return;               // Si no existe el botón o el client ID, salir

    /* Escuchar mensajes del popup de Google con el token */
    window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;   // Ignorar mensajes de otro origen (seguridad)
        if (!event.data?.googleIdToken) return;                // Ignorar si no es un token de Google
        await handleGoogleCredential({ credential: event.data.googleIdToken }); // Procesar el token
    });

    /* Abrir popup de Google al hacer clic en el botón */
    btnGoogle.addEventListener('click', () => {
        const nonce  = Math.random().toString(36).substring(2, 18); // Generar nonce aleatorio para seguridad
        const params = new URLSearchParams({                        // Parámetros OAuth 2.0
            client_id:     GOOGLE_CLIENT_ID,                        // ID de la app en Google Cloud
            redirect_uri:  window.location.origin + '/',            // URL de redirección (esta misma app)
            response_type: 'id_token',                              // Solicitar token de identidad
            scope:         'openid email profile',                  // Permisos: identidad, email y perfil
            nonce,                                                  // Nonce para prevenir ataques de replay
        });

        const ancho = 500;                                          // Ancho del popup en px
        const alto  = 600;                                          // Alto del popup en px
        const left  = Math.round((screen.width  - ancho) / 2);     // Centrar horizontalmente
        const top   = Math.round((screen.height - alto)  / 2);     // Centrar verticalmente

        /* Abrir la ventana de autenticación de Google */
        window.open(
            `https://accounts.google.com/o/oauth2/v2/auth?${params}`,                              // URL de Google OAuth
            'google-oauth',                                                                         // Nombre de la ventana
            `width=${ancho},height=${alto},left=${left},top=${top},resizable=yes,scrollbars=yes`,    // Configuración del popup
        );
    });
}

/**
 * Procesa el credential de Google: llama al backend y redirige al home.
 * @param {{ credential: string }} response - Objeto con el Google ID Token
 */
async function handleGoogleCredential(response) {
    try {
        const data = await loginConGoogle(response.credential);                                   // Enviar token al backend
        await mostrarAlertaExito(data.message || '¡Bienvenido!');                                 // Mostrar alerta de éxito
        window.location.href = '/view/home.html';                                                 // Redirigir al dashboard
    } catch (error) {
        console.error('[Google Auth] Error:', error);                                              // Log del error en consola
        mostrarAlertaError('Error de autenticación', error.message || 'Error al autenticar con Google'); // Mostrar alerta de error
    }
}

/* ========================================================================== */
/* ----- Inicialización al cargar el DOM ----------------------------------- */
/* ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    initPasswordToggle(); // Activar toggle de mostrar/ocultar contraseña
    initGoogleSignIn();   // Inicializar Google Sign-In

    /* ================================================================== */
    /* ----- Formulario de LOGIN ---------------------------------------- */
    /* ================================================================== */

    const btnLogin = document.getElementById('btn-login'); // Botón "Iniciar Sesión"

    if (btnLogin) {
        const form = document.querySelector('.formulario__form'); // Formulario de login

        /* Activar validación visual en tiempo real */
        initValidacionVisual(form, {
            '#email':    { email: true },           // Email: validar formato
            '#password': { regex: PASSWORD_REGEX },  // Contraseña: validar con regex
        });

        /* Bloquear espacios en el campo de contraseña */
        bloquearEspacios(form.querySelector('#password'));

        /* Manejar envío del formulario de login */
        form.addEventListener('submit', async (e) => {
            e.preventDefault();    // Prevenir recarga de la página
            limpiarErrores(form);  // Limpiar errores previos

            /* ----- Validación client-side ----- */
            const { valido, errores } = validateForm(form, {
                '#email': {
                    required: true,                         // Campo obligatorio
                    requiredMsg: 'El correo es requerido',  // Mensaje si está vacío
                    email: true,                            // Validar formato de email
                },
                '#password': {
                    required: true,                             // Campo obligatorio
                    requiredMsg: 'La contraseña es requerida',  // Mensaje si está vacío
                },
            });

            if (!valido) {
                mostrarAlertaError('Campos inválidos', errores.join('<br>')); // Mostrar errores en alerta
                return;                                                       // No enviar al backend
            }

            /* ----- Envío al backend ----- */
            btnLogin.disabled = true;                                                          // Deshabilitar botón
            btnLogin.classList.add('boton--cargando');                                          // Agregar estado de carga
            btnLogin.innerHTML = '<span class="boton__spinner"></span>Iniciando sesión...';     // Mostrar spinner

            try {
                const data = await login(                                                      // Llamar al servicio de login
                    form.querySelector('#email').value.trim(),                                  // Correo sin espacios
                    form.querySelector('#password').value,                                      // Contraseña tal cual
                );
                await mostrarAlertaExito(data.message || '¡Bienvenido!');                      // Alerta de éxito
                window.location.href = '/view/home.html';                                      // Redirigir al dashboard

            } catch (error) {
                console.error('[Login] Error:', error);                                        // Log en consola
                mostrarAlertaError('Error al iniciar sesión', error.message || 'Credenciales incorrectas'); // Alerta de error
                mapearErrorAInput(form, error.message);                                        // Marcar inputs según el error
                btnLogin.disabled = false;                                                     // Rehabilitar botón
                btnLogin.classList.remove('boton--cargando');                                   // Quitar estado de carga
                btnLogin.textContent = 'Iniciar Sesión';                                       // Restaurar texto del botón
            }
        });
    }

    /* ================================================================== */
    /* ----- Formulario de REGISTRO ------------------------------------- */
    /* ================================================================== */

    const btnRegister = document.getElementById('btn-register'); // Botón "Crear Cuenta"

    if (btnRegister) {
        const form = document.querySelector('.formulario__form'); // Formulario de registro

        /* Activar validación visual en tiempo real con reglas por campo */
        initValidacionVisual(form, {
            '#nombre':           { regex: NOMBRE_REGEX, minLength: 2 }, // Solo letras, mín 2 chars
            '#apellido':         { regex: NOMBRE_REGEX, minLength: 2 }, // Solo letras, mín 2 chars
            '#email':            { email: true },                       // Formato de email
            '#password':         { regex: PASSWORD_REGEX },             // Regex de contraseña segura
            '#confirm-password': { match: '#password' },                // Debe coincidir con password
        });

        /* ----- Bloquear espacios en nombre, apellido y contraseñas ----- */
        bloquearEspacios(form.querySelector('#nombre'));           // Sin espacios en nombre
        bloquearEspacios(form.querySelector('#apellido'));         // Sin espacios en apellido
        bloquearEspacios(form.querySelector('#password'));         // Sin espacios en contraseña
        bloquearEspacios(form.querySelector('#confirm-password')); // Sin espacios en confirmación

        /* ----- Barra de fuerza de contraseña ----- */
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

        /* Manejar envío del formulario de registro */
        form.addEventListener('submit', async (e) => {
            e.preventDefault();    // Prevenir recarga de la página
            limpiarErrores(form);  // Limpiar errores previos

            /* ----- Validación client-side (coincide con el backend) ----- */
            const { valido, errores } = validateForm(form, {
                '#nombre': {
                    required: true,                                                              // Obligatorio
                    requiredMsg: 'El nombre es requerido',                                       // Mensaje vacío
                    minLength: 2,                                                                // Mínimo 2 caracteres
                    pattern: {
                        regex: NOMBRE_REGEX,                                                     // Solo letras
                        mensaje: 'El nombre solo puede contener letras (sin espacios ni números)', // Mensaje de error
                    },
                },
                '#apellido': {
                    required: true,                                                                // Obligatorio
                    requiredMsg: 'El apellido es requerido',                                       // Mensaje vacío
                    minLength: 2,                                                                  // Mínimo 2 caracteres
                    pattern: {
                        regex: NOMBRE_REGEX,                                                       // Solo letras
                        mensaje: 'El apellido solo puede contener letras (sin espacios ni números)', // Mensaje de error
                    },
                },
                '#email': {
                    required: true,                         // Obligatorio
                    requiredMsg: 'El correo es requerido',  // Mensaje vacío
                    email: true,                            // Formato de email
                },
                '#password': {
                    required: true,                             // Obligatorio
                    requiredMsg: 'La contraseña es requerida',  // Mensaje vacío
                    pattern: {
                        regex: PASSWORD_REGEX,                  // Regex de contraseña segura
                        mensaje: 'La contraseña debe tener entre 8 y 20 caracteres, sin espacios, una mayúscula, una minúscula y un número',
                    },
                },
                '#confirm-password': {
                    required: true,                                     // Obligatorio
                    requiredMsg: 'Confirmar la contraseña es requerido', // Mensaje vacío
                    match: '#password',                                 // Debe coincidir con password
                    matchMsg: 'Las contraseñas no coinciden',           // Mensaje si no coinciden
                },
            });

            if (!valido) {
                mostrarAlertaError('Campos inválidos', errores.join('<br>')); // Mostrar errores en alerta
                return;                                                       // No enviar al backend
            }

            /* ----- Envío al backend ----- */
            btnRegister.disabled = true;                                                       // Deshabilitar botón
            btnRegister.classList.add('boton--cargando');                                       // Estado de carga
            btnRegister.innerHTML = '<span class="boton__spinner"></span>Creando cuenta...';    // Spinner

            try {
                const data = await register(                                                   // Llamar servicio de registro
                    form.querySelector('#nombre').value.trim(),                                 // Nombre sin espacios
                    form.querySelector('#apellido').value.trim(),                               // Apellido sin espacios
                    form.querySelector('#email').value.trim(),                                  // Email sin espacios
                    form.querySelector('#password').value,                                      // Contraseña tal cual
                );
                await mostrarAlertaExito(data.message || '¡Cuenta creada!');                   // Alerta de éxito
                window.location.href = '/view/home.html';                                      // Redirigir al dashboard

            } catch (error) {
                console.error('[Register] Error:', error);                                     // Log en consola
                mostrarAlertaError('Error al crear cuenta', error.message || 'No se pudo crear la cuenta'); // Alerta
                mapearErrorAInput(form, error.message);                                        // Marcar inputs según error
                btnRegister.disabled = false;                                                  // Rehabilitar botón
                btnRegister.classList.remove('boton--cargando');                                // Quitar estado de carga
                btnRegister.textContent = 'Crear Cuenta';                                      // Restaurar texto del botón
            }
        });
    }

});
