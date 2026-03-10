/* ========================================================================== */
/* ===== AUTH SERVICE ======================================================= */
/* ========================================================================== */

/**
 * Servicio de autenticación.
 * Conecta las páginas de login/registro con los endpoints del backend.
 *
 * Respuesta del backend (POST /auth/login):
 *  { success, message, token, nombre, apellido, correo, rol }
 */

import { post, get } from '../client.js';
import { ENDPOINTS } from '../endpoints.js';
import { guardarSesion, limpiarSesion } from '../../store/auth.store.js';

/* -------------------------------------------------------------------------- */
/* ----- Login -------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Autentica al usuario con correo y contraseña.
 * Si el login es exitoso, guarda el token y los datos del usuario en localStorage.
 *
 * @param {string} correo
 * @param {string} contrasena
 * @returns {Promise<Object>} Datos del usuario autenticado
 * @throws {{ status: number, message: string }}
 */
export async function login(correo, contrasena) {
    const data = await post(ENDPOINTS.AUTH.LOGIN, { correo, contrasena });

    /* El backend responde con success: false en credenciales incorrectas */
    if (!data.success) {
        throw { status: 401, message: data.message || 'Credenciales incorrectas' };
    }

    /* Guardar sesión en localStorage */
    guardarSesion(data.token, {
        nombre:   data.nombre,
        apellido: data.apellido,
        correo:   data.correo,
        rol:      data.rol,
    });

    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Register ----------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Registra un nuevo usuario con rol EMPLEADO y hace auto-login.
 * Si el registro es exitoso, guarda el token en localStorage igual que el login.
 *
 * Request:  { nombre, apellido, correo, contrasena }
 * Response: { success, message, token, nombre, apellido, correo, rol }
 *
 * @param {string} nombre
 * @param {string} apellido
 * @param {string} correo
 * @param {string} contrasena
 * @returns {Promise<Object>} Datos del usuario registrado
 * @throws {{ status: number, message: string }}
 */
export async function register(nombre, apellido, correo, contrasena) {
    const data = await post(ENDPOINTS.AUTH.REGISTER, { nombre, apellido, correo, contrasena });

    if (!data.success) {
        throw { status: data.status ?? 400, message: data.message || 'Error al registrar usuario' };
    }

    /* Auto-login: guardar sesión igual que en login */
    guardarSesion(data.token, {
        nombre:   data.nombre,
        apellido: data.apellido,
        correo:   data.correo,
        rol:      data.rol,
    });

    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Google Login ------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Autentica al usuario con un Google ID Token (credential).
 * El credential lo provee Google Identity Services (GSI) mediante su callback.
 *
 * Request:  { credential: "<Google ID Token>" }
 * Response: { success, message, token, nombre, apellido, correo, rol }
 *
 * @param {string} credential  Google ID Token recibido del callback de GSI
 * @returns {Promise<Object>} Datos del usuario autenticado
 * @throws {{ status: number, message: string }}
 */
export async function loginConGoogle(credential) {
    const data = await post(ENDPOINTS.AUTH.GOOGLE, { credential });

    if (!data.success) {
        throw { status: data.status ?? 401, message: data.message || 'Error al autenticar con Google' };
    }

    guardarSesion(data.token, {
        nombre:   data.nombre,
        apellido: data.apellido,
        correo:   data.correo,
        rol:      data.rol,
    });

    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Logout ------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Cierra la sesión eliminando los datos del localStorage y redirige al login.
 */
export function logout() {
    limpiarSesion();
    window.location.href = '/';
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Perfil ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los datos del usuario autenticado desde el backend.
 * Requiere token válido en localStorage.
 *
 * @returns {Promise<{ success: boolean, userId: string, correo: string, rol: string }>}
 */
export async function obtenerPerfil() {
    return await get(ENDPOINTS.AUTH.ME);
}

/* -------------------------------------------------------------------------- */
/* ----- Recuperar Contraseña ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Solicita el envío de un correo con el enlace de recuperación de contraseña.
 * El backend siempre responde con success:true aunque el correo no exista
 * (medida de seguridad contra enumeración de usuarios).
 *
 * Request:  { correo }
 * Response: { success, message }
 *
 * @param {string} correo
 * @returns {Promise<Object>}
 * @throws {{ status: number, message: string }}
 */
export async function forgotPassword(correo) {
    const data = await post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { correo });

    if (!data.success) {
        throw { status: data.status ?? 400, message: data.message || 'Error al procesar la solicitud' };
    }

    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Validar Token de Recuperación -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Valida que el token de recuperación recibido por URL sea válido y no haya expirado.
 *
 * Response válido:   { success: true, idToken, usuarioId }
 * Response inválido: { success: false, message }
 *
 * @param {string} token  Token de recuperación extraído de los query params de la URL
 * @returns {Promise<{ success: boolean, idToken: number, usuarioId: number }>}
 * @throws {{ status: number, message: string }}
 */
export async function validarTokenRecuperacion(token) {
    const data = await get(`${ENDPOINTS.AUTH.RESET_PASSWORD_VALIDATE}?token=${encodeURIComponent(token)}`);

    if (!data.success) {
        throw { status: 400, message: data.message || 'Token inválido o expirado' };
    }

    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Restablecer Contraseña --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Restablece la contraseña del usuario usando el token de recuperación.
 *
 * Request:  { token, contrasena }
 * Response: { success, message }
 *
 * @param {string} token      Token de recuperación de la URL
 * @param {string} contrasena Nueva contraseña (debe cumplir la política del backend)
 * @returns {Promise<Object>}
 * @throws {{ status: number, message: string }}
 */
export async function resetPassword(token, contrasena) {
    const data = await post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, contrasena });

    if (!data.success) {
        throw { status: data.status ?? 400, message: data.message || 'Error al restablecer la contraseña' };
    }

    return data;
}
