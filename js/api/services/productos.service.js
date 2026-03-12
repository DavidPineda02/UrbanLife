/* ========================================================================== */
/* ===== SERVICIO DE PRODUCTOS =============================================== */
/* ========================================================================== */

/**
 * Servicio de gestión de productos del inventario.
 * Conecta la página de productos con los endpoints del backend.
 *
 * Endpoints consumidos:
 *  GET    /productos           → Lista todos los productos
 *  GET    /productos/id?id=X   → Obtiene un producto por ID
 *  POST   /productos           → Crea un nuevo producto
 *  PUT    /productos/id?id=X   → Actualiza un producto existente
 *  PATCH  /productos/id?id=X   → Activa/desactiva un producto (soft delete)
 *
 * Endpoints de imagen:
 *  GET    /productos/imagen?id=X   → Obtiene las imágenes de un producto
 *  POST   /productos/imagen?id=X   → Sube una imagen en Base64
 *  DELETE /productos/imagen?id=X   → Elimina una imagen por ID
 *
 * Modelo Producto (respuesta del backend):
 *  { idProducto: number, nombre: string, descripcion: string,
 *    precioVenta: number, costoPromedio: number,
 *    stock: number, estado: boolean, categoriaId: number }
 */

// Importar los métodos HTTP del cliente centralizado
import { get, post, put, patch, del } from '../client.js';
// Importar las constantes de rutas del API
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Obtener Todos los Productos ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la lista completa de productos desde el backend.
 *
 * Response: { success: true, data: Producto[] }
 *
 * @returns {Promise<Object[]>} Array de productos
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerProductos() {
    /* Realizar petición GET al endpoint de productos */
    const data = await get(ENDPOINTS.PRODUCTOS.GET_ALL);

    /* Retornar el array de productos contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Producto por ID -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene un producto específico por su ID.
 *
 * Response: { success: true, data: Producto }
 *
 * @param {number} id - ID del producto a consultar
 * @returns {Promise<Object>} Objeto del producto
 * @throws {{ status: number, message: string }} Error HTTP (404 si no existe)
 */
export async function obtenerProductoPorId(id) {
    /* Construir la URL con el query param ?id=X */
    const data = await get(`${ENDPOINTS.PRODUCTOS.GET_BY_ID}?id=${id}`);

    /* Retornar el objeto producto */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Producto ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Crea un nuevo producto enviando sus datos al backend.
 *
 * Request:  { nombre, descripcion, precioVenta, costoPromedio, stock, categoriaId }
 * Response: { success: true, message: string, data: Producto }
 *
 * @param {Object} datos - Datos del producto a crear
 * @param {string} datos.nombre - Nombre del producto (2-150 caracteres)
 * @param {string} [datos.descripcion] - Descripción del producto
 * @param {number} datos.precioVenta - Precio de venta (> 0)
 * @param {number} [datos.costoPromedio] - Costo promedio
 * @param {number} datos.stock - Cantidad en inventario (>= 0)
 * @param {number} datos.categoriaId - ID de la categoría asociada
 * @returns {Promise<Object>} Respuesta del backend con el producto creado
 * @throws {{ status: number, message: string }} Error HTTP (400 validación)
 */
export async function crearProducto(datos) {
    /* Enviar POST con el body JSON al endpoint de creación */
    const data = await post(ENDPOINTS.PRODUCTOS.CREATE, datos);

    /* Retornar la respuesta completa (incluye message y data) */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Producto ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza un producto existente (todos los campos).
 *
 * Request:  { nombre, descripcion, precioVenta, costoPromedio, stock, estado, categoriaId }
 * Response: { success: true, message: string, data: Producto }
 *
 * @param {number} id - ID del producto a actualizar
 * @param {Object} datos - Datos actualizados del producto
 * @returns {Promise<Object>} Respuesta del backend con el producto actualizado
 * @throws {{ status: number, message: string }} Error HTTP (400, 404)
 */
export async function actualizarProducto(id, datos) {
    /* Enviar PUT con el body JSON y el query param ?id=X */
    const data = await put(`${ENDPOINTS.PRODUCTOS.UPDATE}?id=${id}`, datos);

    /* Retornar la respuesta completa */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Activa o desactiva un producto (soft delete).
 *
 * Request:  { estado: boolean }
 * Response: { success: true, message: string, data: Producto }
 *
 * @param {number} id - ID del producto
 * @param {boolean} nuevoEstado - true para activar, false para desactivar
 * @returns {Promise<Object>} Respuesta del backend con el nuevo estado
 * @throws {{ status: number, message: string }} Error HTTP (400, 404)
 */
export async function toggleEstadoProducto(id, nuevoEstado) {
    /* Enviar PATCH con el nuevo estado y el query param ?id=X */
    const data = await patch(`${ENDPOINTS.PRODUCTOS.PATCH}?id=${id}`, { estado: nuevoEstado });

    /* Retornar la respuesta completa */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Imágenes de un Producto ------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todas las imágenes asociadas a un producto.
 *
 * Response: { success: true, data: ImagenProducto[] }
 *
 * @param {number} productoId - ID del producto
 * @returns {Promise<Object[]>} Array de imágenes del producto
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function obtenerImagenesProducto(productoId) {
    /* Realizar petición GET al endpoint de imágenes con el ID del producto */
    const data = await get(`${ENDPOINTS.PRODUCTOS.IMAGEN}?id=${productoId}`);

    /* Retornar el array de imágenes contenido en data */
    return data.data;
}

/* -------------------------------------------------------------------------- */
/* ----- Subir Imagen de Producto ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Sube una imagen en Base64 y la asocia a un producto.
 *
 * Request:  { base64: string, extension: string }
 * Response: { success: true, message: string, data: ImagenProducto }
 *
 * @param {number} productoId - ID del producto
 * @param {string} base64Data - Imagen codificada en Base64
 * @param {string} extension - Extensión del archivo (jpg, png, webp)
 * @returns {Promise<Object>} Respuesta del backend con la imagen creada
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function subirImagenProducto(productoId, base64Data, extension) {
    /* Enviar POST con el base64 y extensión al endpoint de imágenes */
    const data = await post(`${ENDPOINTS.PRODUCTOS.IMAGEN}?id=${productoId}`, {
        base64: base64Data,
        extension,
    });

    /* Retornar la respuesta completa */
    return data;
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Imagen de Producto ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina una imagen por su ID de la BD y del disco.
 *
 * Response: { success: true, message: string }
 *
 * @param {number} imagenId - ID de la imagen a eliminar
 * @returns {Promise<Object>} Respuesta del backend
 * @throws {{ status: number, message: string }} Error HTTP
 */
export async function eliminarImagenProducto(imagenId) {
    /* Enviar DELETE al endpoint de imágenes con el ID de la imagen */
    const data = await del(`${ENDPOINTS.PRODUCTOS.IMAGEN}?id=${imagenId}`);

    /* Retornar la respuesta completa */
    return data;
}
