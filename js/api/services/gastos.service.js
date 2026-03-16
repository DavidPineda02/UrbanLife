/* ========================================================================== */
/* ===== SERVICIO DE GASTOS ================================================= */
/* ========================================================================== */

/**
 * Servicio de gestión de gastos adicionales y movimientos financieros.
 * Conecta la página de gastos con los endpoints del backend.
 *
 * Endpoints consumidos:
 *  GET    /gastos           → Lista todos los gastos
 *  GET    /gastos/id?id=X   → Obtiene un gasto específico
 *  POST   /gastos           → Registra un nuevo gasto
 *  PUT    /gastos/id?id=X   → Actualiza un gasto existente
 *  DELETE /gastos/id?id=X   → Elimina un gasto (lógico)
 *
 * Modelo Gasto (respuesta del backend):
 *  { idGastosAdic: number, monto: number, descripcion: string,
 *    fechaRegistro: string, metodoPago: string }
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post, put, del } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todos los Gastos -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de gastos desde el backend.
 *
 * Response: { success: true, data: Gasto[] }
 *
 * @returns {Promise<Object[]>} Array de gastos
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerGastos() {
    /* Realizar petición GET al endpoint de gastos */
    const data = await get(ENDPOINTS.GASTOS.GET_ALL);

    /* Retornar el array de gastos contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Gasto por ID ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene un gasto específico desde el backend.
 *
 * Response: { success: true, data: Gasto }
 *
 * @param {number} id - ID del gasto a consultar
 * @returns {Promise<Object>} Gasto encontrado
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function obtenerGastoPorId(id) {
    /* Construir la URL con el query param ?id=X */
    const data = await get(`${ENDPOINTS.GASTOS.GET_BY_ID}?id=${id}`);

    /* Retornar el objeto gasto */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Nuevo Gasto ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Registra un nuevo gasto en el backend.
 * El backend crea automáticamente el movimiento financiero correspondiente.
 *
 * Request body: {
 *   monto: number,
 *   descripcion: string,
 *   fechaRegistro: string (YYYY-MM-DD),
 *   metodoPago: 'Transferencia'|'Efectivo'
 * }
 * Nota: el usuarioId se obtiene del JWT en el backend, no se envía en el body.
 *
 * Response: { success: true, message: string, data: Gasto }
 *
 * @param {Object} datos - Datos del nuevo gasto
 * @returns {Promise<Object>} Respuesta del backend con gasto creado
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function crearGasto(datos) {
    /* Enviar POST con el body JSON al endpoint de creación */
    const data = await post(ENDPOINTS.GASTOS.CREATE, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Gasto --------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza un gasto existente en el backend.
 *
 * Request body: mismo formato que crearGasto()
 * Response: { success: true, message: string, data: Gasto }
 *
 * @param {number} id - ID del gasto a actualizar
 * @param {Object} datos - Datos actualizados del gasto
 * @returns {Promise<Object>} Respuesta del backend con gasto actualizado
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function actualizarGasto(id, datos) {
    /* Enviar PUT con el body JSON al endpoint de actualización */
    const data = await put(`${ENDPOINTS.GASTOS.UPDATE}?id=${id}`, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Gasto --------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina un gasto (borrado lógico) en el backend.
 * También elimina el movimiento financiero asociado.
 *
 * Response: { success: true, message: string }
 *
 * @param {number} id - ID del gasto a eliminar
 * @returns {Promise<Object>} Respuesta del backend
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function eliminarGasto(id) {
    /* Enviar DELETE al endpoint de eliminación lógica */
    const data = await del(`${ENDPOINTS.GASTOS.DELETE}?id=${id}`);

    /* Retornar la respuesta completa (incluye message) */
    return data;
}
