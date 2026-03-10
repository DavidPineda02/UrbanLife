# UrbanLife – Especificación de Requisitos de Software
**Proyecto Final de Universidad — Análisis y Desarrollo de Software**

---

## Requisitos Funcionales (RF)

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-01 |
| **Nombre del Requisito** | Iniciar sesión en el sistema |
| **Componente** | Pantalla de inicio de sesión, campo de correo, campo de contraseña, botón de ingresar |
| **Característica asociada** | Autenticación de usuarios, control de acceso |
| **Descripción del Requisito** | El sistema debe tener una pantalla de inicio de sesión donde el usuario pueda ingresar con su correo electrónico y contraseña. Si los datos son correctos, el sistema lo lleva al menú principal. Si son incorrectos, muestra un mensaje de error indicando que las credenciales no son válidas. |
| **Características** | Los campos de correo y contraseña no pueden estar vacíos. El correo debe tener un formato válido con '@'. Si los datos no coinciden con ningún usuario registrado, se muestra un mensaje de error. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Solo pueden ingresar los usuarios que ya estén registrados en el sistema. No existe opción de acceso sin credenciales válidas. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-02 |
| **Nombre del Requisito** | Registrarse en el sistema |
| **Componente** | Pantalla de registro, campo de correo, campo de contraseña, campo de confirmar contraseña, botón de registrarse |
| **Característica asociada** | Creación de cuenta, registro de nuevos usuarios |
| **Descripción del Requisito** | El sistema debe tener una pantalla de registro donde un nuevo usuario pueda crear su cuenta ingresando su correo electrónico, una contraseña y confirmando esa contraseña. Si los datos son válidos y el correo no está registrado antes, el sistema crea la cuenta y lo lleva al menú principal. |
| **Características** | Los campos de contraseña y confirmar contraseña deben coincidir. El correo no puede estar ya registrado en el sistema. Todos los campos son obligatorios. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | No se puede crear una cuenta con un correo que ya exista en el sistema. El registro crea únicamente cuentas con rol de ADMIN (dueño del negocio). |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-03 |
| **Nombre del Requisito** | Iniciar sesión con Google |
| **Componente** | Botón de inicio de sesión con Google en la pantalla de login y en la pantalla de registro |
| **Característica asociada** | Autenticación con cuenta externa, acceso rápido al sistema |
| **Descripción del Requisito** | El sistema debe ofrecer la opción de iniciar sesión o registrarse usando una cuenta de Google. Al dar clic en ese botón, el usuario autoriza el acceso y el sistema usa la información de Google para identificarlo. Si ya tiene cuenta, inicia sesión directamente. Si no tiene cuenta, el sistema la crea de forma automática. |
| **Características** | Si el usuario ya existe con el correo de Google, simplemente inicia sesión. Si no existe, se crea su cuenta automáticamente con los datos que Google proporciona. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Esta función depende de que el servicio de Google esté disponible. Si no lo está, el usuario puede usar el acceso normal con correo y contraseña. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-04 |
| **Nombre del Requisito** | Cerrar sesión del sistema |
| **Componente** | Botón de cerrar sesión en la pantalla de perfil |
| **Característica asociada** | Seguridad de sesión, cierre de acceso al sistema |
| **Descripción del Requisito** | El sistema debe permitir al usuario cerrar su sesión desde la pantalla de perfil. Al dar clic en el botón de cerrar sesión, el sistema termina la sesión activa y redirige al usuario a la pantalla de inicio de sesión. Después de cerrar sesión no se puede navegar a ninguna pantalla del sistema sin volver a ingresar. |
| **Características** | El botón de cerrar sesión debe estar visible en la pantalla de perfil. Tras cerrarse, el sistema no permite acceder a ninguna pantalla interna sin autenticarse de nuevo. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Al cerrar sesión los datos de acceso deben eliminarse correctamente para evitar que otra persona acceda sin permiso. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☐ Sí   ☑ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-05 |
| **Nombre del Requisito** | Gestión de usuarios por rol |
| **Componente** | Sección de administración de usuarios, formulario de registro de usuario, lista de usuarios, botones de editar y eliminar |
| **Característica asociada** | Administración de usuarios, control de acceso por roles |
| **Descripción del Requisito** | El sistema debe permitir gestionar las cuentas de los usuarios según el rol de quien esté usando el sistema. El SUPER-ADMIN puede crear, editar y eliminar cuentas de ADMIN. El ADMIN puede crear, editar y eliminar cuentas de EMPLEADO. En ambos casos se ingresan los datos básicos del usuario como nombre, correo y contraseña. Si un usuario intenta acceder a una pantalla que no le corresponde, el sistema le muestra un mensaje de acceso no permitido. |
| **Características** | No se pueden registrar dos usuarios con el mismo correo. La contraseña debe tener mínimo 6 caracteres. Cada usuario solo puede ver y gestionar las cuentas del rol que le corresponde administrar. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El SUPER-ADMIN solo gestiona cuentas de ADMIN. El ADMIN solo gestiona cuentas de EMPLEADO. El EMPLEADO no puede gestionar cuentas de otros usuarios. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-06 |
| **Nombre del Requisito** | Ver el panel principal con el resumen del negocio |
| **Componente** | Pantalla principal, tarjetas de resumen, gráfico de ventas de la semana, resumen de ingresos y egresos, distribución de stock por categoría, lista de productos más rentables |
| **Característica asociada** | Panel de control, resumen visual del estado del negocio |
| **Descripción del Requisito** | Al ingresar al sistema, el usuario ve una pantalla principal con un resumen del negocio. Se muestran tarjetas con las ventas del día, los egresos a proveedores, las ganancias del mes y la cantidad de productos activos. También hay un gráfico con las ventas de la semana, un comparativo de ingresos y egresos, un gráfico que muestra cuánto stock hay por categoría y una lista de los productos que generan más ganancia. |
| **Características** | Los valores de las tarjetas y los gráficos deben calcularse con base en los registros reales que hay en el sistema, no con datos de ejemplo. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | La información del panel debe mostrar solo los datos del negocio del ADMIN que tiene la sesión activa en ese momento. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-07 |
| **Nombre del Requisito** | Registrar una venta |
| **Componente** | Pantalla de ventas, formulario de registro en dos pasos, selector de cliente, selector de productos, campos de cantidad y precio, botón de guardar venta |
| **Característica asociada** | Registro de ventas, control de ingresos |
| **Descripción del Requisito** | El sistema debe permitir registrar una venta en dos pasos. En el primer paso se selecciona el cliente, la fecha y el método de pago (Efectivo o Transferencia). En el segundo paso se agregan los productos que se vendieron con su cantidad y precio unitario. Se pueden agregar varios productos por venta usando el botón de agregar producto. Al guardar, el stock de cada producto vendido se reduce automáticamente. |
| **Características** | Se debe seleccionar al menos un producto con cantidad mayor a cero. El total se calcula automáticamente sumando los subtotales. El cliente y el método de pago son obligatorios. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | No se puede registrar una venta sin seleccionar un cliente y un método de pago. El sistema no permite vender más unidades de las que hay disponibles en el inventario. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-08 |
| **Nombre del Requisito** | Ver, editar y eliminar ventas |
| **Componente** | Pantalla de ventas, tabla de historial, botón de ver detalle, botón de editar, botón de eliminar con confirmación |
| **Característica asociada** | Consulta y mantenimiento del historial de ventas |
| **Descripción del Requisito** | El sistema debe mostrar una tabla con todas las ventas registradas, indicando el número de venta, la fecha, el cliente, la cantidad de productos, el total y el método de pago. Cada venta tiene tres opciones: ver el detalle completo de los productos vendidos, editar la información de la venta y eliminarla. Antes de eliminar, el sistema pide confirmación al usuario. |
| **Características** | El detalle de la venta muestra la lista de productos, cantidades y precios. El formulario de edición carga los datos actuales de la venta para poder modificarlos. La confirmación de eliminación advierte que la acción no se puede deshacer. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Al editar o eliminar una venta, el stock del inventario debe ajustarse automáticamente para reflejar el cambio. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-09 |
| **Nombre del Requisito** | Registrar una compra a un proveedor |
| **Componente** | Pantalla de compras, formulario de registro, selector de proveedor, selector de producto, campos de fecha, cantidad, costo unitario y método de pago |
| **Característica asociada** | Registro de compras, control de egresos |
| **Descripción del Requisito** | El sistema debe permitir registrar una compra realizada a un proveedor. Se selecciona el proveedor, el producto que se compró, la fecha, la cantidad adquirida, el costo por unidad y el método de pago. Al guardar la compra, el sistema suma las unidades compradas al stock del producto de forma automática. |
| **Características** | Todos los campos del formulario son obligatorios. La cantidad y el costo deben ser números mayores a cero. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Solo se pueden comprar productos que ya estén registrados en el inventario. No es posible agregar nuevos productos desde este formulario. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-10 |
| **Nombre del Requisito** | Ver, editar y eliminar compras |
| **Componente** | Pantalla de compras, tabla de historial, botón de editar, botón de eliminar con confirmación |
| **Característica asociada** | Consulta y mantenimiento del historial de compras |
| **Descripción del Requisito** | El sistema debe mostrar una tabla con todas las compras registradas, indicando la fecha, el proveedor, la ciudad, el producto, la cantidad, el costo unitario, el subtotal y el método de pago. Cada compra tiene botones para editar su información o eliminarla. Antes de eliminar se pide confirmación al usuario. |
| **Características** | El formulario de edición carga los datos actuales de la compra. El mensaje de confirmación de eliminación advierte que la acción no se puede deshacer. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Al eliminar una compra, el sistema debe restar del inventario las unidades que se habían sumado al momento de registrarla. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-11 |
| **Nombre del Requisito** | Registrar un gasto adicional |
| **Componente** | Pantalla de gastos, formulario de registro, selector de tipo de gasto, campos de fecha, monto y descripción |
| **Característica asociada** | Control de egresos, registro de gastos operativos |
| **Descripción del Requisito** | El sistema debe permitir registrar los gastos del negocio que no vienen de una compra de productos, como arriendo, servicios públicos, transporte o publicidad. Se selecciona el tipo de gasto, se ingresa la fecha, el monto y una descripción de en qué se gastó el dinero. |
| **Características** | El tipo de gasto, el monto y la descripción son obligatorios. El monto debe ser un número mayor a cero. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Los tipos de gasto disponibles son fijos y están definidos en el sistema. No se puede guardar un gasto sin seleccionar a qué tipo pertenece. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-12 |
| **Nombre del Requisito** | Ver, editar y eliminar gastos adicionales |
| **Componente** | Pantalla de gastos, tabla de historial, botón de editar, botón de eliminar con confirmación |
| **Característica asociada** | Consulta y mantenimiento del historial de gastos |
| **Descripción del Requisito** | El sistema debe mostrar una tabla con todos los gastos registrados, indicando la fecha, el tipo de gasto, la descripción y el monto. Cada gasto tiene botones para editar su información o eliminarlo. Antes de eliminar, el sistema muestra una ventana de confirmación. |
| **Características** | El formulario de edición carga los datos actuales del gasto con el tipo ya seleccionado, la fecha y el monto listos para modificar. El mensaje de confirmación advierte que la acción no se puede deshacer. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Solo el ADMIN puede registrar, editar o eliminar gastos adicionales. El EMPLEADO no tiene acceso a este módulo. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-13 |
| **Nombre del Requisito** | Ver el resumen financiero del negocio |
| **Componente** | Panel principal, tarjetas de ingresos, egresos y ganancias, sección de resumen semanal con barras comparativas |
| **Característica asociada** | Contabilidad, visualización de ingresos, egresos y ganancias netas |
| **Descripción del Requisito** | El sistema debe mostrar en el panel principal el resumen financiero del negocio. Se muestran las ventas del día, los egresos a proveedores y las ganancias del mes en tarjetas. También hay un bloque de resumen semanal que compara con barras el total de ingresos, egresos y ganancias netas de la semana actual. Todos los valores se calculan automáticamente con base en los registros del sistema. |
| **Características** | Los valores deben actualizarse con los datos reales. Las tarjetas también muestran un indicador de si el valor subió o bajó respecto al período anterior. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Solo el ADMIN puede ver el resumen financiero. El EMPLEADO no tiene acceso a los datos contables del negocio. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-14 |
| **Nombre del Requisito** | Agregar un producto al inventario |
| **Componente** | Pantalla de productos, formulario de registro, campos de nombre, categoría, descripción, precio de venta, costo promedio, stock e imagen |
| **Característica asociada** | Gestión del inventario, registro de nuevos productos |
| **Descripción del Requisito** | El sistema debe permitir agregar nuevos productos al inventario. Se ingresa el nombre del producto, se selecciona su categoría, se escribe una descripción, el precio de venta, el costo promedio, la cantidad inicial disponible y opcionalmente una imagen del producto. |
| **Características** | El nombre, la categoría, el precio de venta y el stock inicial son obligatorios. El precio y el stock deben ser números positivos. No se puede registrar un producto con un nombre que ya exista en el inventario. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Solo el ADMIN puede agregar productos al inventario. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-15 |
| **Nombre del Requisito** | Editar y desactivar un producto |
| **Componente** | Pantalla de productos, botón de editar con formulario precargado, botón de eliminar con ventana de confirmación |
| **Característica asociada** | Gestión del inventario, actualización de datos de productos |
| **Descripción del Requisito** | El sistema debe permitir editar la información de un producto existente. Al dar clic en el botón de editar, se abre un formulario con los datos actuales del producto listos para modificar. Si se quiere eliminar un producto, el sistema muestra una ventana de confirmación. Si ese producto ya tiene ventas o compras registradas, en lugar de borrarse del sistema se desactiva, lo que significa que su estado cambia a inactivo y deja de aparecer en las listas de selección, pero sus registros históricos se conservan. |
| **Características** | El formulario de edición carga todos los datos actuales del producto. Un producto desactivado no puede seleccionarse en nuevas ventas ni compras, pero sus registros anteriores siguen visibles en el historial. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Un producto con ventas o compras asociadas no puede eliminarse permanentemente. En ese caso el sistema lo desactiva en lugar de borrarlo para no afectar el historial. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-16 |
| **Nombre del Requisito** | Ver los productos del inventario |
| **Componente** | Pantalla de productos, grilla de tarjetas de producto con imagen, nombre, categoría, precio y stock |
| **Característica asociada** | Consulta del inventario, visualización de stock disponible |
| **Descripción del Requisito** | El sistema debe mostrar todos los productos del inventario en tarjetas, donde cada una muestra la imagen, el nombre, la categoría a la que pertenece, el precio de venta y el stock disponible. Los productos que tengan pocas unidades deben destacarse visualmente para que el ADMIN sepa que pronto se van a agotar. |
| **Características** | Un producto con menos de 5 unidades disponibles debe mostrarse con un color o etiqueta que indique que el stock es bajo. Un producto desactivado no debe aparecer en esta vista. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El ADMIN y el EMPLEADO pueden ver el inventario. Solo el ADMIN puede agregar, editar o desactivar productos. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-17 |
| **Nombre del Requisito** | Gestionar categorías de productos |
| **Componente** | Pantalla de productos, botón de agregar categoría, formulario con nombre y descripción, lista de categorías disponibles |
| **Característica asociada** | Organización del inventario, clasificación de productos |
| **Descripción del Requisito** | El sistema debe permitir al ADMIN crear nuevas categorías para organizar los productos. Se ingresa el nombre de la categoría y una descripción opcional. Las categorías creadas quedan disponibles para asignarlas a los productos. |
| **Características** | El nombre de la categoría es obligatorio. No se pueden crear dos categorías con el mismo nombre. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | No se puede eliminar una categoría que tenga productos activos asociados. Solo el ADMIN puede crear o eliminar categorías. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-18 |
| **Nombre del Requisito** | Registrar un cliente |
| **Componente** | Pantalla de clientes, formulario de registro, campos de nombre, correo, teléfono, ciudad y dirección |
| **Característica asociada** | Gestión de clientes, registro de contactos del negocio |
| **Descripción del Requisito** | El sistema debe permitir guardar la información de los clientes del negocio. Se ingresa el nombre completo, el correo electrónico, el teléfono, la ciudad y la dirección. Estos clientes no tienen cuenta en el sistema; solo se registran para poder identificar a quién se le hizo una venta. |
| **Características** | El nombre completo es obligatorio. Si se ingresa un correo, debe tener un formato válido. El cliente queda activo por defecto al registrarse. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Los clientes registrados no pueden iniciar sesión en el sistema. Solo se usan como referencia en el módulo de ventas. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-19 |
| **Nombre del Requisito** | Ver, editar y gestionar clientes |
| **Componente** | Pantalla de clientes, tarjetas de contacto con nombre, estado, correo, teléfono y dirección, botón de editar, botón de eliminar con confirmación |
| **Característica asociada** | Consulta y mantenimiento de los datos de clientes |
| **Descripción del Requisito** | El sistema debe mostrar todos los clientes en tarjetas de contacto, donde se ve el nombre, el estado (Activo o Inactivo), el correo, el teléfono y la dirección. Cada tarjeta tiene botones para editar la información del cliente o eliminarlo. Si el cliente tiene ventas asociadas, no se puede borrar del sistema; en ese caso su estado cambia a Inactivo para que no aparezca en nuevas ventas, pero sus registros históricos se conservan. |
| **Características** | El formulario de edición carga los datos actuales del cliente. Los clientes activos se muestran con etiqueta verde y los inactivos con etiqueta roja. Antes de cualquier eliminación o desactivación se muestra una ventana de confirmación. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Un cliente con ventas registradas no puede borrarse permanentemente. En ese caso el sistema lo marca como Inactivo en lugar de eliminarlo. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-20 |
| **Nombre del Requisito** | Registrar un proveedor |
| **Componente** | Pantalla de proveedores, formulario de registro, campos de nombre del contacto, nombre de la empresa, correo, teléfono, ciudad y dirección |
| **Característica asociada** | Gestión de proveedores, registro de contactos del negocio |
| **Descripción del Requisito** | El sistema debe permitir guardar la información de los proveedores del negocio. Se ingresa el nombre del contacto, el nombre de la empresa, el correo, el teléfono, la ciudad y la dirección. Los proveedores no tienen cuenta en el sistema; solo se registran para poder identificar de quién se realizó una compra. |
| **Características** | El nombre del contacto y el nombre de la empresa son obligatorios. El proveedor queda activo por defecto al registrarse. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Los proveedores registrados no pueden iniciar sesión en el sistema. Solo se usan como referencia en el módulo de compras. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-21 |
| **Nombre del Requisito** | Ver, editar y gestionar proveedores |
| **Componente** | Pantalla de proveedores, tarjetas de contacto con nombre, estado, empresa, teléfono y correo, botón de editar, botón de eliminar con confirmación |
| **Característica asociada** | Consulta y mantenimiento de los datos de proveedores |
| **Descripción del Requisito** | El sistema debe mostrar todos los proveedores en tarjetas de contacto, donde se ve el nombre del contacto, el estado (Activo o Inactivo), el nombre de la empresa, el teléfono y el correo. Cada tarjeta tiene botones para editar o eliminar el proveedor. Si el proveedor tiene compras asociadas, no se puede borrar del sistema; en ese caso su estado cambia a Inactivo para que no aparezca en nuevas compras, pero sus registros históricos se conservan. |
| **Características** | El formulario de edición carga los datos actuales del proveedor. Los proveedores activos se muestran con etiqueta verde y los inactivos con etiqueta roja. Antes de eliminar o desactivar se muestra una ventana de confirmación con el nombre del proveedor. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Un proveedor con compras registradas no puede borrarse permanentemente. En ese caso el sistema lo marca como Inactivo en lugar de eliminarlo. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-22 |
| **Nombre del Requisito** | Ver y editar perfil del usuario y del negocio |
| **Componente** | Pantalla de perfil, sección de información personal con nombre y correo, sección de información del negocio con nombre, dirección y ciudad, formularios de edición para cada sección |
| **Característica asociada** | Gestión del perfil, configuración de datos personales y del negocio |
| **Descripción del Requisito** | El sistema debe mostrar en la pantalla de perfil la información del usuario dividida en dos partes: los datos personales del usuario (nombre y correo) y los datos del negocio (nombre del negocio, dirección y ciudad). El usuario puede editar cada parte por separado abriendo un formulario que ya trae los datos actuales listos para cambiar. |
| **Características** | Al guardar los cambios en la información personal, los datos del usuario se actualizan en el sistema. Al guardar los cambios del negocio, se actualiza la información del perfil del negocio. Todos los campos son obligatorios al editar. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El correo no se puede cambiar por uno que ya esté registrado en otra cuenta del sistema. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-23 |
| **Nombre del Requisito** | Cambiar contraseña desde el perfil |
| **Componente** | Pantalla de perfil, sección de contraseña, botón de cambiar, formulario con campo de contraseña actual, nueva contraseña y confirmar contraseña |
| **Característica asociada** | Seguridad de la cuenta, actualización de contraseña |
| **Descripción del Requisito** | El sistema debe permitir al usuario cambiar su contraseña desde la pantalla de perfil. Al dar clic en el botón de cambiar, aparece un formulario donde debe ingresar su contraseña actual, la nueva contraseña y confirmarla. Si la contraseña actual es correcta y las dos nuevas contraseñas coinciden, el sistema la actualiza. |
| **Características** | La nueva contraseña y la confirmación deben ser iguales. La contraseña actual debe verificarse antes de permitir el cambio. La nueva contraseña debe tener mínimo 8 caracteres. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Si la contraseña actual ingresada no coincide con la que está registrada, el sistema no realiza el cambio y muestra un mensaje de error. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-24 |
| **Nombre del Requisito** | Gestionar correos adicionales del perfil |
| **Componente** | Pantalla de perfil, sección de correos adicionales, botón de agregar, formulario con campo de correo, botón de eliminar con confirmación |
| **Característica asociada** | Gestión de contacto del negocio, correos adicionales |
| **Descripción del Requisito** | El sistema debe permitir al usuario agregar y eliminar correos electrónicos adicionales del negocio desde la pantalla de perfil. Al dar clic en agregar, aparece un formulario para ingresar el nuevo correo. Cada correo de la lista tiene un botón de eliminar que pide confirmación antes de borrarlo. |
| **Características** | El correo ingresado debe tener un formato válido. Antes de eliminar cualquier correo, el sistema muestra una ventana de confirmación. |
| **Prioridad** | ☐ Alta/Esencial   ☐ Media/Deseado   ☑ Baja/Opcional |
| **Restricciones** | Estos correos son informativos y pertenecen al perfil del negocio. No se usan para iniciar sesión en el sistema. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-25 |
| **Nombre del Requisito** | Gestionar teléfonos adicionales del perfil |
| **Componente** | Pantalla de perfil, sección de teléfonos adicionales, botón de agregar, formulario con campo de teléfono, botón de eliminar con confirmación |
| **Característica asociada** | Gestión de contacto del negocio, teléfonos adicionales |
| **Descripción del Requisito** | El sistema debe permitir al usuario agregar y eliminar números de teléfono adicionales del negocio desde la pantalla de perfil. Al dar clic en agregar, aparece un formulario para ingresar el nuevo número. Cada teléfono de la lista tiene un botón de eliminar que pide confirmación antes de borrarlo. |
| **Características** | El campo del teléfono no puede estar vacío al agregarlo. Antes de eliminar cualquier teléfono, el sistema muestra una ventana de confirmación. |
| **Prioridad** | ☐ Alta/Esencial   ☐ Media/Deseado   ☑ Baja/Opcional |
| **Restricciones** | Estos teléfonos son informativos y pertenecen al perfil del negocio. No afectan el acceso al sistema. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-26 |
| **Nombre del Requisito** | Actualizar el stock automáticamente al registrar una venta |
| **Componente** | Módulo de ventas, lógica interna del sistema al guardar una venta |
| **Característica asociada** | Control automático del inventario, actualización de stock por ventas |
| **Descripción del Requisito** | Cada vez que se guarda una venta, el sistema debe restar automáticamente las unidades vendidas del stock de cada producto incluido en esa venta. Esto ocurre sin que el usuario tenga que hacer nada adicional. Si se edita o elimina una venta, el stock también se ajusta de forma automática para reflejar el cambio. |
| **Características** | La resta del stock se hace de forma automática al confirmar la venta. Si la venta se elimina, las unidades regresan al inventario. Si la venta se edita y se cambia la cantidad, la diferencia se aplica al stock. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El sistema no debe permitir registrar una venta con más unidades de las que hay disponibles en el inventario en ese momento. |
| **Interacción Humana - Tecnología** | ☐ Sí   ☑ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-27 |
| **Nombre del Requisito** | Actualizar el stock automáticamente al registrar una compra |
| **Componente** | Módulo de compras, lógica interna del sistema al guardar una compra |
| **Característica asociada** | Control automático del inventario, actualización de stock por compras |
| **Descripción del Requisito** | Cada vez que se guarda una compra, el sistema debe sumar automáticamente las unidades compradas al stock del producto correspondiente. Esto ocurre sin que el usuario tenga que actualizar el inventario por separado. Si se edita o elimina la compra, el stock también se ajusta de forma automática. |
| **Características** | La suma al stock se hace de forma automática al confirmar la compra. Si la compra se elimina, las unidades se restan del inventario. Si se edita la cantidad, la diferencia se aplica al stock del producto. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El ajuste de stock solo aplica para productos que ya estén registrados en el inventario. No se pueden crear nuevos productos desde el módulo de compras. |
| **Interacción Humana - Tecnología** | ☐ Sí   ☑ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-28 |
| **Nombre del Requisito** | Ver el detalle completo de una venta |
| **Componente** | Pantalla de ventas, botón de ver detalle, ventana emergente con lista de productos, cantidades, precios y total de la venta |
| **Característica asociada** | Consulta detallada de ventas, trazabilidad de transacciones |
| **Descripción del Requisito** | El sistema debe permitir al usuario consultar el detalle completo de cualquier venta registrada. Al dar clic en el botón de ver detalle, se abre una ventana que muestra la fecha de la venta, el método de pago, el cliente y una tabla con cada producto vendido, su cantidad, su precio unitario y el total de la venta. |
| **Características** | La ventana de detalle es solo de lectura, no permite hacer cambios. Muestra todos los productos incluidos en esa venta con sus cantidades y precios exactos. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Solo se puede ver el detalle de ventas que ya estén guardadas en el sistema. No aplica para ventas que se estén registrando en ese momento. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-29 |
| **Nombre del Requisito** | Controlar el acceso a las pantallas según el rol del usuario |
| **Componente** | Menú lateral, pantallas internas del sistema, mensajes de acceso no permitido |
| **Característica asociada** | Control de acceso por roles, seguridad de pantallas |
| **Descripción del Requisito** | El sistema debe mostrar u ocultar las opciones del menú y las pantallas del sistema según el rol del usuario que tenga la sesión activa. El SUPER-ADMIN tiene acceso a todas las secciones. El ADMIN puede ver el panel, inventario, ventas, compras, gastos, clientes, proveedores y perfil. El EMPLEADO solo puede ver el inventario y registrar ventas. Si un usuario intenta acceder a una sección que no le corresponde, el sistema muestra un mensaje de que no tiene permiso. |
| **Características** | El menú lateral debe adaptarse al rol del usuario y mostrar solo las secciones a las que tiene acceso. Un intento de acceso no autorizado muestra un mensaje claro de que no se tiene permiso para ver esa sección. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Los permisos de cada rol están definidos en el sistema y no pueden ser modificados por los usuarios. Solo el SUPER-ADMIN puede cambiar los roles asignados. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

