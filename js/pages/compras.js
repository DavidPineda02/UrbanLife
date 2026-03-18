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
 *  - Ver detalle de una compra (modal con detalles)
 *  - Búsqueda por proveedor o ID en tiempo real (client-side)
 *  - Filtro por método de pago y período (client-side)
 *  - Carga dinámica de proveedores y productos para los selects
 *  - Costo unitario editable (el usuario ingresa el precio del proveedor)
 *  - Cálculo del total en tiempo real antes de guardar
 *  - Filas de producto dinámicas e ilimitadas (agregar/eliminar con JS)
 *
 * Nota: Las compras son INMUTABLES — no se pueden editar ni eliminar.
 *       El costoUnitario lo ingresa el usuario (precio del proveedor).
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

/** Contador incremental para asignar nombres únicos a cada fila de producto */
let contadorFilas = 1;

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cuerpo de la tabla donde se renderizan las filas de compras */
let tbody;

/** Input de búsqueda por proveedor o ID de compra */
let inputBusqueda;

/** Select de filtro por método de pago */
let selectMetodo;

/** Select de filtro por período de tiempo */
let selectPeriodo;

/* ----- Modal Paso 1: Datos Generales ----- */

/** Select de proveedor en el modal paso 1 */
let selectProveedor;

/** Input de fecha en el modal paso 1 */
let inputFecha;

/** Select de método de pago en el modal paso 1 */
let selectMetodoPago;

/** Botón "Agregar Productos" para avanzar al paso 2 */
let btnSiguiente;

/* ----- Modal Paso 2: Productos de la Compra ----- */

/** Contenedor de la lista de filas de productos en el paso 2 */
let listaProductos;

/** Elemento que muestra el total calculado en tiempo real */
let totalValor;

/** Botón "Guardar Compra" para enviar la compra al backend */
let btnGuardarCompra;

/** Botón "Volver" para regresar al paso 1 */
let btnVolverPaso1;

/* ----- Modal Detalle de Compra ----- */

/** Contenedor del modal de detalle de compra */
let modalDetalle;

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

        /* Generar las opciones HTML para los selects de productos */
        const opciones = generarOpcionesProductos();

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
            <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-texto-suave);">
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
/* ----- Generar Opciones de Productos para Selects ------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Construye el HTML de las opciones de productos activos para un select.
 * @returns {string} HTML con las opciones de productos activos
 */
