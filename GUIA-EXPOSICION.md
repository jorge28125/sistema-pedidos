# Guía de exposición — Sistema de Pedidos

Esta guía te lleva paso a paso para abrir el proyecto en VS Code, ejecutarlo y hacer la
demostración frente al docente.

---

## 1. Antes de empezar

Requisitos:

- **Node.js 22.16 a 24.x** (el proyecto usa `node:sqlite`, incluido en Node).
- **VS Code**.
- Descomprimir el ZIP y abrir **la carpeta del proyecto** en VS Code
  (`Archivo → Abrir carpeta`).

Para verificar que Node está instalado, abre la terminal de VS Code (`Ctrl + ñ`) y ejecuta:

```bash
node -v
```

Debe mostrar una versión entre `v22.16` y `v24.x`.

---

## 2. Instalación (solo la primera vez)

**Opción A — desde VS Code:**

1. `Ctrl + Shift + P` → escribe `Run Task` → elige **1. Instalar dependencias** si es la primera vez.
2. Para compilar y arrancar el sistema completo, ejecuta la tarea **Iniciar app compilada (un solo servidor)**.

**Opción B — desde la terminal:**

```bash
cd server
npm install

cd ../client
npm install
```

> No abras `client/index.html` directamente. La web debe compilarse y servirse desde Express.
> La forma más sencilla es usar `iniciar.bat`, que instala lo que falte y recompila el frontend
> antes de iniciar el servidor único.

---

## 3. Ejecutar el sistema

### Opción rápida (un solo servidor) — recomendada para exponer

Haz doble clic en `iniciar.bat`. También puedes abrir una terminal y ejecutar:

```bash
cd client
npm install
npm run build
cd ../server
npm install
npm start
```

Abre en el navegador la portada: <http://localhost:3001/>. Desde allí aparecen los accesos a Administración, Cocina y Menú de clientes.

También puedes entrar directamente a estas rutas:

- Cliente: <http://localhost:3001/pedido?mesa=1>
- Panel: <http://localhost:3001/admin/login>
- QR de mesas: <http://localhost:3001/admin/qr> (después de iniciar sesión como administrador)
- Cocina: <http://localhost:3001/cocina>

O simplemente haz doble clic en **`iniciar.bat`**. Este archivo recompila el frontend antes de iniciar el servidor.

### Opción desarrollo (dos servidores)

`Ctrl + Shift + P` → `Run Task` → **Iniciar todo (API + Web)**.

- API: <http://localhost:3001>
- Web: <http://localhost:5173>

La web hace proxy de `/api` hacia la API.

