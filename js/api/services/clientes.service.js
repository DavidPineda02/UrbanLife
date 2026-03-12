/* ========================================================================== */
/* ===== SERVICIO DE CLIENTES ================================================ */
/* ========================================================================== */

/**
 * Servicio de gestión de clientes del negocio.
 * Conecta la página de clientes con los endpoints del backend.
 *
 * Endpoints consumidos:
 *  GET    /clientes           → Lista todos los clientes
 *  GET    /clientes/id?id=X   → Obtiene un cliente por ID
 *  POST   /clientes           → Crea un nuevo cliente
 *  PUT    /clientes/id?id=X   → Actualiza un cliente existente
 *  PATCH  /clientes/id?id=X   → Activa/desactiva un cliente (soft delete)
 *
 * Modelo Cliente (respuesta del backend):
 *  { idCliente: number, nombre: string, documento: number, correo: string,
 *    telefono: string, direccion: string, ciudad: string, estado: boolean }
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post, put, patch } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todos los Clientes ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de clientes desde el backend.
 *
 * Response: { success: true, data: Cliente[] }
 *
 * @returns {Promise<Object[]>} Array de clientes
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerClientes() {
    /* Realizar petición GET al endpoint de clientes */
    const data = await get(ENDPOINTS.CLIENTES.GET_ALL);

    /* Retornar el array de clientes contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Cliente por ID --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene un cliente específico por su ID.
 *
 * Response: { success: true, data: Cliente }
 *
 * @param {number} id - ID del cliente a consultar
 * @returns {Promise<Object>} Objeto del cliente
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function obtenerClientePorId(id) {
    /* Construir la URL con el query param ?id=X */
    const data = await get(`${ENDPOINTS.CLIENTES.GET_BY_ID}?id=${id}`);

    /* Retornar el objeto cliente */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Cliente ------------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Crea un nuevo cliente enviando sus datos al backend.
 *
 * Request:  { nombre, documento, correo, telefono, direccion, ciudad }
 * Response: { success: true, message: string, data: Cliente }
 *
 * @param {Object} datos - Datos del cliente a crear
 * @param {string} datos.nombre - Nombre completo del cliente
 * @param {number} datos.documento - Cédula colombiana (6-10 dígitos)
 * @param {string} datos.correo - Correo electrónico
 * @param {string} datos.telefono - Teléfono (7-10 dígitos)
 * @param {string} datos.direccion - Dirección física
 * @param {string} datos.ciudad - Ciudad de residencia
 * @returns {Promise<Object>} Respuesta del backend con el cliente creado
 * @throws {{ status: number, message: string }} Error HTTP (400 validación, 409 duplicado)
 */
export async function crearCliente(datos) {
    /* Enviar POST con el body JSON al endpoint de creación */
    const data = await post(ENDPOINTS.CLIENTES.CREATE, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Cliente ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza un cliente existente (todos los campos).
 *
 * Request:  { nombre, documento, correo, telefono, direccion, ciudad, estado }
 * Response: { success: true, message: string, data: Cliente }
 *
 * @param {number} id - ID del cliente a actualizar
 * @param {Object} datos - Datos actualizados del cliente
 * @returns {Promise<Object>} Respuesta del backend con el cliente actualizado
 * @throws {{ status: number, message: string }} Error HTTP (400, 404, 409)
 */
export async function actualizarCliente(id, datos) {
    /* Enviar PUT con el body JSON y el query param ?id=X */
    const data = await put(`${ENDPOINTS.CLIENTES.UPDATE}?id=${id}`, datos);

    /* Retornar la respuesta completa */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Activa o desactiva un cliente (soft delete).
 * El backend invierte el estado actual del cliente.
 *
 * Request:  { estado: boolean }
 * Response: { success: true, message: string, data: Cliente }
 *
 * @param {number} id - ID del cliente
 * @param {boolean} nuevoEstado - true para activar, false para desactivar
 * @returns {Promise<Object>} Respuesta del backend con el nuevo estado
 * @throws {{ status: number, message: string }} Error HTTP (400, 404)
 */
export async function toggleEstadoCliente(id, nuevoEstado) {
    /* Enviar PATCH con el nuevo estado y el query param ?id=X */
    const data = await patch(`${ENDPOINTS.CLIENTES.PATCH}?id=${id}`, { estado: nuevoEstado });

    /* Retornar la respuesta completa */
    return data;
}
