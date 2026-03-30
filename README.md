# 🏙️ UrbanLife — Frontend

Interfaz web del sistema de gestión empresarial UrbanLife. Desarrollada en JavaScript Vanilla con Vite como bundler. SPA (Single Page Application) con router propio, sin ningún framework de UI.

---

## 📋 Tabla de Contenidos

- [🌟 Alcance del Proyecto](#-alcance-del-proyecto)
- [🚀 Stack Tecnológico](#-stack-tecnológico)
- [📋 Requisitos Previos](#-requisitos-previos)
- [🛠️ Instalación y Configuración](#️-instalación-y-configuración)
  - [1. Clonar el Repositorio](#1-clonar-el-repositorio)
  - [2. Instalar Dependencias](#2-instalar-dependencias)
  - [3. Conectar con el Backend](#3-conectar-con-el-backend)
  - [4. Ejecutar en Desarrollo](#4-ejecutar-en-desarrollo)
  - [5. Build para Producción](#5-build-para-producción)
- [📂 Estructura del Proyecto](#-estructura-del-proyecto)
- [🗺️ Páginas y Rutas](#️-páginas-y-rutas)
- [🏗️ Arquitectura del Frontend](#️-arquitectura-del-frontend)
  - [Router SPA](#router-spa)
  - [Capa de API](#capa-de-api)
  - [Sistema de Validaciones](#sistema-de-validaciones)
  - [Alertas y Notificaciones](#alertas-y-notificaciones)
- [🖥️ Módulos del Sistema](#️-módulos-del-sistema)
- [🔑 Autenticación en el Frontend](#-autenticación-en-el-frontend)
- [🔧 Dependencias](#-dependencias)
- [🙌 Contribuidores](#-contribuidores)
- [📝 Licencia](#-licencia)
- [📧 Contacto](#-contacto)

---

## 🌟 Alcance del Proyecto

UrbanLife Frontend es la interfaz de usuario del sistema de gestión empresarial. Cubre los siguientes módulos:

- **🔐 Autenticación:** Login con email/contraseña, inicio de sesión con Google y recuperación de contraseña.
- **📊 Dashboard:** Resumen financiero y gráficos analíticos de ventas, stock e ingresos vs egresos.
- **📦 Inventario:** Gestión de productos con control de stock, imágenes y filtros avanzados.
- **🏷️ Categorías:** CRUD completo con toggle de estado activo/inactivo.
- **🛒 Ventas:** Registro de ventas con múltiples productos y validación de stock acumulado.
- **🏪 Compras:** Registro de entradas de inventario de proveedores con líneas múltiples.
- **💸 Gastos Adicionales:** Registro de egresos operativos del negocio.
- **📒 Movimientos Financieros:** Libro mayor de todos los movimientos (solo lectura).
- **📋 Clientes y Proveedores:** Directorio de contactos con CRUD completo.
- **👥 Usuarios:** Administración de cuentas con roles diferenciados (solo ADMIN/SUPER_ADMIN).
- **👤 Perfil:** Gestión de datos personales, correos, teléfonos adicionales y contraseña.

---

## 🚀 Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| JavaScript ES6+ | Vanilla | Lógica de toda la aplicación |
| Vite | 6.0 | Bundler, servidor de desarrollo y build |
| HTML5 | — | Estructura de vistas |
| CSS3 | — | Estilos (sin frameworks CSS) |
| SweetAlert2 | 11.x | Alertas, confirmaciones y diálogos |
| browser-image-compression | 2.x | Compresión de imágenes antes de subir |
| Google Identity Services | CDN | Inicio de sesión con Google |
| Font Awesome | CDN | Iconografía |

---

## 📋 Requisitos Previos

- **Node.js 18** o superior
- **npm**
- El **backend de UrbanLife** corriendo en `http://localhost:8080`

Verificar:

```bash
node --version
npm --version
```

---

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/Frontend-UrbanLife.git
cd Frontend-UrbanLife
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Conectar con el Backend

La URL base de la API está definida en `js/api/client.js`. Por defecto apunta a `http://localhost:8080/api`. Si tu backend corre en otro puerto o host, actualiza esa constante:

```js
// js/api/client.js
const BASE_URL = 'http://localhost:8080/api';
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Vite abrirá la aplicación en `http://localhost:5173` (o el siguiente puerto disponible).

> ⚠️ Asegúrate de que el backend esté corriendo antes de iniciar el frontend.

### 5. Build para Producción

```bash
npm run build
```

Los archivos compilados quedan en la carpeta `dist/`. Para previsualizar el build:

```bash
npm run preview
```

---

## 📂 Estructura del Proyecto

```
Frontend-UrbanLife/
│
├── index.html                              # Página de login (punto de entrada)
├── vite.config.js                          # Configuración de Vite y entrypoints del build
├── package.json
│
├── view/
│   ├── app.html                            # Layout principal del SPA (sidebar + navbar + contenido)
│   ├── register.html                       # Registro de nuevo usuario
│   ├── recuperar.html                      # Solicitar recuperación de contraseña
│   ├── nueva-contrasena.html               # Resetear contraseña con token
│   └── partials/                           # Vistas inyectadas dinámicamente por el router
│       ├── home.html                       # Dashboard con gráficos
│       ├── productos.html                  # Inventario de productos
│       ├── categorias.html                 # Categorías
│       ├── clientes.html                   # Directorio de clientes
│       ├── proveedores.html                # Directorio de proveedores
│       ├── ventas.html                     # Registro de ventas
│       ├── compras.html                    # Registro de compras
│       ├── gastos.html                     # Gastos adicionales
│       ├── movimientos.html                # Libro de movimientos financieros
│       ├── usuarios.html                   # Administración de usuarios
│       └── perfil.html                     # Perfil del usuario autenticado
│
├── js/
│   ├── router.js                           # Router del SPA — carga partials y ejecuta módulos
│   │
│   ├── pages/                              # Módulo JS de cada página
│   │   ├── auth.js                         # Login, registro y Google OAuth
│   │   ├── home.js                         # Dashboard: gráficos y tarjetas de resumen
│   │   ├── productos.js                    # CRUD de productos, filtros, imágenes
│   │   ├── categorias.js                   # CRUD de categorías
│   │   ├── clientes.js                     # CRUD de clientes
│   │   ├── proveedores.js                  # CRUD de proveedores
│   │   ├── ventas.js                       # Registro de ventas (formulario 2 pasos)
│   │   ├── compras.js                      # Registro de compras
│   │   ├── gastos.js                       # Registro de gastos adicionales
│   │   ├── movimientos.js                  # Listado de movimientos financieros
│   │   ├── usuarios.js                     # Administración de cuentas de usuario
│   │   ├── perfil.js                       # Edición de perfil, correos y teléfonos adicionales
│   │   ├── recuperar.js                    # Formulario de solicitud de recuperación
│   │   └── nueva-password.js               # Formulario de nueva contraseña con token
│   │
│   ├── api/
│   │   ├── client.js                       # Fetch wrapper con JWT automático y manejo de errores
│   │   ├── endpoints.js                    # URLs centralizadas de todos los endpoints
│   │   └── services/                       # Un servicio por módulo — llaman a client.js
│   │       ├── auth.service.js
│   │       ├── usuarios.service.js
│   │       ├── productos.service.js
│   │       ├── categorias.service.js
│   │       ├── clientes.service.js
│   │       ├── proveedores.service.js
│   │       ├── ventas.service.js
│   │       ├── compras.service.js
│   │       ├── gastos.service.js
│   │       ├── movimientos.service.js
│   │       ├── dashboard.service.js
│   │       ├── correos-usuario.service.js
│   │       └── telefonos-usuario.service.js
│   │
│   ├── constants/
│   │   └── validationPatterns.js           # Regex reutilizables (email, NIT, cédula, teléfono...)
│   │
│   ├── store/
│   │   └── auth.store.js                   # Estado de autenticación en localStorage
│   │
│   └── utils/
│       ├── alerts.js                       # Wrappers de SweetAlert2 (éxito, error, confirmación)
│       ├── formValidation.js               # Validación de formularios al momento de enviar
│       ├── realtimeValidations.js          # Validación en tiempo real (eventos input/blur)
│       ├── modal.js                        # Abrir y cerrar modales
│       ├── globalProfile.js               # Carga del nombre y avatar en el navbar
│       └── notifications.js               # Notificaciones toast
│
└── css/
    ├── templete.css                        # Estilos globales del layout
    ├── customproperties.css                # Variables CSS (colores, tipografía, espaciado)
    ├── validations.css                     # Estilos de estados de validación (verde/rojo)
    ├── base/
    │   └── reset.css                       # CSS reset
    ├── components/                         # 19 archivos CSS por componente
    │   ├── autenticacion.css
    │   ├── sidebar.css
    │   ├── navbar.css
    │   ├── tabla.css
    │   ├── modal.css
    │   ├── formulario.css
    │   ├── tarjetas.css
    │   ├── producto.css
    │   ├── perfil.css
    │   ├── contacto.css
    │   ├── notificacion.css
    │   ├── grafico-barras.css
    │   ├── grafico-pastel.css
    │   ├── grafico-margen.css
    │   ├── detalle-venta.css
    │   ├── resumen-semanal.css
    │   ├── movimientos.css
    │   ├── validacion.css
    │   └── sweetalert.css
    ├── layout/
    │   ├── tablero.css                     # Layout del dashboard principal
    │   └── responsive.css                  # Media queries y diseño responsivo
    └── pages/
        └── autenticacion.css               # Estilos específicos de la página de login
```

---

## 🗺️ Páginas y Rutas

La aplicación es un **SPA** cargado desde `view/app.html`. El router inyecta los partials en el área de contenido y ejecuta el módulo JS correspondiente.

| Ruta (hash) | Partial cargado | Módulo JS |
|---|---|---|
| `#/home` | `partials/home.html` | `pages/home.js` |
| `#/productos` | `partials/productos.html` | `pages/productos.js` |
| `#/categorias` | `partials/categorias.html` | `pages/categorias.js` |
| `#/clientes` | `partials/clientes.html` | `pages/clientes.js` |
| `#/proveedores` | `partials/proveedores.html` | `pages/proveedores.js` |
| `#/ventas` | `partials/ventas.html` | `pages/ventas.js` |
| `#/compras` | `partials/compras.html` | `pages/compras.js` |
| `#/gastos` | `partials/gastos.html` | `pages/gastos.js` |
| `#/movimientos` | `partials/movimientos.html` | `pages/movimientos.js` |
| `#/usuarios` | `partials/usuarios.html` | `pages/usuarios.js` |
| `#/perfil` | `partials/perfil.html` | `pages/perfil.js` |

**Páginas independientes** (fuera del SPA):

| Archivo | Descripción |
|---|---|
| `index.html` | Login y acceso con Google |
| `view/register.html` | Registro de nuevo usuario |
| `view/recuperar.html` | Solicitar recuperación de contraseña |
| `view/nueva-contrasena.html` | Cambiar contraseña con token del correo |

---

## 🏗️ Arquitectura del Frontend

### Router SPA

El archivo `js/router.js` escucha el evento `hashchange` del navegador. Al cambiar la ruta:

1. Lee el hash de la URL (`#/ventas`, `#/productos`, etc.)
2. Hace `fetch` del partial HTML correspondiente.
3. Lo inyecta en el contenedor principal de `app.html`.
4. Importa dinámicamente el módulo JS de la página e invoca su función `inicializar()`.
5. Actualiza el elemento activo en el sidebar.

Esto permite navegación sin recargar la página, con cada módulo siendo completamente independiente.

### Capa de API

**`js/api/client.js`** — Wrapper central de `fetch`:
- Agrega automáticamente el header `Authorization: Bearer <token>` desde `localStorage`.
- Parsea la respuesta JSON.
- Lanza un error con el `message` del backend si `success === false` o el status HTTP es >= 400.
- Exporta métodos: `get(endpoint)`, `post(endpoint, body)`, `put(endpoint, body)`, `patch(endpoint, body)`, `del(endpoint)`.

**`js/api/endpoints.js`** — Objeto centralizado con todas las URLs:
```js
ENDPOINTS.VENTAS.CREATE      // '/ventas'
ENDPOINTS.PRODUCTOS.GET_ALL  // '/productos'
```

**`js/api/services/*.service.js`** — Un archivo por módulo. Cada función llama a `client.js` con el endpoint correspondiente y retorna los datos ya deserializados.

### Sistema de Validaciones

El sistema tiene dos niveles:

**1. Validación en tiempo real** (`js/utils/realtimeValidations.js`)

Se aplica automáticamente a todos los inputs de modales. Cada tipo de campo tiene su propio conjunto de reglas:

| Tipo (`data-validation`) | Caracteres permitidos | Restricciones |
|---|---|---|
| `letras` | Letras y acentos | Un solo espacio entre palabras |
| `letrasEspacios` | Letras y acentos | Un solo espacio entre palabras |
| `numeros` | Dígitos y punto decimal | — |
| `enteros` | Solo dígitos | — |
| `documento` | Solo dígitos | 6–10 dígitos (cédula colombiana) |
| `nit` | Dígitos y guión | Formato `000000000-0` |
| `telefono` | Solo dígitos | 7–10 dígitos (sin espacios ni caracteres especiales) |
| `correo` | — | Formato `ejemplo@dominio.com` |
| `direccion` | Letras, números, `#`, `-`, `.` | Un solo espacio entre palabras |
| `descripcion` | Cualquier carácter | Un solo espacio entre palabras, máx. 255 |
| `texto` | Cualquier carácter | Un solo espacio entre palabras, 2–255 chars |
| `razonSocial` | Cualquier carácter | Un solo espacio entre palabras, 2–150 chars |
| `fecha` | — | Solo fechas desde hoy en el año actual |

El sistema usa un `MutationObserver` para aplicar las validaciones automáticamente cada vez que se abre un modal, sin necesidad de inicialización manual.

**2. Validación al enviar** (`js/utils/formValidation.js`)

La función `validateForm(form, rulesMap)` recorre los campos del formulario justo antes de enviarlo, verifica las reglas definidas y retorna `{ valido: boolean, errores: string[] }` para mostrar en una alerta si hay problemas.

### Alertas y Notificaciones

`js/utils/alerts.js` expone wrappers de SweetAlert2:

```js
mostrarAlertaExito('Venta registrada exitosamente');
mostrarAlertaError('Stock insuficiente', ['Producto A: solicitado 50, disponible 30']);
mostrarAlertaConfirmacion('¿Eliminar este registro?');
```

---

## 🖥️ Módulos del Sistema

### 📊 Dashboard (`home.js`)

- **Tarjetas de resumen:** ventas, compras, gastos y ganancia neta del día y del mes.
- **Gráfico de barras:** ventas de los últimos 7 días.
- **Gráfico agrupado:** ingresos vs egresos vs ganancia por día de la semana.
- **Gráfico de pastel:** distribución del stock por categoría.
- **Top 10 productos:** ordenados por margen de ganancia.

Todos los gráficos se renderizan con CSS puro (sin librerías como Chart.js).

### 📦 Productos (`productos.js`)

- Listado en grid de tarjetas con imagen, nombre, precio, stock y estado.
- Filtros: búsqueda por nombre, categoría, estado y nivel de stock (disponible / bajo / agotado).
- Modal de creación: nombre, descripción, precio, costo, stock (opcional), categoría e imagen.
- Modal de edición: mismos campos más toggle de estado.
- Subida de imagen con compresión automática antes de enviar al servidor.

### 🛒 Ventas (`ventas.js`)

Formulario en **2 pasos**:

1. **Paso 1:** Cliente, fecha (hoy por defecto) y método de pago.
2. **Paso 2:** Tabla de productos con filas dinámicas. Cada fila: selector de producto (con stock disponible visible), cantidad y precio (auto-completado, solo lectura).

Validaciones en tiempo real en el paso 2:
- Si la cantidad total de un mismo producto en varias filas supera el stock, el input se marca en rojo con el mensaje `Stock: X | Total: Y`.
- El botón Guardar también valida antes de enviar.

### 🏪 Compras (`compras.js`)

Similar a ventas pero orientado a entradas de inventario. El costo unitario es editable (lo define el proveedor). Al registrar, el backend recalcula el costo promedio ponderado del producto.

### 👤 Perfil (`perfil.js`)

- Edición de nombre, apellido y correo principal.
- Gestión de correos adicionales (agregar / eliminar).
- Gestión de teléfonos adicionales (agregar / eliminar).
- Cambio de contraseña (para usuarios con contraseña) o establecer contraseña (para usuarios que entraron con Google).

---

## 🔑 Autenticación en el Frontend

El token JWT se guarda en `localStorage` al hacer login. El módulo `js/store/auth.store.js` expone funciones para leerlo, guardarlo y eliminarlo.

`js/api/client.js` lo adjunta automáticamente en cada request.

Al acceder a `view/app.html`, se verifica que el token exista y sea válido llamando a `GET /auth/me`. Si no, se redirige al login.

**Flujo de login con Google:**
1. El usuario hace clic en el botón de Google.
2. Google Identity Services retorna el `id_token`.
3. El frontend lo envía a `POST /api/auth/google`.
4. El backend verifica el token y retorna el JWT de la aplicación.
5. Se guarda el JWT y se redirige al dashboard.

**Cierre de sesión:**
Elimina el token de `localStorage` y redirige a `index.html`.

---

## 🔧 Dependencias

Definidas en `package.json`:

**Dependencias de producción:**

| Dependencia | Versión | Descripción |
|---|---|---|
| `sweetalert2` | `^11.0.0` | Alertas, confirmaciones y diálogos estilizados |
| `browser-image-compression` | `^2.0.2` | Compresión de imágenes en el cliente antes de subir |

**Dependencias de desarrollo:**

| Dependencia | Versión | Descripción |
|---|---|---|
| `vite` | `^6.0.0` | Bundler ultrarrápido y servidor de desarrollo |

**Librerías externas (CDN, sin instalación):**

| Librería | Uso |
|---|---|
| Font Awesome | Iconografía en toda la interfaz |
| Google Identity Services | Botón e integración de login con Google |

---

## 🙌 Contribuidores

¡Gracias a quien hizo posible este proyecto! 👏🎉

- **Yedher David Pineda** — [GitHub](https://github.com/DavidPineda02) 🚀

---

## 📝 Licencia

Este proyecto está bajo una Licencia de Software Propietario. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 📧 Contacto

Si tienes preguntas, sugerencias o encontraste un bug, no dudes en contactarme:

- **Yedher David Pineda** — daxpa.02@gmail.com

---

¡Disfruta el proyecto! 😄