### Credenciales

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@pedidos.com` | `admin123` |
| Cocina | `cocina@pedidos.com` | `cocina123` |

---

## 4. Guion de demostración (8–10 minutos)

### Paso 1 — El problema (30 s)

> “En una cafetería universitaria se forman filas para pedir. Propongo un sistema donde el
> estudiante pide desde su celular escaneando un QR en la mesa, sin registrarse, y el
> personal gestiona todo desde un panel.”

### Paso 2 — Cliente pide por QR (2 min)

1. Abre <http://localhost:3001/pedido?mesa=1>.
2. Muestra el menú (productos con stock disponible). Los QR se generan desde el panel del administrador.
3. Agrega 2 o 3 productos al carrito.
4. Envía el pedido.
5. **Punto clave:** aparece un **código numérico de 12 dígitos**. Ese código identifica el
   pedido para entregarlo y facturarlo; el cliente no crea cuenta.

### Paso 3 — Cocina (2 min)

1. Abre <http://localhost:3001/cocina> e inicia sesión con el usuario de cocina.
2. Muestra las columnas **Pendientes**, **En preparación** y **Listos**.
3. Avanza el pedido que acabas de crear: *Iniciar preparación* → *Marcar listo* → *Entregar*.
4. Explica: la pantalla se actualiza sola cada 15 segundos; el rol de cocina no puede
   entrar al panel administrativo.

### Paso 4 — Panel administrativo (3 min)

Entra a <http://localhost:3001/admin/login> con el usuario admin.

1. **Dashboard:** ventas del día, pedidos entregados, ticket promedio, pedidos activos y
   top de productos. Al entregar el pedido se actualiza en vivo.
2. **Pedidos:** filtro por estado, avance del flujo y cancelación (al cancelar se
   **restaura el inventario**).
3. **Productos:** crear/editar productos y precios.
4. **Inventario:** stock por producto y alerta de bajo stock; cada pedido **descuenta**
   automáticamente.
5. **Usuarios:** administrar administradores y cocineros.
6. **Ventas:** cada pedido entregado genera una venta.
7. **Reportes:** gráfico de ventas por día y top de productos.
8. **QR de mesas:** genera, prueba, copia e imprime un QR distinto para cada mesa.
9. **Facturación:** emisión de factura electrónica opcional vía API (DIAN, Colombia).

### Paso 5 — Generar los códigos QR (1 min)

1. Desde el panel administrador, abre **QR de mesas**.
2. Comprueba que aparezcan las mesas y que cada una tenga un código diferente.
3. Pulsa **Probar QR** o **Imprimir todos los QR**.
4. Para compartir los QR por internet, genera los códigos desde el dominio público desplegado, no desde `localhost`.

### Paso 6 — Cierre técnico (1 min)

> “El backend es una API REST con Node.js y Express, la base de datos es SQLite embebida
> (sin instalar servidores), el frontend es React con Vite, la autenticación usa tokens y
> roles, y la facturación electrónica está desacoplada en una API configurable.”

---

## 5. Arquitectura

```
Navegador (cliente / admin / cocina)
        │  HTTP + JSON
        ▼
Frontend React (Vite)  ──proxy /api──►  API REST Express (:3001)
                                            │
                                            ▼
                                  SQLite (node:sqlite)
                                  server/data.sqlite
```

- **Backend:** Node.js 24, Express, `node:sqlite`, ESM.
- **Frontend:** React 18, React Router, Recharts, react-qr-code, Vite.
- **Autenticación:** token en memoria con TTL de 8 h y roles `admin` / `cocina`.
- **Cliente:** sin registro; se identifica con el número de mesa y recibe un código de pedido.

### Estructura de carpetas

```
sistema-pedidos/
├─ iniciar.bat               ← arranque rápido en Windows
├─ render.yaml               ← despliegue de un solo servicio en Render
├─ README.md                 ← documentación
├─ GUIA-EXPOSICION.md        ← esta guía
├─ .vscode/                  ← tareas y depuración para VS Code
├─ server/
│  ├─ src/
│  │  ├─ index.js            ← arranque Express + sirve la web compilada
│  │  ├─ db.js               ← esquema SQLite y datos de ejemplo
│  │  ├─ env.js              ← carga de .env
│  │  ├─ utils.js            ← tokens, hash de contraseñas, código de pedido
│  │  ├─ middleware/auth.js  ← validación de token y roles
│  │  └─ routes/             ← auth, mesas, pedidos, productos, inventario,
│  │                            usuarios, ventas, dashboard, reportes, facturas
│  └─ data.sqlite            ← base de datos (se crea sola)
└─ client/
   ├─ src/
   │  ├─ pages/              ← menú público, login, dashboard, pedidos, cocina, etc.
   │  ├─ components/         ← layout del panel
   │  └─ api.js              ← cliente HTTP
   └─ dist/                  ← web compilada lista para servir
