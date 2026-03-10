/* ========================================================================== */
/* ===== FUNCIONALIDAD DE AUTENTICACIÓN ===================================== */
/* ========================================================================== */

/**
 * Activa el toggle de mostrar/ocultar contraseña.
 * Itera por cada contenedor .formulario__campo--password de forma independiente.
 *
 * Estado:
 *  - type='password' + fa-eye-slash  → contraseña oculta  (icono: ojo tachado)
 *  - type='text'     + fa-eye        → contraseña visible (icono: ojo abierto)
 */
export function initPasswordToggle() {
    document.querySelectorAll('.formulario__campo--password').forEach(container => {
        const icon  = container.querySelector('.formulario__icono');
        const input = container.querySelector('.formulario__campo');

        if (!icon || !input) return;

        icon.addEventListener('click', () => {
            const isPassword = input.type === 'password';

            /* Cambiar tipo del input */
            input.type = isPassword ? 'text' : 'password';

            /* Remover ambas clases primero para evitar que FA renderice dos iconos */
            icon.classList.remove('fa-eye', 'fa-eye-slash');

            /* Agregar solo la clase correcta según el nuevo estado */
            icon.classList.add(isPassword ? 'fa-eye' : 'fa-eye-slash');
        });
    });
}
