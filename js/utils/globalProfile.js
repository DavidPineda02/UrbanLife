/* ========================================================================== */
/* ===== PERFIL GLOBAL DEL USUARIO ========================================= */
/* ========================================================================== */

/**
 * Sistema global para manejar los datos del perfil del usuario.
 * Carga los datos una vez y los mantiene disponibles para todas las páginas.
 * Actualiza automáticamente el sidebar con nombre y rol del usuario.
 */

import { obtenerPerfil } from '../api/services/auth.service.js';

/* -------------------------------------------------------------------------- */
/* ----- Estado Global ------------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/** Almacena los datos del perfil del usuario en memoria */
let globalPerfilData = null;

/** Bandera para saber si los datos ya se cargaron */
let isProfileLoaded = false;

/* -------------------------------------------------------------------------- */
/* ----- Funciones Principales --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga los datos del perfil del usuario desde el backend.
 * Se ejecuta una sola vez y mantiene los datos en memoria caché.
 * Actualiza automáticamente los elementos del sidebar.
 */
export async function loadGlobalProfile() {
    // Si ya se cargaron, no volver a cargar
    if (isProfileLoaded && globalPerfilData) {
        return globalPerfilData;
    }

    try {
        // Obtener datos del perfil desde el backend
        const perfilData = await obtenerPerfil();
        
        // Guardar en memoria caché
        globalPerfilData = perfilData;
        isProfileLoaded = true;
        
        // Actualizar sidebar inmediatamente
        updateSidebarProfile(perfilData);
        
        console.log('[GlobalProfile] Perfil cargado exitosamente:', perfilData.nombre, perfilData.rol);
        
        return perfilData;
    } catch (error) {
        console.error('[GlobalProfile] Error al cargar perfil:', error);
        throw error;
    }
}

/**
 * Obtiene los datos del perfil desde memoria caché.
 * Si no están cargados, intenta cargarlos.
 * @returns {Object|null} Datos del perfil o null si no se pueden cargar
 */
export async function getGlobalProfile() {
    if (!isProfileLoaded || !globalPerfilData) {
        return await loadGlobalProfile();
    }
    return globalPerfilData;
}

/**
 * Fuerza la recarga de los datos del perfil desde el backend.
 * Útil después de actualizar el perfil.
 */
export async function refreshGlobalProfile() {
    isProfileLoaded = false;
    globalPerfilData = null;
    return await loadGlobalProfile();
}

/**
 * Actualiza los elementos del sidebar con los datos del perfil.
 * @param {Object} perfilData - Datos del perfil del usuario
 */
function updateSidebarProfile(perfilData) {
    // Elementos del sidebar que necesitan actualización
    const nombreElement = document.getElementById('sidebar-nombre-usuario');
    const rolElement = document.getElementById('sidebar-rol-usuario');
    
    // Actualizar nombre si el elemento existe
    if (nombreElement && perfilData.nombre && perfilData.apellido) {
        nombreElement.textContent = `${perfilData.nombre} ${perfilData.apellido}`;
    }
    
    // Actualizar rol si el elemento existe
    if (rolElement && perfilData.rol) {
        rolElement.textContent = formatRole(perfilData.rol);
    }
    
    // Actualizar iniciales si existe el elemento (para página de perfil)
    const inicialesElement = document.getElementById('perfil-iniciales');
    if (inicialesElement && perfilData.nombre && perfilData.apellido) {
        const iniciales = (perfilData.nombre.charAt(0) || '') + (perfilData.apellido.charAt(0) || '');
        inicialesElement.textContent = iniciales.toUpperCase();
    }
}

/**
 * Formatea el nombre del rol para mostrarlo de forma legible.
 * @param {string} rol - Nombre del rol tal como viene del backend
 * @returns {string} Nombre del rol formateado
 */
function formatRole(rol) {
    const roles = {
        'SUPER_ADMIN': 'Super Admin',
        'ADMIN': 'Administrador',
        'EMPLEADO': 'Empleado',
    };
    return roles[rol] || rol;
}

/**
 * Inicializa el perfil global automáticamente.
 * Se llama desde main.js para asegurar que se ejecute en todas las páginas.
 */
export async function initGlobalProfile() {
    try {
        await loadGlobalProfile();
    } catch (error) {
        console.error('[GlobalProfile] No se pudo inicializar el perfil global:', error);
        // No mostrar error al usuario, solo log para desarrollo
    }
}
