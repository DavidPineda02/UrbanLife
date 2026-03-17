/* ========================================================================== */
/* ===== VALIDACIONES EN TIEMPO REAL PARA TODOS LOS MODALES =================== */
/* ========================================================================== */

/**
 * Sistema de validaciones en tiempo real para todos los formularios modales.
 * Aplica validaciones específicas según el tipo de dato y el campo.
 * 
 * Tipos de validación soportados:
 * - letras: Solo letras y espacios (nombres, apellidos)
 * - numeros: Solo números (precios, costos, stock, cantidades)
 * - telefono: Formato de teléfono
 * - correo: Formato de email
 * - texto: Texto general con longitud mínima/máxima
 * - select: Selección requerida
 */

/* ========================================================================== */
/* ----- CONFIGURACIÓN DE VALIDACIONES --------------------------------------- */
/* ========================================================================== */

const VALIDATION_RULES = {
    // Validaciones para campos de texto (solo letras, sin espacios)
    letras: {
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/,
        message: 'Solo se permiten letras',
        transform: (value) => value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '')
    },

    // Validaciones para nombres completos (letras y espacios)
    letrasEspacios: {
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        message: 'Solo se permiten letras y espacios',
        transform: (value) => value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    },
    
    // Validaciones para campos numéricos
    numeros: {
        pattern: /^\d*\.?\d*$/,
        message: 'Solo se permiten números',
        transform: (value) => value.replace(/[^0-9.]/g, '')
    },
    
    // Validaciones para números enteros
    numerosEnteros: {
        pattern: /^\d+$/,
        message: 'Solo se permiten números enteros',
        transform: (value) => value.replace(/[^0-9]/g, '')
    },
    
    // Validaciones para NIT colombiano (9 dígitos, guión opcional, 1 dígito verificador)
    nit: {
        pattern: /^\d{0,9}-?\d{0,1}$/,
        message: 'Formato: 9 dígitos y dígito verificador (ej: 900123456-1)',
        transform: (value) => value.replace(/[^\d-]/g, ''),
        validate: (value) => /^\d{9}-?\d{1}$/.test(value)
    },

    // Validaciones para teléfonos (7-10 dígitos colombianos)
    telefono: {
        pattern: /^[\d\s\-\(\)]+$/,
        message: 'El teléfono debe tener entre 7 y 10 dígitos',
        transform: (value) => value.replace(/[^\d\s\-\(\)]/g, ''),
        validate: (value) => {
            // Extraer solo los dígitos para validar la cantidad
            const soloDigitos = value.replace(/\D/g, '');
            // Verificar que tenga entre 7 y 10 dígitos
            return soloDigitos.length >= 7 && soloDigitos.length <= 10;
        }
    },
    
    // Validaciones para correos
    correo: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Formato de correo no válido',
        transform: (value) => value.toLowerCase().trim()
    },
    
    // Validaciones para texto general
    texto: {
        minLength: 2,
        maxLength: 255,
        message: 'Debe tener entre 2 y 255 caracteres',
        transform: (value) => value.trim()
    },
    
    // Validaciones para descripciones (textos largos)
    descripcion: {
        minLength: 0,
        maxLength: 1000,
        message: 'Máximo 1000 caracteres',
        transform: (value) => value.trim()
    },
    
    // Validaciones para fechas (no permite días pasados)
    fecha: {
        message: 'La fecha no puede ser anterior a hoy',
        validate: (value) => {
            if (!value) return true; // Permitir vacío si no es requerido

            // Parsear la fecha seleccionada como componentes locales (evita desfase UTC)
            const [anio, mes, dia] = value.split('-').map(Number);
            const ahora = new Date();

            // Comparar usando valores numéricos locales (YYYYMMDD) para evitar problemas de timezone
            const fechaSelNum = anio * 10000 + mes * 100 + dia;
            const fechaHoyNum = ahora.getFullYear() * 10000 + (ahora.getMonth() + 1) * 100 + ahora.getDate();
            const inicioAnioNum = ahora.getFullYear() * 10000 + 101;  // 1 de enero del año actual
            const finAnioNum = ahora.getFullYear() * 10000 + 1231;    // 31 de diciembre del año actual

            // Validar que no sea anterior a hoy y esté dentro del año actual
            return fechaSelNum >= fechaHoyNum && fechaSelNum >= inicioAnioNum && fechaSelNum <= finAnioNum;
        }
    }
};

/* ========================================================================== */
/* ----- FUNCIONES DE VALIDACIÓN -------------------------------------------- */
/* ========================================================================== */