### FASE V.ERS – Especificación de Requisitos Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RF-30 |
| **Nombre del Requisito** | Buscar registros en las listas del sistema |
| **Componente** | Pantallas de clientes, proveedores, productos, ventas, compras y gastos, campo de búsqueda en cada lista |
| **Característica asociada** | Búsqueda y filtrado de información, acceso rápido a registros |
| **Descripción del Requisito** | El sistema debe permitir al usuario buscar registros dentro de cada lista del sistema escribiendo en un campo de búsqueda. Por ejemplo, en la lista de clientes se puede buscar por nombre, en la de ventas por fecha o cliente, y en la de productos por nombre o categoría. Los resultados se filtran en tiempo real mientras el usuario escribe. |
| **Características** | El campo de búsqueda debe estar visible en cada pantalla que tenga una lista de registros. Los resultados deben actualizarse mientras el usuario escribe sin necesidad de presionar un botón. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | La búsqueda aplica únicamente sobre los registros que ya están guardados en el sistema. No busca en registros eliminados o desactivados. |
| **Interacción Humana - Tecnología** | ☑ Sí   ☐ No |
| **Interacción Tecnología - Tecnología** | ☑ Sí   ☐ No |

---

## Requisitos No Funcionales (RNF)

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-01 |
| **Nombre del Requisito** | Seguridad en el acceso y contraseñas |
| **Categoría** | Seguridad |
| **Descripción del Requisito** | El sistema debe garantizar que solo los usuarios registrados puedan ingresar a las pantallas internas. Las contraseñas no deben guardarse como texto normal en la base de datos, sino de forma cifrada. Además, el servidor debe verificar que el usuario tenga sesión activa antes de responder a cualquier solicitud del sistema. |
| **Criterio de Aceptación** | Si alguien intenta entrar a una pantalla protegida sin haber iniciado sesión, el sistema lo redirige a la pantalla de login. Las contraseñas en la base de datos deben estar cifradas y nunca visibles en texto plano. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El sistema no debe mostrar contraseñas ni información sensible de los usuarios en ninguna pantalla o respuesta del servidor. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-02 |
| **Nombre del Requisito** | Facilidad de uso de la interfaz |
| **Categoría** | Usabilidad |
| **Descripción del Requisito** | La interfaz del sistema debe ser sencilla y fácil de entender para cualquier persona, incluso si no tiene experiencia con software de este tipo. Los formularios, botones y mensajes deben estar bien organizados y ser fáciles de identificar. La navegación desde el menú lateral debe ser clara y consistente en todas las pantallas. |
| **Criterio de Aceptación** | Una persona que nunca ha usado el sistema debe poder registrar una venta o consultar el inventario en menos de 5 minutos sin necesitar instrucciones escritas. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El diseño, los colores y la estructura del menú deben ser iguales en todas las pantallas para mantener una experiencia consistente. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-03 |
| **Nombre del Requisito** | Velocidad de respuesta del sistema |
| **Categoría** | Rendimiento |
| **Descripción del Requisito** | El sistema debe responder rápido a las acciones del usuario. Cuando se guarda una venta, se carga una pantalla o se abre un formulario, el servidor debe dar respuesta en menos de 3 segundos en condiciones normales de uso. |
| **Criterio de Aceptación** | La mayoría de las acciones del usuario como guardar, consultar o abrir formularios deben completarse y mostrar resultado en menos de 3 segundos. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El tiempo de respuesta puede verse afectado por las características del computador o servidor donde esté instalado el sistema. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-04 |
| **Nombre del Requisito** | Disponibilidad del sistema en horario laboral |
| **Categoría** | Disponibilidad |
| **Descripción del Requisito** | El sistema debe estar funcionando y disponible para usarse durante el horario de trabajo del negocio. No debe presentar caídas frecuentes que interrumpan el registro de ventas o la consulta del inventario durante el día. |
| **Criterio de Aceptación** | El sistema debe estar disponible y funcionando correctamente al menos el 95% del tiempo durante el horario de uso del negocio. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | La disponibilidad del sistema depende también del computador o servidor donde esté instalado. Si el equipo se apaga o pierde conexión, el servicio deja de estar disponible. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-05 |
| **Nombre del Requisito** | Organización y legibilidad del código |
| **Categoría** | Mantenibilidad |
| **Descripción del Requisito** | El código del proyecto debe estar bien organizado y separado por responsabilidades. El backend debe dividirse en clases para controlar las peticiones, otra para la lógica del negocio y otra para representar los datos. El frontend debe tener cada pantalla en su propio archivo con nombres que describan lo que contienen. El código debe tener comentarios en las partes más importantes. |
| **Criterio de Aceptación** | La estructura del proyecto debe ser clara para que cualquier desarrollador pueda entender qué hace cada parte del sistema sin necesitar una explicación adicional. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | La organización del código debe adaptarse a las tecnologías que ya se están usando en el proyecto, sin agregar herramientas o librerías nuevas que no hayan sido planeadas desde el inicio. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-06 |
| **Nombre del Requisito** | Compatibilidad con navegadores web modernos |
| **Categoría** | Portabilidad |
| **Descripción del Requisito** | El sistema debe funcionar correctamente en los navegadores web más usados actualmente, como Google Chrome, Mozilla Firefox y Microsoft Edge. Las pantallas, los formularios, los modales y los gráficos deben verse y comportarse igual sin importar cuál de esos navegadores use el dueño del negocio o sus empleados. |
| **Criterio de Aceptación** | Todas las pantallas y funcionalidades del sistema deben verse y funcionar correctamente en las versiones más recientes de Chrome, Firefox y Edge, sin errores visuales ni de funcionamiento. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | No se garantiza compatibilidad con versiones muy antiguas de los navegadores ni con Internet Explorer. Se recomienda el uso de navegadores actualizados. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-07 |
| **Nombre del Requisito** | Integridad de los datos registrados |
| **Categoría** | Confiabilidad |
| **Descripción del Requisito** | El sistema debe garantizar que los datos guardados sean consistentes y no queden a medias si ocurre un error durante una operación. Por ejemplo, si se está guardando una venta y el sistema falla a mitad del proceso, no deben quedar registros incompletos ni el inventario desajustado. Las operaciones que afectan a más de una parte del sistema deben completarse todas o no completarse ninguna. |
| **Criterio de Aceptación** | Si ocurre un error durante el registro de una venta, compra o gasto, el sistema no debe guardar información parcial. Los datos del inventario, ventas y gastos deben quedar siempre en un estado consistente. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Esta característica depende de que la base de datos esté configurada para soportar transacciones. Si la base de datos no lo soporta, esta garantía no puede cumplirse completamente. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-08 |
| **Nombre del Requisito** | Escalabilidad para manejar más datos con el tiempo |
| **Categoría** | Escalabilidad |
| **Descripción del Requisito** | El sistema debe seguir funcionando bien a medida que el negocio crece y se acumulan más registros de ventas, compras, productos y clientes. Las consultas que muestra el sistema no deben volverse lentas aunque la base de datos tenga miles de registros guardados. |
| **Criterio de Aceptación** | El sistema debe mantener tiempos de respuesta aceptables aunque la base de datos tenga más de 10.000 registros en las tablas principales como ventas, compras y productos. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | La escalabilidad está limitada por las características del servidor donde esté instalado el sistema. Para negocios muy grandes puede ser necesario mejorar el hardware del servidor. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-09 |
| **Nombre del Requisito** | Portabilidad del sistema entre equipos |
| **Categoría** | Portabilidad |
| **Descripción del Requisito** | El sistema debe poder instalarse y ejecutarse en diferentes computadores sin necesitar cambios en el código. El backend en Java debe poder correrse en cualquier equipo que tenga Java instalado, y el frontend debe abrirse desde cualquier navegador web moderno apuntando a la dirección del servidor. |
| **Criterio de Aceptación** | El sistema debe poder instalarse en un computador diferente siguiendo los pasos de configuración básicos, sin necesidad de modificar el código fuente. |
| **Prioridad** | ☐ Alta/Esencial   ☑ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | El equipo donde se instale debe tener Java en una versión compatible y una base de datos MySQL disponible. Sin estos requisitos el sistema no puede funcionar. |

---

### FASE V.ERS – Especificación de Requisitos No Funcionales

| Campo | Descripción |
|---|---|
| **Id. del Requisito** | RNF-10 |
| **Nombre del Requisito** | Registro de los movimientos financieros del negocio |
| **Categoría** | Trazabilidad |
| **Descripción del Requisito** | El sistema debe guardar un registro de todos los movimientos de dinero que ocurren en el negocio, ya sea por una venta, una compra o un gasto adicional. Este historial debe poder consultarse para saber en qué fechas entró o salió dinero y por qué concepto, lo que permite llevar un control claro de las finanzas del negocio a lo largo del tiempo. |
| **Criterio de Aceptación** | Cada vez que se registre una venta, una compra o un gasto, el sistema debe guardar automáticamente el movimiento financiero correspondiente con su fecha, tipo y monto. Este registro no debe poder modificarse ni eliminarse directamente. |
| **Prioridad** | ☑ Alta/Esencial   ☐ Media/Deseado   ☐ Baja/Opcional |
| **Restricciones** | Los movimientos financieros son de solo lectura para el usuario. Solo se generan automáticamente cuando se registra una transacción y no pueden editarse de forma manual. |

---