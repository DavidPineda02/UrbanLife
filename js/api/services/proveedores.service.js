/* ========================================================================== */
/* ===== SERVICIO DE PROVEEDORES ============================================= */
/* ========================================================================== */

/**
 * Servicio de gestión de proveedores del negocio.
 * Conecta la página de proveedores con los endpoints del backend.
 *
 * Endpoints consumidos:
 *  GET    /proveedores           → Lista todos los proveedores
 *  GET    /proveedores/id?id=X   → Obtiene un proveedor por ID
 *  POST   /proveedores           → Crea un nuevo proveedor
 *  PUT    /proveedores/id?id=X   → Actualiza un proveedor existente
 *  PATCH  /proveedores/id?id=X   → Activa/desactiva un proveedor (soft delete)
 *
 * Modelo Proveedor (respuesta del backend):
 *  { idProveedor: number, nombre: string, razonSocial: string, nit: string,
 *    correo: string, telefono: string, direccion: string, ciudad: string, estado: boolean }
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post, put, patch } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todos los Proveedores -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de proveedores desde el backend.
 *
 * Response: { success: true, data: Proveedor[] }
 *
 * @returns {Promise<Object[]>} Array de proveedores
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerProveedores() {
    /* Realizar petición GET al endpoint de proveedores */
    const data = await get(ENDPOINTS.PROVEEDORES.GET_ALL);

    /* Retornar el array de proveedores contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Proveedor por ID ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene un proveedor específico por su ID.
 *
 * Response: { success: true, data: Proveedor }
 *
 * @param {number} id - ID del proveedor a consultar
 * @returns {Promise<Object>} Objeto del proveedor
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function obtenerProveedorPorId(id) {
    /* Construir la URL con el query param ?id=X */
    const data = await get(`${ENDPOINTS.PROVEEDORES.GET_BY_ID}?id=${id}`);

    /* Retornar el objeto proveedor */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Proveedor ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Crea un nuevo proveedor enviando sus datos al backend.
 *
 * Request:  { nombre, razonSocial, nit, correo, telefono, direccion, ciudad }
 * Response: { success: true, message: string, data: Proveedor }
 *
 * @param {Object} datos - Datos del proveedor a crear
 * @param {string} datos.nombre - Nombre del contacto del proveedor
 * @param {string} datos.razonSocial - Razón social / nombre de la empresa
 * @param {string} datos.nit - NIT colombiano del proveedor
 * @param {string} datos.correo - Correo electrónico
 * @param {string} datos.telefono - Teléfono (7-10 dígitos)
 * @param {string} datos.direccion - Dirección física
 * @param {string} datos.ciudad - Ciudad
 * @returns {Promise<Object>} Respuesta del backend con el proveedor creado
 * @throws {{ status: number, message: string }} Error HTTP (400 validación, 409 duplicado)
 */
export async function crearProveedor(datos) {
    /* Enviar POST con el body JSON al endpoint de creación */
    const data = await post(ENDPOINTS.PROVEEDORES.CREATE, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Proveedor ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza un proveedor existente (todos los campos).
 *
 * Request:  { nombre, razonSocial, nit, correo, telefono, direccion, ciudad, estado }
 * Response: { success: true, message: string, data: Proveedor }
 *
 * @param {number} id - ID del proveedor a actualizar
 * @param {Object} datos - Datos actualizados del proveedor
 * @returns {Promise<Object>} Respuesta del backend con el proveedor actualizado
 * @throws {{ status: number, message: string }} Error HTTP (400, 404, 409)
 */
export async function actualizarProveedor(id, datos) {
    /* Enviar PUT con el body JSON y el query param ?id=X */
    const data = await put(`${ENDPOINTS.PROVEEDORES.UPDATE}?id=${id}`, datos);

    /* Retornar la respuesta completa */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Activa o desactiva un proveedor (soft delete).
 * El backend invierte el estado actual del proveedor.
 *
 * Request:  { estado: boolean }
 * Response: { success: true, message: string, data: Proveedor }
 *
 * @param {number} id - ID del proveedor
 * @param {boolean} nuevoEstado - true para activar, false para desactivar
 * @returns {Promise<Object>} Respuesta del backend con el nuevo estado
 * @throws {{ status: number, message: string }} Error HTTP (400, 404)
 */
export async function toggleEstadoProveedor(id, nuevoEstado) {
    /* Enviar PATCH con el nuevo estado y el query param ?id=X */
    const data = await patch(`${ENDPOINTS.PROVEEDORES.PATCH}?id=${id}`, { estado: nuevoEstado });

    /* Retornar la respuesta completa */
    return data;
}
