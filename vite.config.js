import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main:            resolve(__dirname, 'index.html'),
                app:             resolve(__dirname, 'view/app.html'),
                register:        resolve(__dirname, 'view/register.html'),
                recuperar:       resolve(__dirname, 'view/recuperar.html'),
                nuevaContrasena: resolve(__dirname, 'view/nueva-contrasena.html'),
            },
        },
    },
});
