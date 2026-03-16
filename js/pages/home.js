/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — DASHBOARD (HOME) ============================ */
/* ========================================================================== */

/**
 * Lógica de la página de inicio / dashboard de ganancias.
 * Carga todos los datos financieros desde el backend y renderiza
 * dinámicamente las tarjetas resumen, gráficos y listas.
 *
 * Secciones del dashboard:
 *  1. Tarjetas resumen     → Ventas del día, Egresos hoy, Ganancias del mes, Productos activos
 *  2. Gráfico de barras    → Ventas por día de los últimos 7 días
 *  3. Resumen semanal      → Ingresos, Egresos y Ganancias acumulados de la semana
 *  4. Gráfico de dona      → Stock total agrupado por categoría
 *  5. Productos rentables  → Top 5 productos con mayor margen de ganancia
 *
 * Dependencias:
 *  - dashboard.service.js → 5 endpoints GET del backend
 *  - notifications.js     → toasts de error
 */

// Importar funciones del servicio de dashboard
import {
    obtenerResumen,                                                            // GET tarjetas resumen
    obtenerVentasSemanales,                                                    // GET ventas por día (7 días)
    obtenerResumenSemanal,                                                     // GET ingresos/egresos/ganancias diarios
    obtenerStockCategorias,                                                    // GET stock por categoría
    obtenerProductosRentables,                                                 // GET top 10 productos rentables
} from '../api/services/dashboard.service.js';

// Importar utilidades de UI
import { showNotification } from '../utils/notifications.js';                  // Toasts

/* -------------------------------------------------------------------------- */
/* ----- Constantes --------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Nombres cortos de los días de la semana en español (0=Domingo ... 6=Sábado) */
const NOMBRES_DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Paleta de colores para el gráfico de dona (hasta 10 categorías) */
const COLORES_DONA = [
    '#6c5ce7',                                                                 // Morado
    '#00b894',                                                                 // Verde
    '#fdcb6e',                                                                 // Amarillo
    '#e17055',                                                                 // Naranja
    '#0984e3',                                                                 // Azul
    '#d63031',                                                                 // Rojo
    '#00cec9',                                                                 // Turquesa
    '#e84393',                                                                 // Rosa
    '#636e72',                                                                 // Gris
    '#2d3436',                                                                 // Gris oscuro
];

/** Íconos de FontAwesome para los productos rentables (se ciclan) */
const ICONOS_PRODUCTOS = [
    'fa-trophy',                                                               // 1er lugar
    'fa-star',                                                                 // 2do lugar
    'fa-shirt',                                                                // 3er lugar
    'fa-hat-cowboy',                                                           // 4to lugar
    'fa-water',                                                                // 5to lugar
];

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* ----- Tarjetas Resumen ----- */

/** Valor de la tarjeta "Ventas del día" */
let valorVentasDia;

/** Valor de la tarjeta "Egresos del día" */
let valorEgresosDia;

/** Valor de la tarjeta "Ganancias del mes" */
let valorGananciasMes;

/** Valor de la tarjeta "Productos activos" */
let valorProductosActivos;

/* ----- Gráfico de Barras (Ventas por Semana) ----- */

/** Contenedor de las barras verticales */
let barrasContenedor;

/** Contenedor del eje Y (etiquetas de valores) */
let ejeY;

/** Contenedor del eje X (nombres de los días) */
let ejeX;

/* ----- Resumen Semanal ----- */

/** Barra horizontal de ingresos semanales */
let barraIngresos;

/** Barra horizontal de egresos semanales */
let barraEgresos;

/** Barra horizontal de ganancias semanales */
let barraGanancias;

/* ----- Gráfico de Dona (Stock por Categoría) ----- */

/** Elemento visual de la dona (recibe conic-gradient) */
let dona;

/** Valor total dentro de la dona */
let donaTotalValor;

/** Texto de unidad dentro de la dona */
let donaTotalUnidad;

/** Contenedor de la leyenda de la dona */
let donaLeyenda;

/* ----- Productos Rentables ----- */

/** Contenedor de la lista de productos rentables */
let listaRentables;

/* -------------------------------------------------------------------------- */
/* ----- Formatear Precio -------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Formatea un número como precio colombiano con separador de miles.
 * @param {number} precio - Valor numérico a formatear
 * @returns {string} Precio formateado (ej: "$ 120.000")
 */
