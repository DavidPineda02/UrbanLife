/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — COMPRAS ===================================== */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de compras.
 * Conecta la vista HTML con el servicio de compras del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza la tabla de compras desde el API
 *  - Registrar compra en 2 pasos (datos generales → productos)
 *  - Editar compra existente (modal editar → PUT)
 *  - Eliminar compra (confirmación SweetAlert → DELETE lógico)
 *  - Ver detalle de una compra (modal con detalles)
 *  - Búsqueda por proveedor o ID en tiempo real (client-side)
 *  - Filtro por método de pago y período (client-side)
 *  - Carga dinámica de proveedores y productos para los selects
 *  - Precio unitario auto-llenado desde el catálogo (solo lectura)
 *  - Cálculo del total en tiempo real antes de guardar
 *
 * Dependencias:
 *  - compras.service.js   → llamadas al API de compras
 *  - proveedores.service.js → cargar proveedores para el select
 *  - productos.service.js  → cargar productos para los selects
 *  - alerts.js            → SweetAlert2 (éxito/error)
 *  - modal.js             → abrir/cerrar modales
 *  - notifications.js     → toasts informativos
 */

// Importar funciones del servicio de compras
import {
    obtenerCompras,                                                             // GET todas las compras
    obtenerCompraPorId,                                                         // GET compra con detalles
    crearCompra,                                                                // POST registrar compra
    actualizarCompra,                                                           // PUT actualizar compra
    eliminarCompra,                                                              // DELETE eliminar compra
} from '../api/services/compras.service.js';

// Importar funciones de otros servicios para poblar selects
import { obtenerProveedores } from '../api/services/proveedores.service.js';      // GET proveedores activos
import { obtenerProductos } from '../api/services/productos.service.js';        // GET productos activos

// Importar utilidades de UI
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';   // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                     // Sistema de modales
import { showNotification } from '../utils/notifications.js';                  // Toasts

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de compras cargadas desde el backend (cache local) */
let compras = [];

/** Array de proveedores cargados desde el backend (para select y lookup) */
let proveedores = [];

/** Array de productos cargados desde el backend (para selects y lookup) */
let productos = [];

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cuerpo de la tabla donde se renderizan las filas de compras */
const tbody = document.querySelector('.tabla__cuerpo');

/** Input de búsqueda por proveedor o ID de compra */
const inputBusqueda = document.querySelector('.buscador__input');

/** Select de filtro por método de pago */
const selectMetodo = document.querySelector('[name="filtro-metodo"]');

/** Select de filtro por período de tiempo */
const selectPeriodo = document.querySelector('[name="filtro-periodo"]');

/* ----- Modal Paso 1: Datos Generales ----- */

/** Select de proveedor en el modal paso 1 */
const selectProveedor = document.getElementById('compra-proveedor');

/** Input de fecha en el modal paso 1 */
const inputFecha = document.getElementById('compra-fecha');

/** Select de método de pago en el modal paso 1 */
const selectMetodoPago = document.getElementById('compra-metodo-pago');

/** Botón "Agregar Productos" para avanzar al paso 2 */
const btnSiguiente = document.getElementById('btn-siguiente-productos');

/* ----- Modal Paso 2: Productos de la Compra ----- */

/** Contenedor de la lista de filas de productos en el paso 2 */
const listaProductos = document.querySelector('#modal-productos-compra .factura__lista');

/** Elemento que muestra el total calculado en tiempo real */
const totalValor = document.querySelector('#modal-productos-compra .factura__total-valor');

/** Botón "Guardar Compra" para enviar la compra al backend */
const btnGuardarCompra = document.getElementById('btn-guardar-compra');

/** Botón "Volver" para regresar al paso 1 */
const btnVolverPaso1 = document.getElementById('btn-volver-paso1');

/* ----- Modal Detalle de Compra ----- */

/** Contenedor del modal de detalle de compra */
const modalDetalle = document.getElementById('modal-detalle-compra');

