/* ========================================================================== */
/* ===== HTTP CLIENT BASE =================================================== */
/* ========================================================================== */

/**
 * Wrapper sobre fetch que centraliza:
 *  - La URL base del API (desde .env)
 *  - El header Authorization: Bearer <token> en cada petición
 *  - El manejo global de errores (401 → logout, 500 → error estándar)
 *
 * Uso:
 *  import { get, post, put, patch, del } from '../api/client.js';
 */

import { obtenerToken, limpiarSesion } from '../store/auth.store.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* -------------------------------------------------------------------------- */
/* ----- Función Interna de Petición --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Realiza una petición HTTP al backend.
 * @param {string} method   - 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 * @param {string} endpoint - Ruta relativa, ej: '/auth/login'
 * @param {Object|null} body - Datos a enviar en el body (opcional)
 * @returns {Promise<Object>} JSON de respuesta del backend
 * @throws {{ status: number, message: string }} Error con código HTTP y mensaje
 */
async function request(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };

    /* Adjuntar JWT si existe */
    const token = obtenerToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    /* Parsear JSON siempre (el backend siempre responde JSON) */
    const data = await response.json();

    /* 401: token expirado o inválido → solo redirigir si había sesión activa */
    if (response.status === 401 && token) {
        limpiarSesion();
        window.location.href = '/';
        return;
    }

    /* Respuesta con error HTTP → lanzar para que el servicio/página lo maneje */
    if (!response.ok) {
        throw {
            status: response.status,
            message: data.message || 'Error en el servidor'
        };
    }

    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Métodos Públicos --------------------------------------------------- */
/* -------------------------------------------------------------------------- */

export const get   = (endpoint)       => request('GET',    endpoint);
export const post  = (endpoint, body) => request('POST',   endpoint, body);
export const put   = (endpoint, body) => request('PUT',    endpoint, body);
export const patch = (endpoint, body) => request('PATCH',  endpoint, body);
export const del   = (endpoint)       => request('DELETE', endpoint);