/**
 * Aplica validación en tiempo real a un input específico.
 * @param {HTMLInputElement} input - Elemento input a validar
 * @param {string} validationType - Tipo de validación a aplicar
 * @param {Object} options - Opciones adicionales de validación
 */
function applyRealtimeValidation(input, validationType, options = {}) {
    // Obtener las reglas de validación
    const rules = { ...VALIDATION_RULES[validationType], ...options };
    
    // Agregar evento input para validación en tiempo real
    input.addEventListener('input', function(e) {
        const value = e.target.value;
        let isValid = true;
        let errorMessage = '';
        
        // Aplicar transformación si existe
        if (rules.transform && value !== '') {
            e.target.value = rules.transform(value);
        }
        
        // Validar patrón si existe
        if (rules.pattern && e.target.value !== '') {
            isValid = rules.pattern.test(e.target.value);
            errorMessage = rules.message;
        }
        
        // Validar con función personalizada si existe
        if (rules.validate && e.target.value !== '') {
            isValid = rules.validate(e.target.value);
            errorMessage = rules.message;
        }
        
        // Validar longitud si existe
        if (rules.minLength !== undefined && e.target.value.length < rules.minLength) {
            isValid = false;
            errorMessage = `Mínimo ${rules.minLength} caracteres`;
        }
        
        if (rules.maxLength !== undefined && e.target.value.length > rules.maxLength) {
            isValid = false;
            errorMessage = `Máximo ${rules.maxLength} caracteres`;
        }
        
        // Validar rango numérico si existe
        if (rules.min !== undefined && parseFloat(e.target.value) < rules.min) {
            isValid = false;
            errorMessage = `Valor mínimo: ${rules.min}`;
        }
        
        if (rules.max !== undefined && parseFloat(e.target.value) > rules.max) {
            isValid = false;
            errorMessage = `Valor máximo: ${rules.max}`;
        }
        
        // Para selects, validar que tenga valor seleccionado
        if (e.target.tagName === 'SELECT') {
            isValid = e.target.value !== '';
            errorMessage = isValid ? '' : 'Debe seleccionar una opción';
        }
        
        // Mostrar u ocultar mensaje de error
        showFieldError(e.target, isValid, errorMessage);
    });
    
    // Agregar evento blur para validación final
    input.addEventListener('blur', function(e) {
        // Forzar validación al salir del campo
        if (e.target.value !== '' || e.target.tagName === 'SELECT') {
            e.target.dispatchEvent(new Event('input'));
        }
    });
    
    // Agregar evento change para selects
    if (input.tagName === 'SELECT') {
        input.addEventListener('change', function(e) {
            e.target.dispatchEvent(new Event('input'));
        });
    }
}

/**
 * Muestra u oculta el mensaje de error para un campo.
 * @param {HTMLInputElement} input - Elemento input
 * @param {boolean} isValid - Si el campo es válido
 * @param {string} message - Mensaje de error
 */
function showFieldError(input, isValid, message) {
    // Buscar o crear contenedor de error
    let errorContainer = input.parentNode.querySelector('.field-error');
    
    if (!isValid && message) {
        // Crear contenedor de error si no existe
        if (!errorContainer) {
            errorContainer = document.createElement('span');
            errorContainer.className = 'field-error';
            errorContainer.style.cssText = `
                color: #e74c3c;
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: block;
                font-weight: 500;
            `;
            input.parentNode.appendChild(errorContainer);
        }
        
        // Mostrar mensaje de error
        errorContainer.textContent = message;
        input.style.borderColor = '#e74c3c';
        input.classList.add('error');
        input.classList.remove('valid');
        input.parentNode.classList.add('has-error');
        input.parentNode.classList.remove('has-success');
    } else {
        // Ocultar mensaje de error
        if (errorContainer) {
            errorContainer.remove();
        }
        
        // Si el campo tiene contenido y es válido, ponerlo en verde
        if (input.value.trim() !== '') {
            input.style.borderColor = '#27ae60';
            input.classList.add('valid');
            input.classList.remove('error');
            input.parentNode.classList.add('has-success');
            input.parentNode.classList.remove('has-error');
            
            // Agregar animación de pulse cuando se valida correctamente
            input.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        } else {
            // Si está vacío, quitar todos los estilos
            input.style.borderColor = '';
            input.classList.remove('valid', 'error');
            input.parentNode.classList.remove('has-success', 'has-error');
        }
    }
}

/**
 * Aplica validaciones a todos los inputs de un modal.
 * @param {HTMLElement} modal - Elemento modal
 */