/* ----- Modal Editar Compra ----- */

/** Contenedor del modal de editar compra */
const modalEditar = document.getElementById('modal-editar-compra');

/** Botón "Actualizar Compra" en el modal de editar */
const btnActualizarCompra = document.getElementById('btn-actualizar-compra');

/* -------------------------------------------------------------------------- */
/* ----- Cargar Proveedores desde el Backend --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los proveedores activos del backend y llena el select del modal.
 * @returns {Promise<void>}
 */
async function cargarProveedores() {
    try {
        /* Petición GET al backend para obtener proveedores */
        proveedores = await obtenerProveedores();

        /* Filtrar solo los proveedores activos para el select */
        const activos = proveedores.filter(p => p.estado === true);

        /* Llenar el select de proveedores con las opciones dinámicas */
        selectProveedor.innerHTML = '<option value="">Seleccionar proveedor</option>';
        activos.forEach(prov => {
            /* Crear opción con el ID como valor y el nombre como texto */
            selectProveedor.innerHTML += `<option value="${prov.idProveedor}">${prov.nombre}</option>`;
        });
    } catch (error) {
        /* Log del error si falla la carga de proveedores */
        console.error('Error al cargar proveedores:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Cargar Productos desde el Backend ----------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los productos activos del backend y llena todos los selects de producto.
 * @returns {Promise<void>}
 */
async function cargarProductos() {
    try {
        /* Petición GET al backend para obtener productos */
        productos = await obtenerProductos();

        /* Filtrar solo los productos activos */
        const activos = productos.filter(p => p.estado === true);

        /* Construir las opciones HTML para los selects de productos */
        const opciones = '<option value="">Seleccionar</option>' +
            activos.map(p => `<option value="${p.idProducto}">${p.nombre}</option>`).join('');

        /* Llenar todos los selects de productos en el modal paso 2 */
        const selects = document.querySelectorAll('#modal-productos-compra .factura__fila select');
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
/* ----- Cargar Compras desde el Backend ------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todas las compras del backend y las renderiza en la tabla.
 * @returns {Promise<void>}
 */
async function cargarCompras() {
    try {
        /* Petición GET al backend */
        compras = await obtenerCompras();

        /* Renderizar la tabla con los datos obtenidos */
        renderizarTabla();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar las compras', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar compras:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Nombre de Proveedor ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Busca el nombre de un proveedor por su ID en el cache local.
 * @param {number} proveedorId - ID del proveedor
 * @returns {string} Nombre del proveedor o 'Proveedor desconocido'
 */
function obtenerNombreProveedor(proveedorId) {
    /* Buscar el proveedor en el cache por su ID */
    const prov = proveedores.find(p => p.idProveedor === proveedorId);

    /* Retornar el nombre o un texto por defecto */
    return prov ? prov.nombre : 'Proveedor desconocido';
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
/* ----- Renderizar Tabla de Compras ----------------------------------------- */
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

    /* Filtrar las compras según todos los criterios */
    const filtradas = compras.filter(compra => {
        /* Obtener el nombre del proveedor para la búsqueda */
        const nombreProveedor = obtenerNombreProveedor(compra.proveedorId).toLowerCase();

        /* Verificar si el nombre del proveedor o el ID coinciden con la búsqueda */
        const coincideBusqueda = nombreProveedor.includes(busqueda)
            || String(compra.idCompra).includes(busqueda);

        /* Verificar si el método de pago coincide con el filtro */
        const coincideMetodo = filtroMetodo === ''
            || compra.metodoPago === filtroMetodo;

        /* Verificar si la fecha está dentro del período seleccionado */
        const coincidePeriodo = filtrarPorPeriodo(compra.fechaCompra, filtroPeriodo);

        /* La compra pasa si cumple todas las condiciones */
        return coincideBusqueda && coincideMetodo && coincidePeriodo;
    });

    /* Construir el HTML de todas las filas filtradas */
    tbody.innerHTML = filtradas.map(compra => {
        /* Determinar la clase CSS del badge según el método de pago */
        const badgeClase = compra.metodoPago === 'Efectivo'
            ? 'tabla__badge--efectivo'                                         // Badge verde para efectivo
            : 'tabla__badge--transferencia';                                   // Badge azul para transferencia

        /* Retornar el HTML de la fila con la misma estructura del diseño original */
        return `
            <tr class="tabla__fila">
                <td class="tabla__td">${compra.idCompra}</td>
                <td class="tabla__td">${formatearFecha(compra.fechaCompra)}</td>
                <td class="tabla__td">${obtenerNombreProveedor(compra.proveedorId)}</td>
                <td class="tabla__td">${compra.detalles ? compra.detalles.length : 0} items</td>
                <td class="tabla__td tabla__td--precio">${formatearPrecio(compra.totalCompra)}</td>
                <td class="tabla__td">
                    <span class="tabla__badge ${badgeClase}">${compra.metodoPago}</span>
                </td>
                <td class="tabla__td tabla__td--acciones">
                    <button type="button" class="tabla__accion tabla__accion--ver" title="Ver Detalle"
                            data-accion="ver" data-id="${compra.idCompra}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');                                                                // Unir todas las filas en un solo string

    /* Si no hay resultados, mostrar un mensaje vacío */
    if (filtradas.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-texto-suave);">
                No se encontraron compras
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

    /* Validar que se haya seleccionado un proveedor */
    if (!selectProveedor.value) {
        mostrarAlertaError('Seleccione un proveedor');
        return;
    }

    /* Validar que se haya ingresado la fecha */
    if (!inputFecha.value) {
        mostrarAlertaError('Ingrese la fecha de la compra');
        return;
    }

    /* Validar que se haya seleccionado un método de pago */
    if (!selectMetodoPago.value) {
        mostrarAlertaError('Seleccione un método de pago');
        return;
    }

    /* Cerrar el modal del paso 1 */
    closeModal('modal-compra');

    /* Abrir el modal del paso 2 */
    openModal('modal-productos-compra');
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
    closeModal('modal-productos-compra');

    /* Abrir el modal del paso 1 */
    openModal('modal-compra');
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
        /* Si se encontró, asignar el precio de compra (usamos precioVenta como referencia) */
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
 * Calcula y muestra el total de la compra sumando cantidad × precio
 * de todas las filas visibles que tengan producto seleccionado.
 */
function calcularTotal() {
    /* Inicializar el acumulador del total */
    let total = 0;

    /* Obtener todas las filas de producto del modal paso 2 */
    const filas = document.querySelectorAll('#modal-productos-compra .factura__fila');

    /* Iterar cada fila para sumar su subtotal */
    filas.forEach((fila, index) => {
        /* Verificar si la fila es visible (primera siempre, demás por checkbox) */
        if (index === 0 || esFilaVisible(index + 1)) {
            /* Obtener los valores de cantidad y precio de la fila */
            const cantidadInput = fila.querySelector('input[name^="cantidad"]');
            const precioInput = fila.querySelector('input[name^="precio"]');

            /* Si ambos tienen valor, sumar al total */
            if (cantidadInput?.value && precioInput?.value) {
                const cantidad = parseInt(cantidadInput.value);
                const precio = parseFloat(precioInput.value);
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
/* ----- Verificar Visibilidad de Fila (Modo Edición) ----------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Verifica si una fila de producto extra está visible (checkbox marcado) en modo edición.
 * @param {number} numFila - Número de la fila (2-10)
 * @returns {boolean} true si la fila está visible
 */
function esFilaVisibleEditar(numFila) {
    /* La fila 1 siempre está visible */
    if (numFila <= 1) return true;

    /* Buscar el checkbox correspondiente a la fila en el modal de edición */
    const checkbox = document.getElementById(`editar-agregar-${numFila}`);

    /* Retornar true si el checkbox existe y está marcado */
    return checkbox ? checkbox.checked : false;
}

/* -------------------------------------------------------------------------- */
/* ----- Calcular Total en Tiempo Real (Modo Edición) ------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Calcula y muestra el total de la compra en modo edición.
 */
function calcularTotalEditar() {
    /* Inicializar el acumulador del total */
    let total = 0;

    /* Obtener todas las filas de producto del modal de edición */
    const filas = document.querySelectorAll('#modal-editar-compra .factura__fila');

    /* Iterar cada fila para sumar su subtotal */
    filas.forEach((fila, index) => {
        /* Verificar si la fila es visible (primera siempre, demás por checkbox) */
        if (index === 0 || esFilaVisibleEditar(index + 1)) {
            /* Obtener los valores de cantidad y precio de la fila */
            const cantidadInput = fila.querySelector('input[name^="cantidad"]');
            const precioInput = fila.querySelector('input[name^="precio"]');

            /* Si ambos tienen valor, sumar al total */
            if (cantidadInput?.value && precioInput?.value) {
                const cantidad = parseInt(cantidadInput.value);
                const precio = parseFloat(precioInput.value);
                total += cantidad * precio;
            }
        }
    });

    /* Actualizar el texto del total en el modal de edición */
    const totalEditar = document.querySelector('#modal-editar-compra .factura__total-valor');
    if (totalEditar) {
        totalEditar.textContent = formatearPrecio(total);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Registrar Compra (Enviar al Backend) ------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Recolecta los datos de ambos pasos, valida y envía POST al backend.
 * Solo envía productoId y cantidad — el backend lee el precio de la BD.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleCrearCompra(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Obtener los datos generales del paso 1 */
    const proveedorId = parseInt(selectProveedor.value);                         // ID del proveedor
    const fechaCompra = inputFecha.value;                                       // Fecha YYYY-MM-DD
    const metodoPago = selectMetodoPago.value;                                 // "Efectivo" o "Transferencia"

    /* Recolectar los ítems de todas las filas visibles con producto seleccionado */
    const items = [];
    /* Obtener todas las filas de producto del modal */
    const filas = document.querySelectorAll('#modal-productos-compra .factura__fila');

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
        /* Enviar petición POST al backend para registrar la compra */
        const respuesta = await crearCompra({ fechaCompra, metodoPago, proveedorId, items });

        /* Cerrar el modal del paso 2 */
        closeModal('modal-productos-compra');

        /* Limpiar todos los campos del formulario de compra */
        limpiarFormularioCompra();

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message || 'Compra registrada exitosamente');

        /* Recargar la tabla y los productos (stock actualizado) */
        await cargarProductos();
        await cargarCompras();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al registrar la compra');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Limpiar Formulario de Compra ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Resetea todos los campos del formulario de compra (pasos 1 y 2).
 * Restaura los checkboxes a su estado por defecto.
 */
function limpiarFormularioCompra() {
    /* Limpiar campos del paso 1 */
    selectProveedor.value = '';                                                 // Resetear proveedor
    inputFecha.value = new Date().toISOString().split('T')[0];                 // Restaurar fecha de hoy
    selectMetodoPago.value = '';                                               // Resetear método de pago

    /* Limpiar todos los selects de producto en el paso 2 */
    const selects = document.querySelectorAll('#modal-productos-compra .factura__fila select');
    selects.forEach(sel => { sel.value = ''; });

    /* Limpiar todos los inputs de cantidad en el paso 2 */
    const cantidades = document.querySelectorAll('#modal-productos-compra .factura__fila input[name^="cantidad"]');
    cantidades.forEach(input => { input.value = ''; });

    /* Limpiar todos los inputs de precio en el paso 2 */
    const precios = document.querySelectorAll('#modal-productos-compra .factura__fila input[name^="precio"]');
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
/* ----- Ver Detalle de Compra ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga los detalles de una compra desde el backend y los muestra en el modal.
 * @param {number} id - ID de la compra a consultar
 * @returns {Promise<void>}
 */
async function handleVerDetalle(id) {
    try {
        /* Petición GET al backend para obtener la compra con sus detalles */
        const compra = await obtenerCompraPorId(id);

        /* Actualizar el título del modal con el ID de la compra */
        const titulo = modalDetalle.querySelector('.modal__titulo');
        titulo.textContent = `Detalle de Compra #${compra.idCompra}`;

        /* Actualizar el subtítulo con la fecha, método y proveedor */
        const subtitulo = modalDetalle.querySelector('.modal__subtitulo');
        const nombreProveedor = obtenerNombreProveedor(compra.proveedorId);
        subtitulo.innerHTML = `${formatearFecha(compra.fechaCompra)} &bull; ${compra.metodoPago} &bull; ${nombreProveedor}`;

        /* Construir el HTML de la tabla de detalles */
        const tableBody = modalDetalle.querySelector('.factura__tabla tbody');
        tableBody.innerHTML = compra.detalles.map(det => {
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
        totalEl.textContent = formatearPrecio(compra.totalCompra);

        /* Abrir el modal de detalle */
        openModal('modal-detalle-compra');
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cargar el detalle de la compra');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Editar Compra ------------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Carga los datos de una compra existente en el modal de edición.
 * @param {number} id - ID de la compra a editar
 * @returns {Promise<void>}
 */
async function handleEditarCompra(id) {
    try {
        /* Petición GET al backend para obtener la compra con sus detalles */
        const compra = await obtenerCompraPorId(id);

        /* Guardar el ID de la compra en el modal para referencia */
        modalEditar.dataset.id = id;

        /* Actualizar el título del modal */
        const titulo = modalEditar.querySelector('.modal__titulo');
        titulo.textContent = `Editar Compra #${compra.idCompra}`;

        /* Llenar los campos del paso 1 */
        selectProveedor.value = compra.proveedorId;
        inputFecha.value = compra.fechaCompra;
        selectMetodoPago.value = compra.metodoPago;

        /* Llenar los productos del paso 2 */
        const filas = document.querySelectorAll('#modal-editar-compra .factura__fila');
        
        /* Limpiar y llenar cada fila con los datos de la compra */
        compra.detalles.forEach((detalle, index) => {
            if (index < filas.length) {
                const fila = filas[index];
                const select = fila.querySelector('select');
                const cantidadInput = fila.querySelector('input[name^="cantidad"]');
                const precioInput = fila.querySelector('input[name^="precio"]');

                if (select) select.value = detalle.productoId;
                if (cantidadInput) cantidadInput.value = detalle.cantidad;
                if (precioInput) precioInput.value = detalle.precioUnitario;
            }
        });

        /* Calcular el total */
        calcularTotalEditar();

        /* Abrir el modal de edición */
        openModal('modal-editar-compra');
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cargar los datos de la compra');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Compra (Confirmar Edición) -------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Envía los datos actualizados de la compra al backend.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleActualizarCompra(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Obtener el ID de la compra desde el dataset del modal */
    const id = parseInt(modalEditar.dataset.id);
    if (!id) {
        mostrarAlertaError('ID de compra no encontrado');
        return;
    }

    /* Obtener los datos generales del paso 1 */
    const proveedorId = parseInt(selectProveedor.value);
    const fechaCompra = inputFecha.value;
    const metodoPago = selectMetodoPago.value;

    /* Recolectar los ítems actualizados */
    const items = [];
    const filas = document.querySelectorAll('#modal-editar-compra .factura__fila');

    filas.forEach((fila, index) => {
        if (index === 0 || esFilaVisibleEditar(index + 1)) {
            const select = fila.querySelector('select');
            const cantidadInput = fila.querySelector('input[name^="cantidad"]');

            if (select?.value && cantidadInput?.value) {
                items.push({
                    productoId: parseInt(select.value),
                    cantidad: parseInt(cantidadInput.value),
                });
            }
        }
    });

    /* Validaciones */
    if (items.length === 0) {
        mostrarAlertaError('Agregue al menos un producto');
        return;
    }

    try {
        /* Enviar petición PUT al backend */
        const respuesta = await actualizarCompra(id, { fechaCompra, metodoPago, proveedorId, items });

        /* Cerrar el modal de edición */
        closeModal('modal-editar-compra');

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || 'Compra actualizada exitosamente');

        /* Recargar datos */
        await cargarProductos();
        await cargarCompras();
    } catch (error) {
        mostrarAlertaError(error.message || 'Error al actualizar la compra');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Eliminar Compra ---------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra confirmación y elimina una compra lógicamente.
 * @param {number} id - ID de la compra a eliminar
 * @returns {Promise<void>}
 */
async function handleEliminarCompra(id) {
    try {
        /* Mostrar confirmación con SweetAlert */
        const resultado = await Swal.fire({
            title: '¿Eliminar esta compra?',
            text: 'Esta acción no se puede deshacer. La compra se marcará como inactiva.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        /* Si el usuario confirma, proceder con la eliminación */
        if (resultado.isConfirmed) {
            /* Enviar petición DELETE al backend */
            const respuesta = await eliminarCompra(id);

            /* Mostrar alerta de éxito */
            await mostrarAlertaExito(respuesta.message || 'Compra eliminada exitosamente');

            /* Recargar la tabla y los productos (stock revertido) */
            await cargarProductos();
            await cargarCompras();
        }
    } catch (error) {
        mostrarAlertaError(error.message || 'Error al eliminar la compra');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Delegación de Eventos en la Tabla ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja los clics en los botones de acción de la tabla (ver, editar, eliminar).
 * Usa delegación de eventos en el tbody para manejar filas dinámicas.
 * @param {Event} e - Evento de clic
 */
function handleAccionesTabla(e) {
    /* Buscar el botón de acción más cercano al clic */
    const boton = e.target.closest('[data-accion]');

    /* Si no se hizo clic en un botón de acción, salir */
    if (!boton) return;

    /* Obtener la acción y el ID de la compra desde los data attributes */
    const accion = boton.dataset.accion;                                       // 'ver'
    const id = parseInt(boton.dataset.id);                                     // ID de la compra

    /* Ejecutar la acción correspondiente */
    if (accion === 'ver') {
        /* Abrir el modal de detalle con los datos de la compra */
        handleVerDetalle(id);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página de compras.
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

    /* Botón "Guardar Compra" → enviar la compra al backend */
    btnGuardarCompra.addEventListener('click', handleCrearCompra);

    /* Auto-llenar precio cuando se selecciona un producto */
    listaProductos.addEventListener('change', handleProductoChange);

    /* Recalcular total cuando cambia una cantidad */
    listaProductos.addEventListener('input', (e) => {
        /* Solo recalcular si el evento viene de un input de cantidad */
        if (e.target.matches('input[name^="cantidad"]')) calcularTotal();
    });

    /* ===== Event Listeners del Modal Editar ===== */

    /* Botón "Actualizar Compra" → confirmar edición */
    if (btnActualizarCompra) {
        btnActualizarCompra.addEventListener('click', handleActualizarCompra);
    }

    /* ===== Carga Inicial de Datos ===== */

    /* Establecer la fecha de hoy como valor por defecto */
    inputFecha.value = new Date().toISOString().split('T')[0];

    /* Cargar los proveedores para el select del paso 1 */
    cargarProveedores();

    /* Cargar los productos para los selects del paso 2 */
    cargarProductos();

    /* Cargar las compras desde el backend y renderizar la tabla */
    cargarCompras();
});
