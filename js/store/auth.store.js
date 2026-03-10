/* ========================================================================== */
/* ===== AUTH STORE ========================================================= */
/* ========================================================================== */

/**
 * Gestión del estado de autenticación en el cliente.
 * Guarda y lee el JWT y los datos del usuario desde localStorage.
 *
 * Claves usadas:
 *  - 'ul_token'   → JWT string
 *  - 'ul_usuario' → JSON del usuario { nombre, apellido, correo, rol }
 */

const TOKEN_KEY   = 'ul_token';
const USUARIO_KEY = 'ul_usuario';

/* -------------------------------------------------------------------------- */
/* ----- Guardar Sesión ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Persiste el token JWT y los datos del usuario tras un login exitoso.
 * @param {string} token   - JWT recibido del backend
 * @param {Object} usuario - { nombre, apellido, correo, rol }
 */
export function guardarSesion(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

/* -------------------------------------------------------------------------- */
/* ----- Leer Token --------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Retorna el JWT guardado o null si no existe.
 * @returns {string|null}
 */
export function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/* -------------------------------------------------------------------------- */
/* ----- Leer Usuario ------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Retorna el objeto del usuario autenticado o null.
 * @returns {{ nombre: string, apellido: string, correo: string, rol: string }|null}
 */
export function obtenerUsuario() {
    const data = localStorage.getItem(USUARIO_KEY);
    return data ? JSON.parse(data) : null;
}

/* -------------------------------------------------------------------------- */
/* ----- Leer Rol ----------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Retorna el rol del usuario: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLEADO' | null
 * @returns {string|null}
 */
export function obtenerRol() {
    return obtenerUsuario()?.rol ?? null;
}

/* -------------------------------------------------------------------------- */
/* ----- Verificar Sesión Activa -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Retorna true si hay un token guardado (sesión activa).
 * @returns {boolean}
 */
export function estaAutenticado() {
    return !!obtenerToken();
}

/* -------------------------------------------------------------------------- */
/* ----- Limpiar Sesión ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina el token y los datos del usuario (logout).
 */
export function limpiarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
}
