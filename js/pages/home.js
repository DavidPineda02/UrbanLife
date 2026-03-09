document.querySelectorAll('[data-altura]').forEach(el => {
    el.style.setProperty('--altura-barra', el.dataset.altura);
});

document.querySelectorAll('[data-ancho]').forEach(el => {
    el.style.setProperty('--ancho', el.dataset.ancho);
});

document.querySelectorAll('[data-ancho-barra]').forEach(el => {
    el.style.setProperty('--ancho-barra', el.dataset.anchoBarra);
});
