/* ========================================================================== */
/* ===== SERVICIO DE VENTAS ================================================= */
/* ========================================================================== */

/**
 * Servicio de gestión de ventas.
 * Conecta la página de ventas con los endpoints del backend.
 *
 * Endpoints consumidos:
 *  GET    /ventas           → Lista todas las ventas
 *  GET    /ventas/id?id=X   → Obtiene una venta con sus detalles
 *  POST   /ventas           → Registra una nueva venta (inmutable)
 *
 * Modelo Venta (respuesta del backend):
 *  { idVenta: number, fechaVenta: string, totalVenta: number,
 *    metodoPago: string, usuarioId: number, clienteId: number }
 *
 * Modelo DetalleVenta (incluido en GET by ID):
 *  { idDetVenta: number, cantidad: number, precioUnitario: number,
 *    subtotal: number, ventaId: number, productoId: number }
 *
 * Nota: Las ventas son inmutables — no existe UPDATE ni DELETE.
 *       El precio unitario se lee de la BD, no del frontend.
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todas las Ventas ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de ventas desde el backend.
 *
 * Response: { success: true, data: Venta[] }
 *
 * @returns {Promise<Object[]>} Array de ventas (sin detalles)
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerVentas() {
    /* Realizar petición GET al endpoint de ventas */
    const data = await get(ENDPOINTS.VENTAS.GET_ALL);

    /* Retornar el array de ventas contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Venta por ID (con Detalles) -------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene una venta específica con sus ítems (detalles).
 *
 * Response: { success: true, data: { ...Venta, detalles: DetalleVenta[] } }
 *
 * @param {number} id - ID de la venta a consultar
 * @returns {Promise<Object>} Venta con array de detalles incluido
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function obtenerVentaPorId(id) {
    /* Construir la URL con el query param ?id=X */
    const data = await get(`${ENDPOINTS.VENTAS.GET_BY_ID}?id=${id}`);

    /* Retornar el objeto venta con sus detalles */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Registrar Venta ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Registra una nueva venta con sus ítems en una transacción atómica.
 * El backend calcula el precio desde la BD (previene manipulación).
 * También descuenta stock y crea un movimiento financiero tipo=1 (ingreso).
 *
 * Request:  { fechaVenta: "YYYY-MM-DD", metodoPago: "Efectivo"|"Transferencia",
 *             clienteId: number, items: [{ productoId: number, cantidad: number }] }
 * Response: { success: true, message: string, data: Venta }
 *
 * @param {Object} datos - Datos de la venta a registrar
 * @param {string} datos.fechaVenta - Fecha en formato YYYY-MM-DD
 * @param {string} datos.metodoPago - "Efectivo" o "Transferencia"
 * @param {number} datos.clienteId - ID del cliente asociado
 * @param {Object[]} datos.items - Array de ítems ({ productoId, cantidad })
 * @returns {Promise<Object>} Respuesta del backend con la venta creada
 * @throws {{ status: number, message: string }} Error HTTP (400 validación, 404 no encontrado)
 */
export async function crearVenta(datos) {
    /* Enviar POST con el body JSON al endpoint de creación */
    const data = await post(ENDPOINTS.VENTAS.CREATE, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}
