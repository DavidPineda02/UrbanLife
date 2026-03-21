/* ========================================================================== */
/* ===== ROUTER SPA — NAVEGACIÓN SIN RECARGA ================================ */
/* ========================================================================== */

/**
 * Router basado en hash (#/ruta) para la navegación SPA.
 * Carga parciales HTML e inicializa el módulo JS de cada vista
 * sin recargar la página completa.
 *
 * Rutas soportadas:
 *  #/home, #/productos, #/categorias, #/clientes, #/ventas,
 *  #/proveedores, #/compras, #/usuarios, #/gastos, #/movimientos, #/perfil
 */

/* -------------------------------------------------------------------------- */
/* ----- Definición de Rutas ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Mapa de rutas: cada clave es el nombre de la ruta (sin #/)
 * y el valor contiene la ruta al parcial HTML y una función
 * que importa dinámicamente el módulo JS de la página.
 */
const RUTAS = {
    'home': {
        partial: '/view/partials/home.html',                                   // Parcial HTML del dashboard
        module: () => import('./pages/home.js'),                               // Módulo JS del dashboard
    },
    'productos': {
        partial: '/view/partials/productos.html',                              // Parcial HTML de productos
        module: () => import('./pages/productos.js'),                          // Módulo JS de productos
    },
    'categorias': {
        partial: '/view/partials/categorias.html',                             // Parcial HTML de categorías
        module: () => import('./pages/categorias.js'),                         // Módulo JS de categorías
    },
    'clientes': {
        partial: '/view/partials/clientes.html',                               // Parcial HTML de clientes
        module: () => import('./pages/clientes.js'),                           // Módulo JS de clientes
    },
    'ventas': {
        partial: '/view/partials/ventas.html',                                 // Parcial HTML de ventas
        module: () => import('./pages/ventas.js'),                             // Módulo JS de ventas
    },
    'proveedores': {
        partial: '/view/partials/proveedores.html',                            // Parcial HTML de proveedores
        module: () => import('./pages/proveedores.js'),                        // Módulo JS de proveedores
    },
    'compras': {
        partial: '/view/partials/compras.html',                                // Parcial HTML de compras
        module: () => import('./pages/compras.js'),                            // Módulo JS de compras
    },
    'usuarios': {
        partial: '/view/partials/usuarios.html',                               // Parcial HTML de usuarios
        module: () => import('./pages/usuarios.js'),                           // Módulo JS de usuarios
    },
    'gastos': {
        partial: '/view/partials/gastos.html',                                 // Parcial HTML de gastos
        module: () => import('./pages/gastos.js'),                             // Módulo JS de gastos
    },
    'movimientos': {
        partial: '/view/partials/movimientos.html',                            // Parcial HTML de movimientos financieros
        module: () => import('./pages/movimientos.js'),                        // Módulo JS de movimientos financieros
    },
    'perfil': {
        partial: '/view/partials/perfil.html',                                 // Parcial HTML de perfil
        module: () => import('./pages/perfil.js'),                             // Módulo JS de perfil
    },
};

/** Ruta por defecto cuando no hay hash o es inválido */
const RUTA_DEFAULT = 'home';

/* -------------------------------------------------------------------------- */
/* ----- Estado Interno ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Ruta actualmente cargada (para evitar recargar la misma vista) */
let rutaActual = null;

/** Contenedor donde se inyecta el HTML parcial */
let contenedor = null;

/** Caché de parciales HTML ya descargados (evita fetch repetidos) */
const cachePartials = {};

/* -------------------------------------------------------------------------- */
/* ----- Funciones del Router ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Extrae el nombre de la ruta desde el hash de la URL.
 * @returns {string} Nombre de la ruta (ej: 'home', 'ventas')
 */
function obtenerRutaDesdeHash() {
    /* Obtener el hash sin el # inicial */
    const hash = window.location.hash.slice(1);

    /* Quitar la barra inicial si existe (ej: '/home' → 'home') */
    const ruta = hash.startsWith('/') ? hash.slice(1) : hash;

    /* Si la ruta existe en el mapa, retornarla; si no, retornar la ruta por defecto */
    return RUTAS[ruta] ? ruta : RUTA_DEFAULT;
}

/**
 * Actualiza la clase activa en los enlaces del sidebar.
 * Resalta el enlace que corresponde a la ruta actual.
 * @param {string} ruta - Nombre de la ruta activa
 */
function actualizarEnlaceActivo(ruta) {
    /* Obtener todos los enlaces del sidebar */
    const enlaces = document.querySelectorAll('.sidebar__enlace');

    /* Recorrer cada enlace y quitar/agregar la clase activa */
    enlaces.forEach(enlace => {
        /* Obtener el valor del atributo data-route del enlace */
        const dataRoute = enlace.getAttribute('data-route');

        /* Si el data-route coincide con la ruta actual, marcar como activo */
        if (dataRoute === ruta) {
            enlace.classList.add('sidebar__enlace--activo');
        } else {
            enlace.classList.remove('sidebar__enlace--activo');
        }
    });
}

