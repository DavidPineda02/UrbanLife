/* ========================================================================== */
/* ===== SERVICIO DE COMPRAS ================================================ */
/* ========================================================================== */

/**
 * Servicio de gestión de compras a proveedores.
 * Conecta la página de compras con los endpoints del backend.
 *
 * Endpoints consumidos:
 *  GET    /compras           → Lista todas las compras
 *  GET    /compras/id?id=X   → Obtiene una compra con sus detalles
 *  POST   /compras           → Registra una nueva compra
 *
 * Modelo Compra (respuesta del backend):
 *  { idCompra: number, fechaCompra: string, totalCompra: number,
 *    metodoPago: string, usuarioId: number, proveedorId: number, estado: boolean }
 *
 * Modelo DetalleCompra (incluido en GET by ID):
 *  { idDetCompra: number, cantidad: number, precioUnitario: number,
 *    subtotal: number, compraId: number, productoId: number }
 *
 * Nota: Las compras son inmutables (sin editar/eliminar) por reglas de contabilidad.
 *       El costoUnitario viene del frontend (precio del proveedor varía).
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todas las Compras ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de compras desde el backend.
 *
 * Response: { success: true, data: Compra[] }
 *
 * @returns {Promise<Object[]>} Array de compras (sin detalles)
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerCompras() {
    /* Realizar petición GET al endpoint de compras */
    const data = await get(ENDPOINTS.COMPRAS.GET_ALL);

    /* Retornar el array de compras contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Compra por ID (con Detalles) ------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene una compra específica con sus ítems (detalles).
 *
 * Response: { success: true, data: { ...Compra, detalles: DetalleCompra[] } }
 *
 * @param {number} id - ID de la compra a consultar
 * @returns {Promise<Object>} Compra con array de detalles incluido
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function obtenerCompraPorId(id) {
    /* Construir la URL con el query param ?id=X */
    const data = await get(`${ENDPOINTS.COMPRAS.GET_BY_ID}?id=${id}`);

    /* Retornar el objeto compra con sus detalles */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Registrar Compra ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Registra una nueva compra con sus ítems en una transacción atómica.
 * El backend calcula el precio desde la BD (previene manipulación).
 * También aumenta stock y crea un movimiento financiero tipo=2 (egreso).
 *
 * Request:  { fechaCompra: "YYYY-MM-DD", metodoPago: "Efectivo"|"Transferencia",
 *             proveedorId: number, items: [{ productoId: number, cantidad: number }] }
 * Response: { success: true, message: string, data: Compra }
 *
 * @param {Object} datos - Datos de la compra a registrar
 * @param {string} datos.fechaCompra - Fecha en formato YYYY-MM-DD
 * @param {string} datos.metodoPago - "Efectivo" o "Transferencia"
 * @param {number} datos.proveedorId - ID del proveedor asociado
 * @param {Object[]} datos.items - Array de ítems ({ productoId, cantidad })
 * @returns {Promise<Object>} Respuesta del backend con la compra creada
 * @throws {{ status: number, message: string }} Error HTTP (400 validación, 404 no encontrado)
 */
export async function crearCompra(datos) {
    /* Enviar POST con el body JSON al endpoint de creación */
    const data = await post(ENDPOINTS.COMPRAS.CREATE, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

