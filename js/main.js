/* ========================================================================== */
/* ===== PUNTO DE ENTRADA PRINCIPAL ========================================= */
/* ========================================================================== */

/**
 * Inicializa los sistemas globales de la aplicación al cargar el DOM.
 * Se ejecuta en todas las páginas que importen este archivo.
 */

import { initModals } from './utils/modal.js';   // Sistema de modales
import { initAlerts } from './utils/alerts.js';   // Sistema de alertas SweetAlert2
import { initGlobalProfile } from './utils/globalProfile.js';  // Perfil global del usuario

/* Esperar a que el DOM esté completamente cargado */
document.addEventListener('DOMContentLoaded', async () => {
    initModals();   // Conectar disparadores de modales (data-modal-open, data-modal-close)
    initAlerts();   // Conectar botones con data-swal-ok y data-swal-delete
    await initGlobalProfile();  // Cargar y mostrar datos del usuario en sidebar
});
