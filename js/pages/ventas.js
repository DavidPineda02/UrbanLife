/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — VENTAS ====================================== */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de ventas.
 * Conecta la vista HTML con el servicio de ventas del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza la tabla de ventas desde el API
 *  - Registrar venta en 2 pasos (datos generales → productos)
 *  - Ver detalle de una venta (modal con detalles)
 *  - Búsqueda por cliente o ID en tiempo real (client-side)
 *  - Filtro por método de pago y período (client-side)
 *  - Carga dinámica de clientes y productos para los selects
 *  - Precio unitario auto-llenado desde el catálogo (solo lectura)
 *  - Cálculo del total en tiempo real antes de guardar
 *
 * Nota: Las ventas son INMUTABLES — no se pueden editar ni eliminar.
 *       El precio unitario lo determina el backend desde la BD.
 *
 * Dependencias:
 *  - ventas.service.js    → llamadas al API de ventas
 *  - clientes.service.js  → cargar clientes para el select
 *  - productos.service.js → cargar productos para los selects
 *  - alerts.js            → SweetAlert2 (éxito/error)
 *  - modal.js             → abrir/cerrar modales
 *  - notifications.js     → toasts informativos
 */

// Importar funciones del servicio de ventas
import {
    obtenerVentas,                                                             // GET todas las ventas
    obtenerVentaPorId,                                                         // GET venta con detalles
    crearVenta,                                                                // POST registrar venta
} from '../api/services/ventas.service.js';

// Importar funciones de otros servicios para poblar selects
import { obtenerClientes } from '../api/services/clientes.service.js';         // GET clientes activos
import { obtenerProductos } from '../api/services/productos.service.js';       // GET productos activos

// Importar utilidades de UI
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';   // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                     // Sistema de modales
import { showNotification } from '../utils/notifications.js';                  // Toasts

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de ventas cargadas desde el backend (cache local) */
let ventas = [];

/** Array de clientes cargados desde el backend (para select y lookup) */
let clientes = [];

/** Array de productos cargados desde el backend (para selects y lookup) */
let productos = [];

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cuerpo de la tabla donde se renderizan las filas de ventas */
const tbody = document.querySelector('.tabla__cuerpo');

/** Input de búsqueda por cliente o ID de venta */
const inputBusqueda = document.querySelector('.buscador__input');

/** Select de filtro por método de pago */
const selectMetodo = document.querySelector('[name="filtro-metodo"]');

/** Select de filtro por período de tiempo */
const selectPeriodo = document.querySelector('[name="filtro-periodo"]');

/* ----- Modal Paso 1: Datos Generales ----- */

/** Select de cliente en el modal paso 1 */
const selectCliente = document.getElementById('venta-cliente');

/** Input de fecha en el modal paso 1 */
const inputFecha = document.getElementById('venta-fecha');

/** Select de método de pago en el modal paso 1 */
const selectMetodoPago = document.getElementById('venta-metodo-pago');

/** Botón "Agregar Productos" para avanzar al paso 2 */
const btnSiguiente = document.getElementById('btn-siguiente-productos');

/* ----- Modal Paso 2: Productos de la Venta ----- */

/** Contenedor de la lista de filas de productos en el paso 2 */
const listaProductos = document.querySelector('#modal-productos-venta .factura__lista');

/** Elemento que muestra el total calculado en tiempo real */
const totalValor = document.querySelector('#modal-productos-venta .factura__total-valor');

/** Botón "Guardar Venta" para enviar la venta al backend */
const btnGuardarVenta = document.getElementById('btn-guardar-venta');

/** Botón "Volver" para regresar al paso 1 */
const btnVolverPaso1 = document.getElementById('btn-volver-paso1');

/* ----- Modal Detalle de Venta ----- */

/** Contenedor del modal de detalle de venta */
const modalDetalle = document.getElementById('modal-detalle-venta');

/* -------------------------------------------------------------------------- */
/* ----- Cargar Clientes desde el Backend ----------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los clientes activos del backend y llena el select del modal.
 * @returns {Promise<void>}
 */
