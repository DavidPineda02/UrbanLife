/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — PRODUCTOS =================================== */
/* ========================================================================== */

/**
 * Lógica de la página de gestión de productos.
 * Conecta la vista HTML con el servicio de productos del backend.
 *
 * Funcionalidades:
 *  - Carga y renderiza tarjetas de productos desde el API
 *  - Crear producto (modal agregar → POST + imagen opcional)
 *  - Editar producto (modal editar → PUT + imagen opcional)
 *  - Activar/Desactivar producto (PATCH toggle estado)
 *  - Búsqueda por nombre en tiempo real (client-side)
 *  - Filtro por categoría, estado y stock (client-side)
 *  - Carga dinámica de categorías para los select del formulario
 *
 * Dependencias:
 *  - productos.service.js   → llamadas al API de productos
 *  - categorias.service.js  → cargar categorías para los selects
 *  - alerts.js              → SweetAlert2 (éxito/error)
 *  - modal.js               → abrir/cerrar modales
 *  - notifications.js       → toasts informativos
 *  - formValidation.js      → validación de formularios
 */

// Importar funciones del servicio de productos
import {
    obtenerProductos,                                                          // GET todos los productos
    crearProducto,                                                             // POST nuevo producto
    actualizarProducto,                                                        // PUT actualizar producto
    toggleEstadoProducto,                                                      // PATCH activar/desactivar
    obtenerImagenesProducto,                                                   // GET imágenes de un producto
    subirImagenProducto,                                                       // POST subir imagen base64
} from '../api/services/productos.service.js';

// Importar función para cargar categorías desde el backend
import { obtenerCategorias } from '../api/services/categorias.service.js';

// Importar utilidades de UI
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';   // Alertas SweetAlert2
import { openModal, closeModal } from '../utils/modal.js';                     // Sistema de modales
import { showNotification } from '../utils/notifications.js';                  // Toasts
import { validateForm, clearFormState } from '../utils/formValidation.js';     // Validación de formularios
import Swal from 'sweetalert2';                                                // SweetAlert2 para confirmaciones
// Importar validaciones en tiempo real
import '../utils/realtimeValidations.js';                                      // Validaciones automáticas
// Importar función para obtener el rol del usuario autenticado
import { obtenerRol } from '../store/auth.store.js';                           // Rol del localStorage

/* -------------------------------------------------------------------------- */
/* ----- Estado Local del Módulo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Array de productos cargados desde el backend (cache local) */
let productos = [];

/** Array de categorías cargadas desde el backend (para selects y filtro) */
let categorias = [];

/** Mapa de imágenes por producto: { productoId: urlPrimeraImagen } */
let imagenesProductos = {};

/** ID del producto que se está editando actualmente (null si no hay edición) */
let productoEditandoId = null;

/** URL base del API para construir URLs de imágenes */
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080';

/* -------------------------------------------------------------------------- */
/* ----- Referencias al DOM ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Contenedor grid donde se renderizan las tarjetas de productos */
let grid;

/** Input de búsqueda por nombre */
let inputBusqueda;

/** Select de filtro por categoría */
let selectCategoria;

/** Select de filtro por estado (activo/inactivo) */
let selectEstado;

/** Select de filtro por stock */
let selectStock;

/* ----- Modal Agregar ----- */

/** Contenedor del modal de agregar producto */
let modalAgregar;

/** Input del nombre en el modal de agregar */
let inputNombreAgregar;

/** Select de categoría en el modal de agregar */
let selectCategoriaAgregar;

/** Textarea de la descripción en el modal de agregar */
let inputDescAgregar;

/** Input del precio de venta en el modal de agregar */
let inputPrecioAgregar;

/** Input del costo promedio en el modal de agregar */
let inputCostoAgregar;

/** Input del stock en el modal de agregar */
let inputStockAgregar;

/** Input file de la imagen en el modal de agregar */
let inputImagenAgregar;

/** Span de texto del archivo seleccionado en el modal de agregar */
let textoArchivoAgregar;

/** Botón "Guardar" del modal de agregar */
let btnGuardar;