function generarOpcionesProductos() {
    /* Filtrar solo los productos activos */
    const activos = productos.filter(p => p.estado === true);

    /* Retornar las opciones HTML con el nombre del producto */
    return '<option value="">Seleccionar</option>' +
        activos.map(p => `<option value="${p.idProducto}">${p.nombre}</option>`).join('');
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Fila de Producto (HTML Dinámico) ----------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Genera el HTML de una fila de producto para el modal paso 2.
 * Todas las filas tienen botón de eliminar activo (la lógica de no eliminar
 * la última fila se maneja en eliminarFilaCompra).
 * A diferencia de ventas, el costo unitario es EDITABLE (el usuario lo ingresa).
 * @param {number} num - Número de fila (para nombres únicos)
 * @returns {string} HTML de la fila de producto
 */
function crearFilaProductoHTML(num) {
    /* Generar las opciones de productos activos para el select */
    const opciones = generarOpcionesProductos();

    /* Retornar el HTML completo de la fila con botón de eliminar siempre activo */
    return `
        <div class="factura__fila">
            <span class="factura__fila-numero"></span>
            <select class="formulario__select" name="producto_${num}" title="Producto" data-required>
                ${opciones}
            </select>
            <input type="number" class="formulario__input" name="cantidad_${num}" placeholder="0" title="Cantidad" min="1">
            <input type="number" class="formulario__input" name="costo_${num}" placeholder="$ 0" title="Costo Unitario">
            <button type="button" class="factura__eliminar btn-eliminar-fila" title="Eliminar producto">
                <i class="fa-solid fa-trash"></i>
            </button>
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
function agregarFilaCompra() {
    /* Incrementar el contador de filas para nombre único */
    contadorFilas++;

    /* Generar el HTML de la nueva fila */
    const nuevaFilaHTML = crearFilaProductoHTML(contadorFilas);

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
function eliminarFilaCompra(e) {
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
/* ----- Calcular Total en Tiempo Real -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Calcula y muestra el total de la compra sumando cantidad × costoUnitario
 * de todas las filas que tengan producto seleccionado.
 */
function calcularTotal() {
    /* Inicializar el acumulador del total */
    let total = 0;

    /* Obtener todas las filas de producto del modal paso 2 */
    const filas = document.querySelectorAll('#modal-productos-compra .factura__fila');

    /* Iterar cada fila para sumar su subtotal */
    filas.forEach(fila => {
        /* Obtener los valores de cantidad y costo de la fila */
        const cantidadInput = fila.querySelector('input[name^="cantidad"]');
        const costoInput = fila.querySelector('input[name^="costo"]');

        /* Calcular el subtotal si ambos campos tienen valor */
        if (cantidadInput && cantidadInput.value && costoInput && costoInput.value) {
            /* Parsear la cantidad como entero */
            const cantidad = parseInt(cantidadInput.value) || 0;
            /* Parsear el costo como decimal */
            const costo = parseFloat(costoInput.value) || 0;
            /* Sumar al total */
            total += cantidad * costo;
        }
    });

    /* Actualizar el texto del total en el modal */
    totalValor.textContent = formatearPrecio(total);
}

/* -------------------------------------------------------------------------- */
/* ----- Registrar Compra (Enviar al Backend) ------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Recolecta los datos de ambos pasos, valida y envía POST al backend.
 * Envía productoId, cantidad y costoUnitario — el costo viene del usuario.
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

    /* Recolectar los ítems de todas las filas con producto seleccionado */
    const items = [];
    /* Obtener todas las filas de producto del modal */
    const filas = document.querySelectorAll('#modal-productos-compra .factura__fila');

    /* Iterar cada fila para recolectar los datos */
    filas.forEach(fila => {
        /* Obtener el select de producto, input de cantidad e input de costo */
        const select = fila.querySelector('select');
        const cantidadInput = fila.querySelector('input[name^="cantidad"]');
        const costoInput = fila.querySelector('input[name^="costo"]');

        /* Si los tres tienen valor, agregar el ítem al array */
        if (select?.value && cantidadInput?.value && costoInput?.value) {
            items.push({
                productoId: parseInt(select.value),                        // ID del producto
                cantidad: parseInt(cantidadInput.value),                    // Cantidad comprada
                costoUnitario: parseFloat(costoInput.value),                // Costo del proveedor
            });
        }
    });

    /* Validar que haya al menos un producto */
    if (items.length === 0) {
        mostrarAlertaError('Agregue al menos un producto con cantidad y costo');
        return;
    }

    /* Validar que todas las cantidades sean mayores a 0 */
    for (const item of items) {
        if (!item.cantidad || item.cantidad <= 0) {
            mostrarAlertaError('La cantidad debe ser mayor a 0');
            return;
        }
        /* Validar que el costo unitario sea mayor a 0 */
        if (!item.costoUnitario || item.costoUnitario <= 0) {
            mostrarAlertaError('El costo unitario debe ser mayor a 0');
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
        
        /* ACTUALIZAR DASHBOARD: Refrescar egresos en tiempo real */
        try {
            // Actualizar dashboard si estamos en la página home
            if (typeof actualizarDashboard === 'function') {
                await actualizarDashboard();
            }
        } catch (error) {
            console.log('Dashboard no disponible para actualizar');
        }
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
 * Elimina todas las filas extra y deja solo la primera fila limpia.
 */
function limpiarFormularioCompra() {
    /* Limpiar campos del paso 1 */
    selectProveedor.value = '';                                                 // Resetear proveedor
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
        /* Resetear el input de costo de la primera fila */
        const costo = primeraFila.querySelector('input[name^="costo"]');
        if (costo) costo.value = '';
    }

    /* Reiniciar el contador de filas a 1 */
    contadorFilas = 1;

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
 * Punto de entrada de la página de compras (compatible con SPA).
 * Consulta los elementos del DOM, conecta event listeners y carga datos iniciales.
 * Se exporta para ser invocada por el router del SPA.
 */
export async function inicializar() {

    /* ===== Resetear Estado del Módulo ===== */

    /* Vaciar el cache de compras para forzar recarga */
    compras = [];

    /* Vaciar el cache de proveedores para forzar recarga */
    proveedores = [];

    /* Vaciar el cache de productos para forzar recarga */
    productos = [];

    /* Reiniciar el contador de filas a 1 */
    contadorFilas = 1;

    /* ===== Consultar Elementos del DOM ===== */

    /* Obtener el cuerpo de la tabla de compras */
    tbody = document.querySelector('.tabla__cuerpo');

    /* Obtener el input de búsqueda */
    inputBusqueda = document.querySelector('.buscador__input');

    /* Obtener el select de filtro por método de pago */
    selectMetodo = document.querySelector('[name="filtro-metodo"]');

    /* Obtener el select de filtro por período */
    selectPeriodo = document.querySelector('[name="filtro-periodo"]');

    /* Obtener el select de proveedor del modal paso 1 */
    selectProveedor = document.getElementById('compra-proveedor');

    /* Obtener el input de fecha del modal paso 1 */
    inputFecha = document.getElementById('compra-fecha');

    /* Obtener el select de método de pago del modal paso 1 */
    selectMetodoPago = document.getElementById('compra-metodo-pago');

    /* Obtener el botón "Agregar Productos" del modal paso 1 */
    btnSiguiente = document.getElementById('btn-siguiente-productos');

    /* Obtener el contenedor de filas de productos del modal paso 2 */
    listaProductos = document.querySelector('#modal-productos-compra .factura__lista');

    /* Obtener el elemento del total calculado del modal paso 2 */
    totalValor = document.querySelector('#modal-productos-compra .factura__total-valor');

    /* Obtener el botón "Guardar Compra" del modal paso 2 */
    btnGuardarCompra = document.getElementById('btn-guardar-compra');

    /* Obtener el botón "Volver" del modal paso 2 */
    btnVolverPaso1 = document.getElementById('btn-volver-paso1');

    /* Obtener el contenedor del modal de detalle de compra */
    modalDetalle = document.getElementById('modal-detalle-compra');

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

    /* Recalcular total cuando cambia una cantidad o costo */
    listaProductos.addEventListener('input', (e) => {
        /* Recalcular si el evento viene de un input de cantidad o costo */
        if (e.target.matches('input[name^="cantidad"]') || e.target.matches('input[name^="costo"]')) {
            calcularTotal();
        }
    });

    /* Delegación de eventos para eliminar filas de producto dinámicas */
    listaProductos.addEventListener('click', eliminarFilaCompra);

    /* Botón "Agregar producto" → agregar nueva fila de producto */
    const btnAgregarFila = document.getElementById('btn-agregar-fila-compra');
    btnAgregarFila.addEventListener('click', agregarFilaCompra);

    /* ===== Carga Inicial de Datos ===== */

    /* Establecer la fecha de hoy como valor por defecto */
    inputFecha.value = obtenerFechaLocal();

    /* Cargar los proveedores para el select del paso 1 */
    cargarProveedores();

    /* Cargar los productos para los selects del paso 2 */
    cargarProductos();

    /* Cargar las compras desde el backend y renderizar la tabla */
    cargarCompras();

    /* Numerar la primera fila de producto que viene pre-renderizada en el HTML */
    renumerarFilas();
}
