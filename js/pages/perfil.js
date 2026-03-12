/* ========================================================================== */
/* ===== CONTROLADOR DE PÁGINA — PERFIL ====================================== */
/* ========================================================================== */

/**
 * Controlador de la vista de perfil del usuario.
 * Gestiona:
 *  - Carga de datos personales desde /auth/me
 *  - Edición de información personal (nombre, apellido, correo) vía PATCH /users/id
 *  - Establecer/cambiar contraseña vía PATCH /users/id
 *  - CRUD de correos adicionales (GET, POST, DELETE /correos-usuario)
 *  - CRUD de números telefónicos (GET, POST, DELETE /numeros-usuario)
 *  - Cerrar sesión
 */

// Servicio para obtener datos del usuario autenticado
import { obtenerPerfil, logout } from '../api/services/auth.service.js';
// Servicio para actualización parcial del usuario
import { actualizarParcialUsuario } from '../api/services/usuarios.service.js';
// Servicio para gestionar correos adicionales
import { obtenerCorreos, agregarCorreo, eliminarCorreo } from '../api/services/correos-usuario.service.js';
// Servicio para gestionar números telefónicos
import { obtenerNumeros, agregarNumero, eliminarNumero } from '../api/services/numeros-usuario.service.js';
// Utilidad para mostrar alertas de éxito con SweetAlert2
import { mostrarAlertaExito, mostrarAlertaError } from '../utils/alerts.js';
// Utilidad para abrir y cerrar modales
import { openModal, closeModal } from '../utils/modal.js';
// Utilidad para mostrar notificaciones tipo toast
import { showNotification } from '../utils/notifications.js';
// Sistema de validaciones de formularios (mismo que autenticación)
import { validateForm, evaluarFuerzaPassword, initValidacionVisual, clearFormState } from '../utils/formValidation.js';
// Sistema global de perfil
import { getGlobalProfile, refreshGlobalProfile } from '../utils/globalProfile.js';
// Importar patrones de validación globales
import { NOMBRE_REGEX, PASSWORD_REGEX, EMAIL_REGEX, TELEFONO_REGEX } from '../constants/validationPatterns.js';
// SweetAlert2 para confirmaciones de eliminación
import Swal from 'sweetalert2';

/* -------------------------------------------------------------------------- */
/* ----- Estado Local de la Página ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/** Almacena los datos del perfil del usuario autenticado */
let perfilUsuario = null;

/* -------------------------------------------------------------------------- */
/* ----- Helpers de Validación Visual -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Bloquea el ingreso de espacios en un input.
 * Cubre: tecla Space, pegado con Ctrl+V y cualquier otro método de entrada.
 * @param {HTMLInputElement} input - Campo al que se le bloquean los espacios
 */
function bloquearEspacios(input) {
    if (!input) return;

    input.addEventListener('keydown', (e) => {
        if (e.key === ' ') e.preventDefault();
    });

    input.addEventListener('input', () => {
        const pos = input.selectionStart;
        const sinEspacios = input.value.replace(/ /g, '');
        if (sinEspacios !== input.value) {
            input.value = sinEspacios;
            input.setSelectionRange(pos - 1, pos - 1);
        }
    });
}

/**
 * Marca uno o más inputs con borde rojo (estado de error).
 * Se auto-limpia cuando el usuario vuelve a escribir en el campo.
 * @param {HTMLFormElement} form - Formulario padre
 * @param {...string}       ids  - Selectores CSS de los inputs a marcar
 */
function marcarErrorVisual(form, ...ids) {
    ids.forEach(id => {
        const input = form.querySelector(id);
        if (!input) return;
        input.classList.remove('formulario__input--valido');
        input.classList.add('formulario__input--error');
        input.addEventListener('input', () => {
            input.classList.remove('formulario__input--error');
        }, { once: true });
    });
}

/**
 * Elimina todos los estados de error del formulario.
 * @param {HTMLFormElement} form - Formulario a limpiar
 */
