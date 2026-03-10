/**
 * endpoints.js
 * -------------------------------------------------
 * Centraliza todas las rutas del API en un único lugar.
 * Evita strings hardcodeados en los servicios.
 *
 * Endpoints del backend (http://localhost:8080/api):
 *
 * AUTH
 *   POST   /auth/login
 *   POST   /auth/register
 *   POST   /auth/google
 *   GET    /auth/me
 *   POST   /auth/forgot-password
 *   GET    /auth/reset-password/validate?token=X
 *   POST   /auth/reset-password
 *
 * USUARIOS
 *   GET    /users
 *   GET    /users/id?id=X
 *   PUT    /users/id?id=X
 *   PATCH  /users/id?id=X
 *
 * PRODUCTOS
 *   (pendiente de confirmar rutas con el backend)
 *
 * CATEGORÍAS
 *   (pendiente de confirmar rutas con el backend)
 *
 * VENTAS
 *   (pendiente de confirmar rutas con el backend)
 *
 * COMPRAS
 *   (pendiente de confirmar rutas con el backend)
 *
 * CLIENTES
 *   (pendiente de confirmar rutas con el backend)
 *
 * PROVEEDORES
 *   (pendiente de confirmar rutas con el backend)
 *
 * GASTOS
 *   (pendiente de confirmar rutas con el backend)
 */

export const ENDPOINTS = {
    AUTH: {
        LOGIN:                  '/auth/login',
        REGISTER:               '/auth/register',
        GOOGLE:                 '/auth/google',
        ME:                     '/auth/me',
        FORGOT_PASSWORD:        '/auth/forgot-password',
        RESET_PASSWORD_VALIDATE:'/auth/reset-password/validate',
        RESET_PASSWORD:         '/auth/reset-password',
    },
    USUARIOS: {
        GET_ALL:    '/users',
        GET_BY_ID:  '/users/id',
        UPDATE:     '/users/id',
        PATCH:      '/users/id',
    },
    PRODUCTOS: {
        GET_ALL:    '/productos',
        GET_BY_ID:  '/productos/id',
        CREATE:     '/productos',
        UPDATE:     '/productos/id',
        DELETE:     '/productos/id',
    },
    CATEGORIAS: {
        GET_ALL:    '/categorias',
        GET_BY_ID:  '/categorias/id',
        CREATE:     '/categorias',
        UPDATE:     '/categorias/id',
        DELETE:     '/categorias/id',
    },
    VENTAS: {
        GET_ALL:    '/ventas',
        GET_BY_ID:  '/ventas/id',
        CREATE:     '/ventas',
        UPDATE:     '/ventas/id',
    },
    COMPRAS: {
        GET_ALL:    '/compras',
        GET_BY_ID:  '/compras/id',
        CREATE:     '/compras',
        UPDATE:     '/compras/id',
    },
    CLIENTES: {
        GET_ALL:    '/clientes',
        GET_BY_ID:  '/clientes/id',
        CREATE:     '/clientes',
        UPDATE:     '/clientes/id',
        DELETE:     '/clientes/id',
    },
    PROVEEDORES: {
        GET_ALL:    '/proveedores',
        GET_BY_ID:  '/proveedores/id',
        CREATE:     '/proveedores',
        UPDATE:     '/proveedores/id',
        DELETE:     '/proveedores/id',
    },
    GASTOS: {
        GET_ALL:    '/gastos',
        GET_BY_ID:  '/gastos/id',
        CREATE:     '/gastos',
        UPDATE:     '/gastos/id',
        DELETE:     '/gastos/id',
    },
};