/* ----- Modal Editar ----- */

/** Contenedor del modal de editar producto */
let modalEditar;

/** Input del nombre en el modal de editar */
let inputNombreEditar;

/** Select de categoría en el modal de editar */
let selectCategoriaEditar;

/** Textarea de la descripción en el modal de editar */
let inputDescEditar;

/** Input del precio de venta en el modal de editar */
let inputPrecioEditar;

/** Input del costo promedio en el modal de editar */
let inputCostoEditar;

/** Input del stock en el modal de editar */
let inputStockEditar;

/** Input file de la imagen en el modal de editar */
let inputImagenEditar;

/** Span de texto del archivo seleccionado en el modal de editar */
let textoArchivoEditar;

/** Select del estado en el modal de editar */
let selectEstadoEditar;

/** Botón "Actualizar" del modal de editar */
let btnActualizar;

/* -------------------------------------------------------------------------- */
/* ----- Cargar Categorías desde el Backend --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene las categorías activas del backend y llena los selects del formulario y filtro.
 * @returns {Promise<void>}
 */
async function cargarCategorias() {
    try {
        /* Petición GET al backend para obtener categorías */
        categorias = await obtenerCategorias();

        /* Filtrar solo las categorías activas para los selects */
        const activas = categorias.filter(c => c.estado === true);

        /* Llenar el select de filtro de categoría */
        selectCategoria.innerHTML = '<option value="">Categoría</option>';
        activas.forEach(cat => {
            /* Crear una opción con el ID como valor y el nombre como texto */
            selectCategoria.innerHTML += `<option value="${cat.idCategoria}">${cat.nombre}</option>`;
        });

        /* Llenar el select de categoría del modal de agregar */
        const opcionesCategoria = '<option value="">Seleccionar</option>' +
            activas.map(cat => `<option value="${cat.idCategoria}">${cat.nombre}</option>`).join('');

        /* Insertar las opciones en ambos selects de los modales */
        selectCategoriaAgregar.innerHTML = opcionesCategoria;
        selectCategoriaEditar.innerHTML = opcionesCategoria;
    } catch (error) {
        /* Log del error si falla la carga de categorías */
        console.error('Error al cargar categorías:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Cargar Productos desde el Backend ---------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene todos los productos del backend, carga sus imágenes y renderiza las tarjetas.
 * @returns {Promise<void>}
 */
async function cargarProductos() {
    try {
        /* Petición GET al backend */
        productos = await obtenerProductos();

        /* Cargar la primera imagen de cada producto en paralelo */
        await cargarImagenes();

        /* Renderizar las tarjetas con los datos obtenidos */
        renderizarGrid();
    } catch (error) {
        /* Mostrar notificación de error si falla la carga */
        showNotification('Error al cargar los productos', 'error');
        /* Log del error para depuración */
        console.error('Error al cargar productos:', error);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Cargar Imágenes de Productos --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Carga la primera imagen de cada producto para mostrar en las tarjetas.
 * Realiza las peticiones en paralelo para optimizar el tiempo de carga.
 * @returns {Promise<void>}
 */
async function cargarImagenes() {
    /* Reiniciar el mapa de imágenes */
    imagenesProductos = {};

    /* Crear un array de promesas para cargar imágenes en paralelo */
    const promesas = productos.map(async (prod) => {
        try {
            /* Obtener las imágenes del producto desde el backend */
            const imagenes = await obtenerImagenesProducto(prod.idProducto);

            /* Si tiene al menos una imagen, guardar la URL de la primera */
            if (imagenes && imagenes.length > 0) {
                imagenesProductos[prod.idProducto] = imagenes[0].url;
            }
        } catch (error) {
            /* Silenciar errores de imágenes individuales para no bloquear la carga */
            console.error(`Error cargando imagen del producto ${prod.idProducto}:`, error);
        }
    });

    /* Esperar a que todas las peticiones de imágenes terminen */
    await Promise.all(promesas);
}

/* -------------------------------------------------------------------------- */
/* ----- Obtener Nombre de Categoría --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Busca el nombre de una categoría por su ID en el cache local.
 * @param {number} categoriaId - ID de la categoría
 * @returns {string} Nombre de la categoría o 'Sin categoría'
 */
function obtenerNombreCategoria(categoriaId) {
    /* Buscar la categoría en el cache por su ID */
    const cat = categorias.find(c => c.idCategoria === categoriaId);

    /* Retornar el nombre o un texto por defecto */
    return cat ? cat.nombre : 'Sin categoría';
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
/* ----- Construir URL de Imagen ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Construye la URL completa de una imagen del producto.
 * @param {number} productoId - ID del producto
 * @returns {string} URL de la imagen o ruta del placeholder
 */
function obtenerUrlImagen(productoId) {
    /* Verificar si el producto tiene una imagen cargada */
    const url = imagenesProductos[productoId];

    /* Si tiene imagen, construir la URL completa con el base del API */
    if (url) return `${API_BASE}${url}`;

    /* Si no tiene imagen, retornar el placeholder por defecto */
    return '../assets/img/producto.png';
}

/* -------------------------------------------------------------------------- */
/* ----- Renderizar Grid de Tarjetas --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Renderiza las tarjetas de productos aplicando los filtros.
 * Se llama cada vez que cambian los datos o los filtros.
 */
function renderizarGrid() {
    /* Obtener el texto de búsqueda en minúsculas */
    const busqueda = inputBusqueda.value.trim().toLowerCase();

    /* Obtener el valor del filtro de categoría */
    const filtroCategoria = selectCategoria.value;

    /* Obtener el valor del filtro de estado */
    const filtroEstado = selectEstado.value;

    /* Obtener el valor del filtro de stock */
    const filtroStock = selectStock.value;

    /* Filtrar los productos según todos los criterios */
    const filtrados = productos.filter(prod => {
        /* Verificar si el nombre coincide con la búsqueda */
        const coincideBusqueda = prod.nombre.toLowerCase().includes(busqueda);

        /* Verificar si la categoría coincide con el filtro */
        const coincideCategoria = filtroCategoria === ''                        // Sin filtro → todos
            || String(prod.categoriaId) === filtroCategoria;                    // Comparar ID como string

        /* Verificar si el estado coincide con el filtro */
        const coincideEstado = filtroEstado === ''                              // Sin filtro → todos
            || (filtroEstado === 'activo' && prod.estado === true)              // Solo activos
            || (filtroEstado === 'inactivo' && prod.estado === false);          // Solo inactivos

        /* Verificar si el stock coincide con el filtro */
        const coincideStock = filtroStock === ''                                // Sin filtro → todos
            || (filtroStock === 'disponible' && prod.stock > 10)               // Stock disponible
            || (filtroStock === 'bajo' && prod.stock > 0 && prod.stock <= 10)  // Stock bajo
            || (filtroStock === 'agotado' && prod.stock === 0);                // Sin stock

        /* El producto pasa si cumple todas las condiciones */
        return coincideBusqueda && coincideCategoria && coincideEstado && coincideStock;
    });

    /* Obtener el rol del usuario para condicionar botones de acción */
    const rolUsuario = obtenerRol();

    /* Construir el HTML de todas las tarjetas filtradas */
    grid.innerHTML = filtrados.map(prod => {
        /* Obtener el nombre de la categoría desde el cache */
        const nombreCategoria = obtenerNombreCategoria(prod.categoriaId);

        /* Obtener la URL de la imagen del producto */
        const urlImagen = obtenerUrlImagen(prod.idProducto);

        /* Determinar clase visual según stock */
        const stockClase = prod.stock === 0 ? 'producto__stock--agotado'
            : prod.stock <= 10 ? 'producto__stock--bajo' : '';

        /* Generar botones de acción solo si el usuario NO es EMPLEADO */
        const botonesAccion = rolUsuario !== 'EMPLEADO' ? `
                    <div class="producto__acciones">
                        <button type="button" class="producto__accion producto__accion--editar" title="Editar"
                                data-accion="editar" data-id="${prod.idProducto}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="producto__accion producto__accion--eliminar" title="${prod.estado ? 'Desactivar' : 'Activar'}"
                                data-accion="toggle" data-id="${prod.idProducto}" data-estado="${prod.estado}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>` : '';

        /* Retornar el HTML de la tarjeta con la misma estructura del diseño original */
        return `
            <article class="producto">
                <div class="producto__imagen">
                    <span class="producto__categoria">${nombreCategoria}</span>
                    ${botonesAccion}
                    <img src="${urlImagen}" alt="${prod.nombre}">
                </div>
                <div class="producto__contenido">
                    <h3 class="producto__nombre">${prod.nombre}</h3>
                    <p class="producto__descripcion">${prod.descripcion || 'Sin descripción'}</p>
                    <div class="producto__footer">
                        <span class="producto__precio">${formatearPrecio(prod.precioVenta)}</span>
                        <span class="producto__stock ${stockClase}">Stock: ${prod.stock}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');                                                                // Unir todas las tarjetas en un solo string

    /* Si no hay resultados, mostrar un mensaje vacío */
    if (filtrados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--color-texto-suave);">
                No se encontraron productos
            </div>
        `;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Convertir Archivo a Base64 ----------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Convierte un archivo de imagen a una cadena Base64.
 * @param {File} archivo - Archivo de imagen seleccionado
 * @returns {Promise<{ base64: string, extension: string }>} Base64 y extensión del archivo
 */
function archivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        /* Crear un FileReader para leer el archivo */
        const reader = new FileReader();

        /* Cuando la lectura termine, extraer el base64 */
        reader.onload = () => {
            /* El resultado tiene formato "data:image/png;base64,xxxxx" */
            const base64Completo = reader.result;
            /* Extraer solo la parte base64 (después de la coma) */
            const base64 = base64Completo.split(',')[1];
            /* Obtener la extensión del archivo */
            const extension = archivo.name.split('.').pop().toLowerCase();
            /* Resolver la promesa con el base64 y la extensión */
            resolve({ base64, extension });
        };

        /* Si hay error en la lectura, rechazar la promesa */
        reader.onerror = reject;

        /* Iniciar la lectura del archivo como Data URL (base64) */
        reader.readAsDataURL(archivo);
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Crear Producto (Modal Agregar) ------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Guardar" del modal de agregar.
 * Valida el formulario, envía POST al backend, sube imagen opcional y recarga.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleCrear(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Obtener el formulario contenedor para validar */
    const form = modalAgregar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#agregar-producto-nombre': {
            required: true,                                                    // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                           // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#agregar-producto-categoria': {
            required: true,                                                    // La categoría es obligatoria
            requiredMsg: 'Seleccione una categoría',                           // Mensaje personalizado
        },
        '#agregar-producto-precio': {
            required: true,                                                    // El precio es obligatorio
            requiredMsg: 'El precio es obligatorio',                           // Mensaje personalizado
            number: true,                                                      // Debe ser un número
        },
        '#agregar-producto-stock': {
            required: true,                                                    // El stock es obligatorio
            requiredMsg: 'El stock es obligatorio',                            // Mensaje personalizado
            number: true,                                                      // Debe ser un número
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores de los inputs */
    const nombre = inputNombreAgregar.value.trim();                            // Nombre del producto
    const descripcion = inputDescAgregar.value.trim() || null;                 // Descripción (null si vacía)
    const precioVenta = parseFloat(inputPrecioAgregar.value);                  // Precio de venta
    const costoPromedio = parseFloat(inputCostoAgregar.value) || 0;            // Costo promedio (0 si vacío)
    const stock = parseInt(inputStockAgregar.value);                           // Stock
    const categoriaId = parseInt(selectCategoriaAgregar.value);                // ID de la categoría

    try {
        /* Enviar petición POST al backend para crear el producto */
        const respuesta = await crearProducto({ nombre, descripcion, precioVenta, costoPromedio, stock, categoriaId });

        /* Si hay una imagen seleccionada, subirla al producto creado */
        if (inputImagenAgregar.files.length > 0) {
            /* Obtener el ID del producto recién creado */
            const nuevoProductoId = respuesta.data?.idProducto;

            /* Si se obtuvo el ID, subir la imagen */
            if (nuevoProductoId) {
                /* Convertir el archivo a base64 */
                const { base64, extension } = await archivoABase64(inputImagenAgregar.files[0]);
                /* Subir la imagen al backend */
                await subirImagenProducto(nuevoProductoId, base64, extension);
                
                /* ACTUALIZAR IMÁGENES: Recargar las imágenes para mostrar la nueva */
                await cargarImagenes();
            }
        }

        /* Cerrar el modal de agregar */
        closeModal('modal-producto');

        /* Limpiar los campos del formulario para el próximo uso */
        inputNombreAgregar.value = '';
        inputDescAgregar.value = '';
        inputPrecioAgregar.value = '';
        inputCostoAgregar.value = '';
        inputStockAgregar.value = '';
        selectCategoriaAgregar.value = '';
        inputImagenAgregar.value = '';
        if (textoArchivoAgregar) textoArchivoAgregar.textContent = 'Seleccionar imagen...';
        clearFormState(form);

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarProductos();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al crear el producto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Abrir Modal de Edición --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Abre el modal de edición pre-llenando los campos con los datos del producto.
 * @param {number} id - ID del producto a editar
 */
function abrirModalEditar(id) {
    /* Buscar el producto en el cache local por su ID */
    const prod = productos.find(p => p.idProducto === id);

    /* Si no se encuentra, mostrar error y salir */
    if (!prod) {
        showNotification('Producto no encontrado', 'error');
        return;
    }

    /* Guardar el ID del producto que se está editando */
    productoEditandoId = id;

    /* Pre-llenar los inputs con los valores actuales */
    inputNombreEditar.value = prod.nombre;                                     // Nombre actual
    selectCategoriaEditar.value = String(prod.categoriaId);                     // Categoría actual
    inputDescEditar.value = prod.descripcion || '';                             // Descripción actual
    inputPrecioEditar.value = prod.precioVenta;                                // Precio actual
    inputCostoEditar.value = prod.costoPromedio;                                // Costo actual
    inputStockEditar.value = prod.stock;                                       // Stock actual
    selectEstadoEditar.value = String(prod.estado);                            // Estado actual
    inputImagenEditar.value = '';                                              // Resetear input de imagen
    if (textoArchivoEditar) textoArchivoEditar.textContent = 'Seleccionar imagen...';

    /* Limpiar los estados visuales de validación previos */
    const form = modalEditar.querySelector('.modal__formulario');
    clearFormState(form);

    /* Abrir el modal de edición */
    openModal('modal-editar-producto');
}

/* -------------------------------------------------------------------------- */
/* ----- Actualizar Producto (Modal Editar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el clic en el botón "Actualizar" del modal de editar.
 * Valida el formulario, envía PUT al backend, sube imagen opcional y recarga.
 * @param {Event} e - Evento de clic
 * @returns {Promise<void>}
 */
async function handleActualizar(e) {
    /* Prevenir comportamiento por defecto */
    e.preventDefault();

    /* Verificar que hay un producto seleccionado para editar */
    if (!productoEditandoId) return;

    /* Obtener el formulario contenedor para validar */
    const form = modalEditar.querySelector('.modal__formulario');

    /* Validar los campos con las reglas definidas */
    const { valido, errores } = validateForm(form, {
        '#editar-producto-nombre': {
            required: true,                                                    // El nombre es obligatorio
            requiredMsg: 'El nombre es obligatorio',                           // Mensaje personalizado
            minLength: 2,                                                      // Mínimo 2 caracteres
        },
        '#editar-producto-categoria': {
            required: true,                                                    // La categoría es obligatoria
            requiredMsg: 'Seleccione una categoría',                           // Mensaje personalizado
        },
        '#editar-producto-precio': {
            required: true,                                                    // El precio es obligatorio
            requiredMsg: 'El precio es obligatorio',                           // Mensaje personalizado
            number: true,                                                      // Debe ser un número
        },
        '#editar-producto-stock': {
            required: true,                                                    // El stock es obligatorio
            requiredMsg: 'El stock es obligatorio',                            // Mensaje personalizado
            number: true,                                                      // Debe ser un número
        },
    });

    /* Si la validación falla, mostrar los errores y detener */
    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    /* Obtener los valores actualizados de los inputs */
    const nombre = inputNombreEditar.value.trim();                             // Nombre actualizado
    const descripcion = inputDescEditar.value.trim() || null;                  // Descripción actualizada
    const precioVenta = parseFloat(inputPrecioEditar.value);                   // Precio actualizado
    const costoPromedio = parseFloat(inputCostoEditar.value) || 0;             // Costo actualizado
    const stock = parseInt(inputStockEditar.value);                            // Stock actualizado
    const estado = selectEstadoEditar.value === 'true';                        // Estado actualizado
    const categoriaId = parseInt(selectCategoriaEditar.value);                 // Categoría actualizada

    try {
        /* Enviar petición PUT al backend para actualizar el producto */
        const respuesta = await actualizarProducto(productoEditandoId, {
            nombre, descripcion, precioVenta, costoPromedio, stock, estado, categoriaId,
        });

        /* Si hay una imagen seleccionada, subirla al producto */
        if (inputImagenEditar.files.length > 0) {
            /* Convertir el archivo a base64 */
            const { base64, extension } = await archivoABase64(inputImagenEditar.files[0]);
            /* Subir la imagen al backend */
            await subirImagenProducto(productoEditandoId, base64, extension);
            
            /* ACTUALIZAR IMÁGENES: Recargar las imágenes para mostrar la nueva */
            await cargarImagenes();
        }

        /* Cerrar el modal de edición */
        closeModal('modal-editar-producto');

        /* Reiniciar el ID de edición */
        productoEditandoId = null;

        /* Mostrar alerta de éxito con el mensaje del backend */
        await mostrarAlertaExito(respuesta.message);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarProductos();
    } catch (error) {
        /* Mostrar el mensaje de error del backend o un mensaje genérico */
        mostrarAlertaError(error.message || 'Error al actualizar el producto');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Toggle Estado (Activar/Desactivar) --------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Muestra una confirmación y luego activa o desactiva el producto.
 * @param {number} id - ID del producto
 * @param {boolean} estadoActual - Estado actual (true = activo)
 * @returns {Promise<void>}
 */
async function handleToggleEstado(id, estadoActual) {
    /* Determinar la acción a realizar para los textos del diálogo */
    const accion = estadoActual ? 'desactivar' : 'activar';                    // Texto de la acción
    const accionPasada = estadoActual ? 'desactivado' : 'activado';            // Texto en pasado

    /* Mostrar diálogo de confirmación con SweetAlert2 */
    const resultado = await Swal.fire({
        icon: 'warning',                                                       // Ícono de advertencia
        iconColor: '#E42727',                                                  // Color rojo del ícono
        title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} producto?`, // Título capitalizado
        text: estadoActual
            ? 'El producto dejará de estar disponible.'                         // Mensaje para desactivar
            : 'El producto volverá a estar disponible.',                        // Mensaje para activar
        showCancelButton: true,                                                // Mostrar botón cancelar
        confirmButtonText: accion.charAt(0).toUpperCase() + accion.slice(1),   // Texto del botón confirmar
        cancelButtonText: 'Cancelar',                                          // Texto del botón cancelar
        reverseButtons: true,                                                  // Cancelar a la izquierda
        customClass: {
            confirmButton: 'swal-btn swal-btn--confirmar',                     // Clase CSS del botón confirmar
            cancelButton: 'swal-btn swal-btn--cancelar',                       // Clase CSS del botón cancelar
            popup: 'swal-popup swal-popup--eliminar',                          // Clase CSS del popup
        },
        buttonsStyling: false,                                                 // Usar CSS personalizado
    });

    /* Si el usuario canceló, no hacer nada */
    if (!resultado.isConfirmed) return;

    try {
        /* Enviar PATCH al backend con el nuevo estado (invertido) */
        const respuesta = await toggleEstadoProducto(id, !estadoActual);

        /* Mostrar alerta de éxito */
        await mostrarAlertaExito(respuesta.message || `Producto ${accionPasada} exitosamente`);

        /* Recargar las tarjetas con los datos actualizados */
        await cargarProductos();
    } catch (error) {
        /* Mostrar el mensaje de error */
        mostrarAlertaError(error.message || 'Error al cambiar el estado');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Delegación de Eventos en el Grid ----------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja los clics en los botones de acción de las tarjetas (editar y toggle).
 * Usa delegación de eventos en el grid para manejar tarjetas dinámicas.
 * @param {Event} e - Evento de clic
 */
function handleAccionesGrid(e) {
    /* Buscar el botón de acción más cercano al clic */
    const boton = e.target.closest('[data-accion]');

    /* Si no se hizo clic en un botón de acción, salir */
    if (!boton) return;

    /* Obtener la acción y el ID del producto desde los data attributes */
    const accion = boton.dataset.accion;                                       // 'editar' o 'toggle'
    const id = parseInt(boton.dataset.id);                                     // ID del producto

    /* Ejecutar la acción correspondiente */
    if (accion === 'editar') {
        /* Abrir el modal de edición con los datos del producto */
        abrirModalEditar(id);
    } else if (accion === 'toggle') {
        /* Obtener el estado actual y ejecutar el toggle */
        const estadoActual = boton.dataset.estado === 'true';
        handleToggleEstado(id, estadoActual);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Mostrar Nombre de Archivo Seleccionado ----------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Actualiza el texto del label de archivo cuando se selecciona una imagen.
 * @param {Event} e - Evento change del input file
 * @param {HTMLElement} textoSpan - Span donde mostrar el nombre
 */
function handleFileChange(e, textoSpan) {
    /* Verificar si hay un archivo seleccionado */
    if (e.target.files.length > 0 && textoSpan) {
        /* Mostrar el nombre del archivo seleccionado */
        textoSpan.textContent = e.target.files[0].name;
    } else if (textoSpan) {
        /* Restaurar el texto por defecto */
        textoSpan.textContent = 'Seleccionar imagen...';
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización ----------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada de la página de productos.
 * Se ejecuta cuando el SPA navega a esta página.
 * Consulta los elementos del DOM, conecta event listeners y carga los datos iniciales.
 */
export async function inicializar() {

    /* ===== Consultar Elementos del DOM ===== */

    /* Contenedor grid donde se renderizan las tarjetas de productos */
    grid = document.querySelector('.productos__grid');

    /* Input de búsqueda por nombre */
    inputBusqueda = document.querySelector('.buscador__input');

    /* Select de filtro por categoría */
    selectCategoria = document.querySelector('[name="filtro-categoria"]');

    /* Select de filtro por estado (activo/inactivo) */
    selectEstado = document.querySelector('[name="filtro-estado"]');

    /* Select de filtro por stock */
    selectStock = document.querySelector('[name="filtro-stock"]');

    /* Contenedor del modal de agregar producto */
    modalAgregar = document.getElementById('modal-producto');

    /* Input del nombre en el modal de agregar */
    inputNombreAgregar = document.getElementById('agregar-producto-nombre');

    /* Select de categoría en el modal de agregar */
    selectCategoriaAgregar = document.getElementById('agregar-producto-categoria');

    /* Textarea de la descripción en el modal de agregar */
    inputDescAgregar = document.getElementById('agregar-producto-descripcion');

    /* Input del precio de venta en el modal de agregar */
    inputPrecioAgregar = document.getElementById('agregar-producto-precio');

    /* Input del costo promedio en el modal de agregar */
    inputCostoAgregar = document.getElementById('agregar-producto-costo');

    /* Input del stock en el modal de agregar */
    inputStockAgregar = document.getElementById('agregar-producto-stock');

    /* Input file de la imagen en el modal de agregar */
    inputImagenAgregar = document.getElementById('agregar-producto-imagen');

    /* Span de texto del archivo seleccionado en el modal de agregar */
    textoArchivoAgregar = modalAgregar ? modalAgregar.querySelector('.formulario__archivo-texto') : null;

    /* Botón "Guardar" del modal de agregar */
    btnGuardar = document.getElementById('btn-guardar-producto');

    /* Contenedor del modal de editar producto */
    modalEditar = document.getElementById('modal-editar-producto');

    /* Input del nombre en el modal de editar */
    inputNombreEditar = document.getElementById('editar-producto-nombre');

    /* Select de categoría en el modal de editar */
    selectCategoriaEditar = document.getElementById('editar-producto-categoria');

    /* Textarea de la descripción en el modal de editar */
    inputDescEditar = document.getElementById('editar-producto-descripcion');

    /* Input del precio de venta en el modal de editar */
    inputPrecioEditar = document.getElementById('editar-producto-precio');

    /* Input del costo promedio en el modal de editar */
    inputCostoEditar = document.getElementById('editar-producto-costo');

    /* Input del stock en el modal de editar */
    inputStockEditar = document.getElementById('editar-producto-stock');

    /* Input file de la imagen en el modal de editar */
    inputImagenEditar = document.getElementById('editar-producto-imagen');

    /* Span de texto del archivo seleccionado en el modal de editar */
    textoArchivoEditar = modalEditar ? modalEditar.querySelector('.formulario__archivo-texto') : null;

    /* Select del estado en el modal de editar */
    selectEstadoEditar = document.getElementById('editar-producto-estado');

    /* Botón "Actualizar" del modal de editar */
    btnActualizar = document.getElementById('btn-actualizar-producto');

    /* ===== Reiniciar Estado del Módulo ===== */

    /* Reiniciar el array de productos */
    productos = [];

    /* Reiniciar el array de categorías */
    categorias = [];

    /* Reiniciar el mapa de imágenes */
    imagenesProductos = {};

    /* Reiniciar el ID del producto en edición */
    productoEditandoId = null;

    /* ===== Event Listeners del Modal Agregar ===== */

    /* Botón "Guardar" del modal de agregar → crear producto */
    btnGuardar.addEventListener('click', handleCrear);

    /* Mostrar nombre de archivo en el label al seleccionar imagen */
    if (inputImagenAgregar) {
        inputImagenAgregar.addEventListener('change', (e) => handleFileChange(e, textoArchivoAgregar));
    }

    /* ===== Event Listeners del Modal Editar ===== */

    /* Botón "Actualizar" del modal de editar → actualizar producto */
    btnActualizar.addEventListener('click', handleActualizar);

    /* Mostrar nombre de archivo en el label al seleccionar imagen */
    if (inputImagenEditar) {
        inputImagenEditar.addEventListener('change', (e) => handleFileChange(e, textoArchivoEditar));
    }

    /* ===== Event Listeners del Grid ===== */

    /* Delegación de eventos para los botones de acción en las tarjetas */
    grid.addEventListener('click', handleAccionesGrid);

    /* ===== Event Listeners de Búsqueda y Filtro ===== */

    /* Filtrar las tarjetas en tiempo real mientras el usuario escribe en el buscador */
    inputBusqueda.addEventListener('input', renderizarGrid);

    /* Filtrar las tarjetas cuando cambia el select de categoría */
    selectCategoria.addEventListener('change', renderizarGrid);

    /* Filtrar las tarjetas cuando cambia el select de estado */
    selectEstado.addEventListener('change', renderizarGrid);

    /* Filtrar las tarjetas cuando cambia el select de stock */
    selectStock.addEventListener('change', renderizarGrid);

    /* ===== Restricción de acciones para EMPLEADO (solo lectura) ===== */

    /* Si el usuario es EMPLEADO, ocultar el botón de agregar producto */
    if (obtenerRol() === 'EMPLEADO') {
        /* Buscar el botón de agregar producto y ocultarlo */
        const btnAgregar = document.querySelector('[data-modal-open="modal-producto"]');
        if (btnAgregar) btnAgregar.style.display = 'none';
    }

    /* ===== Carga Inicial de Datos ===== */

    /* Cargar las categorías para llenar los selects */
    await cargarCategorias();

    /* Cargar los productos desde el backend y renderizar las tarjetas */
    await cargarProductos();
}
