/* ========================================================================== */
/* ===== SERVICIO DE DASHBOARD =============================================== */
/* ========================================================================== */

/**
 * Servicio de datos del dashboard (página de inicio / ganancias).
 * Conecta la página home con los endpoints de resumen del backend.
 *
 * Endpoints consumidos:
 *  GET /dashboard/resumen             → Tarjetas resumen (ingresos, egresos, ganancias, contadores)
 *  GET /dashboard/ventas-semanales    → Ventas por día (últimos 7 días) para gráfico de barras
 *  GET /dashboard/resumen-semanal     → Ingresos/egresos/ganancias por día (últimos 7 días)
 *  GET /dashboard/stock-categorias    → Stock agrupado por categoría para gráfico de dona
 *  GET /dashboard/productos-rentables → Top 10 productos más rentables con margen calculado
 *
 * Todos los endpoints son de solo lectura (GET).
 */

// Importar el método HTTP GET del cliente centralizado
import { get } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Resumen General -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los datos de las tarjetas del dashboard.
 *
 * Response data: { ingresosHoy, egresosHoy, gananciasHoy,
 *                  ingresosMes, egresosMes, gananciaMes,
 *                  productosActivos, clientesActivos }
 *
 * @returns {Promise<Object>} Objeto con los 8 campos del resumen
 */
export async function obtenerResumen() {
    /* Realizar petición GET al endpoint de resumen */
    const data = await get(ENDPOINTS.DASHBOARD.RESUMEN);

    /* Retornar los datos del resumen */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Ventas Semanales ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene el total de ventas por día de los últimos 7 días.
 * Solo retorna los días que tienen ventas registradas.
 *
 * Response data: [{ fecha: "YYYY-MM-DD", total: number }, ...]
 *
 * @returns {Promise<Object[]>} Array de ventas por día
 */
export async function obtenerVentasSemanales() {
    /* Realizar petición GET al endpoint de ventas semanales */
    const data = await get(ENDPOINTS.DASHBOARD.VENTAS_SEMANALES);

    /* Retornar el array de ventas por día */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Resumen Semanal -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene ingresos, egresos y ganancias por día de los últimos 7 días.
 *
 * Response data: [{ fecha: "YYYY-MM-DD", ingresos, egresos, ganancias }, ...]
 *
 * @returns {Promise<Object[]>} Array de resumen por día
 */
export async function obtenerResumenSemanal() {
    /* Realizar petición GET al endpoint de resumen semanal */
    const data = await get(ENDPOINTS.DASHBOARD.RESUMEN_SEMANAL);

    /* Retornar el array de resumen por día */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Stock por Categoría ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene el stock total agrupado por categoría (solo productos activos).
 *
 * Response data: [{ categoria: "Nombre", totalStock: number }, ...]
 *
 * @returns {Promise<Object[]>} Array de stock por categoría
 */
export async function obtenerStockCategorias() {
    /* Realizar petición GET al endpoint de stock por categoría */
    const data = await get(ENDPOINTS.DASHBOARD.STOCK_CATEGORIAS);

    /* Retornar el array de stock agrupado */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Productos Rentables ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los 10 productos más rentables con sus márgenes calculados.
 *
 * Response data: [{ nombre, precioVenta, costoPromedio, margen, margenPorcentaje }, ...]
 *
 * @returns {Promise<Object[]>} Array de productos con márgenes (top 10)
 */
export async function obtenerProductosRentables() {
    /* Realizar petición GET al endpoint de productos rentables */
    const data = await get(ENDPOINTS.DASHBOARD.PRODUCTOS_RENTABLES);

    /* Retornar el array de productos con márgenes */
    return data.data;
}
