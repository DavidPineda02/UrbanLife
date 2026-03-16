/* ========================================================================== */
/* ===== PUNTO DE ENTRADA PRINCIPAL ========================================= */
/* ========================================================================== */

/**
 * Inicializa los sistemas globales de la aplicación SPA al cargar el DOM.
 * Se ejecuta una sola vez cuando se carga app.html.
 * El router se encarga de cargar las vistas dinámicamente.
 */

import { initModals } from './utils/modal.js';   // Sistema de modales
import { initAlerts } from './utils/alerts.js';   // Sistema de alertas SweetAlert2
import { initGlobalProfile } from './utils/globalProfile.js';  // Perfil global del usuario
import { initializeRealtimeValidations } from './utils/realtimeValidations.js';  // Validaciones en tiempo real
import { initRouter } from './router.js';          // Router SPA para navegación sin recarga

/* Esperar a que el DOM esté completamente cargado */
document.addEventListener('DOMContentLoaded', async () => {
    initModals();   // Conectar disparadores de modales (data-modal-open, data-modal-close)
    initAlerts();   // Conectar botones con data-swal-ok y data-swal-delete
    await initGlobalProfile();  // Cargar y mostrar datos del usuario en sidebar
    initializeRealtimeValidations();  // Inicializar validaciones en tiempo real para todos los modales
    await initRouter();  // Iniciar el router SPA y cargar la vista inicial
});
