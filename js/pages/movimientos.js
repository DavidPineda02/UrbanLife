/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — MOVIMIENTOS FINANCIEROS ==================== */
/* ========================================================================== */

/**
 * Lógica de la página de movimientos financieros.
 * Muestra el libro contable central: todas las ventas, compras y gastos
 * registrados en el sistema, con sus montos y naturaleza (ingreso/egreso).
 *
 * Funcionalidades:
 *  - Carga y renderiza la tabla de movimientos desde el API
 *  - Búsqueda por concepto o ID en tiempo real (client-side)
 *  - Filtro por tipo (Venta/Compra/Gasto), naturaleza (Ingreso/Egreso) y período
 *  - Tarjetas resumen: total ingresos, total egresos, ganancia neta
 *  - Los totales se recalculan según los filtros aplicados
 *
 * Nota: Esta vista es de SOLO LECTURA — los movimientos se crean
 *       automáticamente al registrar ventas, compras y gastos.
 *
 * Dependencias:
 *  - movimientos.service.js → llamadas al API de movimientos
 *  - alerts.js              → SweetAlert2 (éxito/error)
 */

// Importar función del servicio de movimientos
import { obtenerMovimientos } from '../api/services/movimientos.service.js';    // GET todos los movimientos

// Importar utilidades
import { mostrarAlertaError } from '../utils/alerts.js';                       // Alertas de error

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de movimientos cargados desde el backend (cache local) */
let movimientos = [];

/* -------------------------------------------------------------------------- */
/* ----- Utilidades de Formato ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Formatea un valor numérico como precio en pesos colombianos.
 * @param {number} precio - Valor numérico a formatear
 * @returns {string} Precio formateado (ej: "$ 120.000")
 */
function formatearPrecio(precio) {
    /* Formatear con separador de miles y sin decimales */
    return '$ ' + Math.round(precio).toLocaleString('es-CO');
}

/**
 * Formatea una fecha en formato ISO a formato legible.
 * @param {string} fechaStr - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada (DD/MM/YYYY)
 */
function formatearFecha(fechaStr) {
    /* Validar que fechaStr exista y sea un string */
    if (!fechaStr || typeof fechaStr !== 'string') {
        return 'Sin fecha';                                                    // Texto por defecto si no hay fecha
    }

    /* Separar la fecha en componentes [año, mes, día] */
    const [anio, mes, dia] = fechaStr.split('-');

    /* Validar que tenga los componentes esperados */
    if (!anio || !mes || !dia) {
        return 'Fecha inválida';                                               // Texto si el formato es incorrecto
    }

    /* Retornar en formato DD/MM/YYYY */
    return `${dia}/${mes}/${anio}`;
}

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cuerpo de la tabla donde se renderizan las filas de movimientos */
let tbody;

/** Input de búsqueda por concepto o ID */
let inputBusqueda;

/** Select de filtro por tipo de movimiento */
let selectTipo;

/** Select de filtro por naturaleza (Ingreso/Egreso) */
let selectNaturaleza;

/** Select de filtro por período de tiempo */
let selectPeriodo;

/** Elemento que muestra el total de ingresos */
let resumenIngresos;

/** Elemento que muestra el total de egresos */
let resumenEgresos;

/** Elemento que muestra la ganancia neta */
let resumenGanancia;

/* -------------------------------------------------------------------------- */
/* ----- Cargar Movimientos desde el Backend -------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los movimientos financieros del backend y los renderiza.
 * @returns {Promise<void>}
 */
