/* ========================================================================== */
/* ===== VALIDACIÓN DE FORMULARIOS ========================================== */
/* ========================================================================== */

/**
 * Sistema de validación del lado del cliente.
 * - Reglas integradas: required, email, minLength, number, match, phone
 * - Retroalimentación visual: borde rojo/verde en el input
 * - validateForm retorna { valido, errores[] } para mostrar mensajes en alertas
 */

/* -------------------------------------------------------------------------- */
/* ----- Mensajes de Error por Defecto -------------------------------------- */
/* -------------------------------------------------------------------------- */

const MENSAJES = {
    required:  'Este campo es obligatorio',
    email:     'Ingrese un email válido',
    minLength: (min) => `Mínimo ${min} caracteres`,
    number:    'Ingrese un número válido',
    match:     'Los campos no coinciden',
    phone:     'Ingrese un teléfono válido',
};

/* -------------------------------------------------------------------------- */
/* ----- Lógica Interna de Validación --------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Evalúa un campo contra sus reglas y retorna el mensaje de error, o '' si es válido.
 * Función interna reutilizada por validateField y validateForm.
 * @param {HTMLInputElement} input
 * @param {Object} reglas
 * @returns {string} Mensaje de error, o '' si el campo es válido
 */
function _getFieldError(input, reglas = {}) {
    const valor = input.value.trim();

    if (reglas.required && valor === '') {
        return reglas.requiredMsg || MENSAJES.required;
    }

    if (reglas.email && valor !== '') {
        /* Mismo patrón que el backend (AuthService.java):
         *  - Local: letras, números, . _ % + -
         *  - Dominio: empieza con alfanumérico (no punto), puede tener . y -
         *  - TLD: mínimo 2 letras
         * Invalida: @gmail (sin TLD), @.co (dominio vacío), @gmail. (TLD vacío) */
        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(valor)) return MENSAJES.email;
    }

    if (reglas.minLength && valor !== '') {
        if (valor.length < reglas.minLength) return MENSAJES.minLength(reglas.minLength);
    }

    if (reglas.number && valor !== '') {
        if (isNaN(Number(valor))) return MENSAJES.number;
    }

    if (reglas.pattern && valor !== '') {
        const regex = reglas.pattern instanceof RegExp
            ? reglas.pattern
            : new RegExp(reglas.pattern.regex);
        const mensaje = reglas.pattern.mensaje || 'Formato no válido';
        if (!regex.test(valor)) return mensaje;
    }

    if (reglas.match && valor !== '') {
        const otroInput = document.querySelector(reglas.match);
        if (otroInput && valor !== otroInput.value.trim()) {
            return reglas.matchMsg || MENSAJES.match;
        }
    }

    if (reglas.phone && valor !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;
        if (!phoneRegex.test(valor)) return MENSAJES.phone;
    }

    return '';
}

/* -------------------------------------------------------------------------- */
/* ----- Validar un Campo Individual ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Valida un campo individual y aplica el estado visual.
 * @param {HTMLInputElement} input - El campo a validar
 * @param {Object} reglas - Reglas de validación
 * @returns {boolean} true si es válido
 *
 * Ejemplo de reglas:
 * { required: true, email: true, minLength: 6, match: '#confirmar-password' }
 */
export function validateField(input, reglas = {}) {
    const error = _getFieldError(input, reglas);

    if (error) {
        setFieldError(input);
        return false;
    }

    setFieldValid(input);
    return true;
}

/* -------------------------------------------------------------------------- */
/* ----- Validar Formulario Completo ---------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Valida todos los campos de un formulario.
 * @param {HTMLFormElement} form      - El formulario a validar
 * @param {Object}          reglasMap - Map de selector → reglas
 * @returns {{ valido: boolean, errores: string[] }}
 *   valido  → true si todos los campos son correctos
 *   errores → lista de mensajes "Label: motivo" para mostrar en una alerta
 *
 * Ejemplo:
 * const { valido, errores } = validateForm(form, {
 *   '#email':    { required: true, email: true },
 *   '#password': { required: true, minLength: 6 }
 * });
 */
export function validateForm(form, reglasMap) {
    let valido = true;
    const errores = [];

    for (const [selector, reglas] of Object.entries(reglasMap)) {
        const input = form.querySelector(selector);
        if (!input) continue;

        const error = _getFieldError(input, reglas);

        if (error) {
            valido = false;
            setFieldError(input);

            /* Obtener el nombre del campo desde su <label> para el mensaje */
            const label = form.querySelector(`label[for="${input.id}"]`);
            const nombreCampo = label
                ? label.textContent.trim()
                : (input.placeholder || input.id || 'Campo');

            errores.push(`<b>${nombreCampo}:</b> ${error}`);
        } else {
            setFieldValid(input);
        }
    }

    return { valido, errores };
}

/* -------------------------------------------------------------------------- */
/* ----- Aplicar Estado de Error -------------------------------------------- */
/* -------------------------------------------------------------------------- */

function setFieldError(input) {
    clearFieldState(input);
    input.classList.add('formulario__input--error');
}

/* -------------------------------------------------------------------------- */
/* ----- Aplicar Estado Válido ---------------------------------------------- */
/* -------------------------------------------------------------------------- */

function setFieldValid(input) {
    clearFieldState(input);
    if (input.value.trim() !== '') {
        input.classList.add('formulario__input--valido');
    }
}

/* -------------------------------------------------------------------------- */
/* ----- Limpiar Estado de un Campo ----------------------------------------- */
/* -------------------------------------------------------------------------- */

export function clearFieldState(input) {
    input.classList.remove('formulario__input--error', 'formulario__input--valido');
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
 * @param {string} password
 * @returns {{ nivel: string, porcentaje: number, color: string }}
 */
export function evaluarFuerzaPassword(password) {
    let puntos = 0;

    if (password.length >= 6)       puntos++;
    if (password.length >= 10)      puntos++;
    if (/[A-Z]/.test(password))     puntos++;
    if (/[0-9]/.test(password))     puntos++;
    if (/[^A-Za-z0-9]/.test(password)) puntos++;

    if (puntos <= 2) return { nivel: 'Débil',  porcentaje: 33,  color: 'var(--color-egreso)'   };
    if (puntos <= 3) return { nivel: 'Media',  porcentaje: 66,  color: 'var(--color-ganancia)' };
    return              { nivel: 'Fuerte', porcentaje: 100, color: 'var(--color-ingreso)'  };
}
