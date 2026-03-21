/* ========================================================================== */
/* ===== SERVICIO DE TELÉFONOS DE USUARIO =================================== */
/* ========================================================================== */

/**
 * Servicio para gestionar los números telefónicos del perfil del usuario.
 * Conecta la vista de perfil con los endpoints de teléfonos del backend.
 *
 * Endpoints utilizados:
 *  - GET    /telefonos-usuario         → Listar teléfonos del usuario autenticado
 *  - POST   /telefonos-usuario         → Agregar un número telefónico
 *  - DELETE /telefonos-usuario?id=X    → Eliminar un número telefónico
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post, del } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Teléfonos del Usuario -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los números telefónicos del usuario autenticado.
 * El backend identifica al usuario a partir del JWT.
 *
 * @returns {Promise<Array>} Lista de teléfonos { idTelefono, telefono, esPrincipal, usuarioId }
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function obtenerTelefonos() {
    // Realizar petición GET al endpoint de listar teléfonos
    const data = await get(ENDPOINTS.TELEFONOS_USUARIO.GET_ALL);
    // Retornar el array de teléfonos contenido en data.data
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Agregar Teléfono --------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Agrega un nuevo número telefónico al perfil del usuario autenticado.
 * El backend valida el formato con TELEFONO_REGEX (7-10 dígitos colombianos).
 *
 * @param {string} telefono - Número de teléfono a agregar
 * @returns {Promise<Object>} Respuesta del backend con el teléfono creado
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function agregarTelefono(telefono) {
    // Realizar petición POST con el teléfono en el body
    const data = await post(ENDPOINTS.TELEFONOS_USUARIO.CREATE, { telefono });
    // Retornar la respuesta completa del backend
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Teléfono -------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina un número telefónico del perfil del usuario autenticado.
 * El backend verifica que el teléfono pertenezca al usuario antes de eliminar.
 *
 * @param {number} idTelefono - ID del teléfono a eliminar
 * @returns {Promise<Object>} Respuesta del backend confirmando la eliminación
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function eliminarTelefono(idTelefono) {
    // Realizar petición DELETE con el ID como query param
    const data = await del(`${ENDPOINTS.TELEFONOS_USUARIO.DELETE}?id=${idTelefono}`);
    // Retornar la respuesta completa del backend
    return data;
}
