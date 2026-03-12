/* ========================================================================== */
/* ===== CATEGORÍAS SERVICE ================================================= */
/* ========================================================================== */

/**
 * Servicio de gestión de categorías de productos.
 * Conecta la página de categorías con los endpoints del backend.
 *
 * Endpoints consumidos:
 *  GET    /categorias           → Lista todas las categorías
 *  GET    /categorias/id?id=X   → Obtiene una categoría por ID
 *  POST   /categorias           → Crea una nueva categoría
 *  PUT    /categorias/id?id=X   → Actualiza una categoría existente
 *  PATCH  /categorias/id?id=X   → Activa/desactiva una categoría (soft delete)
 *
 * Modelo Categoría (respuesta del backend):
 *  { idCategoria: number, nombre: string, descripcion: string|null, estado: boolean }
 */

import { get, post, put, patch } from '../client.js';    // Métodos HTTP del cliente base
import { ENDPOINTS } from '../endpoints.js';              // Rutas centralizadas del API

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todas las Categorías --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de categorías desde el backend.
 *
 * Response: { success: true, data: Categoria[] }
 *
 * @returns {Promise<Object[]>} Array de categorías
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerCategorias() {
    /* Realizar petición GET al endpoint de categorías */
    const data = await get(ENDPOINTS.CATEGORIAS.GET_ALL);

    /* Retornar el array de categorías contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Categoría por ID ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene una categoría específica por su ID.
 *
 * Response: { success: true, data: Categoria }
 *
 * @param {number} id - ID de la categoría a consultar
 * @returns {Promise<Object>} Objeto de la categoría
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function obtenerCategoriaPorId(id) {
    /* Construir la URL con el query param ?id=X */
    const data = await get(`${ENDPOINTS.CATEGORIAS.GET_BY_ID}?id=${id}`);

    /* Retornar el objeto categoría */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Categoría ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Crea una nueva categoría enviando nombre y descripción al backend.
 *
 * Request:  { nombre: string, descripcion?: string }
 * Response: { success: true, message: string, data: Categoria }
 *
 * @param {Object} datos - Datos de la categoría a crear
 * @param {string} datos.nombre - Nombre de la categoría (2-100 caracteres)
 * @param {string} [datos.descripcion] - Descripción opcional (máx 255 caracteres)
 * @returns {Promise<Object>} Respuesta del backend con la categoría creada
 * @throws {{ status: number, message: string }} Error HTTP (400 validación, 409 duplicado)
 */
export async function crearCategoria(datos) {
    /* Enviar POST con el body JSON al endpoint de creación */
    const data = await post(ENDPOINTS.CATEGORIAS.CREATE, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Categoría ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza una categoría existente (nombre, descripción y estado).
 *
 * Request:  { nombre: string, descripcion?: string, estado?: boolean }
 * Response: { success: true, message: string, data: Categoria }
 *
 * @param {number} id - ID de la categoría a actualizar
 * @param {Object} datos - Datos actualizados
 * @param {string} datos.nombre - Nombre de la categoría (2-100 caracteres)
 * @param {string} [datos.descripcion] - Descripción opcional (máx 255 caracteres)
 * @param {boolean} [datos.estado] - Estado activo/inactivo
 * @returns {Promise<Object>} Respuesta del backend con la categoría actualizada
 * @throws {{ status: number, message: string }} Error HTTP (400, 404, 409)
 */
export async function actualizarCategoria(id, datos) {
    /* Enviar PUT con el body JSON y el query param ?id=X */
    const data = await put(`${ENDPOINTS.CATEGORIAS.UPDATE}?id=${id}`, datos);

    /* Retornar la respuesta completa */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Activa o desactiva una categoría (soft delete).
 * El backend invierte el estado actual de la categoría.
 *
 * Request:  { estado: boolean }
 * Response: { success: true, message: string, data: Categoria }
 *
 * @param {number} id - ID de la categoría
 * @param {boolean} nuevoEstado - true para activar, false para desactivar
 * @returns {Promise<Object>} Respuesta del backend con el nuevo estado
 * @throws {{ status: number, message: string }} Error HTTP (400, 404)
 */
export async function toggleEstadoCategoria(id, nuevoEstado) {
    /* Enviar PATCH con el nuevo estado y el query param ?id=X */
    const data = await patch(`${ENDPOINTS.CATEGORIAS.PATCH}?id=${id}`, { estado: nuevoEstado });

    /* Retornar la respuesta completa */
    return data;
}
