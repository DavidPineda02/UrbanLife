import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main:        resolve(__dirname, 'index.html'),
                home:        resolve(__dirname, 'view/home.html'),
                ventas:      resolve(__dirname, 'view/ventas.html'),
                compras:     resolve(__dirname, 'view/compras.html'),
                productos:   resolve(__dirname, 'view/productos.html'),
                clientes:    resolve(__dirname, 'view/clientes.html'),
                proveedores: resolve(__dirname, 'view/proveedores.html'),
                gastos:      resolve(__dirname, 'view/gastos.html'),
                perfil:      resolve(__dirname, 'view/perfil.html'),
                register:        resolve(__dirname, 'view/register.html'),
                recuperar:        resolve(__dirname, 'view/recuperar.html'),
                nuevaContrasena:  resolve(__dirname, 'view/nueva-contrasena.html'),
            },
        },
    },
});
