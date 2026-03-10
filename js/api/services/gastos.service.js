/**
 * gastos.service.js
 * -------------------------------------------------
 * Servicio de gestión de gastos adicionales y movimientos financieros.
 *
 * Funciones a implementar:
 *  - obtenerGastos()                   → GET    /gastos
 *  - obtenerGastoPorId(id)             → GET    /gastos/id?id=X
 *  - crearGasto(datos)                 → POST   /gastos
 *  - actualizarGasto(id, datos)        → PUT    /gastos/id?id=X
 *  - eliminarGasto(id)                 → DELETE /gastos/id?id=X
 *
 * Modelos relacionados (referencia backend):
 *  - GastoAdicional: idGasto, descripcion, monto, tipoGastoId (FK)
 *  - TipoGasto: idTipoGasto, nombre
 *  - MovimientoFinanciero: idMovimiento, tipo, monto, fecha, referencia
 *
 * Importa desde:
 *  - '../client.js'
 *  - '../endpoints.js'
 */
