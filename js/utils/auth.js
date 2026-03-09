/* ========================================================================== */
/* ===== FUNCIONALIDAD DE AUTENTICACIÓN ===================================== */
/* ========================================================================== */

/**
 * Activa el toggle de mostrar/ocultar contraseña.
 * Busca todos los íconos .formulario__icono dentro de .formulario__campo--password.
 */
export function initPasswordToggle() {
    document.querySelectorAll('.formulario__icono').forEach(icon => {
        icon.addEventListener('click', () => {
            const container = icon.closest('.formulario__campo--password');
            const input = container.querySelector('.formulario__campo');
            const isPassword = input.type === 'password';

            input.type = isPassword ? 'text' : 'password';
            icon.classList.toggle('fa-eye',       !isPassword);
            icon.classList.toggle('fa-eye-slash',  isPassword);
        });
    });
}
