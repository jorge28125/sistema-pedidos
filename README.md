# Sistema de Pedidos

Aplicación web de pedidos por QR con tres módulos conectados al mismo servidor:

- **Clientes:** consultan el menú y envían pedidos sin registrarse.
- **Administración:** controla pedidos, productos, inventario, usuarios, ventas, facturación, reportes y códigos QR.
- **Cocina:** recibe pedidos y actualiza su estado durante la preparación.

El frontend está construido con React + Vite; el backend usa Node.js, Express y SQLite.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jorge28125/sistema-pedidos)

## 1. Abrir el proyecto en el computador

Requisitos: Node.js 22.16 a 24.x y npm.

### Inicio rápido en Windows

1. Descomprime el proyecto.
2. Abre la carpeta `sistema-pedidos`.
3. Haz doble clic en `iniciar.bat`.
4. El programa instala las dependencias que falten, vuelve a compilar el frontend y levanta un único servidor.
5. Abre `http://localhost:3001/`.

La portada presenta los accesos a Administración, Cocina y Menú de clientes.

### Inicio desde la terminal

```bash
# Instalar dependencias del backend
cd server
npm install

# Instalar y compilar el frontend
cd ../client
npm install
npm run build

# Iniciar el servidor único
cd ../server
npm start
```

## 2. Direcciones del sistema

Todas las secciones usan el mismo servidor y el mismo dominio. Lo que cambia es la ruta:

| Sección | Dirección local | Para qué sirve |
| --- | --- | --- |
| Portada | `http://localhost:3001/` | Accesos a los tres módulos |
| Inicio de sesión | `http://localhost:3001/admin/login` | Acceso del personal |
| Panel administrador | `http://localhost:3001/admin` | Dashboard y administración |
| QR de mesas | `http://localhost:3001/admin/qr` | Crear mesas, generar y imprimir QR |
| Cocina | `http://localhost:3001/cocina` | Preparar y entregar pedidos |
| Menú cliente | `http://localhost:3001/pedido?mesa=1` | Menú público de la mesa 1 |

La ruta `/` es la portada; no es el menú de clientes. Los QR de los clientes deben apuntar a `/pedido?mesa=N`, nunca al panel administrativo.

## 3. Usuarios locales de demostración

En ejecución local, sin `server/.env`, se crean estos usuarios:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@pedidos.com` | `admin123` |
| Cocina | `cocina@pedidos.com` | `cocina123` |

El administrador entra en `/admin/login`. El personal de cocina puede entrar desde la portada o abrir `/cocina`; después del inicio de sesión será dirigido a su módulo.

**Seguridad:** estas credenciales son únicamente para la demostración local. No publiques el sistema usando estas contraseñas.

## 4. Generar los QR desde el administrador

1. Abre `/admin/login` e inicia sesión como administrador.
2. En el menú lateral entra a **QR de mesas**.
3. Verás un QR distinto para cada mesa registrada.
4. Usa **Probar QR** para verificar el menú o **Copiar enlace** para copiar la dirección.
5. Pulsa **Imprimir todos los QR** para imprimir las tarjetas.
6. Para añadir una mesa, escribe su número en **Agregar una mesa** y pulsa **Crear mesa**.

Cada código conduce a una dirección como:

```text
https://TU-DOMINIO/pedido?mesa=1
https://TU-DOMINIO/pedido?mesa=2
```

El QR se construye usando el dominio con el que abriste el panel. Por eso, cuando publiques el sistema en internet, abre **QR de mesas** desde el dominio público y vuelve a imprimir los códigos. No repartas QR creados con `localhost`, porque solo funcionan en el propio computador.

## 5. Publicar el sistema en internet con Render

El proyecto incluye `render.yaml` para publicarlo como **un solo servicio Node.js**. No lo publiques como sitio estático: también se necesita el backend y su base de datos.

1. Sube la carpeta del proyecto a un repositorio de GitHub.
2. En Render entra a **New → Blueprint** y conecta ese repositorio.
3. Render leerá `render.yaml`, compilará React y ejecutará Express.
4. Completa las variables solicitadas: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `KITCHEN_EMAIL` y `KITCHEN_PASSWORD`. Usa correos y contraseñas privadas, distintas a las de demostración.
5. Cuando el despliegue termine, Render mostrará una dirección pública similar a `https://sistema-pedidos-xxxx.onrender.com`.
6. Abre esa dirección, inicia sesión como administrador y entra a **QR de mesas**.
7. Imprime los QR generados desde el dominio público y colócalos en las mesas.

