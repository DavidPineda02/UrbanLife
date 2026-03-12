/* ========================================================================== */
/* ===== SERVICIO DE CORREOS DE USUARIO ====================================== */
/* ========================================================================== */

/**
 * Servicio para gestionar los correos electrónicos adicionales del perfil.
 * Conecta la vista de perfil con los endpoints de correos del backend.
 *
 * Endpoints utilizados:
 *  - GET    /correos-usuario         → Listar correos del usuario autenticado
 *  - POST   /correos-usuario         → Agregar un correo adicional
 *  - DELETE /correos-usuario?id=X    → Eliminar un correo adicional
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post, del } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Correos del Usuario ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los correos adicionales del usuario autenticado.
 * El backend identifica al usuario a partir del JWT.
 *
 * @returns {Promise<Array>} Lista de correos { idCorreo, correo, usuarioId }
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function obtenerCorreos() {
    // Realizar petición GET al endpoint de listar correos
    const data = await get(ENDPOINTS.CORREOS_USUARIO.GET_ALL);
    // Retornar el array de correos contenido en data.data
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Agregar Correo ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Agrega un nuevo correo electrónico al perfil del usuario autenticado.
 * El backend valida el formato del correo con EMAIL_REGEX.
 *
 * @param {string} correo - Dirección de correo electrónico a agregar
 * @returns {Promise<Object>} Respuesta del backend con el correo creado
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function agregarCorreo(correo) {
    // Realizar petición POST con el correo en el body
    const data = await post(ENDPOINTS.CORREOS_USUARIO.CREATE, { correo });
    // Retornar la respuesta completa del backend
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Correo ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina un correo adicional del perfil del usuario autenticado.
 * El backend verifica que el correo pertenezca al usuario antes de eliminar.
 *
 * @param {number} idCorreo - ID del correo a eliminar
 * @returns {Promise<Object>} Respuesta del backend confirmando la eliminación
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function eliminarCorreo(idCorreo) {
    // Realizar petición DELETE con el ID como query param
    const data = await del(`${ENDPOINTS.CORREOS_USUARIO.DELETE}?id=${idCorreo}`);
    // Retornar la respuesta completa del backend
    return data;
}