function applyModalValidations(modal) {
    // Nombres completos con espacios (clientes y proveedores)
    modal.querySelectorAll('input[data-validation="letrasEspacios"]').forEach(input => {
        applyRealtimeValidation(input, 'letrasEspacios');
    });

    // Nombres y apellidos (solo letras, sin espacios)
    modal.querySelectorAll('input[data-validation="letras"], input[id*="nombre"]:not([data-validation="letrasEspacios"]), input[id*="apellido"]').forEach(input => {
        applyRealtimeValidation(input, 'letras');
    });
    
    // Campos numéricos (precios, costos, montos)
    modal.querySelectorAll('input[data-validation="numeros"], input[id*="precio"], input[id*="costo"], input[id*="monto"], input[id*="total"]').forEach(input => {
        applyRealtimeValidation(input, 'numeros', { min: 0 });
    });
    
    // Campos numéricos enteros (stock, cantidades)
    modal.querySelectorAll('input[data-validation="enteros"], input[id*="stock"], input[id*="cantidad"], input[type="number"]').forEach(input => {
        applyRealtimeValidation(input, 'numerosEnteros', { min: 0 });
    });
    
    // NIT colombiano
    modal.querySelectorAll('input[data-validation="nit"]').forEach(input => {
        applyRealtimeValidation(input, 'nit');
    });

    // Teléfonos
    modal.querySelectorAll('input[data-validation="telefono"], input[type="tel"], input[id*="telefono"]').forEach(input => {
        applyRealtimeValidation(input, 'telefono');
    });
    
    // Correos
    modal.querySelectorAll('input[data-validation="correo"], input[type="email"], input[id*="correo"], input[id*="email"]').forEach(input => {
        applyRealtimeValidation(input, 'correo');
    });
    
    // Texto general
    modal.querySelectorAll('input[data-validation="texto"], input[type="text"]:not([data-validation])').forEach(input => {
        applyRealtimeValidation(input, 'texto');
    });
    
    // Fechas (no permiten días pasados)
    modal.querySelectorAll('input[type="date"], input[data-validation="fecha"], input[id*="fecha"]').forEach(input => {
        // Obtener fecha local actual (evita desfase UTC de toISOString)
        const ahora = new Date();
        const anio = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        // Establecer fecha mínima como hoy en formato local YYYY-MM-DD
        const hoy = `${anio}-${mes}-${dia}`;
        input.setAttribute('min', hoy);

        // Establecer fecha máxima como 31 de diciembre del año actual
        const finAnio = `${anio}-12-31`;
        input.setAttribute('max', finAnio);
        
        // Aplicar validación personalizada
        applyRealtimeValidation(input, 'fecha');
        
        // Agregar evento change para validación inmediata
        input.addEventListener('change', function(e) {
            e.target.dispatchEvent(new Event('input'));
        });
    });
    
    // Descripciones y textareas
    modal.querySelectorAll('textarea[data-validation="descripcion"], textarea').forEach(textarea => {
        applyRealtimeValidation(textarea, 'descripcion');
    });
    
    // Selects requeridos
    modal.querySelectorAll('select[required], select[data-required]').forEach(select => {
        select.addEventListener('change', function(e) {
            const isValid = e.target.value !== '';
            showFieldError(e.target, isValid, isValid ? '' : 'Debe seleccionar una opción');
        });
    });
}

/* ========================================================================== */
/* ----- INICIALIZACIÓN AUTOMÁTICA ------------------------------------------- */
/* ========================================================================== */

/**
 * Inicializa las validaciones en tiempo real para todos los modales.
 */
function initializeRealtimeValidations() {
    // Observar cambios en el DOM para nuevos modales
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                // Si se agregó un modal, aplicar validaciones
                if (node.nodeType === 1 && node.classList && node.classList.contains('modal')) {
                    applyModalValidations(node);
                }
                
                // Si se agregaron nodos, buscar modales dentro
                if (node.nodeType === 1) {
                    const modals = node.querySelectorAll ? node.querySelectorAll('.modal') : [];
                    modals.forEach(modal => applyModalValidations(modal));
                }
            });
        });
    });
    
    // Iniciar observación del body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Aplicar validaciones a modales existentes
    document.querySelectorAll('.modal').forEach(modal => {
        applyModalValidations(modal);
    });
}

/* ========================================================================== */
/* ----- EXPORTACIONES ------------------------------------------------------- */
/* ========================================================================== */

// Exportar funciones para uso manual si es necesario
export {
    applyRealtimeValidation,
    applyModalValidations,
    showFieldError,
    initializeRealtimeValidations
};

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeRealtimeValidations);
