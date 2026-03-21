/* ========================================================================== */
/* ===== SERVICIO API — MOVIMIENTOS FINANCIEROS ============================== */
/* ========================================================================== */

/**
 * Funciones para consumir el API de movimientos financieros.
 * Los movimientos son de SOLO LECTURA — se crean automáticamente
 * al registrar ventas, compras y gastos adicionales.
 *
 * Endpoints consumidos:
 *   GET /movimientos-financieros → lista todos los movimientos
 */

import { get } from '../client.js';                                            // Cliente HTTP con JWT
import { ENDPOINTS } from '../endpoints.js';                                   // Rutas centralizadas

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todos los Movimientos -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los movimientos financieros del backend.
 * @returns {Promise<Array>} Array de movimientos financieros
 */
export async function obtenerMovimientos() {
    const data = await get(ENDPOINTS.MOVIMIENTOS.GET_ALL);                     // GET /movimientos-financieros
    return data.data;                                                          // Retornar el array de movimientos
}