async function cargarClientes() {
    try {
        /* Petición GET al backend para obtener clientes */
        clientes = await obtenerClientes();

        /* Filtrar solo los clientes activos para el select */
        const activos = clientes.filter(c => c.estado === true);

        /* Llenar el select de clientes con las opciones dinámicas */
        selectCliente.innerHTML = '<option value="">Seleccionar cliente</option>';
        activos.forEach(cli => {
            /* Crear opción con el ID como valor y el nombre completo como texto */
            const nombreCompleto = `${cli.nombre} ${cli.apellido || ''}`.trim();
            selectCliente.innerHTML += `<option value="${cli.idCliente}">${nombreCompleto}</option>`;
        });
    } catch (error) {
        /* Log del error si falla la carga de clientes */
        console.error('Error al cargar clientes:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Cargar Productos desde el Backend ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los productos activos del backend y llena todos los selects de producto.
 * @returns {Promise<void>}
 */
async function cargarProductos() {
    try {
        /* Petición GET al backend para obtener productos */
        productos = await obtenerProductos();

        /* Filtrar solo los productos activos con stock disponible */
        const activos = productos.filter(p => p.estado === true);

        /* Construir las opciones HTML para los selects de productos */
        const opciones = '<option value="">Seleccionar</option>' +
            activos.map(p => `<option value="${p.idProducto}">${p.nombre} (Stock: ${p.stock})</option>`).join('');

        /* Llenar todos los selects de productos en el modal paso 2 */
        const selects = document.querySelectorAll('#modal-productos-venta .factura__fila select');
        selects.forEach(sel => {
            /* Insertar las opciones en cada select de producto */
            sel.innerHTML = opciones;
        });
    } catch (error) {
        /* Log del error si falla la carga de productos */
        console.error('Error al cargar productos:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Cargar Ventas desde el Backend ------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todas las ventas del backend y las renderiza en la tabla.
 * @returns {Promise<void>}
 */
async function cargarVentas() {
    try {
        /* Petición GET al backend */
        ventas = await obtenerVentas();

        /* Renderizar la tabla con los datos obtenidos */
        renderizarTabla();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar las ventas', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar ventas:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Nombre de Cliente ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Busca el nombre completo de un cliente por su ID en el cache local.
 * @param {number} clienteId - ID del cliente
 * @returns {string} Nombre completo o 'Cliente desconocido'
 */
function obtenerNombreCliente(clienteId) {
    /* Buscar el cliente en el cache por su ID */
    const cli = clientes.find(c => c.idCliente === clienteId);

    /* Retornar el nombre completo o un texto por defecto */
    return cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : 'Cliente desconocido';
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Nombre de Producto ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Busca el nombre de un producto por su ID en el cache local.
 * @param {number} productoId - ID del producto
 * @returns {string} Nombre del producto o 'Producto desconocido'
 */
function obtenerNombreProducto(productoId) {
    /* Buscar el producto en el cache por su ID */
    const prod = productos.find(p => p.idProducto === productoId);

    /* Retornar el nombre o un texto por defecto */
    return prod ? prod.nombre : 'Producto desconocido';
}

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
/* ----- Formatear Fecha --------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Convierte una fecha de formato YYYY-MM-DD a DD/MM/YYYY.
 * @param {string} fechaStr - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada (DD/MM/YYYY)
 */
function formatearFecha(fechaStr) {
    /* Separar la fecha en componentes [año, mes, día] */
    const [anio, mes, dia] = fechaStr.split('-');

    /* Retornar en formato DD/MM/YYYY */
    return `${dia}/${mes}/${anio}`;
}

/* -------------------------------------------------------------------------- */
/* ----- Filtrar por Período ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Verifica si una fecha pertenece al período seleccionado.
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @param {string} periodo - Período seleccionado (today, week, month, year)
 * @returns {boolean} true si la fecha está dentro del período
 */
function filtrarPorPeriodo(fechaStr, periodo) {
    /* Si no hay filtro de período, todos pasan */
    if (periodo === '') return true;

    /* Crear objeto Date a partir del string (forzar hora local) */
    const fecha = new Date(fechaStr + 'T00:00:00');
    /* Obtener la fecha de hoy sin hora */
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    /* Comparar según el período seleccionado */
    if (periodo === 'today') {
        /* Verificar si la fecha es hoy */
        return fecha.toDateString() === hoy.toDateString();
    } else if (periodo === 'week') {
        /* Calcular el inicio de la semana actual (domingo) */
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        /* Verificar si la fecha es posterior al inicio de la semana */
        return fecha >= inicioSemana;
    } else if (periodo === 'month') {
        /* Verificar si la fecha está en el mismo mes y año */
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    } else if (periodo === 'year') {
        /* Verificar si la fecha está en el mismo año */
        return fecha.getFullYear() === hoy.getFullYear();
    }

    /* Por defecto, la fecha pasa el filtro */
    return true;
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Tabla de Ventas ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza las filas de la tabla aplicando los filtros activos.
 * Se llama cada vez que cambian los datos o los filtros.
 */
function renderizarTabla() {
    /* Obtener el texto de búsqueda en minúsculas */
    const busqueda = inputBusqueda.value.trim().toLowerCase();

    /* Obtener el valor del filtro de método de pago */
    const filtroMetodo = selectMetodo.value;

    /* Obtener el valor del filtro de período */
    const filtroPeriodo = selectPeriodo.value;

    /* Filtrar las ventas según todos los criterios */
    const filtradas = ventas.filter(venta => {
        /* Obtener el nombre del cliente para la búsqueda */
        const nombreCliente = obtenerNombreCliente(venta.clienteId).toLowerCase();

        /* Verificar si el nombre del cliente o el ID coinciden con la búsqueda */
        const coincideBusqueda = nombreCliente.includes(busqueda)
            || String(venta.idVenta).includes(busqueda);

        /* Verificar si el método de pago coincide con el filtro */
        const coincideMetodo = filtroMetodo === ''
            || venta.metodoPago === filtroMetodo;

        /* Verificar si la fecha está dentro del período seleccionado */
        const coincidePeriodo = filtrarPorPeriodo(venta.fechaVenta, filtroPeriodo);

        /* La venta pasa si cumple todas las condiciones */
        return coincideBusqueda && coincideMetodo && coincidePeriodo;
    });

    /* Construir el HTML de todas las filas filtradas */
    tbody.innerHTML = filtradas.map(venta => {
        /* Determinar la clase CSS del badge según el método de pago */
        const badgeClase = venta.metodoPago === 'Efectivo'
            ? 'tabla__badge--efectivo'                                         // Badge verde para efectivo
            : 'tabla__badge--transferencia';                                   // Badge azul para transferencia

        /* Retornar el HTML de la fila con la misma estructura del diseño original */
        return `
            <tr class="tabla__fila">
                <td class="tabla__td">${venta.idVenta}</td>
                <td class="tabla__td">${formatearFecha(venta.fechaVenta)}</td>
                <td class="tabla__td">${obtenerNombreCliente(venta.clienteId)}</td>
                <td class="tabla__td tabla__td--precio">${formatearPrecio(venta.totalVenta)}</td>
                <td class="tabla__td">
                    <span class="tabla__badge ${badgeClase}">${venta.metodoPago}</span>
                </td>
                <td class="tabla__td tabla__td--acciones">
                    <button type="button" class="tabla__accion tabla__accion--ver" title="Ver Detalle"
                            data-accion="ver" data-id="${venta.id}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');                                                                // Unir todas las filas en un solo string

    /* Si no hay resultados, mostrar un mensaje vacío */
    if (filtradas.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-texto-suave);">
                No se encontraron ventas
            </td></tr>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Paso 1 → Paso 2 (Transición de Modales) --------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Valida los datos generales del paso 1 y avanza al paso 2 (productos).
 * @param {Event} e - Evento de clic
 */
function handleSiguienteProductos(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Validar que se haya seleccionado un cliente */
    if (!selectCliente.value) {
        mostrarAlertaError('Seleccione un cliente');
        return;
    }

    /* Validar que se haya ingresado la fecha */
    if (!inputFecha.value) {
        mostrarAlertaError('Ingrese la fecha de la venta');
        return;
    }

    /* Validar que se haya seleccionado un método de pago */
    if (!selectMetodoPago.value) {
        mostrarAlertaError('Seleccione un método de pago');
        return;
    }

    /* Cerrar el modal del paso 1 */
    closeModal('modal-venta');

    /* Abrir el modal del paso 2 */
    openModal('modal-productos-venta');
}

/* -------------------------------------------------------------------------- */
/* ----- Volver al Paso 1 -------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Regresa del paso 2 al paso 1 conservando los datos ingresados.
 * @param {Event} e - Evento de clic
 */
function handleVolverPaso1(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Cerrar el modal del paso 2 */
    closeModal('modal-productos-venta');

    /* Abrir el modal del paso 1 */
    openModal('modal-venta');
}

/* -------------------------------------------------------------------------- */
/* ----- Auto-llenar Precio al Seleccionar Producto ------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Cuando el usuario selecciona un producto, auto-llena el precio unitario
 * desde el catálogo (solo lectura) y recalcula el total.
 * @param {Event} e - Evento change en un select de producto
 */
function handleProductoChange(e) {
    /* Verificar que el evento venga de un select de producto */
    if (!e.target.matches('.factura__fila select')) return;

    /* Obtener la fila contenedora del select */
    const fila = e.target.closest('.factura__fila');

    /* Obtener el input de precio de la misma fila */
    const precioInput = fila.querySelector('input[name^="precio"]');

    /* Obtener el ID del producto seleccionado */
    const productoId = parseInt(e.target.value);

    /* Si hay un producto seleccionado, auto-llenar el precio */
    if (productoId && precioInput) {
        /* Buscar el producto en el cache local */
        const producto = productos.find(p => p.idProducto === productoId);
        /* Si se encontró, asignar el precio de venta */
        if (producto) {
            precioInput.value = producto.precioVenta;
        }
    } else if (precioInput) {
        /* Si se deseleccionó el producto, limpiar el precio */
        precioInput.value = '';
    }

    /* Recalcular el total con los nuevos valores */
    calcularTotal();
}

/* -------------------------------------------------------------------------- */
/* ----- Calcular Total en Tiempo Real -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Calcula y muestra el total de la venta sumando cantidad × precio
 * de todas las filas visibles que tengan producto seleccionado.
 */
function calcularTotal() {
    /* Inicializar el acumulador del total */
    let total = 0;

    /* Obtener todas las filas de producto del modal paso 2 */
    const filas = document.querySelectorAll('#modal-productos-venta .factura__fila');

    /* Iterar cada fila para sumar su subtotal */
    filas.forEach((fila, index) => {
        /* Verificar si la fila es visible (primera siempre, demás por checkbox) */
        if (index === 0 || esFilaVisible(index + 1)) {
            /* Obtener los valores de cantidad y precio de la fila */
            const cantidadInput = fila.querySelector('input[name^="cantidad"]');
            const precioInput = fila.querySelector('input[name^="precio"]');

            /* Calcular el subtotal si ambos campos tienen valor */
            if (cantidadInput && cantidadInput.value && precioInput && precioInput.value) {
                /* Parsear la cantidad como entero */
                const cantidad = parseInt(cantidadInput.value) || 0;
                /* Parsear el precio como decimal */
                const precio = parseFloat(precioInput.value) || 0;
                /* Sumar al total */
                total += cantidad * precio;
            }
        }
    });

    /* Actualizar el texto del total en el modal */
    totalValor.textContent = formatearPrecio(total);
}

/* -------------------------------------------------------------------------- */
/* ----- Verificar Visibilidad de Fila -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Verifica si una fila de producto extra está visible (checkbox marcado).
 * La fila 1 siempre es visible. Las filas 2-10 dependen de sus checkboxes.
 * @param {number} numFila - Número de la fila (2-10)
 * @returns {boolean} true si la fila está visible
 */
function esFilaVisible(numFila) {
    /* La fila 1 siempre está visible */
    if (numFila <= 1) return true;

    /* Buscar el checkbox correspondiente a la fila */
    const checkbox = document.getElementById(`agregar-${numFila}`);

    /* Retornar true si el checkbox existe y está marcado */
    return checkbox ? checkbox.checked : false;
}

/* -------------------------------------------------------------------------- */
/* ----- Registrar Venta (Enviar al Backend) -------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Recolecta los datos de ambos pasos, valida y envía POST al backend.
 * Solo envía productoId y cantidad — el backend lee el precio de la BD.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleCrearVenta(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Obtener los datos generales del paso 1 */
    const clienteId = parseInt(selectCliente.value);                           // ID del cliente
    const fechaVenta = inputFecha.value;                                       // Fecha YYYY-MM-DD
    const metodoPago = selectMetodoPago.value;                                 // "Efectivo" o "Transferencia"

    /* Recolectar los ítems de todas las filas visibles con producto seleccionado */
    const items = [];
    /* Obtener todas las filas de producto del modal */
    const filas = document.querySelectorAll('#modal-productos-venta .factura__fila');

    /* Iterar cada fila para recolectar los datos */
    filas.forEach((fila, index) => {
        /* Solo procesar filas visibles */
        if (index === 0 || esFilaVisible(index + 1)) {
            /* Obtener el select de producto y el input de cantidad */
            const select = fila.querySelector('select');
            const cantidadInput = fila.querySelector('input[name^="cantidad"]');

            /* Si ambos tienen valor, agregar el ítem al array */
            if (select?.value && cantidadInput?.value) {
                items.push({
                    productoId: parseInt(select.value),                        // ID del producto
                    cantidad: parseInt(cantidadInput.value),                    // Cantidad solicitada
                });
            }
        }
    });

    /* Validar que haya al menos un producto */
    if (items.length === 0) {
        mostrarAlertaError('Agregue al menos un producto');
        return;
    }

    /* Validar que todas las cantidades sean mayores a 0 */
    for (const item of items) {
        if (!item.cantidad || item.cantidad <= 0) {
            mostrarAlertaError('La cantidad debe ser mayor a 0');
            return;
        }
    }

    try {
        /* Enviar petición POST al backend para registrar la venta */
        const respuesta = await crearVenta({ fechaVenta, metodoPago, clienteId, items });

        /* Cerrar el modal del paso 2 */
        closeModal('modal-productos-venta');

        /* Limpiar todos los campos del formulario de venta */
        limpiarFormularioVenta();

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message || 'Venta registrada exitosamente');

        /* Recargar la tabla y los productos (stock actualizado) */
        await cargarProductos();
        await cargarVentas();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al registrar la venta');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Limpiar Formulario de Venta ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Resetea todos los campos del formulario de venta (pasos 1 y 2).
 * Restaura los checkboxes a su estado por defecto.
 */
function limpiarFormularioVenta() {
    /* Limpiar campos del paso 1 */
    selectCliente.value = '';                                                  // Resetear cliente
    inputFecha.value = new Date().toISOString().split('T')[0];                 // Restaurar fecha de hoy
    selectMetodoPago.value = '';                                               // Resetear método de pago

    /* Limpiar todos los selects de producto en el paso 2 */
    const selects = document.querySelectorAll('#modal-productos-venta .factura__fila select');
    selects.forEach(sel => { sel.value = ''; });

    /* Limpiar todos los inputs de cantidad en el paso 2 */
    const cantidades = document.querySelectorAll('#modal-productos-venta .factura__fila input[name^="cantidad"]');
    cantidades.forEach(input => { input.value = ''; });

    /* Limpiar todos los inputs de precio en el paso 2 */
    const precios = document.querySelectorAll('#modal-productos-venta .factura__fila input[name^="precio"]');
    precios.forEach(input => { input.value = ''; });

    /* Restaurar los checkboxes a su estado por defecto (2 y 3 activos) */
    for (let i = 2; i <= 10; i++) {
        /* Obtener el checkbox correspondiente */
        const cb = document.getElementById(`agregar-${i}`);
        /* Las filas 2 y 3 están marcadas por defecto, las demás no */
        if (cb) cb.checked = (i <= 3);
    }

    /* Restaurar el texto del total */
    totalValor.textContent = '$ ---';
}

/* -------------------------------------------------------------------------- */
/* ----- Ver Detalle de Venta ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga los detalles de una venta desde el backend y los muestra en el modal.
 * @param {number} id - ID de la venta a consultar
 * @returns {Promise<void>}
 */
async function handleVerDetalle(id) {
    try {
        /* Petición GET al backend para obtener la venta con sus detalles */
        const venta = await obtenerVentaPorId(id);

        /* Actualizar el título del modal con el ID de la venta */
        const titulo = modalDetalle.querySelector('.modal__titulo');
        titulo.textContent = `Detalle de Venta #${venta.idVenta}`;

        /* Actualizar el subtítulo con la fecha, método y cliente */
        const subtitulo = modalDetalle.querySelector('.modal__subtitulo');
        const nombreCliente = obtenerNombreCliente(venta.clienteId);
        subtitulo.innerHTML = `${formatearFecha(venta.fechaVenta)} &bull; ${venta.metodoPago} &bull; ${nombreCliente}`;

        /* Construir el HTML de la tabla de detalles */
        const tableBody = modalDetalle.querySelector('.factura__tabla tbody');
        tableBody.innerHTML = venta.detalles.map(det => {
            /* Obtener el nombre del producto desde el cache */
            const nombreProducto = obtenerNombreProducto(det.productoId);

            /* Retornar el HTML de la fila del detalle */
            return `
                <tr class="factura__tabla-fila">
                    <td class="factura__tabla-td">${nombreProducto}</td>
                    <td class="factura__tabla-td">${det.cantidad}</td>
                    <td class="factura__tabla-td">${formatearPrecio(det.precioUnitario)}</td>
                    <td class="factura__tabla-td">${formatearPrecio(det.subtotal)}</td>
                </tr>
            `;
        }).join('');                                                           // Unir todas las filas

        /* Actualizar el total del modal */
        const totalEl = modalDetalle.querySelector('.factura__total-valor');
        totalEl.textContent = formatearPrecio(venta.totalVenta);

        /* Abrir el modal de detalle */
        openModal('modal-detalle-venta');
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cargar el detalle de la venta');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Delegación de Eventos en la Tabla ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja los clics en los botones de acción de la tabla (ver detalle).
 * Usa delegación de eventos en el tbody para manejar filas dinámicas.
 * @param {Event} e - Evento de clic
 */
function handleAccionesTabla(e) {
    /* Buscar el botón de acción más cercano al clic */
    const boton = e.target.closest('[data-accion]');

    /* Si no se hizo clic en un botón de acción, salir */
    if (!boton) return;

    /* Obtener la acción y el ID de la venta desde los data attributes */
    const accion = boton.dataset.accion;                                       // 'ver'
    const id = parseInt(boton.dataset.id);                                     // ID de la venta

    /* Ejecutar la acción correspondiente */
    if (accion === 'ver') {
        /* Abrir el modal de detalle con los datos de la venta */
        handleVerDetalle(id);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página de ventas.
 * Se ejecuta cuando el DOM está completamente cargado.
 * Conecta todos los event listeners y carga los datos iniciales.
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ===== Event Listeners de la Tabla ===== */

    /* Delegación de eventos para los botones de acción en la tabla */
    tbody.addEventListener('click', handleAccionesTabla);

    /* ===== Event Listeners de Búsqueda y Filtro ===== */

    /* Filtrar la tabla en tiempo real mientras el usuario escribe en el buscador */
    inputBusqueda.addEventListener('input', renderizarTabla);

    /* Filtrar la tabla cuando cambia el select de método de pago */
    selectMetodo.addEventListener('change', renderizarTabla);

    /* Filtrar la tabla cuando cambia el select de período */
    selectPeriodo.addEventListener('change', renderizarTabla);

    /* ===== Event Listeners del Modal Paso 1 ===== */

    /* Botón "Agregar Productos" → validar paso 1 y avanzar al paso 2 */
    btnSiguiente.addEventListener('click', handleSiguienteProductos);

    /* ===== Event Listeners del Modal Paso 2 ===== */

    /* Botón "Volver" → regresar al paso 1 */
    btnVolverPaso1.addEventListener('click', handleVolverPaso1);

    /* Botón "Guardar Venta" → enviar la venta al backend */
    btnGuardarVenta.addEventListener('click', handleCrearVenta);

    /* Auto-llenar precio cuando se selecciona un producto */
    listaProductos.addEventListener('change', handleProductoChange);

    /* Recalcular total cuando cambia una cantidad */
    listaProductos.addEventListener('input', (e) => {
        /* Solo recalcular si el evento viene de un input de cantidad */
        if (e.target.matches('input[name^="cantidad"]')) calcularTotal();
    });

    /* ===== Carga Inicial de Datos ===== */

    /* Establecer la fecha de hoy como valor por defecto */
    inputFecha.value = new Date().toISOString().split('T')[0];

    /* Cargar los clientes para el select del paso 1 */
    cargarClientes();

    /* Cargar los productos para los selects del paso 2 */
    cargarProductos();

    /* Cargar las ventas desde el backend y renderizar la tabla */
    cargarVentas();
});