```

---

## 6. Modelo de datos (resumen)

| Tabla | Campos principales |
| --- | --- |
| `users` | id, nombre, email, password_hash (scrypt), rol, activo |
| `productos` | id, nombre, descripción, precio, categoría, disponible |
| `inventario` | producto_id, stock, unidad, stock_mínimo |
| `mesas` | id, numero, capacidad |
| `pedidos` | id, codigo (12 dígitos), mesa_id, items (JSON), subtotal, iva, total, estado |
| `ventas` | id, pedido_id, total, created_at |
| `facturas` | id, venta_id, numero_factura, estado, respuesta_api |

Flujo de estados:

```
PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO   (genera venta)
PENDIENTE → CANCELADO                            (restaura stock)
```

IVA del 19 % aplicado al total del pedido (contexto Colombia).

---

## 7. API principal

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Login → token |
| GET | `/api/auth/me` | Usuario del token |
| GET | `/api/mesas/:numero/menu` | Menú público por mesa |
| POST | `/api/pedidos` | Crear pedido (público) |
| GET | `/api/pedidos?estado=` | Listar/filtrar pedidos (auth) |
| PATCH | `/api/pedidos/:id` | Cambiar estado (admin/cocina) |
| GET/POST/PATCH | `/api/productos` | Catálogo |
| GET/PATCH | `/api/inventario` | Stock |
| GET/POST/PATCH | `/api/usuarios` | Usuarios |
| GET | `/api/ventas` | Ventas |
| GET | `/api/dashboard` | Indicadores |
| GET | `/api/reportes/ventas` | Reportes |
| POST | `/api/facturas` | Factura electrónica (opcional) |

---

## 8. Facturación electrónica (Colombia)

La emisión está aislada en `server/src/routes/facturas.js` y se configura por variables de
entorno (copia `server/.env.example` a `server/.env`):

```ini
FACTURA_API_URL=https://api.fiscoapi.com/v1/facturas
FACTURA_API_TOKEN=tu_token
FACTURA_TIPO=1
```

Si no hay token configurado, el endpoint responde con un error controlado y el resto del
sistema sigue funcionando. Esto permite demostrar el flujo sin depender del proveedor.

---

## 9. Preguntas frecuentes del docente

**¿Por qué SQLite y no MySQL?**
Es embebida: no requiere instalar ni configurar un servidor de base de datos, ideal para
una demo y para desplegar rápido. El acceso está centralizado en `server/src/db.js`, por lo
que migrar a MySQL/PostgreSQL solo implica cambiar esa capa.

**¿Cómo se protegen las contraseñas?**
Se almacenan con hash `scrypt` y sal aleatoria (`server/src/utils.js`); nunca en texto plano.

**¿Cómo se controla el acceso?**
Tokens Bearer con expiración de 8 horas y middleware de roles: `admin` y `cocina`. El rol
de cocina solo accede a pedidos, no a usuarios, ventas ni facturación.

**¿Por qué el cliente no se registra?**
El objetivo es reducir la fricción: escanea el QR de la mesa, pide y recibe un código. No
se recogen datos personales, lo que simplifica el cumplimiento de protección de datos.

**¿Cómo se evita vender sin stock?**
Al crear el pedido se valida el stock, se descuenta en la misma operación y se rechaza con
HTTP 409 si no alcanza. Al cancelar un pedido se devuelve el stock.

**¿Cómo se genera el código del pedido?**
Con `crypto.randomInt` en un rango de 12 dígitos, evitando colisiones prácticas y códigos
predecibles.

**¿Qué pasa si se cae la API de facturación?**
El pedido y la venta no se ven afectados; la factura queda como intento fallido y se puede
reintentar. La facturación es un módulo opcional desacoplado.

---

## 10. Problemas comunes

| Problema | Solución |
| --- | --- |
| `node:sqlite` no existe | Actualiza Node a 22 o superior |
| `EADDRINUSE` en 3001 | Ya hay un servidor corriendo; ciérralo o cambia `PORT` en `server/.env` |
| La web no carga datos | Verifica que la API esté en el puerto 3001 |
| Quiero empezar de cero | Detén el servidor y borra `server/data.sqlite*`; se recrea con datos de ejemplo |
| El login falla tras reiniciar la API | Los tokens viven en memoria: vuelve a iniciar sesión |

---

## 11. Comandos útiles

```bash
# API
cd server && npm start        # producción/demo
cd server && npm run dev      # con recarga automática

# Web
cd client && npm run dev      # desarrollo en :5173
cd client && npm run build    # compilar a client/dist
```

¡Éxito en la exposición!
