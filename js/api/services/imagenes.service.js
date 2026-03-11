/**
 * imagenes.service.js
 * -------------------------------------------------
 * Servicio para gestionar imágenes de productos.
 * Usa browser-image-compression para comprimir antes de enviar.
 * Las imágenes se envían como Base64 en JSON (no multipart).
 *
 * Endpoints:
 *   POST   /api/productos/imagen?id=X  → sube imagen
 *   GET    /api/productos/imagen?id=X  → obtiene imágenes del producto
 *   DELETE /api/productos/imagen?id=X  → elimina imagen por ID
 */

import imageCompression from 'browser-image-compression';
import { get, post, del } from '../client.js';
import { ENDPOINTS } from '../endpoints.js';

/* -------------------------------------------------------------------------- */
/* ----- Opciones de Compresión --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Configuración de browser-image-compression para reducir el tamaño antes de subir */
const OPCIONES_COMPRESION = {
    maxSizeMB: 1,           // Máximo 1MB después de comprimir
    maxWidthOrHeight: 1024, // Redimensiona si supera 1024px en cualquier dimensión
    useWebWorker: true,     // Usa Web Worker para no bloquear el hilo principal
    fileType: 'image/jpeg', // Convierte todo a JPEG para mayor compatibilidad
};

/* -------------------------------------------------------------------------- */
/* ----- Subir Imagen -------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Comprime y sube una imagen para un producto.
 * Convierte el File a Base64 después de comprimir y lo envía al backend.
 * @param {number} productoId - ID del producto al que se asocia la imagen
 * @param {File}   archivo    - Objeto File del input type="file"
 * @returns {Promise<{success: boolean, url?: string, imagenId?: number, message: string}>}
 */
export async function subirImagen(productoId, archivo) {
    // Comprimir la imagen antes de convertirla a Base64
    const archivoComprimido = await imageCompression(archivo, OPCIONES_COMPRESION);

    // Convertir el archivo comprimido a Base64 usando FileReader
    const base64 = await _fileABase64(archivoComprimido);

    // Extraer solo la extensión del tipo MIME (ej: "image/jpeg" → "jpeg")
    const extension = archivoComprimido.type.split('/')[1] || 'jpg';

    // Enviar al backend: { base64: "...", extension: "jpeg" }
    return post(`${ENDPOINTS.PRODUCTOS.IMAGEN}?id=${productoId}`, { base64, extension });
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Imágenes de un Producto ------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todas las imágenes asociadas a un producto.
 * @param {number} productoId - ID del producto
 * @returns {Promise<{success: boolean, imagenes: Array, message: string}>}
 */
export function obtenerImagenes(productoId) {
    return get(`${ENDPOINTS.PRODUCTOS.IMAGEN}?id=${productoId}`);
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Imagen ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Elimina una imagen por su ID.
 * @param {number} imagenId - ID de la imagen a eliminar (no el del producto)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export function eliminarImagen(imagenId) {
    return del(`${ENDPOINTS.PRODUCTOS.IMAGEN}?id=${imagenId}`);
}

/* -------------------------------------------------------------------------- */
/* ----- Utilidad interna: File → Base64 ------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Convierte un objeto File a string Base64 (incluye prefijo data:image/...).
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} Cadena Base64 completa
 */
function _fileABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.readAsDataURL(file);
    });
}
