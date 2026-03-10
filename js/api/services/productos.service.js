/**
 * productos.service.js
 * -------------------------------------------------
 * Servicio de gestión de productos.
 *
 * Funciones a implementar:
 *  - obtenerProductos()                → GET    /productos
 *  - obtenerProductoPorId(id)          → GET    /productos/id?id=X
 *  - crearProducto(datos)              → POST   /productos
 *  - actualizarProducto(id, datos)     → PUT    /productos/id?id=X
 *  - eliminarProducto(id)              → DELETE /productos/id?id=X  (soft delete)
 *
 * Modelo Producto (referencia backend):
 *  - idProducto, nombre, descripcion
 *  - precioVenta, costoPromedio
 *  - stock, estado
 *  - categoriaId (FK → Categoría)
 *
 * Importa desde:
 *  - '../client.js'
 *  - '../endpoints.js'
 */
