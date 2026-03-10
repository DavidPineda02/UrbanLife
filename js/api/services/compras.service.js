/**
 * compras.service.js
 * -------------------------------------------------
 * Servicio de gestión de compras a proveedores y sus detalles.
 *
 * Funciones a implementar:
 *  - obtenerCompras()                  → GET  /compras
 *  - obtenerCompraPorId(id)            → GET  /compras/id?id=X
 *  - crearCompra(datos)                → POST /compras        → incluye DetalleCompra[]
 *  - actualizarCompra(id, datos)       → PUT  /compras/id?id=X
 *
 * Modelo Compra (referencia backend):
 *  - idCompra, proveedorId (FK), usuarioId (FK)
 *  - fechaCompra, estado, total
 *
 * Modelo DetalleCompra:
 *  - idDetalleCompra, compraId (FK), productoId (FK)
 *  - cantidad, precioUnitario
 *
 * Importa desde:
 *  - '../client.js'
 *  - '../endpoints.js'
 */
