/* ========================================================================== */
/* ===== PERFIL GLOBAL DEL USUARIO ========================================= */
/* ========================================================================== */

/**
 * Sistema global para manejar los datos del perfil del usuario.
 * Carga los datos una vez y los mantiene disponibles para todas las páginas.
 * Actualiza automáticamente el sidebar con nombre y rol del usuario.
 */

import { obtenerPerfil } from '../api/services/auth.service.js';
import { obtenerRol, obtenerUsuario } from '../store/auth.store.js';

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
        
        // Actualizar sidebar con los datos frescos del backend
        updateSidebarProfile(perfilData);

        // Reaplicar filtro de rol con el dato confirmado del backend
        filtrarSidebarPorRol(perfilData.rol);

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
 * Rutas restringidas para el rol EMPLEADO.
 * El empleado solo puede acceder a: clientes, ventas, productos (solo lectura) y perfil.
 */
const RUTAS_RESTRINGIDAS_EMPLEADO = [
    'home',
    'categorias',
    'proveedores',
    'compras',
    'usuarios',
    'gastos',
    'movimientos'
];

/**
 * Oculta los elementos del sidebar que el empleado no puede ver.
 * Busca los enlaces por su atributo data-route y oculta el <li> padre.
 * @param {string} rol - Rol del usuario autenticado
 */
function filtrarSidebarPorRol(rol) {
    // Solo aplicar restricciones al rol EMPLEADO
    if (rol !== 'EMPLEADO') return;

    // Obtener todos los enlaces del sidebar
    const enlaces = document.querySelectorAll('.sidebar__enlace');

    // Recorrer cada enlace y ocultar los restringidos
    enlaces.forEach(enlace => {
        // Obtener el nombre de la ruta desde el atributo data-route del enlace
        const ruta = enlace.getAttribute('data-route');
        // Verificar si la ruta está restringida para EMPLEADO
        if (ruta && RUTAS_RESTRINGIDAS_EMPLEADO.includes(ruta)) {
            // Ocultar el elemento <li> padre del enlace
            enlace.closest('.sidebar__elemento').style.display = 'none';
        }
    });
}

/**
 * Protege las rutas restringidas redirigiendo al empleado.
 * Si un empleado intenta acceder a una ruta que no le corresponde,
 * lo redirige a la ruta de clientes (su vista principal).
 * @param {string} rol - Rol del usuario autenticado
 */
function protegerPaginaPorRol(rol) {
    // Solo aplicar restricciones al rol EMPLEADO
    if (rol !== 'EMPLEADO') return;

    // Obtener la ruta actual desde el hash de la URL (ej: '#/home' → 'home')
    const hash = window.location.hash.slice(1);
    const rutaActual = hash.startsWith('/') ? hash.slice(1) : (hash || 'home');

    // Si la ruta actual está restringida, redirigir a clientes
    if (RUTAS_RESTRINGIDAS_EMPLEADO.includes(rutaActual)) {
        window.location.hash = '#/clientes';
    }
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
 * Muestra la navegación del sidebar después de aplicar el filtrado por rol.
 * Agrega la clase CSS que cambia visibility de hidden a visible.
 */
function mostrarSidebar() {
    // Buscar el contenedor de navegación del sidebar
    const nav = document.querySelector('.sidebar__nav');
    // Si existe, agregar la clase que lo hace visible
    if (nav) nav.classList.add('sidebar__nav--visible');
}

/**
 * Inicializa el perfil global automáticamente.
 * Se llama desde main.js para asegurar que se ejecute en todas las páginas.
 * IMPORTANTE: Primero aplica restricciones de rol con localStorage (síncrono,
 * sin delay) para evitar el parpadeo del sidebar completo. Luego carga los
 * datos frescos del backend para actualizar nombre y rol en el sidebar.
 */
export async function initGlobalProfile() {
    // ── Paso 1: restricciones inmediatas con localStorage (síncrono) ──
    // Leer el rol guardado en localStorage (instantáneo, sin llamada HTTP)
    const rolLocal = obtenerRol();

    // Si hay rol en localStorage, aplicar restricciones antes de que se pinte el sidebar
    if (rolLocal) {
        // Redirigir si el empleado está en una página que no le corresponde
        protegerPaginaPorRol(rolLocal);
        // Ocultar items del sidebar que el empleado no puede ver
        filtrarSidebarPorRol(rolLocal);
    }

    // ── Paso 2: pre-cargar nombre del usuario desde localStorage (síncrono) ──
    // Evita que el sidebar muestre datos de otro usuario mientras carga del backend
    const usuarioLocal = obtenerUsuario();

    // Si hay datos del usuario en localStorage, mostrarlos inmediatamente
    if (usuarioLocal) {
        // Actualizar sidebar con los datos locales (nombre, apellido, rol)
        updateSidebarProfile(usuarioLocal);
    }

    // ── Paso 3: mostrar sidebar después del filtrado (ya no hay flash) ──
    mostrarSidebar();

    // ── Paso 4: cargar datos frescos del backend (asíncrono) ──
    try {
        // Obtener perfil actualizado del backend y refrescar sidebar
        await loadGlobalProfile();
    } catch (error) {
        console.error('[GlobalProfile] No se pudo inicializar el perfil global:', error);
        // No mostrar error al usuario, solo log para desarrollo
    }
}
