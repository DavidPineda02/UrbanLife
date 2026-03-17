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
let tbody;

/** Input de búsqueda por cliente o ID de venta */
let inputBusqueda;

/** Select de filtro por método de pago */
let selectMetodo;

/** Select de filtro por período de tiempo */
let selectPeriodo;

/* ----- Modal Paso 1: Datos Generales ----- */

/** Select de cliente en el modal paso 1 */
let selectCliente;

/** Input de fecha en el modal paso 1 */
let inputFecha;

/** Select de método de pago en el modal paso 1 */
let selectMetodoPago;

/** Botón "Agregar Productos" para avanzar al paso 2 */
let btnSiguiente;

/* ----- Modal Paso 2: Productos de la Venta ----- */

/** Contenedor de la lista de filas de productos en el paso 2 */
let listaProductos;

/** Elemento que muestra el total calculado en tiempo real */
let totalValor;

/** Botón "Guardar Venta" para enviar la venta al backend */
let btnGuardarVenta;

/** Botón "Volver" para regresar al paso 1 */
let btnVolverPaso1;

/* ----- Modal Detalle de Venta ----- */

/** Contenedor del modal de detalle de venta */
let modalDetalle;

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

        /* Generar las opciones HTML para los selects de productos */
        const opciones = generarOpcionesProductos();

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
/* ----- Utilidades de Formato ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD usando la zona horaria local.
 * Evita el bug de toISOString() que convierte a UTC y puede dar la fecha de mañana.
 * @returns {string} Fecha local en formato "YYYY-MM-DD"
 */
function obtenerFechaLocal() {
    /* Crear objeto Date con la hora local */
    const hoy = new Date();
    /* Obtener año, mes (0-based) y día en zona horaria local */
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    /* Retornar en formato YYYY-MM-DD */
    return `${anio}-${mes}-${dia}`;
}

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
                            data-accion="ver" data-id="${venta.idVenta}">
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
/* ----- Contador de Filas de Producto -------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Contador incremental para asignar nombres únicos a cada fila de producto */
let contadorFilas = 1;

/* -------------------------------------------------------------------------- */
/* ----- Generar Opciones de Productos para Selects ------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Construye el HTML de las opciones de productos activos para un select.
 * @returns {string} HTML con las opciones de productos activos
 */
