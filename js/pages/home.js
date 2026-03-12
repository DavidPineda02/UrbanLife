/* ========================================================================== */
/* ===== PÁGINA DE INICIO (DASHBOARD) ======================================= */
/* ========================================================================== */

/**
 * Asigna propiedades CSS personalizadas (custom properties) a los elementos
 * de las gráficas del dashboard, leyendo los valores desde data attributes.
 * Esto permite que las barras y elementos se rendericen con sus dimensiones reales.
 */

/* Asignar --altura-barra a cada elemento con data-altura (barras verticales) */
document.querySelectorAll('[data-altura]').forEach(barra => {
    barra.style.setProperty('--altura-barra', barra.dataset.altura); // Altura desde el atributo
});

/* Asignar --ancho a cada elemento con data-ancho (barras horizontales) */
document.querySelectorAll('[data-ancho]').forEach(barra => {
    barra.style.setProperty('--ancho', barra.dataset.ancho); // Ancho desde el atributo
});

/* Asignar --ancho-barra a cada elemento con data-ancho-barra (variante de barras) */
document.querySelectorAll('[data-ancho-barra]').forEach(barra => {
    barra.style.setProperty('--ancho-barra', barra.dataset.anchoBarra); // Ancho alternativo
});