### Plan gratuito: cómo se comportan los datos

`render.yaml` está configurado para el plan **free** de Render, que tiene dos consecuencias:

- El servicio se **duerme tras 15 minutos sin visitas** y tarda alrededor de un minuto en despertar. Para una exposición, abre la URL unos minutos antes y evita dejar la aplicación inactiva durante la demostración.
- El sistema de archivos es **efímero**: la base SQLite (`/tmp/pedidos.sqlite`) se borra al dormir, reiniciar o redesplegar. Al despertar se crean de nuevo los usuarios, productos y mesas de demostración, pero se pierden los pedidos y los cambios realizados.

Si necesitas conservar los datos, cambia el servicio a un plan pago, añade el disco persistente y ajusta `DB_PATH` a `/var/data/data.sqlite` (el bloque está comentado en `render.yaml`).

Si ya existe una base de datos con usuarios, cambiar las variables de entorno no modifica automáticamente las contraseñas guardadas. Para una instalación nueva, configura primero las cuatro variables solicitadas; si ya habías desplegado el sistema, cambia las contraseñas desde la gestión de usuarios o reinicia la base de datos solo si puedes perder los datos actuales.

## 6. Funciones del sistema

### Cliente
- Abre el menú desde el QR asignado a su mesa.
- Consulta productos disponibles y sus precios.
- Agrega productos al carrito y envía el pedido sin crear una cuenta.
- Recibe un código numérico para identificar su pedido.

### Administrador
- Dashboard con ventas del día, ticket promedio y pedidos activos.
- Consulta y gestión del ciclo de pedidos.
- Creación y edición de productos y precios.
- Control y ajuste de inventario.
- Creación y administración de usuarios.
- Consulta de ventas, facturación y reportes.
- Generación e impresión de QR por mesa.

### Cocina
- Visualiza pedidos pendientes, en preparación y listos.
- Avanza los estados del pedido.
- La pantalla se actualiza automáticamente cada 15 segundos.

## 7. Flujo del pedido

```text
Cliente escanea QR
        ↓
Abre /pedido?mesa=N
        ↓
Agrega productos y envía pedido
        ↓
Pedido aparece en Administración y Cocina
        ↓
PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO
        ↓
Al entregar, se registra una venta
```

Si un pedido pendiente se cancela, el inventario de sus productos se restaura.

## 8. Base de datos y variables

SQLite se crea automáticamente al iniciar el servidor. En local se guarda en `server/data.sqlite` (puede cambiarse con `DB_PATH`). Los productos de demostración y las mesas 1 a 10 se agregan cuando la base está vacía.

Para configurar variables locales, copia `server/.env.example` a `server/.env` y modifica los valores. En producción usa las variables del panel del proveedor de hosting.

Variables principales:

- `PORT`: puerto HTTP (Render define el puerto automáticamente).
- `DB_PATH`: ruta del archivo SQLite.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: cuenta inicial de administrador.
- `KITCHEN_EMAIL` y `KITCHEN_PASSWORD`: cuenta inicial de cocina.
- `FACTURA_API_URL`, `FACTURA_API_TOKEN` y `FACTURA_TIPO`: integración opcional de facturación.

## 9. API principal

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Inicio de sesión y token |
| GET | `/api/mesas` | Consultar mesas |
| POST | `/api/mesas` | Crear mesa (administrador) |
| GET | `/api/mesas/:numero/menu` | Menú público de una mesa |
| POST | `/api/pedidos` | Crear pedido desde el menú público |
| GET | `/api/pedidos` | Listar pedidos (personal autenticado) |
| PATCH | `/api/pedidos/:id` | Actualizar estado de pedido |
| GET/POST/PATCH | `/api/productos` | Catálogo de productos |
| GET/PATCH | `/api/inventario` | Control de inventario |
| GET/POST/PATCH | `/api/usuarios` | Gestión de usuarios |
| GET | `/api/dashboard` | Indicadores del administrador |
| GET | `/api/ventas` | Ventas registradas |
| GET | `/api/reportes/ventas` | Reportes de ventas |
| POST | `/api/facturas` | Emisión opcional de factura |
| GET | `/api/health` | Estado del servidor |
