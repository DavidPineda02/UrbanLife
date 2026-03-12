/* ========================================================================== */
/* ===== SERVICIO DE USUARIOS ================================================ */
/* ========================================================================== */

/**
 * Servicio de gestión de usuarios.
 * Conecta la vista de perfil y gestión de usuarios con los endpoints del backend.
 *
 * Endpoints utilizados:
 *  - GET    /users               → Listar todos los usuarios (SUPER_ADMIN, ADMIN)
 *  - GET    /users/id?id=X       → Obtener usuario por ID (EMPLEADO solo el propio)
 *  - PUT    /users/id?id=X       → Actualización completa del usuario
 *  - PATCH  /users/id?id=X       → Actualización parcial del usuario
 */

// Importar los métodos HTTP del cliente centralizado
import { get, put, patch } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todos los Usuarios ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de usuarios del sistema.
 * Solo accesible por SUPER_ADMIN y ADMIN.
 *
 * @returns {Promise<Array>} Lista de usuarios (sin contraseñas)
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function obtenerUsuarios() {
    // Realizar petición GET al endpoint de listar usuarios
    const data = await get(ENDPOINTS.USUARIOS.GET_ALL);
    // Retornar el array de usuarios contenido en data.data
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Usuario por ID --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los datos de un usuario específico por su ID.
 * EMPLEADO solo puede consultar su propio perfil.
 *
 * @param {number} id - ID del usuario a consultar
 * @returns {Promise<Object>} Datos del usuario encontrado
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function obtenerUsuarioPorId(id) {
    // Realizar petición GET al endpoint con el ID como query param
    const data = await get(`${ENDPOINTS.USUARIOS.GET_BY_ID}?id=${id}`);
    // Retornar el objeto usuario contenido en data.data
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Usuario Completo ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza todos los campos de un usuario (PUT completo).
 * Requiere enviar todos los campos: nombre, apellido, correo, contrasena, estado.
 *
 * @param {number} id - ID del usuario a actualizar
 * @param {Object} datos - Campos a actualizar { nombre, apellido, correo, contrasena, estado }
 * @returns {Promise<Object>} Respuesta del backend con el usuario actualizado
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function actualizarUsuario(id, datos) {
    // Realizar petición PUT al endpoint con el ID como query param
    const data = await put(`${ENDPOINTS.USUARIOS.UPDATE}?id=${id}`, datos);
    // Retornar la respuesta completa del backend
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Usuario Parcial ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza solo los campos enviados de un usuario (PATCH parcial).
 * Solo se modifican los campos presentes en el objeto datos.
 *
 * @param {number} id - ID del usuario a actualizar
 * @param {Object} datos - Campos a actualizar (solo los que se desean cambiar)
 * @returns {Promise<Object>} Respuesta del backend con el usuario actualizado
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function actualizarParcialUsuario(id, datos) {
    // Realizar petición PATCH al endpoint con el ID como query param
    const data = await patch(`${ENDPOINTS.USUARIOS.PATCH}?id=${id}`, datos);
    // Retornar la respuesta completa del backend
    return data;
}