/**
 * Actualiza el título de la pestaña del navegador según la ruta.
 * @param {string} ruta - Nombre de la ruta activa
 */
function actualizarTitulo(ruta) {
    /* Mapa de títulos para cada ruta */
    const titulos = {
        'home': 'Inicio',
        'productos': 'Productos',
        'categorias': 'Categorías',
        'clientes': 'Clientes',
        'ventas': 'Ventas',
        'proveedores': 'Proveedores',
        'compras': 'Compras',
        'usuarios': 'Usuarios',
        'gastos': 'Gastos Adicionales',
        'movimientos': 'Movimientos Financieros',
        'perfil': 'Mi Perfil',
    };

    /* Actualizar el título de la pestaña */
    document.title = titulos[ruta] || 'UrbanLife';
}

/**
 * Carga el parcial HTML de una ruta (con caché).
 * @param {string} ruta - Nombre de la ruta
 * @returns {Promise<string>} HTML del parcial
 */
async function cargarPartial(ruta) {
    /* Si el parcial ya está en caché, retornarlo directamente */
    if (cachePartials[ruta]) {
        return cachePartials[ruta];
    }

    /* Obtener la URL del parcial desde la definición de rutas */
    const url = RUTAS[ruta].partial;

    /* Hacer fetch del archivo HTML parcial */
    const respuesta = await fetch(url);

    /* Si el fetch falla, lanzar error */
    if (!respuesta.ok) {
        throw new Error(`No se pudo cargar la vista: ${url}`);
    }

    /* Obtener el texto HTML */
    const html = await respuesta.text();

    /* Guardar en caché para futuros accesos */
    cachePartials[ruta] = html;

    /* Retornar el HTML */
    return html;
}

/**
 * Navega a una ruta: carga el HTML, lo inyecta y ejecuta el módulo JS.
 * @param {string} ruta - Nombre de la ruta a cargar
 */
async function navegar(ruta) {
    /* Si la ruta es la misma que la actual, no hacer nada */
    if (ruta === rutaActual) return;

    try {
        /* Cargar el HTML parcial de la ruta */
        const html = await cargarPartial(ruta);

        /* Inyectar el HTML en el contenedor principal */
        contenedor.innerHTML = html;

        /* Actualizar el enlace activo en el sidebar */
        actualizarEnlaceActivo(ruta);

        /* Actualizar el título de la pestaña */
        actualizarTitulo(ruta);

        /* Guardar la ruta actual */
        rutaActual = ruta;

        /* Importar dinámicamente el módulo JS de la página e inicializarlo */
        const modulo = await RUTAS[ruta].module();

        /* Llamar a la función inicializar del módulo si existe */
        if (modulo.inicializar) {
            await modulo.inicializar();
        }
    } catch (error) {
        /* Mostrar error en el contenedor si la carga falla */
        contenedor.innerHTML = `
            <main class="tablero" style="display:flex; align-items:center; justify-content:center;">
                <div style="text-align:center; color: var(--color-texto-suave);">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; margin-bottom:1rem;"></i>
                    <p>Error al cargar la vista</p>
                </div>
            </main>
        `;
        /* Log del error para depuración */
        console.error('[Router] Error al navegar a', ruta, error);
    }
}

/**
 * Manejador del evento hashchange.
 * Se dispara cuando el usuario navega con los enlaces del sidebar
 * o usa los botones adelante/atrás del navegador.
 */
function onHashChange() {
    /* Obtener la ruta desde el hash actual */
    const ruta = obtenerRutaDesdeHash();

    /* Navegar a la ruta */
    navegar(ruta);
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización del Router ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Inicializa el router SPA.
 * Obtiene el contenedor, escucha cambios de hash y carga la ruta inicial.
 */
export async function initRouter() {
    /* Obtener el contenedor donde se inyecta el contenido */
    contenedor = document.getElementById('app-content');

    /* Escuchar cambios en el hash de la URL (navegación del sidebar y botones del navegador) */
    window.addEventListener('hashchange', onHashChange);

    /* Si no hay hash en la URL, establecer el hash por defecto */
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        window.location.hash = `#/${RUTA_DEFAULT}`;
    } else {
        /* Cargar la ruta actual del hash */
        onHashChange();
    }
}

/**
 * Navega programáticamente a una ruta.
 * Útil para redirigir desde otros módulos (ej: protección por rol).
 * @param {string} ruta - Nombre de la ruta destino (ej: 'clientes')
 */
export function navegarA(ruta) {
    /* Cambiar el hash de la URL, lo que dispara hashchange automáticamente */
    window.location.hash = `#/${ruta}`;
}
