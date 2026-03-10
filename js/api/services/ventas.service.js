/**
 * ventas.service.js
 * -------------------------------------------------
 * Servicio de gestión de ventas y sus detalles.
 *
 * Funciones a implementar:
 *  - obtenerVentas()                   → GET  /ventas
 *  - obtenerVentaPorId(id)             → GET  /ventas/id?id=X
 *  - crearVenta(datos)                 → POST /ventas         → incluye DetalleVenta[]
 *  - actualizarVenta(id, datos)        → PUT  /ventas/id?id=X
 *
 * Modelo Venta (referencia backend):
 *  - idVenta, clienteId (FK), usuarioId (FK)
 *  - fechaVenta, estado, total
 *
 * Modelo DetalleVenta:
 *  - idDetalleVenta, ventaId (FK), productoId (FK)
 *  - cantidad, precioUnitario
 *
 * Importa desde:
 *  - '../client.js'
 *  - '../endpoints.js'
 */
