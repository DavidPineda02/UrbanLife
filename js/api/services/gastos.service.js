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
 *  { idGasto: number, descripcion: string, monto: number,
 *    fechaGasto: string, tipoGastoId: number, usuarioId: number, estado: boolean }
 *
 * Modelo TipoGasto:
 *  { idTipoGasto: number, nombre: string }
 *
 * Modelo MovimientoFinanciero (creado automáticamente):
 *  { idMovimiento: number, tipo: number, monto: number, 
 *    fecha: string, referencia: string }
 *
 * Nota: Los gastos pueden editarse pero no eliminarse físicamente (borrado lógico).
 *       Cada gasto crea un movimiento financiero tipo=2 (egreso).
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
/* ----- Obtener Gasto por ID ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene un gasto específico por su ID.
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
/* ----- Registrar Gasto ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Registra un nuevo gasto en el sistema.
 * Crea automáticamente un movimiento financiero tipo=2 (egreso).
 *
 * Request:  { descripcion: string, monto: number, fechaGasto: "YYYY-MM-DD",
 *             tipoGastoId: number }
 * Response: { success: true, message: string, data: Gasto }
 *
 * @param {Object} datos - Datos del gasto a registrar
 * @param {string} datos.descripcion - Descripción del gasto
 * @param {number} datos.monto - Monto del gasto
 * @param {string} datos.fechaGasto - Fecha en formato YYYY-MM-DD
 * @param {number} datos.tipoGastoId - ID del tipo de gasto
 * @returns {Promise<Object>} Respuesta del backend con el gasto creado
 * @throws {{ status: number, message: string }} Error HTTP (400 validación, 404 no encontrado)
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
 * Actualiza un gasto existente.
 * Ajusta automáticamente el movimiento financiero asociado.
 *
 * Request:  { descripcion: string, monto: number, fechaGasto: "YYYY-MM-DD",
 *             tipoGastoId: number }
 * Response: { success: true, message: string, data: Gasto }
 *
 * @param {number} id - ID del gasto a actualizar
 * @param {Object} datos - Datos actualizados del gasto
 * @param {string} datos.descripcion - Descripción del gasto
 * @param {number} datos.monto - Monto del gasto
 * @param {string} datos.fechaGasto - Fecha en formato YYYY-MM-DD
 * @param {number} datos.tipoGastoId - ID del tipo de gasto
 * @returns {Promise<Object>} Respuesta del backend con el gasto actualizado
 * @throws {{ status: number, message: string }} Error HTTP (400 validación, 404 no encontrado)
 */
export async function actualizarGasto(id, datos) {
    /* Enviar PUT con el body JSON al endpoint de actualización */
    const data = await put(`${ENDPOINTS.GASTOS.UPDATE}?id=${id}`, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Gasto (Lógica) -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina un gasto lógicamente (cambia estado a false).
 * Elimina automáticamente el movimiento financiero asociado.
 * El gasto permanece en la BD pero con estado=false.
 *
 * Response: { success: true, message: string }
 *
 * @param {number} id - ID del gasto a eliminar
 * @returns {Promise<Object>} Respuesta del backend con mensaje de confirmación
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function eliminarGasto(id) {
    /* Enviar DELETE al endpoint de eliminación lógica */
    const data = await del(`${ENDPOINTS.GASTOS.DELETE}?id=${id}`);

    /* Retornar la respuesta completa (incluye message) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Tipos de Gasto --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista de tipos de gasto disponibles.
 * Usado para llenar el select en el formulario.
 *
 * Response: { success: true, data: TipoGasto[] }
 *
 * @returns {Promise<Object[]>} Array de tipos de gasto
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerTiposGasto() {
    /* Realizar petición GET al endpoint de tipos de gasto (si existe) */
    try {
        const data = await get('/tipos-gasto'); // Endpoint hipotético
        return data.data;
    } catch (error) {
        /* Si el endpoint no existe, retornar tipos por defecto */
        return [
            { idTipoGasto: 1, nombre: 'Servicios' },
            { idTipoGasto: 2, nombre: 'Suministros' },
            { idTipoGasto: 3, nombre: 'Mantenimiento' },
            { idTipoGasto: 4, nombre: 'Impuestos' },
            { idTipoGasto: 5, nombre: 'Otros' }
        ];
    }
}
