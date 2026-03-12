/* ========================================================================== */
/* ===== PATRONES DE VALIDACIÓN GLOBALES ==================================== */
/* ========================================================================== */

/**
 * Patrones de validación centralizados para toda la aplicación.
 * Exporta todos los regex utilizados en formularios de autenticación y perfil.
 * Mantiene consistencia entre frontend y backend.
 */

/* -------------------------------------------------------------------------- */
/* ----- Patrones de Texto -------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Solo letras (incluye acentos y ñ), sin espacios ni números */
export const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+$/;

/** Letras y espacios (para nombres completos que permiten espacios) */
export const NOMBRE_COMPLETO_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;

/* -------------------------------------------------------------------------- */
/* ----- Patrones de Contraseña --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** 8-20 chars, al menos una mayúscula, una minúscula, un dígito, sin espacios */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{8,20}$/;

/** Contraseña simple (mínimo 6 caracteres) */
export const PASSWORD_SIMPLE_REGEX = /.{6,}/;

/* -------------------------------------------------------------------------- */
/* ----- Patrones de Email -------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Regex para validar formato de email (mismo que backend) */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/;

/** Regex simple para validación visual rápida */
export const EMAIL_SIMPLE_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* -------------------------------------------------------------------------- */
/* ----- Patrones de Teléfono ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Regex para validar números de teléfono colombianos (exactamente 10 dígitos, sin espacios ni caracteres especiales) */
export const TELEFONO_REGEX = /^3[0-9]{9}$/;

/** Regex flexible para teléfonos internacionales */
export const TELEFONO_INTERNACIONAL_REGEX = /^\+?[1-9][0-9]{7,14}$/;

/* -------------------------------------------------------------------------- */
/* ----- Patrones de Documentos --------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Cédula colombiana (8-10 dígitos) */
export const CEDULA_REGEX = /^[0-9]{8,10}$/;

/** NIT colombiano (9 dígitos) */
export const NIT_REGEX = /^[0-9]{9}$/;

/* -------------------------------------------------------------------------- */
/* ----- Patrones Numéricos ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/** Solo números positivos */
export const NUMERO_POSITIVO_REGEX = /^[0-9]+$/;

/** Números decimales (para precios, costos) */
export const DECIMAL_REGEX = /^[0-9]+(\.[0-9]{1,2})?$/;

/* -------------------------------------------------------------------------- */
/* ----- Patrones de Direcciones -------------------------------------------- */
/* -------------------------------------------------------------------------- */

/** Dirección básica (permite letras, números, espacios, #, -, y caracteres comunes) */
export const DIRECCION_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s\#\-\.]+$/;

/* -------------------------------------------------------------------------- */
/* ----- Patrones Especiales ------------------------------------------------ */
/* -------------------------------------------------------------------------- */

/** Para códigos alfanuméricos */
export const CODIGO_REGEX = /^[A-Z0-9]{3,10}$/;

/** Para URLs */
export const URL_REGEX = /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}/;