function limpiarErrores(form) {
    form.querySelectorAll('.formulario__input--error').forEach(input => {
        input.classList.remove('formulario__input--error');
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Inicialización de la Página ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Punto de entrada: se ejecuta cuando el DOM está listo.
 * Carga los datos del perfil y registra todos los event listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Cargar los datos del perfil desde el backend
    cargarPerfil();
    // Cargar correos adicionales del usuario
    cargarCorreos();
    // Cargar números telefónicos del usuario
    cargarNumeros();
    // Registrar eventos de los botones de los modales
    registrarEventos();
    // Inicializar validaciones visuales en todos los formularios
    inicializarValidaciones();
});

/* -------------------------------------------------------------------------- */
/* ----- Inicialización de Validaciones Visuales --------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Inicializa todas las validaciones visuales en tiempo real para los formularios de perfil.
 * Usa el mismo sistema que la autenticación.
 */
function inicializarValidaciones() {
    // ----- Formulario Editar Información Personal -----
    const formEditarPersonal = document.getElementById('form-editar-personal');
    if (formEditarPersonal) {
        // Activar validación visual en tiempo real
        initValidacionVisual(formEditarPersonal, {
            '#editar-nombre': { regex: NOMBRE_REGEX, minLength: 2 },
            '#editar-apellido': { regex: NOMBRE_REGEX, minLength: 2 },
            '#editar-correo': { regex: EMAIL_REGEX },
        });
        
        // Bloquear espacios en nombres
        bloquearEspacios(formEditarPersonal.querySelector('#editar-nombre'));
        bloquearEspacios(formEditarPersonal.querySelector('#editar-apellido'));
    }

    // ----- Formulario Establecer Contraseña -----
    const formEstablecerContrasena = document.getElementById('form-establecer-contrasena');
    if (formEstablecerContrasena) {
        // Activar validación visual en tiempo real
        initValidacionVisual(formEstablecerContrasena, {
            '#establecer-contrasena': { regex: PASSWORD_REGEX },
            '#establecer-contrasena-confirmar': { match: '#establecer-contrasena' },
        });
        
        // Bloquear espacios en contraseñas
        bloquearEspacios(formEstablecerContrasena.querySelector('#establecer-contrasena'));
        bloquearEspacios(formEstablecerContrasena.querySelector('#establecer-contrasena-confirmar'));
        
        // Agregar barra de fuerza de contraseña
        inicializarBarraFuerza('establecer-contrasena', 'fuerza-password-establecer');
    }

    // ----- Formulario Cambiar Contraseña -----
    const formCambiarContrasena = document.getElementById('form-cambiar-contrasena');
    if (formCambiarContrasena) {
        // Activar validación visual en tiempo real
        initValidacionVisual(formCambiarContrasena, {
            '#cambiar-contrasena-actual': { required: true },
            '#cambiar-contrasena-nueva': { regex: PASSWORD_REGEX },
            '#cambiar-contrasena-confirmar': { match: '#cambiar-contrasena-nueva' },
        });
        
        // Bloquear espacios en contraseñas
        bloquearEspacios(formCambiarContrasena.querySelector('#cambiar-contrasena-actual'));
        bloquearEspacios(formCambiarContrasena.querySelector('#cambiar-contrasena-nueva'));
        bloquearEspacios(formCambiarContrasena.querySelector('#cambiar-contrasena-confirmar'));
        
        // Agregar barra de fuerza de contraseña
        inicializarBarraFuerza('cambiar-contrasena-nueva', 'fuerza-password-cambiar');
    }

    // ----- Formulario Agregar Correo -----
    const formAgregarCorreo = document.getElementById('form-agregar-correo');
    if (formAgregarCorreo) {
        // Activar validación visual en tiempo real
        initValidacionVisual(formAgregarCorreo, {
            '#agregar-correo': { regex: EMAIL_REGEX },
        });
    }

    // ----- Formulario Agregar Teléfono -----
    const formAgregarTelefono = document.getElementById('form-agregar-telefono');
    if (formAgregarTelefono) {
        // Activar validación visual en tiempo real
        initValidacionVisual(formAgregarTelefono, {
            '#agregar-telefono': { regex: TELEFONO_REGEX },
        });
    }
}

/**
 * Inicializa la barra de fuerza de contraseña para un campo específico.
 * @param {string} inputId - ID del input de contraseña
 * @param {string} containerId - ID del contenedor de la barra de fuerza
 */
function inicializarBarraFuerza(inputId, containerId) {
    const passwordInput = document.getElementById(inputId);
    const fuerzaContainer = document.getElementById(containerId);
    
    if (!passwordInput || !fuerzaContainer) return;
    
    // Crear estructura de la barra si no existe
    if (!fuerzaContainer.querySelector('.fuerza-password__barra')) {
        fuerzaContainer.innerHTML = `
            <div class="fuerza-password__barra">
                <div class="fuerza-password__progreso"></div>
            </div>
            <span class="fuerza-password__texto"></span>
        `;
    }
    
    const fuerzaProgreso = fuerzaContainer.querySelector('.fuerza-password__progreso');
    const fuerzaTexto = fuerzaContainer.querySelector('.fuerza-password__texto');
    
    // Evaluar fuerza en cada tecla
    passwordInput.addEventListener('input', () => {
        const valor = passwordInput.value;
        
        if (!valor) {
            fuerzaContainer.style.display = 'none';
            return;
        }
        
        const { nivel, porcentaje, color } = evaluarFuerzaPassword(valor);
        fuerzaContainer.style.display = 'block';
        fuerzaProgreso.style.width = `${porcentaje}%`;
        fuerzaProgreso.style.background = color;
        fuerzaTexto.textContent = nivel;
        fuerzaTexto.style.color = color;
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Carga de Datos del Perfil ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los datos completos del usuario autenticado desde el sistema global.
 * Actualiza todos los elementos de la vista con la información recibida.
 */
async function cargarPerfil() {
    try {
        // Obtener datos del perfil desde el sistema global
        const datos = await getGlobalProfile();
        // Guardar los datos en el estado local para uso posterior
        perfilUsuario = datos;

        // ----- Actualizar header del perfil -----

        // Construir las iniciales del usuario a partir del nombre y apellido
        const iniciales = (datos.nombre?.charAt(0) || '') + (datos.apellido?.charAt(0) || '');
        // Mostrar las iniciales en el avatar circular
        document.getElementById('perfil-iniciales').textContent = iniciales.toUpperCase();
        // Mostrar el nombre completo en el encabezado del perfil
        document.getElementById('perfil-nombre-completo').textContent = `${datos.nombre} ${datos.apellido}`;
        // Mostrar el rol del usuario en formato legible
        document.getElementById('perfil-rol-texto').textContent = formatearRol(datos.rol);

        // ----- Actualizar sidebar -----

        // Mostrar nombre completo en el enlace del sidebar
        document.getElementById('sidebar-nombre-usuario').textContent = `${datos.nombre} ${datos.apellido}`;
        // Mostrar rol en el sidebar
        document.getElementById('sidebar-rol-usuario').textContent = formatearRol(datos.rol);

        // ----- Actualizar sección de información personal -----

        // Mostrar el nombre en el campo de información personal
        document.getElementById('perfil-nombre').textContent = datos.nombre;
        // Mostrar el apellido en el campo de información personal
        document.getElementById('perfil-apellido').textContent = datos.apellido;
        // Mostrar el correo principal en el campo de información personal
        document.getElementById('perfil-correo').textContent = datos.correo;

        // ----- Actualizar sección de seguridad y acceso -----

        // Mostrar el campo de Google si el usuario tiene cuenta vinculada
        document.getElementById('campo-metodo-google').style.display = datos.tieneGoogle ? '' : 'none';
        // Mostrar el campo de método por correo y contraseña si el usuario tiene contraseña
        document.getElementById('campo-metodo-contrasena').style.display = datos.tieneContrasena ? '' : 'none';
        // Mostrar el botón de cambiar contraseña si el usuario ya tiene una
        document.getElementById('campo-cambiar-contrasena').style.display = datos.tieneContrasena ? '' : 'none';
        // Mostrar el botón de establecer contraseña si el usuario NO tiene una
        document.getElementById('campo-establecer-contrasena').style.display = datos.tieneContrasena ? 'none' : '';

    } catch (error) {
        // Mostrar error al usuario si falla la carga del perfil
        mostrarAlertaError('Error al cargar el perfil', error.message);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Carga de Correos Adicionales --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los correos adicionales del usuario y los renderiza en la lista.
 */
async function cargarCorreos() {
    try {
        // Llamar al backend para obtener los correos del usuario
        const correos = await obtenerCorreos();
        // Renderizar la lista de correos en el contenedor
        renderizarCorreos(correos);
    } catch (error) {
        // Mostrar notificación de error si falla la carga
        showNotification('Error al cargar correos', 'error');
    }
}

/**
 * Renderiza la lista de correos adicionales en el contenedor HTML.
 * @param {Array} correos - Lista de objetos { idCorreo, correo, usuarioId }
 */
function renderizarCorreos(correos) {
    // Obtener el contenedor de la lista de correos
    const contenedor = document.getElementById('lista-correos');

    // Si no hay correos, mostrar mensaje indicándolo
    if (correos.length === 0) {
        // Mostrar texto indicando que no hay correos adicionales
        contenedor.innerHTML = '<p class="perfil__lista-vacia">No hay correos adicionales registrados</p>';
        // Salir de la función sin continuar
        return;
    }

    // Generar el HTML de cada correo con su botón de eliminar
    contenedor.innerHTML = correos.map(correo => `
        <div class="perfil__lista-item">
            <i class="fa-solid fa-envelope"></i>
            <span>${correo.correo}</span>
            <button type="button" class="perfil__lista-eliminar" data-eliminar-correo="${correo.idCorreo}" title="Eliminar correo">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

/* -------------------------------------------------------------------------- */
/* ----- Carga de Números Telefónicos --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los números telefónicos del usuario y los renderiza en la lista.
 */
async function cargarNumeros() {
    try {
        // Llamar al backend para obtener los números del usuario
        const numeros = await obtenerNumeros();
        // Renderizar la lista de números en el contenedor
        renderizarNumeros(numeros);
    } catch (error) {
        // Mostrar notificación de error si falla la carga
        showNotification('Error al cargar teléfonos', 'error');
    }
}

/**
 * Renderiza la lista de números telefónicos en el contenedor HTML.
 * @param {Array} numeros - Lista de objetos { idNumero, numero, usuarioId }
 */
function renderizarNumeros(numeros) {
    // Obtener el contenedor de la lista de teléfonos
    const contenedor = document.getElementById('lista-telefonos');

    // Si no hay números, mostrar mensaje indicándolo
    if (numeros.length === 0) {
        // Mostrar texto indicando que no hay teléfonos adicionales
        contenedor.innerHTML = '<p class="perfil__lista-vacia">No hay teléfonos adicionales registrados</p>';
        // Salir de la función sin continuar
        return;
    }

    // Generar el HTML de cada número con su botón de eliminar
    contenedor.innerHTML = numeros.map(numero => `
        <div class="perfil__lista-item">
            <i class="fa-solid fa-phone"></i>
            <span>${numero.numero}</span>
            <button type="button" class="perfil__lista-eliminar" data-eliminar-numero="${numero.idNumero}" title="Eliminar teléfono">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

/* -------------------------------------------------------------------------- */
/* ----- Registro de Eventos ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Registra todos los event listeners de la página de perfil.
 * Incluye botones de modales, cerrar sesión y delegación de eventos.
 */
function registrarEventos() {

    // ----- Cerrar sesión -----

    // Registrar evento click en el botón de cerrar sesión
    document.getElementById('btn-cerrar-sesion').addEventListener('click', (evento) => {
        // Prevenir navegación del enlace
        evento.preventDefault();
        // Llamar a la función de logout que limpia sesión y redirige
        logout();
    });

    // ----- Guardar información personal -----

    // Registrar evento click en el botón de guardar del modal de editar personal
    document.getElementById('btn-guardar-personal').addEventListener('click', handleGuardarPersonal);

    // ----- Establecer contraseña -----

    // Registrar evento click en el botón de establecer contraseña
    document.getElementById('btn-establecer-contrasena').addEventListener('click', handleEstablecerContrasena);

    // ----- Cambiar contraseña -----

    // Registrar evento click en el botón de cambiar contraseña
    document.getElementById('btn-cambiar-contrasena').addEventListener('click', handleCambiarContrasena);

    // ----- Agregar correo -----

    // Registrar evento click en el botón de agregar correo
    document.getElementById('btn-agregar-correo').addEventListener('click', handleAgregarCorreo);

    // ----- Agregar teléfono -----

    // Registrar evento click en el botón de agregar teléfono
    document.getElementById('btn-agregar-telefono').addEventListener('click', handleAgregarTelefono);

    // ----- Delegación de eventos para eliminar correos -----

    // Registrar evento click con delegación en el contenedor de correos
    document.getElementById('lista-correos').addEventListener('click', (evento) => {
        // Buscar el botón de eliminar más cercano al elemento clickeado
        const boton = evento.target.closest('[data-eliminar-correo]');
        // Si se encontró un botón de eliminar, ejecutar la eliminación
        if (boton) handleEliminarCorreo(parseInt(boton.dataset.eliminarCorreo));
    });

    // ----- Delegación de eventos para eliminar números -----

    // Registrar evento click con delegación en el contenedor de teléfonos
    document.getElementById('lista-telefonos').addEventListener('click', (evento) => {
        // Buscar el botón de eliminar más cercano al elemento clickeado
        const boton = evento.target.closest('[data-eliminar-numero]');
        // Si se encontró un botón de eliminar, ejecutar la eliminación
        if (boton) handleEliminarNumero(parseInt(boton.dataset.eliminarNumero));
    });

    // ----- Pre-cargar datos en modal de editar personal -----

    // Escuchar apertura del modal para rellenar los campos con datos actuales
    const btnEditarPersonal = document.querySelector('[data-modal-open="modal-editar-personal"]');
    // Registrar evento click en el enlace de editar información personal
    if (btnEditarPersonal) {
        btnEditarPersonal.addEventListener('click', () => {
            // Rellenar el campo nombre con el valor actual del perfil
            document.getElementById('editar-nombre').value = perfilUsuario?.nombre || '';
            // Rellenar el campo apellido con el valor actual del perfil
            document.getElementById('editar-apellido').value = perfilUsuario?.apellido || '';
            // Rellenar el campo correo con el valor actual del perfil
            document.getElementById('editar-correo').value = perfilUsuario?.correo || '';
        });
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Handler: Guardar Información Personal ------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el guardado de la información personal (nombre, apellido, correo).
 * Usa PATCH /users/id para actualización parcial con validaciones profesionales.
 */
async function handleGuardarPersonal() {
    const form = document.getElementById('form-editar-personal');
    
    // Limpiar errores previos
    limpiarErrores(form);
    
    // Validación client-side con el mismo sistema que autenticación
    const { valido, errores } = validateForm(form, {
        '#editar-nombre': {
            required: true,
            requiredMsg: 'El nombre es requerido',
            minLength: 2,
            pattern: {
                regex: NOMBRE_REGEX,
                mensaje: 'El nombre solo puede contener letras (sin espacios ni números)',
            },
        },
        '#editar-apellido': {
            required: true,
            requiredMsg: 'El apellido es requerido',
            minLength: 2,
            pattern: {
                regex: NOMBRE_REGEX,
                mensaje: 'El apellido solo puede contener letras (sin espacios ni números)',
            },
        },
        '#editar-correo': {
            required: true,
            requiredMsg: 'El correo es requerido',
            pattern: {
                regex: EMAIL_REGEX,
                mensaje: 'Ingrese un correo electrónico válido',
            },
        },
    });

    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    // Obtener valores validados
    const nombre = document.getElementById('editar-nombre').value.trim();
    const apellido = document.getElementById('editar-apellido').value.trim();
    const correo = document.getElementById('editar-correo').value.trim();

    try {
        const userId = parseInt(perfilUsuario.userId);
        await actualizarParcialUsuario(userId, { nombre, apellido, correo });
        closeModal('modal-editar-personal');
        mostrarAlertaExito('Información actualizada correctamente');
        // Refrescar el perfil global para actualizar sidebar
        await refreshGlobalProfile();
        await cargarPerfil();
    } catch (error) {
        mostrarAlertaError('Error al actualizar', error.message);
        marcarErrorVisual(form, '#editar-nombre', '#editar-apellido', '#editar-correo');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Handler: Establecer Contraseña ------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el establecimiento de contraseña para cuentas Google sin contraseña.
 * Usa PATCH /users/id con el campo contrasena y validaciones profesionales.
 */
async function handleEstablecerContrasena() {
    const form = document.getElementById('form-establecer-contrasena');
    
    // Limpiar errores previos
    limpiarErrores(form);
    
    // Validación client-side con el mismo sistema que autenticación
    const { valido, errores } = validateForm(form, {
        '#establecer-contrasena': {
            required: true,
            requiredMsg: 'La contraseña es requerida',
            pattern: {
                regex: PASSWORD_REGEX,
                mensaje: 'La contraseña debe tener entre 8 y 20 caracteres, sin espacios, una mayúscula, una minúscula y un número',
            },
        },
        '#establecer-contrasena-confirmar': {
            required: true,
            requiredMsg: 'Confirmar la contraseña es requerido',
            match: '#establecer-contrasena',
            matchMsg: 'Las contraseñas no coinciden',
        },
    });

    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    // Obtener valor validado
    const contrasena = document.getElementById('establecer-contrasena').value;

    try {
        const userId = parseInt(perfilUsuario.userId);
        await actualizarParcialUsuario(userId, { contrasena });
        closeModal('modal-establecer-contrasena');
        form.reset();
        clearFormState(form);
        mostrarAlertaExito('Contraseña establecida correctamente');
        // Refrescar el perfil global para actualizar sidebar
        await refreshGlobalProfile();
        await cargarPerfil();
    } catch (error) {
        mostrarAlertaError('Error al establecer contraseña', error.message);
        marcarErrorVisual(form, '#establecer-contrasena', '#establecer-contrasena-confirmar');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Handler: Cambiar Contraseña ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja el cambio de contraseña para cuentas que ya tienen una establecida.
 * Usa PATCH /users/id con el campo contrasena (la nueva) y validaciones profesionales.
 */
async function handleCambiarContrasena() {
    const form = document.getElementById('form-cambiar-contrasena');
    
    // Limpiar errores previos
    limpiarErrores(form);
    
    // Validación client-side con el mismo sistema que autenticación
    const { valido, errores } = validateForm(form, {
        '#cambiar-contrasena-actual': {
            required: true,
            requiredMsg: 'La contraseña actual es requerida',
        },
        '#cambiar-contrasena-nueva': {
            required: true,
            requiredMsg: 'La nueva contraseña es requerida',
            pattern: {
                regex: PASSWORD_REGEX,
                mensaje: 'La contraseña debe tener entre 8 y 20 caracteres, sin espacios, una mayúscula, una minúscula y un número',
            },
        },
        '#cambiar-contrasena-confirmar': {
            required: true,
            requiredMsg: 'Confirmar la nueva contraseña es requerido',
            match: '#cambiar-contrasena-nueva',
            matchMsg: 'Las contraseñas nuevas no coinciden',
        },
    });

    if (!valido) {
        mostrarAlertaError('Campos inválidos', errores.join('<br>'));
        return;
    }

    // Obtener valores validados
    const actual = document.getElementById('cambiar-contrasena-actual').value;
    const nueva = document.getElementById('cambiar-contrasena-nueva').value;

    // Validación adicional: la nueva contraseña debe ser diferente a la actual
    if (actual === nueva) {
        mostrarAlertaError('Error', 'La nueva contraseña debe ser diferente a la actual');
        marcarErrorVisual(form, '#cambiar-contrasena-nueva', '#cambiar-contrasena-confirmar');
        return;
    }

    try {
        const userId = parseInt(perfilUsuario.userId);
        await actualizarParcialUsuario(userId, { contrasena: nueva });
        closeModal('modal-cambiar-contrasena');
        form.reset();
        clearFormState(form);
        mostrarAlertaExito('Contraseña cambiada correctamente');
    } catch (error) {
        mostrarAlertaError('Error al cambiar contraseña', error.message);
        marcarErrorVisual(form, '#cambiar-contrasena-actual', '#cambiar-contrasena-nueva', '#cambiar-contrasena-confirmar');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Handler: Agregar Correo -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja la adición de un nuevo correo electrónico adicional.
 * Usa POST /correos-usuario con el correo en el body y validaciones profesionales.
 */
async function handleAgregarCorreo() {
    const form = document.getElementById('form-agregar-correo');
    
    // Limpiar errores previos
    limpiarErrores(form);
    
    // Validación client-side con el mismo sistema que autenticación
    const { valido, errores } = validateForm(form, {
        '#agregar-correo': {
            required: true,
            requiredMsg: 'El correo es requerido',
            pattern: {
                regex: EMAIL_REGEX,
                mensaje: 'Ingrese un correo electrónico válido',
            },
        },
    });

    if (!valido) {
        mostrarAlertaError('Campo inválido', errores.join('<br>'));
        return;
    }

    // Obtener valor validado
    const correo = document.getElementById('agregar-correo').value.trim();

    try {
        await agregarCorreo(correo);
        closeModal('modal-agregar-correo');
        form.reset();
        clearFormState(form);
        mostrarAlertaExito('Correo agregado exitosamente');
        await cargarCorreos();
    } catch (error) {
        mostrarAlertaError('Error al agregar correo', error.message);
        marcarErrorVisual(form, '#agregar-correo');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Handler: Eliminar Correo ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja la eliminación de un correo adicional con confirmación previa.
 * Usa DELETE /correos-usuario?id=X.
 * @param {number} idCorreo - ID del correo a eliminar
 */
async function handleEliminarCorreo(idCorreo) {
    // Mostrar diálogo de confirmación antes de eliminar
    const resultado = await Swal.fire({
        // Título del diálogo de confirmación
        title: '¿Eliminar este correo?',
        // Texto descriptivo de la acción
        text: 'Esta acción no se puede deshacer',
        // Icono de advertencia
        icon: 'warning',
        // Mostrar botón de cancelar
        showCancelButton: true,
        // Texto del botón de confirmar
        confirmButtonText: 'Sí, eliminar',
        // Texto del botón de cancelar
        cancelButtonText: 'Cancelar',
        // Clases CSS personalizadas para los botones
        customClass: {
            confirmButton: 'swal-btn swal-btn--confirmar',
            cancelButton: 'swal-btn swal-btn--cancelar',
        },
        // Desactivar estilos por defecto de SweetAlert2
        buttonsStyling: false,
    });

    // Si el usuario canceló, salir sin hacer nada
    if (!resultado.isConfirmed) return;

    try {
        // Enviar la solicitud de eliminación al backend
        await eliminarCorreo(idCorreo);
        // Mostrar notificación de éxito
        showNotification('Correo eliminado', 'success');
        // Recargar la lista de correos para reflejar la eliminación
        await cargarCorreos();
    } catch (error) {
        // Mostrar el error retornado por el backend
        mostrarAlertaError('Error al eliminar correo', error.message);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Handler: Agregar Teléfono ------------------------------------------ */
/* -------------------------------------------------------------------------- */

/**
 * Maneja la adición de un nuevo número telefónico.
 * Usa POST /numeros-usuario con el número en el body y validaciones profesionales.
 */
async function handleAgregarTelefono() {
    const form = document.getElementById('form-agregar-telefono');
    
    // Limpiar errores previos
    limpiarErrores(form);
    
    // Validación client-side con el mismo sistema que autenticación
    const { valido, errores } = validateForm(form, {
        '#agregar-telefono': {
            required: true,
            requiredMsg: 'El número de teléfono es requerido',
            pattern: {
                regex: TELEFONO_REGEX,
                mensaje: 'Ingrese un número de teléfono colombiano válido (10 dígitos)',
            },
        },
    });

    if (!valido) {
        mostrarAlertaError('Campo inválido', errores.join('<br>'));
        return;
    }

    // Obtener valor validado
    const numero = document.getElementById('agregar-telefono').value.trim();

    try {
        await agregarNumero(numero);
        closeModal('modal-agregar-telefono');
        form.reset();
        clearFormState(form);
        mostrarAlertaExito('Teléfono agregado exitosamente');
        await cargarNumeros();
    } catch (error) {
        mostrarAlertaError('Error al agregar teléfono', error.message);
        marcarErrorVisual(form, '#agregar-telefono');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Handler: Eliminar Número ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Maneja la eliminación de un número telefónico con confirmación previa.
 * Usa DELETE /numeros-usuario?id=X.
 * @param {number} idNumero - ID del número a eliminar
 */
async function handleEliminarNumero(idNumero) {
    // Mostrar diálogo de confirmación antes de eliminar
    const resultado = await Swal.fire({
        // Título del diálogo de confirmación
        title: '¿Eliminar este teléfono?',
        // Texto descriptivo de la acción
        text: 'Esta acción no se puede deshacer',
        // Icono de advertencia
        icon: 'warning',
        // Mostrar botón de cancelar
        showCancelButton: true,
        // Texto del botón de confirmar
        confirmButtonText: 'Sí, eliminar',
        // Texto del botón de cancelar
        cancelButtonText: 'Cancelar',
        // Clases CSS personalizadas para los botones
        customClass: {
            confirmButton: 'swal-btn swal-btn--confirmar',
            cancelButton: 'swal-btn swal-btn--cancelar',
        },
        // Desactivar estilos por defecto de SweetAlert2
        buttonsStyling: false,
    });

    // Si el usuario canceló, salir sin hacer nada
    if (!resultado.isConfirmed) return;

    try {
        // Enviar la solicitud de eliminación al backend
        await eliminarNumero(idNumero);
        // Mostrar notificación de éxito
        showNotification('Teléfono eliminado', 'success');
        // Recargar la lista de números para reflejar la eliminación
        await cargarNumeros();
    } catch (error) {
        // Mostrar el error retornado por el backend
        mostrarAlertaError('Error al eliminar teléfono', error.message);
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Utilidades --------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Formatea el nombre del rol para mostrarlo de forma legible.
 * Convierte el rol de la BD (ej: "SUPER_ADMIN") a un formato amigable (ej: "Super Admin").
 * @param {string} rol - Nombre del rol tal como viene del backend
 * @returns {string} Nombre del rol formateado para la interfaz
 */
function formatearRol(rol) {
    // Mapa de roles del backend a sus nombres legibles en la interfaz
    const roles = {
        'SUPER_ADMIN': 'Super Admin',
        'ADMIN': 'Administrador',
        'EMPLEADO': 'Empleado',
    };
    // Retornar el nombre legible del rol, o el original si no está en el mapa
    return roles[rol] || rol;
}
