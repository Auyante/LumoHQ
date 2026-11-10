# Lumo HQ — Negocios Locales, Visibles

> **Plataforma web integral, comercial, operativa y financiera para digitalizar y posicionar negocios locales latinos en Midland-Odessa, Texas.**

---

## Visión General

**Lumo HQ** es una solución "llave en mano" diseñada para resolver el problema de invisibilidad digital que sufren miles de negocios en la cuenca Pérmica (Midland-Odessa, TX). La plataforma integra:
1. **Landing Page Bilingüe de Alta Conversión (ES/EN):** Optimizada con Mobile-First Responsive Design, simulación interactiva de canales de contacto (WhatsApp, SMS, llamadas, reservas) y comparador interactivo "Antes y Después".
2. **Motor de Demos Interactivas en Vivo:** Experiencias reales para nichos de alta rotación (Barbería El Rey con simulador de reservas y Taquería Los Compadres con menú digital).
3. **Generador y Kit QR de Reseñas de Google:** Herramienta para generar códigos QR directos y stickers descargables de mostrador.
4. **Pasarela de Pagos Stripe con Cumplimiento Legal de Texas:** Anticipo 50/50 ($250 / $500), suscripciones de mantenimiento mensual ($50 / $99), cálculo automático del **Texas Sales Tax (8.25%)**, firma electrónica de contratos y cláusulas anti-chargeback.
5. **CRM Comercial de 8 Señales de Calificación:** Sistema operativo basado en el Manual de Operaciones de Lumo HQ, con 5 lotes de prospección (30 negocios c/u), guiones oficiales de contacto y manejo de las 8 objeciones reales de venta.
6. **Portal de Clientes Autogestionado:** Guía interactiva "Cero Contraseñas" con delegación de acceso a Google Business Profile (Doc 02) y checklist de 5 días de lanzamiento.
7. **Panel Financiero y Tablero Dominical (Doc 04):** Cascada de reparto exacta (comisiones Stripe, comisiones escalonadas de Bárbara con tope de $500, reserva del 8%, regla de doble aprobación para gastos >$100 y monitor semanal del Riesgo #1).

---

## Stack Tecnológico

- **Framework Web:** [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Lenguaje:** TypeScript (Strict mode)
- **Estilos & Diseño:** Tailwind CSS, tipografías locales WOFF2 (`Bricolage Grotesque` y `Figtree`), paleta oficial (`Noche #1B2130`, `Ámbar #F2A33A`, `Brillo #FFD27A`, `Arena #FFF7EC`, `Pizarra #5B6375`, `Niebla #E6E8EE`).
- **Iconografía:** [Lucide React](https://lucide.dev/) (100% iconos vectoriales SVG, Cero Emojis).
- **Base de Datos & ORM:** Prisma ORM con SQLite / Local Persistence Engine.
- **Autenticación & Seguridad:** RBAC con cookies `HttpOnly`, `SameSite=Strict`, HMAC-SHA256 y hashing de contraseñas con PBKDF2 + SHA-512 + Sal de 16 bytes.
- **Pagos & Facturación:** Stripe API (Checkout Sessions, Webhooks con firma HMAC, Texas Sales Tax).
- **Testing:** Playwright (E2E), Vitest (Unitarias/Integración) y suite maestra de certificación (`scripts/verify-all.js`).

---

## Inicio Rápido

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd LumoHQ
npm install
```

### 2. Configurar variables de entorno
Copia el archivo de ejemplo y configura tus claves:
```bash
cp .env.example .env.local
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
# Disponible en: http://localhost:3000
```

### 4. Compilar para producción
```bash
npm run build
npm start
```

---

## Pruebas y Certificación de Calidad

Todo se corre con un solo comando. Necesita el servidor de desarrollo en marcha (`npx next dev -p 3100`) para la suite de seguridad en vivo:

```bash
BASE_URL=http://localhost:3100 node scripts/verify-all.js
```

Corre, en orden: TypeScript (`tsc`), ESLint, las pruebas de unidad (`npm test`: login cifrado, RBAC, WAF y honeypots, cero emojis, 8 señales y 8 objeciones, 3D y responsive, CRM, libro del IRS, tablero dominical), los 5 sprints (`scripts/verify-sprint1.js` a `verify-sprint5.js`) y la suite de seguridad en vivo (`npm run test:security`: ataques reales contra el servidor).

`npm run build` se corre aparte: detén antes el servidor de desarrollo, porque el build y `next dev` comparten la carpeta `.next`.

---

## Cuentas de Acceso y Roles (RBAC)

Los 3 usuarios del equipo se crean al primer arranque. Las contraseñas **nunca** van en el código:

- Defínelas en `.env.local` (`ADMIN_CARLOS_PASSWORD`, `ADMIN_LUIS_PASSWORD`, `SALES_BARBARA_PASSWORD`), o
- ejecuta `node scripts/rehash-users.js`, que genera contraseñas aleatorias y las muestra una sola vez.

| Usuario | Correo Electrónico | Rol |
| :--- | :--- | :--- |
| **Carlos Gómez** | `carlos@lumohq.com` | `SUPER_ADMIN` |
| **Luis Barbera** | `luis@lumohq.com` | `ADMIN_LUIS` |
| **Bárbara** | `barbara@lumohq.com` | `SALES_BARBARA` |

*Acceso al panel administrativo:* [`/login`](http://localhost:3100/login)

---

## Mapa de Rutas Principales

### Plataforma Pública
- `/` — Landing Page principal bilingüe con simulador de contacto y diagnóstico FTC/TCPA.
- `/demo/barberia` — Demo interactiva completa para Barbería (Midland, TX).
- `/demo/taqueria` — Demo interactiva completa para Taquería Los Compadres.
- `/herramientas/resenas` — Generador del Kit de Reseñas QR y sticker de mostrador.
- `/checkout` — Checkout Stripe con cálculo de impuestos de Texas y firma de contrato.
- `/propuesta/[id]` — Visualizador de propuesta comercial personalizada.

### Portal y Operaciones
- `/portal` — Portal del cliente con guía "Cero Contraseñas" y checklist de entrega en 5 días.
- `/login` — Inicio de sesión encriptado con rate-limiting y RBAC.
- `/admin/crm` — CRM con 5 lotes, 8 señales de calificación y guiones oficiales de objeciones.
- `/admin/produccion` — Gestión de la línea de montaje de 5 días (Carlos y Luis).
- `/admin/finanzas` — Cascada de reparto y libro de millas y gastos del IRS (Schedule C) con doble firma de Luis y Carlos para gastos de más de $100.
- `/admin/tablero-dominical` — Revisión semanal de 15 minutos: horas, Riesgo #1 y metas por hito, guardada en el servidor.
- `/admin/retencion` — Reporte mensual de métricas y gestión de tickets de cambios.
- `/admin/usuarios` — Gestión de cuentas, roles y restablecimiento de credenciales.
- `/admin/seguridad` — Centro de seguridad (SOC): bitácora con cadena de hashes, IPs bloqueadas, sesiones.

---

## Cumplimiento Legal y Normativo

- **FTC Act (Federal Trade Commission):** Políticas explícitas anti-promesas falsas (cero afirmaciones de "te pondremos de #1 en Google" o "duplicarás tus ventas").
- **TCPA (Telephone Consumer Protection Act):** Consentimiento previo obligatorio en todos los formularios de captación de leads.
- **Texas Comptroller:** Registro de DBA en Midland County y cobro del **8.25% de Sales Tax** en servicios aplicables.
- **Ciberseguridad OWASP ASVS Nivel 2:** Cabeceras HTTP estrictas (`Content-Security-Policy`, `HSTS Preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`), validación de firmas criptográficas HMAC en Stripe Webhooks y protección contra inyecciones XSS / SSRF.

---

## Licencia

Propiedad exclusiva de **Lumo HQ LLC / Luis Barbera DBA Lumo HQ (Midland, Texas)**. Todos los derechos reservados.

