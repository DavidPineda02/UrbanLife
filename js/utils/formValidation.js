/* ========================================================================== */
/* ===== VALIDACIÓN DE FORMULARIOS ========================================== */
/* ========================================================================== */

/**
 * Sistema de validación del lado del cliente.
 * - Reglas integradas: required, email, minLength, number, match
 * - Retroalimentación visual: borde rojo/verde + mensaje de error
 * - Validación por campo individual o formulario completo
 */

/* -------------------------------------------------------------------------- */
/* ----- Mensajes de Error por Defecto -------------------------------------- */
/* -------------------------------------------------------------------------- */

const MENSAJES = {
    required: 'Este campo es obligatorio',
    email: 'Ingrese un email válido',
    minLength: (min) => `Mínimo ${min} caracteres`,
    number: 'Ingrese un número válido',
    match: 'Los campos no coinciden',
    phone: 'Ingrese un teléfono válido'
};

/* -------------------------------------------------------------------------- */
/* ----- Validar un Campo Individual ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Valida un campo de formulario según las reglas proporcionadas.
 * @param {HTMLInputElement} input - El campo a validar
 * @param {Object} reglas - Objeto con reglas de validación
 * @returns {boolean} true si es válido
 * 
 * Ejemplo de reglas:
 * { required: true, email: true, minLength: 6, match: '#confirmar-password' }
 */
export function validateField(input, reglas = {}) {
    const valor = input.value.trim();
    let error = '';

    /* ===== Regla: required ===== */
    if (reglas.required && valor === '') {
        error = reglas.requiredMsg || MENSAJES.required;
    }

    /* ===== Regla: email ===== */
    if (!error && reglas.email && valor !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(valor)) {
            error = MENSAJES.email;
        }
    }

    /* ===== Regla: minLength ===== */
    if (!error && reglas.minLength && valor !== '') {
        if (valor.length < reglas.minLength) {
            error = MENSAJES.minLength(reglas.minLength);
        }
    }

    /* ===== Regla: number ===== */
    if (!error && reglas.number && valor !== '') {
        if (isNaN(Number(valor)) || valor === '') {
            error = MENSAJES.number;
        }
    }

    /* ===== Regla: match (comparar con otro campo) ===== */
    if (!error && reglas.match && valor !== '') {
        const otroInput = document.querySelector(reglas.match);
        if (otroInput && valor !== otroInput.value.trim()) {
            error = reglas.matchMsg || MENSAJES.match;
        }
    }

    /* ===== Regla: phone ===== */
    if (!error && reglas.phone && valor !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;
        if (!phoneRegex.test(valor)) {
            error = MENSAJES.phone;
        }
    }

    /* Aplicar retroalimentación visual */
    if (error) {
        setFieldError(input, error);
        return false;
    } else {
        setFieldValid(input);
        return true;
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Validar Formulario Completo ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Valida todos los campos de un formulario.
 * @param {HTMLFormElement} form - El formulario a validar
 * @param {Object} reglasMap - Map de selector → reglas
 * @returns {boolean} true si todos los campos son válidos
 * 
 * Ejemplo:
 * validateForm(form, {
 *   '#email': { required: true, email: true },
 *   '#password': { required: true, minLength: 6 }
 * })
 */
export function validateForm(form, reglasMap) {
    let esValido = true;

    for (const [selector, reglas] of Object.entries(reglasMap)) {
        const input = form.querySelector(selector);
        if (input) {
            const campoValido = validateField(input, reglas);
            if (!campoValido) esValido = false;
        }
    }

    return esValido;
}

/* -------------------------------------------------------------------------- */
/* ----- Aplicar Estado de Error -------------------------------------------- */
/* -------------------------------------------------------------------------- */

function setFieldError(input, mensaje) {
    /* Remover estado previo */
    clearFieldState(input);

    /* Aplicar clase de error */
    input.classList.add('formulario__input--error');

    /* Crear mensaje de error */
    const errorEl = document.createElement('span');
    errorEl.className = 'formulario__error';
    errorEl.textContent = mensaje;

    /* Insertar después del input */
    input.parentNode.insertBefore(errorEl, input.nextSibling);
}

/* -------------------------------------------------------------------------- */
/* ----- Aplicar Estado Válido ---------------------------------------------- */
/* -------------------------------------------------------------------------- */

function setFieldValid(input) {
    /* Remover estado previo */
    clearFieldState(input);

    /* Solo mostrar válido si el campo tiene contenido */
    if (input.value.trim() !== '') {
        input.classList.add('formulario__input--valido');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Limpiar Estado de un Campo ----------------------------------------- */
/* -------------------------------------------------------------------------- */

export function clearFieldState(input) {
    input.classList.remove('formulario__input--error', 'formulario__input--valido');

    /* Remover mensaje de error existente */
    const errorExistente = input.parentNode.querySelector('.formulario__error');
    if (errorExistente) {
        errorExistente.remove();
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Limpiar Todos los Estados de un Formulario ------------------------- */
/* -------------------------------------------------------------------------- */

export function clearFormState(form) {
    const inputs = form.querySelectorAll('.formulario__input--error, .formulario__input--valido');
    inputs.forEach(input => clearFieldState(input));
}

/* -------------------------------------------------------------------------- */
/* ----- Fuerza de Contraseña ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Evalúa la fuerza de una contraseña.
 * @param {string} password - La contraseña a evaluar
 * @returns {Object} { nivel: 'debil'|'medio'|'fuerte', porcentaje: 0-100, color: string }
 */
export function evaluarFuerzaPassword(password) {
    let puntos = 0;

    if (password.length >= 6) puntos++;
    if (password.length >= 10) puntos++;
    if (/[A-Z]/.test(password)) puntos++;
    if (/[0-9]/.test(password)) puntos++;
    if (/[^A-Za-z0-9]/.test(password)) puntos++;

    if (puntos <= 2) {
        return { nivel: 'Débil', porcentaje: 33, color: 'var(--color-egreso)' };
    } else if (puntos <= 3) {
        return { nivel: 'Media', porcentaje: 66, color: 'var(--color-ganancia)' };
    } else {
        return { nivel: 'Fuerte', porcentaje: 100, color: 'var(--color-ingreso)' };
    }
}
