/* ========================================================================== */
/* ===== SERVICIO DE NÚMEROS DE USUARIO ====================================== */
/* ========================================================================== */

/**
 * Servicio para gestionar los números telefónicos del perfil del usuario.
 * Conecta la vista de perfil con los endpoints de números del backend.
 *
 * Endpoints utilizados:
 *  - GET    /numeros-usuario         → Listar números del usuario autenticado
 *  - POST   /numeros-usuario         → Agregar un número telefónico
 *  - DELETE /numeros-usuario?id=X    → Eliminar un número telefónico
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post, del } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Números del Usuario ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los números telefónicos del usuario autenticado.
 * El backend identifica al usuario a partir del JWT.
 *
 * @returns {Promise<Array>} Lista de números { idNumero, numero, usuarioId }
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function obtenerNumeros() {
    // Realizar petición GET al endpoint de listar números
    const data = await get(ENDPOINTS.NUMEROS_USUARIO.GET_ALL);
    // Retornar el array de números contenido en data.data
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Agregar Número ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Agrega un nuevo número telefónico al perfil del usuario autenticado.
 * El backend valida el formato con TELEFONO_REGEX (7-10 dígitos colombianos).
 *
 * @param {string} numero - Número de teléfono a agregar
 * @returns {Promise<Object>} Respuesta del backend con el número creado
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function agregarNumero(numero) {
    // Realizar petición POST con el número en el body
    const data = await post(ENDPOINTS.NUMEROS_USUARIO.CREATE, { numero });
    // Retornar la respuesta completa del backend
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Número ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina un número telefónico del perfil del usuario autenticado.
 * El backend verifica que el número pertenezca al usuario antes de eliminar.
 *
 * @param {number} idNumero - ID del número a eliminar
 * @returns {Promise<Object>} Respuesta del backend confirmando la eliminación
 * @throws {{ status: number, message: string }} Error del backend
 */
export async function eliminarNumero(idNumero) {
    // Realizar petición DELETE con el ID como query param
    const data = await del(`${ENDPOINTS.NUMEROS_USUARIO.DELETE}?id=${idNumero}`);
    // Retornar la respuesta completa del backend
    return data;
}
