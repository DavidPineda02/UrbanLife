/* ========================================================================== */
/* ===== RENDERIZADO DINÁMICO DE GRÁFICAS =================================== */
/* ========================================================================== */

/**
 * Utilidades para animar gráficas CSS del dashboard.
 * - Contadores animados con easing
 * - Barras que crecen de 0 a su valor
 * - Gráfica de pastel con conic-gradient dinámico
 * - Tooltips interactivos en gráficas
 * - Intersection Observer para animar al hacer scroll
 */

/* -------------------------------------------------------------------------- */
/* ----- Animar Contadores -------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Anima valores numéricos de 0 hasta su valor final.
 * @param {string} selector - Selector CSS de los elementos con data-valor
 * @param {number} duracion - Duración de la animación en ms (default: 1500)
 * 
 * HTML esperado: <p class="tarjeta__valor" data-valor="450000">$ 0</p>
 */
export function animateCounters(selector = '[data-valor]', duracion = 1500) {
    const elementos = document.querySelectorAll(selector);

    elementos.forEach(el => {
        const valorFinal = parseFloat(el.getAttribute('data-valor')) || 0;
        const prefijo = el.getAttribute('data-prefijo') || '';
        const sufijo = el.getAttribute('data-sufijo') || '';
        const decimales = parseInt(el.getAttribute('data-decimales')) || 0;
        const inicio = performance.now();

        function actualizar(ahora) {
            const progreso = Math.min((ahora - inicio) / duracion, 1);

            /* Easing: ease-out cubic */
            const eased = 1 - Math.pow(1 - progreso, 3);
            const valorActual = valorFinal * eased;

            /* Formatear con separadores de miles */
            el.textContent = prefijo + formatearNumero(valorActual, decimales) + sufijo;

            if (progreso < 1) {
                requestAnimationFrame(actualizar);
            }
        }

        requestAnimationFrame(actualizar);
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Animar Barras de Gráfica ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Anima las barras de una gráfica de 0% a su valor real.
 * @param {string} contenedorSelector - Selector del contenedor de barras
 * @param {number} duracion - Duración de la animación en ms
 * 
 * HTML esperado: <div class="barra" data-altura="75" style="height: 0%"></div>
 */
export function animateBarChart(contenedorSelector, duracion = 1000) {
    const contenedor = document.querySelector(contenedorSelector);
    if (!contenedor) return;

    const barras = contenedor.querySelectorAll('[data-altura]');
    const inicio = performance.now();

    barras.forEach((barra, index) => {
        const alturaFinal = parseFloat(barra.getAttribute('data-altura')) || 0;

        /* Delay escalonado por barra para efecto cascada */
        const delay = index * 100;

        setTimeout(() => {
            const inicioAnimacion = performance.now();

            function actualizar(ahora) {
                const progreso = Math.min((ahora - inicioAnimacion) / duracion, 1);
                const eased = 1 - Math.pow(1 - progreso, 3);

                barra.style.height = (alturaFinal * eased) + '%';

                if (progreso < 1) {
                    requestAnimationFrame(actualizar);
                }
            }

            requestAnimationFrame(actualizar);
        }, delay);
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Animar Gráfica de Pastel ------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Construye y anima un conic-gradient para gráfica de pastel.
 * @param {string} selector - Selector del elemento de la gráfica
 * @param {Array} datos - Array de { valor, color }
 * 
 * Ejemplo de datos: [
 *   { valor: 40, color: '#00b894' },
 *   { valor: 30, color: '#3498db' },
 *   { valor: 30, color: '#f39c12' }
 * ]
 */
export function animatePieChart(selector, datos) {
    const elemento = document.querySelector(selector);
    if (!elemento) return;

    const total = datos.reduce((sum, d) => sum + d.valor, 0);
    const duracion = 1200;
    const inicio = performance.now();

    function actualizar(ahora) {
        const progreso = Math.min((ahora - inicio) / duracion, 1);
        const eased = 1 - Math.pow(1 - progreso, 3);

        let gradiente = '';
        let acumulado = 0;

        datos.forEach((d, i) => {
            const porcentaje = (d.valor / total) * 100 * eased;
            const inicioSlice = acumulado;
            acumulado += porcentaje;

            if (i > 0) gradiente += ', ';
            gradiente += `${d.color} ${inicioSlice}% ${acumulado}%`;
        });

        /* Completar hasta 100% con gris */
        if (acumulado < 100) {
            gradiente += `, #e0e0e0 ${acumulado}% 100%`;
        }

        elemento.style.background = `conic-gradient(${gradiente})`;

        if (progreso < 1) {
            requestAnimationFrame(actualizar);
        }
    }

    requestAnimationFrame(actualizar);
}

/* -------------------------------------------------------------------------- */
/* ----- Animar Insignias de Porcentaje -------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Agrega una animación de pulso a las insignias de porcentaje.
 * @param {string} selector - Selector de las insignias
 */
export function animateBadges(selector = '.tarjeta__insignia') {
    const insignias = document.querySelectorAll(selector);

    insignias.forEach((badge, index) => {
        badge.style.opacity = '0';
        badge.style.transform = 'scale(0.5)';
        badge.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

        setTimeout(() => {
            badge.style.opacity = '1';
            badge.style.transform = 'scale(1)';
        }, 300 + index * 150);
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Tooltips en Gráficas ----------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Agrega tooltips interactivos a elementos de gráficas.
 * @param {string} contenedorSelector - Selector del contenedor
 * @param {string} elementoSelector - Selector de los elementos con datos
 * 
 * HTML esperado: <div class="barra" data-tooltip="Lunes: $120.000"></div>
 */
export function addChartTooltips(contenedorSelector, elementoSelector = '[data-tooltip]') {
    const contenedor = document.querySelector(contenedorSelector);
    if (!contenedor) return;

    const elementos = contenedor.querySelectorAll(elementoSelector);
    let tooltipEl = null;

    elementos.forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const texto = el.getAttribute('data-tooltip');
            if (!texto) return;

            /* Crear tooltip */
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'grafica__tooltip';
            tooltipEl.textContent = texto;
            document.body.appendChild(tooltipEl);

            /* Posicionar tooltip */
            posicionarTooltip(tooltipEl, e);
        });

        el.addEventListener('mousemove', (e) => {
            if (tooltipEl) posicionarTooltip(tooltipEl, e);
        });

        el.addEventListener('mouseleave', () => {
            if (tooltipEl) {
                tooltipEl.remove();
                tooltipEl = null;
            }
        });
    });
}

/* -------------------------------------------------------------------------- */
/* ----- Posicionar Tooltip ------------------------------------------------- */
/* -------------------------------------------------------------------------- */

function posicionarTooltip(tooltip, evento) {
    const offset = 12;
    tooltip.style.left = evento.pageX + offset + 'px';
    tooltip.style.top = evento.pageY - offset - tooltip.offsetHeight + 'px';
}

/* -------------------------------------------------------------------------- */
/* ----- Intersection Observer para Animaciones ----------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Ejecuta un callback cuando un elemento entra en el viewport.
 * Útil para disparar animaciones de gráficas al hacer scroll.
 * @param {string} selector - Selector del elemento a observar
 * @param {Function} callback - Función a ejecutar cuando sea visible
 * @param {Object} opciones - Opciones del IntersectionObserver
 */
export function onVisible(selector, callback, opciones = { threshold: 0.2 }) {
    const elemento = document.querySelector(selector);
    if (!elemento) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, opciones);

    observer.observe(elemento);
}

/* -------------------------------------------------------------------------- */
/* ----- Formatear Número con Separadores ----------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * Formatea un número con separadores de miles (punto).
 * @param {number} num - Número a formatear
 * @param {number} decimales - Cantidad de decimales
 * @returns {string} Número formateado
 */
export function formatearNumero(num, decimales = 0) {
    return num.toFixed(decimales).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