function formatearPrecio(precio) {
    /* Formatear con separador de miles y sin decimales */
    return '$ ' + Math.round(precio).toLocaleString('es-CO');
}

/* -------------------------------------------------------------------------- */
/* ----- 1. Cargar Tarjetas Resumen ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga los datos del resumen y actualiza las 4 tarjetas del dashboard.
 * @returns {Promise<void>}
 */
async function cargarResumen() {
    try {
        /* Petición GET al backend para obtener el resumen */
        const resumen = await obtenerResumen();

        /* Actualizar el valor de la tarjeta "Ventas del día" */
        valorVentasDia.textContent = formatearPrecio(resumen.ingresosHoy);

        /* Actualizar el valor de la tarjeta "Egresos del día" */
        valorEgresosDia.textContent = formatearPrecio(resumen.egresosHoy);

        /* Actualizar el valor de la tarjeta "Ganancias del mes" */
        valorGananciasMes.textContent = formatearPrecio(resumen.gananciaMes);

        /* Actualizar el valor de la tarjeta "Productos activos" */
        valorProductosActivos.textContent = resumen.productosActivos;
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar el resumen', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar resumen:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- 2. Cargar Gráfico de Barras (Ventas por Semana) -------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Genera los últimos 7 días como array de objetos { fecha, diaNombre }.
 * Incluye días sin ventas (total = 0) para mostrar todas las barras.
 * @returns {Object[]} Array de 7 días con fecha ISO y nombre corto
 */
function generarUltimos7Dias() {
    /* Array donde se acumularán los 7 días */
    const dias = [];

    /* Iterar desde hace 6 días hasta hoy */
    for (let i = 6; i >= 0; i--) {
        /* Crear un objeto Date restando i días a hoy */
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);

        /* Formatear la fecha como YYYY-MM-DD en zona horaria local para comparar con el backend */
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const fechaISO = `${anio}-${mes}-${dia}`;

        /* Obtener el nombre corto del día desde el array de constantes */
        const diaNombre = NOMBRES_DIAS[fecha.getDay()];

        /* Agregar el día al array */
        dias.push({ fecha: fechaISO, diaNombre });
    }

    /* Retornar los 7 días generados */
    return dias;
}

/**
 * Carga las ventas semanales y renderiza el gráfico de barras.
 * Genera los 7 días completos rellenando con 0 los que no tienen ventas.
 * @returns {Promise<void>}
 */
async function cargarVentasSemanales() {
    try {
        /* Petición GET al backend para obtener ventas por día */
        const ventasDias = await obtenerVentasSemanales();

        /* Generar los 7 días completos (incluyendo días sin ventas) */
        const dias7 = generarUltimos7Dias();

        /* Crear un mapa fecha → total para acceso rápido */
        const mapaVentas = {};
        ventasDias.forEach(d => {
            /* Mapear cada fecha del backend a su total de ventas */
            mapaVentas[d.fecha] = d.total;
        });

        /* Combinar los 7 días con los totales (0 si no hay venta ese día) */
        const datosCompletos = dias7.map(dia => ({
            diaNombre: dia.diaNombre,                                          // Nombre corto del día
            total: mapaVentas[dia.fecha] || 0,                                 // Total de ventas o 0
        }));

        /* Encontrar el valor máximo para escalar las barras */
        const maxValor = Math.max(...datosCompletos.map(d => d.total), 1);

        /* Calcular el tope del eje Y (redondear hacia arriba al millar más cercano) */
        const topeEje = Math.ceil(maxValor / 1000) * 1000;

        /* Renderizar las etiquetas del eje Y (5 divisiones + 0) */
        ejeY.innerHTML = '';
        for (let i = 5; i >= 0; i--) {
            /* Calcular el valor de cada división */
            const valor = Math.round((topeEje / 5) * i);
            /* Formatear como miles para mostrar en el eje */
            const etiqueta = valor >= 1000
                ? `${Math.round(valor / 1000)}k`                              // Ej: "500k"
                : String(valor);                                               // Ej: "0"
            /* Crear el span de la etiqueta */
            ejeY.innerHTML += `<span class="barras__eje-etiqueta">${etiqueta}</span>`;
        }

        /* Renderizar las barras verticales */
        barrasContenedor.innerHTML = datosCompletos.map(d => {
            /* Calcular la altura como porcentaje del tope (mínimo 2% para que se vea) */
            const altura = d.total > 0 ? Math.max((d.total / topeEje) * 100, 2) : 0;
            /* Formatear el valor para mostrar sobre la barra */
            const valorTexto = d.total >= 1000
                ? `${Math.round(d.total / 1000)}k`                            // Ej: "350k"
                : String(Math.round(d.total));                                 // Ej: "0"

            /* Retornar el HTML de la barra con data-altura para la animación CSS */
            return `
                <div class="barras__elemento" data-altura="${altura}%" data-valor="${Math.round(d.total)}">
                    <span class="barras__valor">${valorTexto}</span>
                </div>
            `;
        }).join('');

        /* Renderizar las etiquetas del eje X con los nombres de los días */
        ejeX.innerHTML = datosCompletos.map(d =>
            `<span class="barras__dia">${d.diaNombre}</span>`
        ).join('');

        /* Aplicar las alturas CSS a las barras recién creadas */
        document.querySelectorAll('[data-altura]').forEach(barra => {
            /* Establecer la variable CSS --altura-barra desde el data attribute */
            barra.style.setProperty('--altura-barra', barra.dataset.altura);
        });
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar ventas semanales', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar ventas semanales:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- 3. Cargar Resumen Semanal ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Carga el resumen semanal, suma los totales y renderiza las barras horizontales.
 * @returns {Promise<void>}
 */
async function cargarResumenSemanal() {
    try {
        /* Petición GET al backend para obtener datos diarios de la semana */
        const diasSemana = await obtenerResumenSemanal();

        /* Sumar los ingresos de todos los días de la semana */
        const totalIngresos = diasSemana.reduce((acc, d) => acc + d.ingresos, 0);
        /* Sumar los egresos de todos los días de la semana */
        const totalEgresos = diasSemana.reduce((acc, d) => acc + d.egresos, 0);
        /* Calcular las ganancias como ingresos - egresos */
        const totalGanancias = totalIngresos - totalEgresos;

        /* Encontrar el valor máximo para escalar las barras horizontales */
        const maxValor = Math.max(totalIngresos, totalEgresos, Math.abs(totalGanancias), 1);

        /* Calcular el ancho porcentual de cada barra relativo al máximo */
        const anchoIngresos = Math.round((totalIngresos / maxValor) * 100);
        const anchoEgresos = Math.round((totalEgresos / maxValor) * 100);
        const anchoGanancias = Math.round((Math.abs(totalGanancias) / maxValor) * 100);

        /* Actualizar la barra de ingresos con su valor y ancho */
        barraIngresos.querySelector('.resumen-semanal__valor').textContent = formatearPrecio(totalIngresos);
        barraIngresos.dataset.ancho = `${anchoIngresos}%`;
        barraIngresos.style.setProperty('--ancho', `${anchoIngresos}%`);

        /* Actualizar la barra de egresos con su valor y ancho */
        barraEgresos.querySelector('.resumen-semanal__valor').textContent = formatearPrecio(totalEgresos);
        barraEgresos.dataset.ancho = `${anchoEgresos}%`;
        barraEgresos.style.setProperty('--ancho', `${anchoEgresos}%`);

        /* Actualizar la barra de ganancias con su valor y ancho */
        barraGanancias.querySelector('.resumen-semanal__valor').textContent = formatearPrecio(totalGanancias);
        barraGanancias.dataset.ancho = `${anchoGanancias}%`;
        barraGanancias.style.setProperty('--ancho', `${anchoGanancias}%`);
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar resumen semanal', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar resumen semanal:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- 4. Cargar Gráfico de Dona (Stock por Categoría) -------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga los datos de stock por categoría y renderiza el gráfico de dona.
 * Genera el conic-gradient CSS y la leyenda dinámicamente.
 * @returns {Promise<void>}
 */
async function cargarStockCategorias() {
    try {
        /* Petición GET al backend para obtener stock agrupado */
        const categorias = await obtenerStockCategorias();

        /* Calcular el total de stock sumando todas las categorías */
        const totalStock = categorias.reduce((acc, c) => acc + c.totalStock, 0);

        /* Actualizar el valor total dentro de la dona */
        donaTotalValor.textContent = totalStock;
        /* Actualizar el texto de unidad */
        donaTotalUnidad.textContent = 'productos';

        /* Construir el conic-gradient CSS a partir de los datos */
        let gradiente = '';
        /* Ángulo acumulado para posicionar cada segmento de la dona */
        let anguloAcumulado = 0;

        /* Recorrer cada categoría para construir el gradiente */
        categorias.forEach((cat, i) => {
            /* Calcular el porcentaje de esta categoría respecto al total */
            const porcentaje = totalStock > 0 ? (cat.totalStock / totalStock) * 100 : 0;
            /* Obtener el color correspondiente (se cicla si hay más de 10 categorías) */
            const color = COLORES_DONA[i % COLORES_DONA.length];
            /* Calcular el ángulo final del segmento */
            const anguloFinal = anguloAcumulado + porcentaje;

            /* Agregar el segmento al gradiente con separador si no es el primero */
            if (i > 0) gradiente += ', ';
            gradiente += `${color} ${anguloAcumulado}% ${anguloFinal}%`;

            /* Avanzar el ángulo acumulado para el siguiente segmento */
            anguloAcumulado = anguloFinal;
        });

        /* Aplicar el conic-gradient como fondo de la dona */
        if (categorias.length > 0) {
            dona.style.background = `conic-gradient(${gradiente})`;
        } else {
            /* Si no hay categorías, mostrar gris */
            dona.style.background = '#e0e0e0';
        }

        /* Renderizar la leyenda dinámicamente */
        donaLeyenda.innerHTML = categorias.map((cat, i) => {
            /* Calcular el porcentaje para la leyenda */
            const porcentaje = totalStock > 0 ? Math.round((cat.totalStock / totalStock) * 100) : 0;
            /* Obtener el color del segmento */
            const color = COLORES_DONA[i % COLORES_DONA.length];

            /* Retornar el HTML del elemento de la leyenda */
            return `
                <div class="pastel-leyenda__elemento">
                    <div class="pastel-leyenda__indicador" style="background: ${color};"></div>
                    <div class="pastel-leyenda__info">
                        <span class="pastel-leyenda__etiqueta">${cat.categoria}</span>
                        <span class="pastel-leyenda__valor">${cat.totalStock} unidades</span>
                    </div>
                    <span class="pastel-leyenda__porcentaje">${porcentaje}%</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar stock por categoría', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar stock categorías:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- 5. Cargar Productos Rentables -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga los productos más rentables y renderiza la lista con barras de margen.
 * Muestra solo los primeros 5 del top 10 retornado por el backend.
 * @returns {Promise<void>}
 */
async function cargarProductosRentables() {
    try {
        /* Petición GET al backend para obtener los productos rentables */
        const productos = await obtenerProductosRentables();

        /* Tomar solo los primeros 5 para la vista */
        const top5 = productos.slice(0, 5);

        /* Renderizar la lista de productos rentables */
        listaRentables.innerHTML = top5.map((prod, i) => {
            /* Redondear el porcentaje de margen */
            const porcentaje = Math.round(prod.margenPorcentaje);

            /* Determinar la clase CSS del nivel de margen */
            let nivelClase = '';
            if (porcentaje >= 50) {
                nivelClase = '--alto';                                         // Verde para margen alto
            } else if (porcentaje >= 30) {
                nivelClase = '--medio';                                        // Amarillo para margen medio
            } else {
                nivelClase = '--bajo';                                         // Rojo para margen bajo
            }

            /* Obtener el ícono correspondiente (se cicla si hay más de 5) */
            const icono = ICONOS_PRODUCTOS[i % ICONOS_PRODUCTOS.length];

            /* Clase especial para el primer elemento (trofeo dorado) */
            const claseElemento = i === 0 ? 'margen-elemento margen-elemento--alto' : 'margen-elemento';
            /* Clase del ícono (diferentes colores según posición) */
            const claseIcono = i === 0 ? 'margen-elemento__icono' : `margen-elemento__icono margen-elemento__icono--${i + 1}`;

            /* Retornar el HTML del elemento del producto */
            return `
                <div class="${claseElemento}">
                    <div class="${claseIcono}">
                        <i class="fa-solid ${icono}"></i>
                    </div>
                    <div class="margen-elemento__contenido">
                        <div class="margen-elemento__header">
                            <span class="margen-elemento__nombre">${prod.nombre}</span>
                            <span class="margen-elemento__porcentaje margen-elemento__porcentaje${nivelClase}">${porcentaje}%</span>
                        </div>
                        <div class="margen-elemento__barra-contenedor">
                            <div class="margen-elemento__barra margen-elemento__barra${nivelClase}"
                                data-ancho-barra="${porcentaje}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        /* Aplicar los anchos CSS a las barras de margen recién creadas */
        document.querySelectorAll('[data-ancho-barra]').forEach(barra => {
            /* Establecer la variable CSS --ancho-barra desde el data attribute */
            barra.style.setProperty('--ancho-barra', barra.dataset.anchoBarra);
        });

        /* Si no hay productos, mostrar mensaje vacío */
        if (top5.length === 0) {
            listaRentables.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--color-texto-suave);">
                    No hay productos registrados
                </div>
            `;
        }
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar productos rentables', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar productos rentables:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Función Global para Actualización Dashboard -------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Función global que puede ser llamada desde otras páginas para actualizar el dashboard.
 * Actualiza principalmente los egresos que se ven afectados por compras y gastos.
 * @returns {Promise<void>}
 */
async function actualizarDashboard() {
    try {
        console.log('🔄 Actualizando dashboard...');
        
        /* Actualizar las secciones que afectan egresos */
        await Promise.all([
            cargarResumen(),           // Actualiza tarjeta "Egresos del día"
            cargarResumenSemanal()    // Actualiza barra de egresos semanales
        ]);
        
        console.log('✅ Dashboard actualizado correctamente');
    } catch (error) {
        console.error('❌ Error al actualizar dashboard:', error);
    }
}

/* Hacer la función disponible globalmente para otras páginas */
window.actualizarDashboard = actualizarDashboard;

/* -------------------------------------------------------------------------- */
/* ----- Inicialización ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página del dashboard.
 * Se ejecuta cuando el SPA navega a esta página.
 * Consulta los elementos del DOM y lanza todas las cargas en paralelo.
 * @returns {Promise<void>}
 */
export async function inicializar() {

    /* ===== Consultar Elementos del DOM ===== */

    /* Obtener el valor de la tarjeta "Ventas del día" */
    valorVentasDia = document.getElementById('tarjeta-ventas-valor');
    /* Obtener el valor de la tarjeta "Egresos del día" */
    valorEgresosDia = document.getElementById('tarjeta-egresos-valor');
    /* Obtener el valor de la tarjeta "Ganancias del mes" */
    valorGananciasMes = document.getElementById('tarjeta-ganancias-valor');
    /* Obtener el valor de la tarjeta "Productos activos" */
    valorProductosActivos = document.getElementById('tarjeta-productos-valor');

    /* Obtener el contenedor de las barras verticales */
    barrasContenedor = document.querySelector('.barras');
    /* Obtener el contenedor del eje Y (etiquetas de valores) */
    ejeY = document.querySelector('.barras__eje-y');
    /* Obtener el contenedor del eje X (nombres de los días) */
    ejeX = document.querySelector('.barras__eje-x');

    /* Obtener la barra horizontal de ingresos semanales */
    barraIngresos = document.querySelector('.resumen-semanal__barra--ingreso');
    /* Obtener la barra horizontal de egresos semanales */
    barraEgresos = document.querySelector('.resumen-semanal__barra--egreso');
    /* Obtener la barra horizontal de ganancias semanales */
    barraGanancias = document.querySelector('.resumen-semanal__barra--ganancia');

    /* Obtener el elemento visual de la dona */
    dona = document.querySelector('.pastel-dona');
    /* Obtener el valor total dentro de la dona */
    donaTotalValor = document.querySelector('.pastel-dona__total-valor');
    /* Obtener el texto de unidad dentro de la dona */
    donaTotalUnidad = document.querySelector('.pastel-dona__total-unidad');
    /* Obtener el contenedor de la leyenda de la dona */
    donaLeyenda = document.querySelector('.pastel-leyenda');

    /* Obtener el contenedor de la lista de productos rentables */
    listaRentables = document.querySelector('.margen__lista');

    /* ===== Carga Inicial de Datos ===== */

    /* Cargar todas las secciones del dashboard en paralelo */
    await Promise.all([
        cargarResumen(),                                                           // Tarjetas resumen
        cargarVentasSemanales(),                                                   // Gráfico de barras
        cargarResumenSemanal(),                                                    // Barras horizontales
        cargarStockCategorias(),                                                   // Gráfico de dona
        cargarProductosRentables(),                                                // Lista de productos
    ]);
}
