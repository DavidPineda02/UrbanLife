/**
 * usuarios.service.js
 * -------------------------------------------------
 * Servicio de gestión de usuarios.
 *
 * Funciones a implementar:
 *  - obtenerUsuarios()                 → GET   /users               → roles: SUPER_ADMIN, ADMIN
 *  - obtenerUsuarioPorId(id)           → GET   /users/id?id=X       → roles: todos (EMPLEADO solo el propio)
 *  - actualizarUsuario(id, datos)      → PUT   /users/id?id=X       → actualización completa
 *  - actualizarParcialUsuario(id, datos) → PATCH /users/id?id=X     → actualización parcial
 *
 * Notas:
 *  - Todos los endpoints requieren JWT en el header Authorization
 *  - EMPLEADO solo puede ver/editar su propio perfil
 *  - No hay DELETE, el backend usa soft delete (campo 'estado')
 *
 * Importa desde:
 *  - '../client.js'
 *  - '../endpoints.js'
 */