async function cargarMovimientos() {
    try {
        /* Petición GET al backend */
        movimientos = await obtenerMovimientos();

        /* Renderizar la tabla con los datos obtenidos */
        renderizarMovimientos();
    } catch (error) {
        /* Mostrar alerta de error si falla la carga */
        mostrarAlertaError('Error al cargar los movimientos financieros');
        /* Log del error para depuración */
        console.error('Error al cargar movimientos:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Movimientos en la Tabla --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza la tabla de movimientos con los datos del array local.
 * Aplica filtros de búsqueda, tipo, naturaleza y período.
 * Recalcula los totales de las tarjetas resumen según los filtros.
 */
function renderizarMovimientos() {
    /* Obtener valores de los filtros */
    const busqueda = inputBusqueda.value.toLowerCase().trim();                 // Texto de búsqueda
    const tipoFiltro = selectTipo.value;                                       // Tipo: Venta, Compra, Gasto Adicional
    const naturalezaFiltro = selectNaturaleza.value;                           // Naturaleza: Ingreso, Egreso
    const periodoFiltro = selectPeriodo.value;                                 // Período: today, week, month, year

    /* Filtrar los movimientos según todos los criterios */
    const filtrados = movimientos.filter(mov => {
        /* Verificar si el concepto o el ID coinciden con la búsqueda */
        const coincideBusqueda = busqueda === '' ||
            (mov.concepto && mov.concepto.toLowerCase().includes(busqueda)) ||
            mov.idMovimiento.toString().includes(busqueda);

        /* Verificar si coincide el filtro de tipo */
        const coincideTipo = tipoFiltro === '' || mov.tipoMovimiento === tipoFiltro;

        /* Verificar si coincide el filtro de naturaleza */
        const coincideNaturaleza = naturalezaFiltro === '' || mov.naturaleza === naturalezaFiltro;

        /* Verificar si coincide el filtro de período */
        let coincidePeriodo = true;                                            // Por defecto pasa el filtro
        if (periodoFiltro !== '' && mov.fecha) {
            /* Crear objeto Date desde el string de fecha */
            const fechaMov = new Date(mov.fecha + 'T00:00:00');
            /* Obtener la fecha de hoy sin hora */
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            /* Comparar según el período seleccionado */
            switch (periodoFiltro) {
                case 'today':
                    /* Verificar si la fecha es hoy */
                    coincidePeriodo = fechaMov.toDateString() === hoy.toDateString();
                    break;
                case 'week':
                    /* Calcular el inicio de la semana (domingo) */
                    const inicioSemana = new Date(hoy);
                    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
                    /* Verificar si la fecha es posterior al inicio de la semana */
                    coincidePeriodo = fechaMov >= inicioSemana;
                    break;
                case 'month':
                    /* Verificar si la fecha está en el mismo mes y año */
                    coincidePeriodo = fechaMov.getMonth() === hoy.getMonth() &&
                        fechaMov.getFullYear() === hoy.getFullYear();
                    break;
                case 'year':
                    /* Verificar si la fecha está en el mismo año */
                    coincidePeriodo = fechaMov.getFullYear() === hoy.getFullYear();
                    break;
            }
        }

        /* Retornar true si cumple todos los filtros */
        return coincideBusqueda && coincideTipo && coincideNaturaleza && coincidePeriodo;
    });

    /* Calcular totales de las tarjetas resumen con los datos filtrados */
    calcularResumen(filtrados);

    /* Construir el HTML de todas las filas filtradas */
    tbody.innerHTML = filtrados.map(mov => {
        /* Determinar clase CSS del badge según el tipo de movimiento */
        let badgeTipoClase = '';                                               // Clase CSS del badge de tipo
        if (mov.tipoMovimiento === 'Venta') badgeTipoClase = 'tabla__badge--venta';              // Teal para ventas
        else if (mov.tipoMovimiento === 'Compra') badgeTipoClase = 'tabla__badge--compra';       // Azul para compras
        else badgeTipoClase = 'tabla__badge--gasto';                           // Naranja para gastos

        /* Determinar clase CSS del badge según la naturaleza */
        const badgeNatClase = mov.naturaleza === 'Ingreso'
            ? 'tabla__badge--ingreso'                                          // Verde para ingresos
            : 'tabla__badge--egreso';                                          // Rojo para egresos

        /* Retornar el HTML de la fila */
        return `
            <tr class="tabla__fila">
                <td class="tabla__td">${mov.idMovimiento}</td>
                <td class="tabla__td">${formatearFecha(mov.fecha)}</td>
                <td class="tabla__td">
                    <span class="tabla__badge ${badgeTipoClase}">${mov.tipoMovimiento}</span>
                </td>
                <td class="tabla__td">${mov.concepto}</td>
                <td class="tabla__td">
                    <span class="tabla__badge ${badgeNatClase}">${mov.naturaleza}</span>
                </td>
                <td class="tabla__td tabla__td--precio">${formatearPrecio(mov.monto)}</td>
            </tr>
        `;
    }).join('');                                                                // Unir todas las filas en un string

    /* Si no hay resultados, mostrar un mensaje vacío */
    if (filtrados.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-texto-suave);">
                No se encontraron movimientos financieros
            </td></tr>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Calcular Resumen (Tarjetas) ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Calcula y actualiza las tarjetas resumen con los totales de los
 * movimientos filtrados: ingresos, egresos y ganancia neta.
 * @param {Array} movsFiltrados - Array de movimientos ya filtrados
 */
function calcularResumen(movsFiltrados) {
    /* Sumar todos los ingresos (naturaleza = 'Ingreso') */
    const totalIngresos = movsFiltrados
        .filter(m => m.naturaleza === 'Ingreso')                               // Solo ingresos
        .reduce((sum, m) => sum + (m.monto || 0), 0);                         // Sumar montos

    /* Sumar todos los egresos (naturaleza = 'Egreso') */
    const totalEgresos = movsFiltrados
        .filter(m => m.naturaleza === 'Egreso')                                // Solo egresos
        .reduce((sum, m) => sum + (m.monto || 0), 0);                         // Sumar montos

    /* Calcular la ganancia neta (ingresos - egresos) */
    const ganancia = totalIngresos - totalEgresos;

    /* Actualizar los textos de las tarjetas */
    resumenIngresos.textContent = formatearPrecio(totalIngresos);              // Total ingresos
    resumenEgresos.textContent = formatearPrecio(totalEgresos);                // Total egresos
    resumenGanancia.textContent = formatearPrecio(ganancia);                   // Ganancia neta
}

/* -------------------------------------------------------------------------- */
/* ----- Configurar Event Listeners ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Configura todos los event listeners necesarios para la página.
 * Conecta los filtros de búsqueda con la función de renderizado.
 */
function configurarEventListeners() {
    /* Filtrar en tiempo real mientras el usuario escribe en el buscador */
    inputBusqueda?.addEventListener('input', renderizarMovimientos);

    /* Filtrar cuando cambia el select de tipo */
    selectTipo?.addEventListener('change', renderizarMovimientos);

    /* Filtrar cuando cambia el select de naturaleza */
    selectNaturaleza?.addEventListener('change', renderizarMovimientos);

    /* Filtrar cuando cambia el select de período */
    selectPeriodo?.addEventListener('change', renderizarMovimientos);
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización de la Página ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página de movimientos financieros (SPA).
 * Consulta los elementos del DOM, conecta los event listeners,
 * reinicia el estado local y carga los datos iniciales.
 * @returns {Promise<void>}
 */
export async function inicializar() {
    try {
        /* ===== Reiniciar Estado Local ===== */

        /* Vaciar el cache local de movimientos */
        movimientos = [];

        /* ===== Consultar Elementos del DOM ===== */

        /* Obtener el cuerpo de la tabla de movimientos */
        tbody = document.querySelector('.tabla__cuerpo');
        /* Obtener el input de búsqueda */
        inputBusqueda = document.querySelector('.buscador__input');
        /* Obtener el select de filtro por tipo */
        selectTipo = document.querySelector('[name="filtro-tipo"]');
        /* Obtener el select de filtro por naturaleza */
        selectNaturaleza = document.querySelector('[name="filtro-naturaleza"]');
        /* Obtener el select de filtro por período */
        selectPeriodo = document.querySelector('[name="filtro-periodo"]');
        /* Obtener los elementos de las tarjetas resumen */
        resumenIngresos = document.getElementById('resumen-ingresos');
        resumenEgresos = document.getElementById('resumen-egresos');
        resumenGanancia = document.getElementById('resumen-ganancia');

        /* ===== Configurar Event Listeners ===== */

        /* Conectar filtros con la función de renderizado */
        configurarEventListeners();

        /* ===== Carga Inicial de Datos ===== */

        /* Cargar los movimientos desde el backend y renderizar la tabla */
        await cargarMovimientos();
    } catch (error) {
        /* Mostrar alerta de error si falla la inicialización */
        mostrarAlertaError('Error al cargar la página. Por favor, recargue.');
    }
}