function generarOpcionesProductos() {
    /* Filtrar solo los productos activos con stock disponible */
    const activos = productos.filter(p => p.estado === true);

    /* Retornar las opciones HTML con el stock entre paréntesis */
    return '<option value="">Seleccionar</option>' +
        activos.map(p => `<option value="${p.idProducto}">${p.nombre} (Stock: ${p.stock})</option>`).join('');
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Fila de Producto (HTML Dinámico) ----------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Genera el HTML de una fila de producto para el modal paso 2.
 * La primera fila no tiene botón de eliminar, las demás sí.
 * @param {number} num - Número de fila (para nombres únicos)
 * @param {boolean} conEliminar - true si la fila debe tener botón de eliminar
 * @returns {string} HTML de la fila de producto
 */
function crearFilaProductoHTML(num, conEliminar) {
    /* Generar las opciones de productos activos para el select */
    const opciones = generarOpcionesProductos();

    /* Generar el botón de eliminar o un placeholder deshabilitado */
    const botonEliminar = conEliminar
        ? `<button type="button" class="factura__eliminar btn-eliminar-fila" title="Eliminar producto">
               <i class="fa-solid fa-trash"></i>
           </button>`
        : `<span class="factura__eliminar factura__eliminar--disabled">
               <i class="fa-solid fa-trash"></i>
           </span>`;

    /* Retornar el HTML completo de la fila */
    return `
        <div class="factura__fila">
            <span class="factura__fila-numero"></span>
            <select class="formulario__select" name="producto_${num}" title="Producto">
                ${opciones}
            </select>
            <input type="number" class="formulario__input" name="cantidad_${num}" placeholder="0" title="Cantidad" min="1">
            <input type="number" class="formulario__input" name="precio_${num}" placeholder="$ 0" title="Precio de Venta" min="1" step="any" readonly>
            ${botonEliminar}
        </div>
    `;
}

/* -------------------------------------------------------------------------- */
/* ----- Agregar Fila de Producto ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Agrega una nueva fila de producto al final de la lista en el modal paso 2.
 * Cada nueva fila tiene botón de eliminar y opciones de productos actualizadas.
 */
function agregarFilaVenta() {
    /* Incrementar el contador de filas para nombre único */
    contadorFilas++;

    /* Generar el HTML de la nueva fila con botón de eliminar */
    const nuevaFilaHTML = crearFilaProductoHTML(contadorFilas, true);

    /* Insertar la nueva fila al final de la lista de productos */
    listaProductos.insertAdjacentHTML('beforeend', nuevaFilaHTML);

    /* Renumerar todas las filas visibles */
    renumerarFilas();

    /* Hacer scroll hacia la nueva fila agregada */
    const filas = listaProductos.querySelectorAll('.factura__fila');
    const ultimaFila = filas[filas.length - 1];
    if (ultimaFila) {
        ultimaFila.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Fila de Producto ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Elimina una fila de producto del modal paso 2 al hacer clic en el botón de eliminar.
 * No permite eliminar si solo queda una fila.
 * @param {Event} e - Evento de clic en el botón de eliminar
 */
function eliminarFilaVenta(e) {
    /* Buscar el botón de eliminar más cercano al clic */
    const boton = e.target.closest('.btn-eliminar-fila');

    /* Si no se hizo clic en un botón de eliminar, salir */
    if (!boton) return;

    /* Obtener todas las filas actuales del modal */
    const filas = listaProductos.querySelectorAll('.factura__fila');

    /* No permitir eliminar si solo queda una fila */
    if (filas.length <= 1) return;

    /* Obtener la fila contenedora del botón */
    const fila = boton.closest('.factura__fila');

    /* Eliminar la fila del DOM */
    fila.remove();

    /* Renumerar las filas restantes */
    renumerarFilas();

    /* Recalcular el total después de eliminar */
    calcularTotal();
}

/* -------------------------------------------------------------------------- */
/* ----- Renumerar Filas de Producto ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza los números de fila visibles después de agregar o eliminar filas.
 * Los números CSS se manejan con counter, pero esto asegura consistencia visual.
 */
function renumerarFilas() {
    /* Obtener todas las filas actuales del modal */
    const filas = listaProductos.querySelectorAll('.factura__fila');

    /* Iterar cada fila y actualizar su número visual */
    filas.forEach((fila, index) => {
        /* Obtener el span del número de fila */
        const numero = fila.querySelector('.factura__fila-numero');

        /* Asignar el número correspondiente con formato de dos dígitos */
        if (numero) numero.textContent = String(index + 1).padStart(2, '0');
    });
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

    /* Si se deseleccionó el producto, limpiar el precio */
    if (!productoId && precioInput) {
        precioInput.value = '';
    }

    /* Si se seleccionó un producto, auto-llenar el precio desde el catálogo */
    if (productoId && precioInput) {
        /* Buscar el producto seleccionado en el array de productos */
        const producto = productos.find(p => p.idProducto === productoId);

        /* Si se encontró el producto, asignar su precio de venta al input */
        if (producto) precioInput.value = producto.precioVenta;
    }

    /* Recalcular el total con los nuevos valores */
    calcularTotal();
}

/* -------------------------------------------------------------------------- */
/* ----- Calcular Total en Tiempo Real -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Calcula y muestra el total de la venta sumando cantidad × precio
 * de todas las filas que tengan producto seleccionado.
 */
function calcularTotal() {
    /* Inicializar el acumulador del total */
    let total = 0;

    /* Obtener todas las filas de producto del modal paso 2 */
    const filas = document.querySelectorAll('#modal-productos-venta .factura__fila');

    /* Iterar cada fila para sumar su subtotal */
    filas.forEach(fila => {
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
    });

    /* Actualizar el texto del total en el modal */
    totalValor.textContent = formatearPrecio(total);
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

    /* Recolectar los ítems de todas las filas con producto seleccionado */
    const items = [];
    /* Obtener todas las filas de producto del modal */
    const filas = document.querySelectorAll('#modal-productos-venta .factura__fila');

    /* Iterar cada fila para recolectar los datos */
    filas.forEach(fila => {
        /* Obtener el select de producto, el input de cantidad y el input de precio */
        const select = fila.querySelector('select');
        const cantidadInput = fila.querySelector('input[name^="cantidad"]');
        const precioInput = fila.querySelector('input[name^="precio"]');

        /* Si todos tienen valor, agregar el ítem al array */
        if (select?.value && cantidadInput?.value && precioInput?.value) {
            items.push({
                productoId: parseInt(select.value),                        // ID del producto
                cantidad: parseInt(cantidadInput.value),                    // Cantidad solicitada
                precioUnitario: parseFloat(precioInput.value),             // Precio de venta ingresado
            });
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
        /* Validar que todos los precios sean mayores a 0 */
        if (!item.precioUnitario || item.precioUnitario <= 0) {
            mostrarAlertaError('El precio unitario debe ser mayor a 0');
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
 * Elimina todas las filas extra y deja solo la primera fila limpia.
 */
function limpiarFormularioVenta() {
    /* Limpiar campos del paso 1 */
    selectCliente.value = '';                                                  // Resetear cliente
    inputFecha.value = obtenerFechaLocal();                 // Restaurar fecha de hoy
    selectMetodoPago.value = '';                                               // Resetear método de pago

    /* Eliminar todas las filas de producto excepto la primera */
    const filas = listaProductos.querySelectorAll('.factura__fila');
    filas.forEach((fila, index) => {
        /* Mantener solo la primera fila */
        if (index > 0) fila.remove();
    });

    /* Limpiar los campos de la primera fila */
    const primeraFila = listaProductos.querySelector('.factura__fila');
    if (primeraFila) {
        /* Resetear el select de producto de la primera fila */
        const select = primeraFila.querySelector('select');
        if (select) select.value = '';
        /* Resetear el input de cantidad de la primera fila */
        const cantidad = primeraFila.querySelector('input[name^="cantidad"]');
        if (cantidad) cantidad.value = '';
        /* Resetear el input de precio de la primera fila */
        const precio = primeraFila.querySelector('input[name^="precio"]');
        if (precio) precio.value = '';
    }

    /* Reiniciar el contador de filas a 1 */
    contadorFilas = 1;

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
        console.log('🔍 Iniciando handleVerDetalle para venta ID:', id);
        
        /* Petición GET al backend para obtener la venta con sus detalles */
        const venta = await obtenerVentaPorId(id);
        console.log('✅ Venta obtenida del backend:', venta);

        /* Verificar que el modal exista */
        if (!modalDetalle) {
            console.error('❌ Modal de detalle no encontrado');
            mostrarAlertaError('Error: Modal de detalle no encontrado');
            return;
        }

        /* Actualizar el título del modal con el ID de la venta */
        const titulo = modalDetalle.querySelector('.modal__titulo');
        if (titulo) {
            titulo.textContent = `Detalle de Venta #${venta.idVenta}`;
        } else {
            console.error('❌ Elemento .modal__titulo no encontrado');
        }

        /* Actualizar el subtítulo con la fecha, método y cliente */
        const subtitulo = modalDetalle.querySelector('.modal__subtitulo');
        const nombreCliente = obtenerNombreCliente(venta.clienteId);
        console.log('👤 Cliente:', nombreCliente, 'ID:', venta.clienteId);
        
        if (subtitulo) {
            subtitulo.innerHTML = `${formatearFecha(venta.fechaVenta)} &bull; ${venta.metodoPago} &bull; ${nombreCliente}`;
        } else {
            console.error('❌ Elemento .modal__subtitulo no encontrado');
        }

        /* Verificar que existan detalles */
        if (!venta.detalles || !Array.isArray(venta.detalles)) {
            console.error('❌ La venta no tiene detalles válidos:', venta.detalles);
            mostrarAlertaError('Error: La venta no tiene detalles');
            return;
        }
        
        console.log('📦 Detalles de venta:', venta.detalles);

        /* Construir el HTML de la tabla de detalles */
        const tableBody = modalDetalle.querySelector('.factura__tabla tbody');
        if (!tableBody) {
            console.error('❌ Elemento .factura__tabla tbody no encontrado');
            mostrarAlertaError('Error: Tabla de detalles no encontrada');
            return;
        }
        
        tableBody.innerHTML = venta.detalles.map((det, index) => {
            /* Obtener el nombre del producto desde el cache */
            const nombreProducto = obtenerNombreProducto(det.productoId);
            console.log(`📋 Detalle ${index + 1}:`, { det, nombreProducto });

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
        if (totalEl) {
            totalEl.textContent = formatearPrecio(venta.totalVenta);
        } else {
            console.error('❌ Elemento .factura__total-valor no encontrado');
        }

        console.log('🎯 Abriendo modal de detalle...');
        /* Abrir el modal de detalle */
        openModal('modal-detalle-venta');
        
    } catch (error) {
        console.error('❌ Error en handleVerDetalle:', error);
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
 * Punto de entrada de la página de ventas (compatible con SPA).
 * Consulta los elementos del DOM, conecta event listeners y carga datos iniciales.
 * Se exporta para ser invocada por el router del SPA.
 */
export async function inicializar() {

    /* ===== Resetear Estado del Módulo ===== */

    /* Vaciar el cache de ventas para forzar recarga */
    ventas = [];

    /* Vaciar el cache de clientes para forzar recarga */
    clientes = [];

    /* Vaciar el cache de productos para forzar recarga */
    productos = [];

    /* Reiniciar el contador de filas a 1 */
    contadorFilas = 1;

    /* ===== Consultar Elementos del DOM ===== */

    /* Obtener el cuerpo de la tabla de ventas */
    tbody = document.querySelector('.tabla__cuerpo');

    /* Obtener el input de búsqueda */
    inputBusqueda = document.querySelector('.buscador__input');

    /* Obtener el select de filtro por método de pago */
    selectMetodo = document.querySelector('[name="filtro-metodo"]');

    /* Obtener el select de filtro por período */
    selectPeriodo = document.querySelector('[name="filtro-periodo"]');

    /* Obtener el select de cliente del modal paso 1 */
    selectCliente = document.getElementById('venta-cliente');

    /* Obtener el input de fecha del modal paso 1 */
    inputFecha = document.getElementById('venta-fecha');

    /* Obtener el select de método de pago del modal paso 1 */
    selectMetodoPago = document.getElementById('venta-metodo-pago');

    /* Obtener el botón "Agregar Productos" del modal paso 1 */
    btnSiguiente = document.getElementById('btn-siguiente-productos');

    /* Obtener el contenedor de filas de productos del modal paso 2 */
    listaProductos = document.querySelector('#modal-productos-venta .factura__lista');

    /* Obtener el elemento del total calculado del modal paso 2 */
    totalValor = document.querySelector('#modal-productos-venta .factura__total-valor');

    /* Obtener el botón "Guardar Venta" del modal paso 2 */
    btnGuardarVenta = document.getElementById('btn-guardar-venta');

    /* Obtener el botón "Volver" del modal paso 2 */
    btnVolverPaso1 = document.getElementById('btn-volver-paso1');

    /* Obtener el contenedor del modal de detalle de venta */
    modalDetalle = document.getElementById('modal-detalle-venta');

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

    /* Recalcular total cuando cambia una cantidad o un precio */
    listaProductos.addEventListener('input', (e) => {
        /* Recalcular si el evento viene de un input de cantidad o precio */
        if (e.target.matches('input[name^="cantidad"]') || e.target.matches('input[name^="precio"]')) calcularTotal();
    });

    /* Delegación de eventos para eliminar filas de producto dinámicas */
    listaProductos.addEventListener('click', eliminarFilaVenta);

    /* Botón "Agregar producto" → agregar nueva fila de producto */
    const btnAgregarFila = document.getElementById('btn-agregar-fila-venta');
    btnAgregarFila.addEventListener('click', agregarFilaVenta);

    /* ===== Carga Inicial de Datos ===== */

    /* Establecer la fecha de hoy como valor por defecto */
    inputFecha.value = obtenerFechaLocal();

    /* Cargar los clientes para el select del paso 1 */
    cargarClientes();

    /* Cargar los productos para los selects del paso 2 */
    cargarProductos();

    /* Cargar las ventas desde el backend y renderizar la tabla */
    cargarVentas();

    /* Numerar la primera fila de producto que viene pre-renderizada en el HTML */
    renumerarFilas();
}
