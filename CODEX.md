# CODEX.md

> Especificación maestra del proyecto de micro-herramientas desktop.
> Este archivo complementa `AGENTS.md`. Codex DEBE leer ambos antes de planear, modificar o generar código.

## 0. Jerarquía de instrucciones

1. Instrucciones del sistema/entorno de Codex.
2. Solicitud explícita y actual del usuario.
3. `AGENTS.md` del repositorio y cualquier `AGENTS.md` más específico por directorio.
4. Este `CODEX.md`.
5. Documentación del proyecto (`README.md`, ADRs, issues, backlog).

`AGENTS.md` y `CODEX.md` son los defaults persistentes del proyecto. Una solicitud explícita del usuario puede cambiar una decisión de arquitectura, pero Codex debe señalar el impacto antes de ejecutar una desviación importante.

Si existe un conflicto real entre `AGENTS.md` y `CODEX.md` y la tarea actual no lo resuelve explícitamente, detener la implementación de esa parte, documentar el conflicto y seguir la regla de mayor prioridad. No reinterpretar silenciosamente la arquitectura.

Antes de comenzar cualquier tarea:

- Leer `AGENTS.md`.
- Leer `CODEX.md`.
- Leer `HERRAMIENTAS_PENDIENTES.md` si existe.
- Revisar el código actual antes de crear abstracciones nuevas.
- Implementar el cambio mínimo coherente con la arquitectura.
- Ejecutar lint, typecheck, tests y build aplicables antes de considerar una tarea terminada.

---

## 1. Visión

Construir un ecosistema de micro-utilidades desktop para **Windows y macOS**, con una experiencia simple, rápida y consistente.

La filosofía del producto es:

> **Una tool. Un problema. Una interfaz obvia.**

Objetivos:

- Crear herramientas pequeñas que una persona pueda comprender en menos de 10 segundos.
- Mantener precios de entrada bajos para favorecer adopción y reconocimiento de marca.
- Tener una sola aplicación/hub y un solo codebase.
- Comercializar herramientas individualmente y en bundles.
- Permitir que una compra desbloquee únicamente los módulos adquiridos.
- Hacer que el usuario descubra otras tools sin convertir la app en una tienda agresiva.
- Priorizar funciones locales/offline cuando no exista una razón fuerte para usar un servidor.
- Mantener el sistema preparado para crecer sin sobrearquitectura prematura.

No es objetivo inicial:

- Crear un SaaS complejo.
- Crear un marketplace de terceros.
- Crear un sistema de plugins descargables.
- Añadir IA por marketing si la tool no la necesita.
- Requerir cuenta para funciones que pueden funcionar localmente.
- Implementar las 270 ideas de este documento de golpe.

---

## 1.1 Enmienda 2026-08-27 — Distribución web-first y monetización simplificada

Decisión de negocio confirmada explícitamente por el usuario. Esta enmienda tiene prioridad sobre cualquier texto de las secciones 2, 3, 9, 10 y 23 que la contradiga, hasta que esas secciones se reescriban por completo.

### Distribución

- El canal principal de lanzamiento es **web**, no desktop. El build de Vite ya funciona en navegador (adapter de localStorage) sin cambios adicionales de stack.
- Priorizar tools 100% client-side (sin filesystem real, sin red de bajo nivel, sin acceso a SO). Ver el mapa de toolkits consolidados en `HERRAMIENTAS_PENDIENTES.md`.
- Tauri/desktop deja de ser el objetivo del lanzamiento inicial. Se retoma como add-on **"Pro Desktop"** para el subconjunto de tools que sí requieren acceso nativo (filesystem batch, red, sistema, overlays de pantalla). No se descarta desktop, solo deja de bloquear el lanzamiento.

### Monetización

- Se reemplaza el modelo de compra por-tool/por-bundle como mecanismo principal de acceso. **Todas las tools están abiertas y usables en su versión gratuita**, cada una con sus propios límites sensatos (menos slots, sin export, límites de lote, marca de agua, etc.).
- Existe un único producto: **TinyTools Pro** (pago único, PWYW con precio sugerido, vendido en Gumroad). Comprarlo desbloquea las funciones Pro en _todas_ las tools a la vez.
- Se modela como un entitlement único (p. ej. `app.pro`) consultado con la misma interfaz `EntitlementService.has()` de la sección 7 — no cambia el contrato, solo el uso: en vez de `has("tool.rename")` para decidir si la tool _abre_, las tools usan `has("app.pro")` para decidir si renderizan sus funciones avanzadas. Ninguna tool queda bloqueada por completo.
- Los bundles temáticos (sección 2.3) quedan en pausa como mecanismo de venta principal; podrían reintroducirse solo para el add-on Desktop Pro más adelante.
- Los precios "por tool" listados en el catálogo (sección 25 / `HERRAMIENTAS_PENDIENTES.md`) quedan como referencia histórica de valor relativo entre tools, no como precios de venta reales.

### Verificación de licencia (corrección 2026-08-27, implementada en Fase B)

La API de verificación de licencias de Gumroad (`POST https://api.gumroad.com/v2/licenses/verify`) **no soporta CORS**: no puede llamarse directo desde JavaScript de navegador. La arquitectura implementada usa una función serverless propia, sin estado y sin base de datos (no un "backend" en el sentido de la sección 1, solo un proxy):

- `api/verify-license.ts` — Vercel Edge Function (host elegido: Vercel, el usuario ya tenía cuenta ahí — ver nota de Fase C sobre los términos del plan Hobby). Recibe `{ licenseKey }` del cliente, reenvía la verificación a Gumroad server-to-server (donde CORS no aplica), y responde `{ valid: boolean, error?: string }` con headers CORS propios.
- `src/core/entitlements/GumroadEntitlementProvider.ts` — implementa `EntitlementService`. Cachea el resultado localmente (`storage`) para uso offline; `refresh()` revalida en segundo plano sin bloquear el arranque y, si falla por conectividad, conserva el último estado conocido en vez de revocar Pro. El endpoint es configurable (`VITE_VERIFY_ENDPOINT`, default `/api/verify-license`) para que el futuro build de escritorio pueda apuntar a la URL absoluta del sitio desplegado.
- Requiere una variable de entorno server-side en Vercel: `GUMROAD_PRODUCT_ID` (el id de producto de Gumroad, no el permalink — Gumroad exige `product_id` para productos creados desde 2023-01-09). No existe valor real hasta que el producto "TinyTools Pro" se cree en Gumroad (Fase C).
- Ads (ver Fase B más abajo): banner discreto solo en build web (`!isTauri()`) y solo para usuarios no-Pro, nunca dentro de una tool — solo al final del Hub. Inerte hasta configurar `VITE_ADSENSE_CLIENT_ID`/`VITE_ADSENSE_SLOT_ID` (ver `.env.example`), lo cual requiere cuenta de AdSense aprobada sobre un dominio real (Fase C).

---

## 2. Modelo de producto y distribución

### 2.1 Una aplicación, múltiples productos

Debe existir **un único cliente desktop principal** (nombre temporal: `TinyTools`; el nombre final de marca puede cambiar).

Todos los productos individuales apuntan al mismo instalador. La diferencia entre compras se expresa mediante **entitlements**.

Ejemplo:

```text
Desktop App
├── Count.       owned
├── Time.        owned
├── Awake.       free
├── Rename.      locked
├── Split CSV.   locked
└── QR.          locked
```

### 2.2 Gumroad

Gumroad es un canal de distribución/venta, no el núcleo de la arquitectura.

Reglas:

- Cada tool puede tener su propia página/producto.
- Deben existir bundles temáticos.
- Todos pueden entregar el mismo instalador desktop.
- Nunca acoplar un módulo directamente a un identificador o API concreta de Gumroad.
- Todo acceso pasa por `EntitlementService`.
- Si el proveedor de pagos cambia, las tools no deben necesitar modificaciones.
- No hardcodear precios en la lógica de negocio. Los precios mostrados deben venir de un catálogo/configuración actualizable.
- Nunca diseñar un flujo para eludir comisiones o condiciones de una plataforma. Si una venta ocurre en un canal, respetar las reglas vigentes de ese canal.

### 2.3 Bundles

Un bundle equivale a un conjunto de entitlements.

Ejemplo:

```ts
type EntitlementId = "tool.count" | "tool.timer" | "tool.rename" | "tool.split_csv";

type Bundle = {
  id: string;
  entitlements: EntitlementId[];
};
```

La aplicación sólo pregunta:

```ts
canUse("tool.rename");
```

Nunca:

```ts
if (gumroadLicenseForRename) ...
```

---

## 3. Plataformas soportadas

Objetivo obligatorio:

- Windows 10/11.
- macOS en hardware Apple Silicon.
- macOS Intel mientras las dependencias elegidas lo soporten razonablemente.

No introducir APIs exclusivas de Windows o macOS dentro de componentes React. Toda diferencia de plataforma debe encapsularse en adaptadores o comandos Tauri/Rust.

Las rutas de archivos, separadores, permisos, ventanas, shortcuts y comportamiento del filesystem deben tratarse de forma cross-platform.

Linux, iOS y Android quedan fuera del alcance inicial aunque Tauri pueda soportarlos.

---

## 4. Stack tecnológico obligatorio

### Desktop shell

- **Tauri 2**.
- Rust para funciones nativas, filesystem avanzado, operaciones de alto volumen o acceso al sistema.
- Plugins oficiales de Tauri cuando cubran una necesidad antes de escribir implementación propia.

### Frontend

- **React**.
- **TypeScript en modo strict**.
- **Vite**.
- **Tailwind CSS**.
- **Lucide** para iconografía.
- **Zustand** para estado global pequeño/mediano cuando aporte valor.
- Estado local de React para estado estrictamente de componente.

### Datos locales

- Tauri Store para preferencias y configuración ligera.
- SQLite mediante el plugin SQL oficial de Tauri cuando exista historial, tablas, relaciones, logs o datasets locales.
- Migraciones versionadas desde la primera vez que se introduzca SQLite.

### Testing

- Vitest para lógica TypeScript.
- React Testing Library para comportamiento UI relevante.
- Tests Rust para comandos/servicios nativos donde sea útil.
- E2E sólo para flujos de alto valor cuando la base sea estable.

### Calidad

- ESLint.
- Prettier.
- TypeScript strict.
- `cargo fmt`.
- `cargo clippy`.
- Usar el package manager ya definido por el repositorio. Si el repo está vacío, preferir `pnpm`.
- No introducir una librería pesada cuando una implementación pequeña y mantenible sea suficiente.

### Versiones

Usar las **últimas versiones estables compatibles** en el momento de inicializar o actualizar el proyecto. No hacer upgrades mayores no solicitados dentro de una tarea de funcionalidad.

---

## 5. Principios de arquitectura

### 5.1 Modular monolith

La V1 es un **monolito modular**, no microservicios y no plugins descargables.

Todas las tools viajan con el cliente. El entitlement decide si pueden abrirse.

### 5.2 Separación

```text
UI
 ↓
Tool/Application logic
 ↓
Core services
 ↓
Tauri/native adapters
 ↓
OS / filesystem / network
```

Los componentes UI no deben contener lógica de licencia, filesystem complejo, HTTP de proveedores de pago ni SQL directo.

### 5.3 Estructura objetivo

```text
/
├── AGENTS.md
├── CODEX.md
├── HERRAMIENTAS_PENDIENTES.md
├── README.md
├── package.json
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes/
│   │   ├── layout/
│   │   └── command-palette/
│   ├── core/
│   │   ├── catalog/
│   │   ├── entitlements/
│   │   ├── licensing/
│   │   ├── storage/
│   │   ├── updater/
│   │   ├── platform/
│   │   ├── telemetry/
│   │   └── errors/
│   ├── components/
│   │   ├── ui/
│   │   ├── navigation/
│   │   └── tool-shell/
│   ├── design-system/
│   │   ├── tokens.css
│   │   └── primitives/
│   ├── tools/
│   │   ├── count/
│   │   ├── timer/
│   │   └── ...
│   ├── stores/
│   └── lib/
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   ├── services/
│   │   ├── platform/
│   │   └── lib.rs
│   ├── capabilities/
│   └── tauri.conf.json
└── docs/
    ├── adr/
    └── release/
```

No crear `packages/`, microservicios ni workspaces adicionales hasta que exista una necesidad real.

---

## 6. Contrato de una Tool

Cada herramienta vive aislada en `src/tools/<tool-id>/`.

Estructura sugerida:

```text
src/tools/count/
├── manifest.ts
├── CountTool.tsx
├── store.ts
├── domain.ts
├── components/
└── __tests__/
```

Cada tool debe exportar un manifest tipado:

```ts
export type ToolManifest = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  entitlement: `tool.${string}`;
  icon: string;
  route: `/tools/${string}`;
  free: boolean;
  featured?: boolean;
  keywords: string[];
};
```

El catálogo global se genera desde manifests. Evitar duplicar nombre, categoría, route o entitlement en varios lugares.

Reglas:

- Una tool puede conocer servicios del `core`.
- Una tool no puede importar internals de otra tool.
- Si dos tools comparten lógica verdaderamente genérica, extraerla a `core` o `lib` sólo después de la segunda necesidad real.
- No crear abstracciones “por si acaso”.

---

## 7. Entitlements y licensing

Definir una interfaz estable, por ejemplo:

```ts
interface EntitlementService {
  has(entitlement: string): Promise<boolean>;
  listOwned(): Promise<string[]>;
  refresh(): Promise<void>;
}
```

Proveedores posibles:

- `LocalDevEntitlementProvider`: desarrollo/pruebas.
- `CachedEntitlementProvider`: lectura offline segura.
- `RemoteEntitlementProvider`: backend futuro.
- Adaptador Gumroad/backend: fuera de las tools.

Requisitos:

- Nunca almacenar secretos privados del proveedor de pagos dentro del cliente.
- No confiar en flags editables del frontend como autoridad de compra.
- Preparar cache local firmada/verificable para permitir uso offline cuando el modelo de licencia lo permita.
- La UX de pérdida temporal de Internet debe ser amable.
- Los productos gratuitos no requieren una licencia online para poder abrirse.
- Las compras de bundle se normalizan a una lista de entitlements.
- Soportar en diseño futura restauración de compra sin acoplarse a una sola tienda.

La V1 puede comenzar con entitlements mock/locales para construir el producto antes de implementar pagos reales.

---

## 8. Catálogo de productos

Debe existir una fuente única de verdad para metadatos comerciales.

Separar:

- `ToolManifest`: metadatos funcionales/UX estables.
- `ProductCatalog`: precio, URL de compra, disponibilidad, bundles y promociones.

No usar valores monetarios dispersos en componentes.

Formato conceptual:

```ts
type ProductCatalogItem = {
  toolId: string;
  currency: "USD";
  priceCents: number | null;
  pricingMode: "fixed" | "free" | "pwyw";
  purchaseUrl?: string;
  available: boolean;
};
```

La aplicación puede mostrar “Discover”, pero:

- primero muestra herramientas del usuario;
- la tienda es secundaria;
- no usar popups agresivos;
- no bloquear la navegación con upsells;
- no mostrar más de una llamada comercial prominente por pantalla.

---

## 9. Diseño visual

### Dirección

Minimalista, premium, amigable y funcional.

Referencias conceptuales:

- claridad de utilidades de macOS;
- velocidad de interacción tipo command palette;
- densidad cuidada de productos como Linear/Raycast;
- sin copiar marcas, layouts, assets o trade dress de terceros.

### Reglas

- Mucho espacio visual.
- Una acción primaria clara por tool.
- Poco texto.
- Bordes discretos.
- Sombras sutiles, no “dashboard SaaS”.
- Evitar gradients decorativos salvo que la identidad final de marca los requiera.
- No abusar de cards.
- No usar glassmorphism por defecto.
- No usar emojis como iconografía de producto.
- Iconos consistentes con Lucide o assets propios.
- Animaciones breves y funcionales.
- Respetar `prefers-reduced-motion`.

### Temas

Obligatorio:

- Light.
- Dark.
- System.

Los colores deben vivir en tokens CSS. No dispersar hex values por componentes.

Tokens mínimos:

- background
- surface
- surface-hover
- text-primary
- text-secondary
- border
- accent
- accent-foreground
- success
- warning
- danger
- radius-sm/md/lg
- spacing
- shadows

La marca/accent definitivo se puede cambiar después sin reescribir componentes.

### Tipografía

Priorizar system font stack para rendimiento y naturalidad cross-platform. No empaquetar fuentes comerciales sin licencia.

### Accesibilidad

- Navegación por teclado.
- Focus visible.
- Labels accesibles.
- Contraste suficiente.
- Targets de interacción razonables.
- No depender únicamente del color para comunicar estado.

---

## 10. Layout del Hub

Desktop-first.

```text
┌───────────────────────────────────────────────────────────┐
│                        App title                      ⚙   │
├──────────────┬────────────────────────────────────────────┤
│ Home         │                                            │
│              │  Your tools                                │
│ YOUR TOOLS   │  [ Count ] [ Timer ] [ Awake ]            │
│ Count        │                                            │
│ Timer        │  Discover                                  │
│ Awake        │  [ Rename 🔒 ] [ Split 🔒 ] [ QR 🔒 ]     │
│              │                                            │
│ DISCOVER     │                                            │
│ ...          │                                            │
│              │                                            │
│ Settings     │                                            │
└──────────────┴────────────────────────────────────────────┘
```

Cuando haya muchas tools:

- sidebar;
- búsqueda;
- categorías;
- favoritos/recientes si hay evidencia de utilidad;
- command palette `Ctrl+K` / `Cmd+K`.

No implementar pestañas horizontales para todas las tools.

---

## 11. Tool shell

Cada módulo se ejecuta dentro de un shell común:

- botón regresar;
- icono;
- nombre;
- menú contextual opcional;
- contenido específico;
- estado de licencia resuelto antes de montar acciones sensibles.

La tool debe sentirse como una pequeña app independiente aunque comparta shell.

Ejemplo Count:

- número grande;
- `-`;
- `+`;
- reset discreto;
- shortcuts;
- persistencia opcional.

No añadir estadísticas, gráficas, login, exportación o IA a una tool básica salvo requerimiento explícito.

---

## 12. Persistencia

### Tauri Store

Usar para:

- tema;
- idioma;
- preferencias;
- última tool abierta;
- configuración simple;
- flags no sensibles.

### SQLite

Usar sólo si se necesita:

- historial;
- logs;
- varias entidades;
- búsquedas;
- datasets locales;
- relaciones;
- migraciones.

Nunca almacenar credenciales sensibles en texto plano.

---

## 13. Actualizaciones

Preparar la arquitectura para el updater oficial de Tauri.

Reglas:

- actualizaciones firmadas;
- canal estable inicialmente;
- SemVer;
- changelog;
- no actualizar silenciosamente si la plataforma o UX requiere confirmación;
- separar `check`, `download`, `install`;
- tolerar que el endpoint no esté disponible.

La infraestructura real del updater puede agregarse después del MVP, pero no diseñar una arquitectura que lo impida.

---

## 14. Seguridad

- Principio de mínimos permisos de Tauri.
- Capabilities por necesidad.
- No habilitar APIs peligrosas globalmente.
- Validar rutas y entradas antes de operaciones destructivas.
- Mostrar preview para rename/move/delete/batch.
- Operaciones destructivas requieren confirmación clara.
- No ejecutar shell arbitrario desde datos del usuario.
- No interpolar entradas en comandos del sistema.
- No guardar tokens privados del backend en repositorio o frontend.
- Sanitizar datos renderizados.
- Mantener dependencias pequeñas y justificadas.

---

## 15. Privacidad y telemetría

La propuesta de valor debe favorecer herramientas locales.

Por defecto:

- archivos del usuario no salen de su máquina;
- no subir contenido para analytics;
- no registrar nombres/rutas de archivos;
- no analytics invasivo.

Si en el futuro hay telemetría:

- documentarla;
- minimizarla;
- agregar opt-out cuando corresponda;
- usar eventos de producto generales, no contenido privado.

---

## 16. Internacionalización

Preparar strings de UI para i18n aunque la primera versión pueda salir en inglés.

Idiomas objetivo iniciales:

- English.
- Español.

No hardcodear textos importantes en lógica de dominio.

---

## 17. Rendimiento

La filosofía de las tools exige sensación inmediata.

- Lazy-load de módulos si ayuda al tiempo inicial.
- No cargar SQLite si una tool no lo necesita.
- Operaciones pesadas no deben bloquear la UI.
- Usar Rust/background work para lotes grandes cuando corresponda.
- Mostrar progreso y cancelación en procesos largos.
- Evitar recalcular previews masivos innecesariamente.
- Virtualizar listas grandes.

---

## 18. Manejo de errores

Nunca mostrar errores técnicos crudos al usuario como experiencia final.

Modelo:

- mensaje corto y humano;
- detalle opcional;
- acción de recuperación;
- log técnico local cuando aporte valor.

Ejemplo:
`No pudimos renombrar 3 de 128 archivos. Ver detalles.`

Las operaciones por lote deben reportar éxitos parciales sin ocultarlos.

---

## 19. Convenciones de código

TypeScript:

- strict;
- evitar `any`;
- preferir tipos explícitos en límites de módulo;
- componentes pequeños;
- hooks con responsabilidad clara;
- no mezclar acceso nativo con presentación.

Naming:

- componentes: PascalCase;
- hooks: `useX`;
- services: `XService`;
- IDs de tools: `snake_case` o `kebab-case`, elegir uno y mantenerlo;
- entitlements: `tool.<id>`.

Rust:

- comandos finos;
- lógica reusable en services;
- errores tipados;
- no `unwrap()` en rutas de producción salvo invariantes demostrables;
- `cargo fmt` y `cargo clippy`.

Commits y cambios:

- no reescribir archivos no relacionados;
- no hacer refactors masivos durante una feature pequeña;
- no eliminar comportamiento existente sin solicitud.

---

## 20. Definition of Done

Una feature/tool no está terminada hasta que:

- funciona en desarrollo;
- TypeScript compila sin errores;
- lint pasa;
- tests relevantes pasan;
- `cargo check`/build aplicable pasa;
- estados vacío/loading/error están considerados cuando aplican;
- teclado funciona razonablemente;
- dark/light no se rompe;
- no introduce dependencias innecesarias;
- se documenta en backlog/changelog según corresponda.

Para cambios con filesystem:

- probar rutas con espacios;
- nombres Unicode;
- archivos sin extensión;
- colisiones;
- cancelación/error parcial;
- Windows y macOS conceptualmente.

---

## 21. Política de nuevas herramientas

Antes de implementar una tool:

1. Confirmar que aparece en `HERRAMIENTAS_PENDIENTES.md` o agregarla.
2. Definir una oración: “Esta tool hace X”.
3. Definir input, output y acción primaria.
4. Definir si es free/PWYW/paid.
5. Definir entitlement.
6. Identificar bundle(s).
7. Definir qué NO hará la V1.
8. Implementar manifest.
9. Implementar UI mínima.
10. Añadir tests de lógica.
11. Actualizar backlog a estado correspondiente.

Si la descripción necesita varias frases para explicar el valor principal, reconsiderar el alcance.

---

## 22. Backlog obligatorio: HERRAMIENTAS_PENDIENTES.md

Codex DEBE crear y mantener `HERRAMIENTAS_PENDIENTES.md`.

Si no existe:

- generarlo usando el **Catálogo canónico** de este documento;
- incluir todas las 270 herramientas;
- agrupar por categoría;
- incluir: `ID`, nombre, descripción, precio recomendado USD, bundle(s), dificultad estimada, estado y prioridad;
- estado inicial: `idea`;
- no comenzar a implementar automáticamente todas las tools.

Si existe:

- no reemplazar notas humanas;
- actualizar sólo las filas relacionadas;
- agregar nuevas ideas sin borrar las anteriores;
- mantener un contador de progreso.

Estados permitidos:

- `idea`
- `planned`
- `in_progress`
- `beta`
- `released`
- `paused`
- `retired`

Dificultad:

- `XS`: horas, UI/lógica mínima.
- `S`: tool pequeña.
- `M`: filesystem, codecs, parsing o lógica moderada.
- `L`: integración nativa/compleja; debe justificarse antes de iniciar.

Prioridad:

- `P0`: base del sistema.
- `P1`: primeras tools/alto potencial.
- `P2`: catálogo siguiente.
- `P3`: experimental/nicho.

---

## 23. Roadmap inicial

> Nota: las fases siguientes se escribieron antes de la enmienda 2026-08-27 (ver sección 1.1). El orden de ejecución vigente es: Wave 1 de toolkits web (client-side, sin filesystem) → desbloqueo Pro global → Desktop Pro add-on para las tools nativas. Ver `HERRAMIENTAS_PENDIENTES.md` para el mapa de toolkits consolidados.

### Phase 0 — Foundation

- Scaffold Tauri 2 + React + TypeScript + Vite + Tailwind.
- Configurar lint/format/typecheck/test.
- Design tokens.
- Light/Dark/System.
- App shell.
- Router.
- Tool registry/manifests.
- EntitlementService mock.
- ProductCatalog mock.
- Settings persistentes.
- Error boundary.
- Command palette básica.
- README de desarrollo.

### Phase 1 — Primeras tools

Implementar sólo:

1. `Count.` — free/PWYW.
2. `Time.` — paid.
3. `Awake.` — free/PWYW, si la implementación cross-platform está clara.
4. `Rename.` — paid, después de validar la arquitectura de filesystem.

### Phase 2 — Commerce foundation

- Entitlement cache.
- Modelo de bundles.
- Flujo `locked → purchase → restore/refresh`.
- Integración real de proveedor sólo cuando se defina el backend/canal.
- No guardar secretos del proveedor en el cliente.

### Phase 3 — Distribution

- builds Windows/macOS;
- firma;
- notarización macOS;
- code signing Windows cuando corresponda;
- updater firmado;
- release notes.

### Phase 4 — Catalog growth

Agregar tools una por una guiándose por uso, facilidad de mantenimiento y demanda.

---

## 24. Regla de Codex: no adelantarse

Codex NO debe:

- implementar cientos de tools por iniciativa propia;
- crear backend antes de necesitarlo;
- elegir Electron/MAUI/Avalonia sin una solicitud explícita de reevaluación;
- reemplazar Tauri;
- añadir Redux si Zustand/estado local basta;
- crear un sistema de plugins descargables;
- construir login obligatorio;
- inventar branding definitivo;
- agregar IA;
- añadir tracking;
- cambiar estrategia de precios sin instrucción;
- convertir cada tool en un proyecto independiente.

Ante una mejora “interesante” no pedida: documentarla como idea en lugar de implementarla.

---

## 25. Catálogo canónico de herramientas

Precio recomendado en USD. Es una referencia comercial, no un valor que deba quedar hardcodeado en UI.

### Conteo y seguimiento

|  ID | Tool                 | Propósito                                                           |        Precio | Bundle(s)              |
| --: | -------------------- | ------------------------------------------------------------------- | ------------: | ---------------------- |
| 001 | **Count.**           | Contador manual +1/-1 con reset y atajos de teclado.                | PWYW / Gratis | Starter / Productivity |
| 002 | **Multi Count.**     | Múltiples contadores con nombre, color y persistencia local.        |            $3 | Productivity           |
| 003 | **Goal Counter.**    | Contador con meta, porcentaje y progreso.                           |            $3 | Productivity           |
| 004 | **Event Tally.**     | Cuenta eventos por categoría y exporta CSV.                         |            $3 | Business / Operations  |
| 005 | **People Counter.**  | Entradas/salidas con ocupación actual.                              |            $4 | Operations             |
| 006 | **Lap Counter.**     | Cuenta vueltas, repeticiones o ciclos.                              |            $2 | Productivity           |
| 007 | **Click Logger.**    | Registra clics manuales con timestamp y etiqueta.                   |            $3 | Productivity           |
| 008 | **Session Counter.** | Conteos separados por sesión/turno.                                 |            $3 | Operations             |
| 009 | **Daily Counter.**   | Reinicia automáticamente un contador cada día y conserva historial. |            $3 | Productivity           |
| 010 | **Counter Board.**   | Panel de varios contadores grandes para operación o eventos.        |            $5 | Operations             |

### Tiempo y productividad

|  ID | Tool                  | Propósito                                             | Precio | Bundle(s)               |
| --: | --------------------- | ----------------------------------------------------- | -----: | ----------------------- |
| 011 | **Time.**             | Temporizador minimalista.                             |     $2 | Starter / Productivity  |
| 012 | **Multi Timer.**      | Varios temporizadores simultáneos con nombre.         |     $3 | Productivity            |
| 013 | **Pomodoro.**         | Pomodoro simple con ciclos configurables.             |     $3 | Productivity            |
| 014 | **Stopwatch.**        | Cronómetro con vueltas y exportación.                 |     $2 | Productivity            |
| 015 | **Countdown.**        | Cuenta regresiva hacia una fecha y hora.              |     $2 | Productivity            |
| 016 | **Meeting Cost.**     | Calcula en tiempo real el costo de una reunión.       |     $3 | Business / Productivity |
| 017 | **Focus Block.**      | Bloques de enfoque con historial local.               |     $3 | Productivity            |
| 018 | **Break Reminder.**   | Recordatorios para levantarse y descansar.            |     $2 | Productivity            |
| 019 | **Stretch Reminder.** | Recordatorios de estiramiento configurables.          |     $2 | Productivity            |
| 020 | **Freelance Timer.**  | Tiempo por proyecto multiplicado por tarifa por hora. |     $5 | Business / Productivity |

### Archivos y carpetas

|  ID | Tool                   | Propósito                                                     | Precio | Bundle(s) |
| --: | ---------------------- | ------------------------------------------------------------- | -----: | --------- |
| 021 | **Rename.**            | Renombrado masivo con prefijo, sufijo, secuencia y reemplazo. |     $4 | Files     |
| 022 | **Number Files.**      | Añade numeración secuencial a archivos.                       |     $2 | Files     |
| 023 | **Move By Type.**      | Ordena archivos en carpetas según extensión.                  |     $3 | Files     |
| 024 | **Folder Size.**       | Muestra rápidamente el tamaño de carpetas.                    |     $3 | Files     |
| 025 | **Large Files.**       | Encuentra los archivos más pesados de una carpeta o disco.    |     $3 | Files     |
| 026 | **Empty Folders.**     | Encuentra carpetas vacías y permite eliminarlas.              |     $2 | Files     |
| 027 | **Duplicate Names.**   | Detecta nombres de archivo duplicados en árboles de carpetas. |     $2 | Files     |
| 028 | **Duplicate Files.**   | Detecta duplicados por hash y tamaño.                         |     $5 | Files     |
| 029 | **File List.**         | Exporta inventario de archivos/carpetas a CSV o TXT.          |     $3 | Files     |
| 030 | **Extension Changer.** | Cambia extensiones de archivos en lote con vista previa.      |     $2 | Files     |

### Imágenes

|  ID | Tool                     | Propósito                                           | Precio | Bundle(s)           |
| --: | ------------------------ | --------------------------------------------------- | -----: | ------------------- |
| 031 | **Resize.**              | Redimensiona imágenes en lote.                      |     $3 | Images / Creator    |
| 032 | **Compress.**            | Comprime JPG/PNG/WebP localmente.                   |     $3 | Images / Creator    |
| 033 | **Convert Image.**       | Convierte entre PNG/JPG/WebP cuando sea compatible. |     $3 | Images / Creator    |
| 034 | **Crop Batch.**          | Recorte por relación o dimensiones en lote.         |     $4 | Images / Creator    |
| 035 | **Watermark.**           | Añade texto o imagen de marca de agua por lote.     |     $4 | Images / Creator    |
| 036 | **Image Metadata.**      | Visualiza y elimina metadatos EXIF seleccionados.   |     $3 | Images / Privacy    |
| 037 | **Image Contact Sheet.** | Crea hojas de contacto con miniaturas.              |     $4 | Images / Creator    |
| 038 | **Image Border.**        | Añade borde, padding o fondo uniforme en lote.      |     $3 | Images / Creator    |
| 039 | **Image Numberer.**      | Añade numeración visible a una serie de imágenes.   |     $3 | Images / Operations |
| 040 | **Color Extract.**       | Extrae colores dominantes de una imagen.            |     $3 | Images / Creator    |

### PDF y documentos

|  ID | Tool                   | Propósito                                         | Precio | Bundle(s)     |
| --: | ---------------------- | ------------------------------------------------- | -----: | ------------- |
| 041 | **Images to PDF.**     | Une imágenes ordenadas en un PDF.                 |     $3 | PDF           |
| 042 | **PDF to Images.**     | Convierte páginas de PDF a imágenes.              |     $3 | PDF           |
| 043 | **Merge PDF.**         | Une varios PDF.                                   |     $3 | PDF           |
| 044 | **Split PDF.**         | Divide un PDF por páginas o rangos.               |     $3 | PDF           |
| 045 | **Rotate PDF.**        | Rota páginas seleccionadas y guarda copia.        |     $2 | PDF           |
| 046 | **Reorder PDF.**       | Reordena páginas visualmente.                     |     $3 | PDF           |
| 047 | **Extract PDF Pages.** | Extrae páginas concretas a un nuevo PDF.          |     $2 | PDF           |
| 048 | **PDF Page Numbers.**  | Añade numeración simple de páginas.               |     $4 | PDF           |
| 049 | **PDF Metadata.**      | Consulta y limpia metadatos básicos de PDF.       |     $3 | PDF / Privacy |
| 050 | **PDF Contact Sheet.** | Genera una vista resumen en miniaturas de un PDF. |     $4 | PDF           |

### Texto y portapapeles

|  ID | Tool                   | Propósito                                                                | Precio | Bundle(s)           |
| --: | ---------------------- | ------------------------------------------------------------------------ | -----: | ------------------- |
| 051 | **Case.**              | Convierte texto entre mayúsculas, minúsculas, title, camel y snake case. | Gratis | Starter / Text      |
| 052 | **Text Cleaner.**      | Limpia espacios, saltos y caracteres invisibles.                         |     $2 | Text                |
| 053 | **Character Count.**   | Cuenta caracteres, palabras, líneas y párrafos.                          | Gratis | Starter / Text      |
| 054 | **Clipboard History.** | Historial local de texto copiado.                                        |     $4 | Text / Productivity |
| 055 | **Clipboard Cleaner.** | Limpia el portapapeles manual o automáticamente.                         |     $2 | Privacy / Text      |
| 056 | **Find Replace.**      | Buscar/reemplazar en texto con vista previa.                             |     $2 | Text                |
| 057 | **Line Tools.**        | Ordena, deduplica, invierte o numera líneas.                             |     $3 | Text / Developer    |
| 058 | **Slug Maker.**        | Convierte títulos a slugs limpios.                                       |     $2 | Text / Developer    |
| 059 | **Lorem Maker.**       | Genera texto placeholder configurable.                                   | Gratis | Developer / Creator |
| 060 | **Text Diff.**         | Compara dos textos y resalta diferencias.                                |     $3 | Text / Developer    |

### CSV y hojas de cálculo

|  ID | Tool                 | Propósito                                              | Precio | Bundle(s) |
| --: | -------------------- | ------------------------------------------------------ | -----: | --------- |
| 061 | **Split CSV.**       | Divide CSV grandes por número de filas.                |     $3 | Data      |
| 062 | **Merge CSV.**       | Une CSV compatibles.                                   |     $3 | Data      |
| 063 | **CSV Viewer.**      | Visualizador rápido con filtro y búsqueda.             |     $4 | Data      |
| 064 | **CSV Columns.**     | Selecciona, elimina o reordena columnas.               |     $3 | Data      |
| 065 | **CSV Deduplicate.** | Elimina filas duplicadas por columnas elegidas.        |     $4 | Data      |
| 066 | **CSV Filter.**      | Filtra y exporta filas por reglas sencillas.           |     $4 | Data      |
| 067 | **CSV Sample.**      | Extrae muestras aleatorias o primeras/últimas N filas. |     $2 | Data      |
| 068 | **CSV Encoding.**    | Detecta y convierte codificaciones comunes.            |     $3 | Data      |
| 069 | **CSV Delimiter.**   | Convierte delimitadores coma/punto y coma/tab.         |     $2 | Data      |
| 070 | **Excel to CSV.**    | Convierte hojas XLSX a CSV en lote.                    |     $4 | Data      |

### JSON, datos y desarrollador

|  ID | Tool               | Propósito                                                             | Precio | Bundle(s)            |
| --: | ------------------ | --------------------------------------------------------------------- | -----: | -------------------- |
| 071 | **JSON Pretty.**   | Formatea y minifica JSON.                                             | Gratis | Developer            |
| 072 | **JSON Validate.** | Valida JSON y muestra ubicación del error.                            | Gratis | Developer            |
| 073 | **JSON to CSV.**   | Convierte estructuras JSON tabulares a CSV.                           |     $3 | Developer / Data     |
| 074 | **CSV to JSON.**   | Convierte CSV a JSON.                                                 |     $3 | Developer / Data     |
| 075 | **Base64.**        | Codifica y decodifica texto/archivos en Base64.                       | Gratis | Developer            |
| 076 | **UUID.**          | Genera UUID individuales o por lote.                                  | Gratis | Developer            |
| 077 | **Hash.**          | Calcula hashes de texto y archivos.                                   | Gratis | Developer / Security |
| 078 | **Regex.**         | Probador de expresiones regulares con resaltado.                      |     $3 | Developer            |
| 079 | **JWT Peek.**      | Decodifica localmente encabezado/payload de JWT sin validar secretos. |     $2 | Developer            |
| 080 | **Unix Time.**     | Convierte timestamps Unix y fechas legibles.                          |     $2 | Developer            |

### Red y diagnóstico

|  ID | Tool                 | Propósito                                          | Precio | Bundle(s)           |
| --: | -------------------- | -------------------------------------------------- | -----: | ------------------- |
| 081 | **Ping.**            | Monitor sencillo de ping con historial.            |     $4 | Network             |
| 082 | **Downtime.**        | Registra caídas y recuperación de Internet.        |     $5 | Network             |
| 083 | **Port Check.**      | Comprueba puertos TCP concretos.                   |     $3 | Network             |
| 084 | **LAN Devices.**     | Descubre dispositivos visibles en la red local.    |     $5 | Network             |
| 085 | **DNS Lookup.**      | Consulta registros DNS comunes.                    |     $3 | Network / Developer |
| 086 | **Local IP.**        | Muestra IP local, interfaces y datos básicos.      | Gratis | Network             |
| 087 | **Connection Log.**  | Registra conectividad periódica a varios destinos. |     $4 | Network             |
| 088 | **Latency Compare.** | Compara latencia entre varios hosts.               |     $3 | Network             |
| 089 | **HTTP Status.**     | Comprueba código de estado y latencia de URLs.     |     $3 | Network / Developer |
| 090 | **Wake on LAN.**     | Envía paquetes Wake-on-LAN a equipos configurados. |     $3 | Network             |

### QR, códigos y etiquetas

|  ID | Tool                     | Propósito                                           | Precio | Bundle(s)            |
| --: | ------------------------ | --------------------------------------------------- | -----: | -------------------- |
| 091 | **QR.**                  | Generador QR offline para texto y URL.              |     $3 | QR / Creator         |
| 092 | **QR Batch.**            | Genera QR en lote desde CSV.                        |     $5 | QR / Operations      |
| 093 | **WiFi QR.**             | Genera QR para compartir credenciales Wi‑Fi.        |     $2 | QR                   |
| 094 | **Barcode.**             | Genera códigos de barras comunes.                   |     $4 | Barcode / Operations |
| 095 | **Barcode Batch.**       | Genera códigos en lote desde CSV.                   |     $5 | Barcode / Operations |
| 096 | **Label Sequence.**      | Genera etiquetas secuenciales listas para imprimir. |     $5 | Labels / Operations  |
| 097 | **Label Designer Lite.** | Diseño simple de etiqueta con texto, QR y barcode.  |     $7 | Labels / Operations  |
| 098 | **QR Contact Sheet.**    | Acomoda muchos QR en hojas imprimibles.             |     $4 | QR / Labels          |
| 099 | **Asset Tag Maker.**     | Genera etiquetas de activos con ID y QR.            |     $5 | Labels / Business    |
| 100 | **Shelf Label Maker.**   | Genera etiquetas simples para estantes/precios.     |     $5 | Labels / Business    |

### Audio

|  ID | Tool                  | Propósito                                                            | Precio | Bundle(s)            |
| --: | --------------------- | -------------------------------------------------------------------- | -----: | -------------------- |
| 101 | **Audio Convert.**    | Conversión básica entre formatos de audio permitidos.                |     $4 | Audio / Creator      |
| 102 | **Audio Trim.**       | Recorta inicio y fin de audio.                                       |     $3 | Audio / Creator      |
| 103 | **Audio Join.**       | Une archivos de audio en orden.                                      |     $3 | Audio / Creator      |
| 104 | **Volume Normalize.** | Normaliza volumen por lote.                                          |     $4 | Audio / Creator      |
| 105 | **Silence Trim.**     | Recorta silencio inicial/final configurable.                         |     $4 | Audio / Creator      |
| 106 | **Audio Metadata.**   | Edita metadatos básicos de archivos de audio.                        |     $3 | Audio                |
| 107 | **Voice Recorder.**   | Grabadora simple con guardado local.                                 |     $3 | Audio / Productivity |
| 108 | **Audio Speed.**      | Crea copia a velocidad distinta preservando tono cuando sea posible. |     $4 | Audio                |
| 109 | **Audio Channels.**   | Convierte estéreo/mono y separa canales cuando aplique.              |     $4 | Audio                |
| 110 | **Soundboard Lite.**  | Panel local de sonidos con atajos.                                   |     $5 | Audio / Creator      |

### Video

|  ID | Tool                     | Propósito                                | Precio | Bundle(s)       |
| --: | ------------------------ | ---------------------------------------- | -----: | --------------- |
| 111 | **Video Trim.**          | Recorta segmentos sin editor complejo.   |     $4 | Video / Creator |
| 112 | **Video Join.**          | Une clips compatibles.                   |     $4 | Video / Creator |
| 113 | **Video Compress.**      | Perfiles simples para reducir tamaño.    |     $5 | Video / Creator |
| 114 | **Video to GIF.**        | Convierte fragmentos cortos a GIF.       |     $4 | Video / Creator |
| 115 | **GIF to Video.**        | Convierte GIF a video.                   |     $3 | Video / Creator |
| 116 | **Video Screenshot.**    | Extrae frames en timestamps elegidos.    |     $3 | Video / Creator |
| 117 | **Video Contact Sheet.** | Crea mosaico de frames representativos.  |     $4 | Video / Creator |
| 118 | **Mute Video.**          | Elimina pista de audio de videos.        |     $2 | Video / Creator |
| 119 | **Rotate Video.**        | Rota/orienta video con presets.          |     $3 | Video / Creator |
| 120 | **Video Metadata.**      | Muestra información técnica del archivo. |     $3 | Video           |

### Pantalla y presentación

|  ID | Tool                    | Propósito                                     |        Precio | Bundle(s)              |
| --: | ----------------------- | --------------------------------------------- | ------------: | ---------------------- |
| 121 | **Color Picker.**       | Captura color de cualquier punto de pantalla. | PWYW / Gratis | Creator / Starter      |
| 122 | **Pixel Ruler.**        | Regla de píxeles sobre pantalla.              |            $3 | Creator / Developer    |
| 123 | **Crosshair.**          | Overlay de crosshair configurable.            |            $2 | Screen                 |
| 124 | **Screen Dimmer.**      | Oscurece monitores con overlay configurable.  |            $3 | Screen                 |
| 125 | **Click Visualizer.**   | Visualiza clics para demos y tutoriales.      |            $4 | Creator                |
| 126 | **Key Visualizer.**     | Muestra teclas presionadas para tutoriales.   |            $4 | Creator                |
| 127 | **Presentation Timer.** | Timer grande para ponentes.                   |            $3 | Productivity / Creator |
| 128 | **Always on Top.**      | Mantiene una ventana seleccionada encima.     | PWYW / Gratis | Starter / System       |
| 129 | **Screen Marker.**      | Dibuja temporalmente sobre la pantalla.       |            $4 | Creator                |
| 130 | **Focus Overlay.**      | Oscurece todo excepto una zona seleccionada.  |            $4 | Creator / Productivity |

### Sistema y escritorio

|  ID | Tool                  | Propósito                                                                    |        Precio | Bundle(s)             |
| --: | --------------------- | ---------------------------------------------------------------------------- | ------------: | --------------------- |
| 131 | **Awake.**            | Evita suspensión temporal del equipo.                                        | PWYW / Gratis | Starter / System      |
| 132 | **Auto Shutdown.**    | Apaga/reinicia/cierra sesión a una hora o tras countdown.                    |            $3 | System                |
| 133 | **Battery Note.**     | Avisos configurables de nivel de batería.                                    |            $2 | System                |
| 134 | **Startup Viewer.**   | Muestra accesos de inicio conocidos con enlaces a configuración del sistema. |            $3 | System                |
| 135 | **Process Watch.**    | Avisa cuando aparece o desaparece un proceso configurado.                    |            $4 | System                |
| 136 | **Disk Space Alert.** | Avisa al bajar de cierto espacio libre.                                      |            $3 | System                |
| 137 | **Folder Watch.**     | Registra cambios de archivos en una carpeta.                                 |            $4 | System / Automation   |
| 138 | **Desktop Cleaner.**  | Mueve archivos del escritorio siguiendo reglas.                              |            $3 | System / Files        |
| 139 | **App Launcher.**     | Lanzador configurable de aplicaciones y carpetas.                            |            $3 | System / Productivity |
| 140 | **Quick Paths.**      | Menú de accesos rápidos a rutas frecuentes.                                  |            $2 | System / Productivity |

### Creadores y contenido

|  ID | Tool                      | Propósito                                                   | Precio | Bundle(s)              |
| --: | ------------------------- | ----------------------------------------------------------- | -----: | ---------------------- |
| 141 | **Aspect Ratio.**         | Calculadora y conversor de relaciones de aspecto.           |     $2 | Creator                |
| 142 | **Thumbnail Board.**      | Organiza imágenes candidatas para comparar miniaturas.      |     $3 | Creator                |
| 143 | **Caption Counter.**      | Cuenta caracteres con límites configurables por plataforma. |     $2 | Creator                |
| 144 | **Hashtag Cleaner.**      | Limpia, deduplica y ordena hashtags.                        |     $2 | Creator                |
| 145 | **Filename SEO.**         | Normaliza nombres descriptivos de archivos por lote.        |     $3 | Creator / Files        |
| 146 | **Palette Board.**        | Guarda y exporta paletas de color.                          |     $3 | Creator                |
| 147 | **Safe Area Overlay.**    | Plantillas visuales de zonas seguras configurables.         |     $3 | Creator                |
| 148 | **Batch Thumbnail Text.** | Añade texto simple a imágenes por lote.                     |     $5 | Creator / Images       |
| 149 | **Content Checklist.**    | Checklist local reutilizable para publicar contenido.       |     $3 | Creator / Productivity |
| 150 | **UTM Builder.**          | Genera URLs con parámetros UTM.                             |     $2 | Creator / Marketing    |

### Oficina y administración

|  ID | Tool                     | Propósito                                                  | Precio | Bundle(s)             |
| --: | ------------------------ | ---------------------------------------------------------- | -----: | --------------------- |
| 151 | **Quick Notes.**         | Notas rápidas locales con autosave.                        |     $3 | Office / Productivity |
| 152 | **Meeting Notes.**       | Plantilla simple de notas y acuerdos.                      |     $3 | Office                |
| 153 | **Agenda Maker.**        | Genera agenda a partir de bloques de temas y tiempos.      |     $3 | Office                |
| 154 | **Name List Cleaner.**   | Limpia listas de nombres y duplicados.                     |     $2 | Office / Text         |
| 155 | **Attendance Tally.**    | Registro manual sencillo de asistencia.                    |     $4 | Office / Operations   |
| 156 | **Room Counter.**        | Control básico de ocupación de sala.                       |     $3 | Office                |
| 157 | **Shift Handover.**      | Plantilla local para entregar turno y pendientes.          |     $4 | Office / Operations   |
| 158 | **Task Batch.**          | Crea listas rápidas de tareas repetibles.                  |     $3 | Office / Productivity |
| 159 | **Contact CSV Cleaner.** | Normaliza columnas básicas de contactos.                   |     $4 | Office / Data         |
| 160 | **Simple Form Filler.**  | Guarda snippets/datos recurrentes para copiar rápidamente. |     $3 | Office / Productivity |

### Finanzas y negocio

|  ID | Tool                  | Propósito                                          | Precio | Bundle(s)              |
| --: | --------------------- | -------------------------------------------------- | -----: | ---------------------- |
| 161 | **Cash Counter.**     | Calcula efectivo por denominaciones configurables. |     $3 | Business               |
| 162 | **Expense Log.**      | Registro local de gastos con CSV.                  |     $4 | Business               |
| 163 | **Margin.**           | Calculadora de costo, margen y markup.             |     $2 | Business / Calculators |
| 164 | **Break Even.**       | Calculadora simple de punto de equilibrio.         |     $3 | Business / Calculators |
| 165 | **Hourly Rate.**      | Convierte sueldo/meta a tarifa por hora.           |     $2 | Business               |
| 166 | **Invoice Number.**   | Administra consecutivos de facturas/cotizaciones.  |     $3 | Business               |
| 167 | **Quote Calculator.** | Calcula subtotal, descuento, impuesto y total.     |     $3 | Business               |
| 168 | **Commission.**       | Calculadora de comisiones por reglas sencillas.    |     $3 | Business               |
| 169 | **Cash Closing.**     | Cierre sencillo de caja contra monto esperado.     |     $5 | Business / Operations  |
| 170 | **Payment Split.**    | Divide un cobro entre personas/porcentajes.        |     $2 | Business / Calculators |

### Inventario y operaciones

|  ID | Tool                    | Propósito                                         | Precio | Bundle(s)                 |
| --: | ----------------------- | ------------------------------------------------- | -----: | ------------------------- |
| 171 | **Inventory Count.**    | Conteo manual de inventario con exportación.      |     $4 | Operations                |
| 172 | **Production Counter.** | Conteo con meta y ritmo por hora.                 |     $4 | Operations                |
| 173 | **Shift Counter.**      | Producción por turno con historial.               |     $5 | Operations                |
| 174 | **Queue Number.**       | Generador local de turnos numerados.              |     $3 | Operations                |
| 175 | **Lot Number.**         | Generador de folios/lotes configurables.          |     $3 | Operations                |
| 176 | **Box Tally.**          | Conteo de cajas por tipo o línea.                 |     $4 | Operations                |
| 177 | **Defect Counter.**     | Cuenta defectos por categorías.                   |     $4 | Operations                |
| 178 | **Cycle Time.**         | Mide tiempos de ciclo repetitivos.                |     $4 | Operations                |
| 179 | **Downtime Log.**       | Registra manualmente paros, causa y duración.     |     $5 | Operations                |
| 180 | **Simple Kanban.**      | Tablero local mínimo de pendiente/en curso/hecho. |     $5 | Operations / Productivity |

### Estudio y aprendizaje

|  ID | Tool                     | Propósito                                           | Precio | Bundle(s)           |
| --: | ------------------------ | --------------------------------------------------- | -----: | ------------------- |
| 181 | **Study Timer.**         | Timer de estudio con sesiones e historial.          |     $3 | Study               |
| 182 | **Flashcards Lite.**     | Tarjetas locales simples.                           |     $4 | Study               |
| 183 | **Reading Timer.**       | Cronómetro y sesiones de lectura.                   |     $2 | Study               |
| 184 | **Reading Pace.**        | Calcula ritmo y tiempo estimado para terminar.      |     $2 | Study               |
| 185 | **Random Question.**     | Selecciona preguntas aleatorias desde una lista.    |     $2 | Study               |
| 186 | **Quiz CSV.**            | Carga preguntas desde CSV y muestra quiz local.     |     $4 | Study               |
| 187 | **Vocabulary List.**     | Lista local de vocabulario y repaso simple.         |     $3 | Study               |
| 188 | **Study Streak.**        | Racha de estudio diaria minimalista.                |     $2 | Study               |
| 189 | **Citation Scratchpad.** | Guarda referencias y notas bibliográficas manuales. |     $3 | Study               |
| 190 | **Grade Calculator.**    | Calculadora de calificaciones ponderadas.           |     $2 | Study / Calculators |

### Organización personal

|  ID | Tool                    | Propósito                                                            | Precio | Bundle(s)               |
| --: | ----------------------- | -------------------------------------------------------------------- | -----: | ----------------------- |
| 191 | **Habit.**              | Un hábito, un check diario y una racha.                              |     $2 | Personal                |
| 192 | **Multi Habit.**        | Varias rachas y calendario local.                                    |     $4 | Personal                |
| 193 | **Decision Wheel.**     | Ruleta local para elegir opciones.                                   |     $2 | Personal                |
| 194 | **Random Picker.**      | Elige uno o varios elementos de una lista.                           |     $2 | Personal                |
| 195 | **Team Maker.**         | Divide una lista en equipos aleatorios.                              |     $3 | Personal / Office       |
| 196 | **Packing List.**       | Checklist reutilizable para viajes.                                  |     $2 | Personal                |
| 197 | **Routine.**            | Checklist diaria reutilizable.                                       |     $3 | Personal / Productivity |
| 198 | **Birthday Countdown.** | Cuenta regresiva a fechas importantes.                               |     $2 | Personal                |
| 199 | **Simple Journal.**     | Entradas locales por fecha sin nube.                                 |     $4 | Personal                |
| 200 | **Mood Dot.**           | Registro privado de estado con una escala simple y notas opcionales. |     $3 | Personal                |

### Privacidad y seguridad

|  ID | Tool                    | Propósito                                                                              | Precio | Bundle(s)            |
| --: | ----------------------- | -------------------------------------------------------------------------------------- | -----: | -------------------- |
| 201 | **Password.**           | Generador local de contraseñas.                                                        | Gratis | Security / Starter   |
| 202 | **PIN Batch.**          | Genera lotes de PIN aleatorios.                                                        |     $2 | Security             |
| 203 | **Checksum Verify.**    | Compara hash esperado contra un archivo.                                               |     $2 | Security / Developer |
| 204 | **Metadata Cleaner.**   | Limpia metadatos compatibles de archivos seleccionados.                                |     $4 | Security / Privacy   |
| 205 | **Secure Delete Hint.** | Interfaz educativa para borrado normal y advertencias sobre límites de borrado seguro. | Gratis | Security             |
| 206 | **Clipboard Timeout.**  | Borra portapapeles tras un intervalo.                                                  |     $2 | Security             |
| 207 | **Secret Notes.**       | Notas locales cifradas con contraseña maestra.                                         |     $5 | Security             |
| 208 | **File Encrypt.**       | Cifra/descifra archivos localmente con formatos estándar bien auditados.               |     $7 | Security             |
| 209 | **Privacy Checklist.**  | Checklist local de revisión de privacidad.                                             |     $2 | Security             |
| 210 | **Random Data.**        | Genera datos ficticios para pruebas sin usar datos reales.                             |     $3 | Security / Developer |

### Web, URL y marketing

|  ID | Tool                    | Propósito                                                                         | Precio | Bundle(s)             |
| --: | ----------------------- | --------------------------------------------------------------------------------- | -----: | --------------------- |
| 211 | **URL Encode.**         | Codifica/decodifica componentes URL.                                              | Gratis | Developer / Web       |
| 212 | **URL Cleaner.**        | Elimina parámetros de tracking conocidos de URLs.                                 |     $2 | Web / Privacy         |
| 213 | **Link List.**          | Valida formato y deduplica listas de URLs.                                        |     $2 | Web                   |
| 214 | **Open URLs.**          | Abre una lista de URLs con control por lotes.                                     |     $3 | Web / Productivity    |
| 215 | **UTM Builder Pro.**    | Crea campañas UTM y guarda presets.                                               |     $4 | Marketing             |
| 216 | **Meta Preview.**       | Previsualización local de título/descripción/imagen a partir de datos ingresados. |     $3 | Marketing             |
| 217 | **Robots Tester Lite.** | Ayuda a comprobar reglas robots.txt pegadas manualmente.                          |     $3 | Developer / Marketing |
| 218 | **Sitemap List.**       | Genera un sitemap XML básico desde una lista de URLs.                             |     $3 | Developer / Marketing |
| 219 | **Redirect Map.**       | Crea y valida mapas origen→destino para migraciones.                              |     $4 | Developer / Marketing |
| 220 | **Link QR.**            | Convierte una lista de enlaces en QR exportables.                                 |     $3 | Web / QR              |

### Conversión y calculadoras

|  ID | Tool                   | Propósito                                                            | Precio | Bundle(s)               |
| --: | ---------------------- | -------------------------------------------------------------------- | -----: | ----------------------- |
| 221 | **Unit.**              | Conversión de unidades comunes.                                      |     $2 | Calculators             |
| 222 | **Storage.**           | KB/MB/GB/TB y bits/bytes.                                            |     $2 | Calculators / Developer |
| 223 | **DPI.**               | Calcula tamaño físico, píxeles y DPI.                                |     $2 | Creator / Calculators   |
| 224 | **Aspect.**            | Calcula dimensiones manteniendo relación.                            |     $2 | Creator / Calculators   |
| 225 | **Date Diff.**         | Diferencia entre fechas y horas.                                     |     $2 | Calculators             |
| 226 | **Percentage.**        | Aumentos, descuentos y porcentajes.                                  |     $2 | Calculators             |
| 227 | **Rule of Three.**     | Regla de tres simple/directa.                                        |     $2 | Calculators             |
| 228 | **Time Decimal.**      | Convierte hh:mm ↔ horas decimales.                                   |     $2 | Business / Calculators  |
| 229 | **Bytes Text.**        | Muestra tamaño aproximado de texto en distintas codificaciones.      |     $2 | Developer / Calculators |
| 230 | **Coordinate Format.** | Convierte entre formatos de coordenadas introducidas por el usuario. |     $3 | Calculators             |

### Automatización por lotes

|  ID | Tool                      | Propósito                                                   | Precio | Bundle(s)                 |
| --: | ------------------------- | ----------------------------------------------------------- | -----: | ------------------------- |
| 231 | **Batch Copy.**           | Copia archivos listados a un destino.                       |     $3 | Automation / Files        |
| 232 | **Batch Move.**           | Mueve archivos con vista previa.                            |     $3 | Automation / Files        |
| 233 | **Batch Delete.**         | Elimina lotes seleccionados con confirmación fuerte.        |     $3 | Automation / Files        |
| 234 | **Batch Create Folders.** | Crea carpetas desde lista/CSV.                              |     $3 | Automation / Files        |
| 235 | **Batch Touch.**          | Actualiza timestamps cuando el sistema lo permita.          |     $3 | Automation / Developer    |
| 236 | **Batch Prefix.**         | Aplica prefijos/sufijos usando reglas.                      |     $2 | Automation / Files        |
| 237 | **Batch Command Queue.**  | Ejecuta una cola local de operaciones predefinidas seguras. |     $5 | Automation                |
| 238 | **Watch & Move.**         | Vigila carpeta y mueve archivos por reglas.                 |     $5 | Automation / Files        |
| 239 | **Watch & Rename.**       | Vigila carpeta y renombra nuevos archivos.                  |     $5 | Automation / Files        |
| 240 | **Folder Template.**      | Crea estructuras de carpetas reutilizables.                 |     $3 | Automation / Productivity |

### Impresión y papel

|  ID | Tool                     | Propósito                                             | Precio | Bundle(s)          |
| --: | ------------------------ | ----------------------------------------------------- | -----: | ------------------ |
| 241 | **Page Imposer.**        | Acomoda varias piezas iguales en una hoja imprimible. |     $5 | Print / Creator    |
| 242 | **Business Card Sheet.** | Acomoda tarjetas en hojas configurables.              |     $4 | Print / Business   |
| 243 | **Number Tickets.**      | Genera tickets numerados para impresión.              |     $5 | Print / Operations |
| 244 | **Name Badges.**         | Genera gafetes desde CSV.                             |     $5 | Print / Office     |
| 245 | **Simple Certificates.** | Rellena nombre/fecha sobre plantilla local.           |     $5 | Print / Office     |
| 246 | **Price Tags.**          | Genera etiquetas de precio desde CSV.                 |     $5 | Print / Business   |
| 247 | **Table Tent.**          | Genera tarjetas plegables con nombre/número.          |     $4 | Print / Events     |
| 248 | **Raffle Tickets.**      | Genera boletos numerados con talón.                   |     $5 | Print / Events     |
| 249 | **Address Labels.**      | Genera hojas de etiquetas de dirección.               |     $5 | Print / Office     |
| 250 | **Print Grid.**          | Crea cuadrículas imprimibles con texto/IDs.           |     $4 | Print / Operations |

### Eventos y equipos

|  ID | Tool                   | Propósito                                          | Precio | Bundle(s)       |
| --: | ---------------------- | -------------------------------------------------- | -----: | --------------- |
| 251 | **Raffle.**            | Sorteo desde lista con historial de ganadores.     |     $3 | Events          |
| 252 | **Bingo Caller.**      | Sortea números y lleva control de los ya llamados. |     $3 | Events          |
| 253 | **Scoreboard.**        | Marcador simple para dos equipos.                  |     $3 | Events          |
| 254 | **Multi Score.**       | Marcador para múltiples participantes.             |     $4 | Events          |
| 255 | **Round Timer.**       | Timer por rondas con descansos.                    |     $3 | Events          |
| 256 | **Tournament Pairer.** | Emparejamiento aleatorio sencillo.                 |     $4 | Events          |
| 257 | **Name Draw.**         | Animación simple para seleccionar nombres.         |     $2 | Events          |
| 258 | **Vote Counter.**      | Conteo manual de votos por opciones.               |     $3 | Events          |
| 259 | **Seat Randomizer.**   | Asigna lugares aleatoriamente desde listas.        |     $3 | Events          |
| 260 | **Event Check-in.**    | Check-in local simple por lista.                   |     $5 | Events / Office |

### Fechas y calendario local

|  ID | Tool                 | Propósito                                        | Precio | Bundle(s)           |
| --: | -------------------- | ------------------------------------------------ | -----: | ------------------- |
| 261 | **Days Until.**      | Días restantes hasta una fecha.                  |     $2 | Date / Productivity |
| 262 | **Workdays.**        | Cuenta días hábiles según configuración manual.  |     $3 | Date / Business     |
| 263 | **Date List.**       | Genera listas de fechas por intervalo.           |     $2 | Date                |
| 264 | **Recurring Dates.** | Genera ocurrencias según reglas simples.         |     $3 | Date                |
| 265 | **Week Number.**     | Muestra semana ISO y datos relacionados.         | Gratis | Date                |
| 266 | **Age Calc.**        | Calcula edad/diferencia exacta entre fechas.     |     $2 | Date                |
| 267 | **Shift Calendar.**  | Genera calendarios de turnos repetitivos.        |     $4 | Date / Operations   |
| 268 | **Deadline Board.**  | Panel local de deadlines con countdown.          |     $4 | Date / Productivity |
| 269 | **Calendar CSV.**    | Genera CSV de fechas/eventos repetitivos.        |     $3 | Date / Office       |
| 270 | **Timestamp Log.**   | Botón para registrar timestamps y notas rápidas. |     $3 | Date / Operations   |

## 26. Bundles recomendados

| Bundle                | Precio orientativo | Contenido / enfoque                                                                                                                         |
| --------------------- | -----------------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Starter Pack**      |               $7–9 | Count., Time., Awake., Case., Character Count., Password., Color Picker.                                                                    |
| **Productivity Pack** |              $9–12 | Multi Count., Multi Timer., Pomodoro., Focus Block., Quick Notes., Routine., Deadline Board.                                                |
| **Files Pack**        |              $9–12 | Rename., Number Files., Move By Type., Folder Size., Large Files., Empty Folders., File List.                                               |
| **Image Pack**        |             $12–15 | Resize., Compress., Convert Image., Crop Batch., Watermark., Image Metadata., Contact Sheet.                                                |
| **PDF Pack**          |             $10–13 | Images to PDF., PDF to Images., Merge PDF., Split PDF., Rotate PDF., Reorder PDF., Extract PDF Pages.                                       |
| **Text Pack**         |              $7–10 | Text Cleaner., Clipboard History., Find Replace., Line Tools., Slug Maker., Text Diff.                                                      |
| **Data Pack**         |             $12–15 | Split CSV., Merge CSV., CSV Viewer., CSV Columns., Deduplicate., Filter., Excel to CSV.                                                     |
| **Developer Pack**    |              $9–12 | JSON Pretty., JSON Validate., Base64., UUID., Hash., Regex., JWT Peek., Unix Time.                                                          |
| **Network Pack**      |             $12–16 | Ping., Downtime., Port Check., LAN Devices., DNS Lookup., Connection Log., HTTP Status.                                                     |
| **QR & Barcode Pack** |             $12–16 | QR., QR Batch., WiFi QR., Barcode., Barcode Batch., QR Contact Sheet.                                                                       |
| **Labels Pack**       |             $15–19 | Label Sequence., Label Designer Lite., Asset Tag Maker., Shelf Label Maker., Price Tags., Address Labels.                                   |
| **Creator Pack**      |             $15–19 | Resize., Compress., Color Picker., Pixel Ruler., Click Visualizer., Key Visualizer., Palette Board., UTM Builder.                           |
| **Audio Pack**        |             $12–16 | Audio Convert., Trim., Join., Normalize., Silence Trim., Metadata., Voice Recorder.                                                         |
| **Video Pack**        |             $15–19 | Video Trim., Join., Compress., Video to GIF., Screenshot., Contact Sheet., Mute., Rotate.                                                   |
| **System Pack**       |              $9–12 | Awake., Always on Top., Auto Shutdown., Disk Space Alert., Folder Watch., App Launcher., Quick Paths.                                       |
| **Office Pack**       |             $12–15 | Quick Notes., Meeting Notes., Agenda Maker., Attendance Tally., Shift Handover., Task Batch., Contact CSV Cleaner.                          |
| **Business Pack**     |             $12–16 | Cash Counter., Expense Log., Margin., Break Even., Invoice Number., Quote Calculator., Commission., Cash Closing.                           |
| **Operations Pack**   |             $15–19 | Inventory Count., Production Counter., Shift Counter., Queue Number., Lot Number., Defect Counter., Cycle Time., Downtime Log.              |
| **Study Pack**        |              $9–12 | Study Timer., Flashcards Lite., Reading Timer., Reading Pace., Random Question., Quiz CSV., Grade Calculator.                               |
| **Privacy Pack**      |             $12–16 | Password., Checksum Verify., Metadata Cleaner., Clipboard Timeout., Secret Notes., Random Data.                                             |
| **Automation Pack**   |             $12–16 | Batch Copy., Move., Delete., Create Folders., Command Queue., Watch & Move., Watch & Rename., Folder Template.                              |
| **Print Pack**        |             $15–19 | Page Imposer., Business Card Sheet., Number Tickets., Name Badges., Price Tags., Raffle Tickets., Address Labels.                           |
| **Events Pack**       |             $10–14 | Raffle., Bingo Caller., Scoreboard., Multi Score., Round Timer., Name Draw., Vote Counter., Event Check-in.                                 |
| **Complete Pack**     |     $29–39 inicial | Todas las herramientas publicadas en el momento de compra; política de futuras herramientas debe definirse antes de venderlo como lifetime. |

## 27. Estrategia de precios

Objetivo: adquisición y reconocimiento de marca antes que maximización de ARPU.

Escalones sugeridos:

- Gratis / PWYW: adquisición.
- $2: micro-tool.
- $3: utilidad simple.
- $4–5: herramienta con batch, historial o valor profesional claro.
- $7: tool especializada.
- $9+: sólo cuando el valor/alcance lo justifique.
- Bundles: descuento real frente a suma individual.

Los precios deben revisarse antes de publicar según:

- fees vigentes del canal;
- soporte esperado;
- complejidad;
- demanda;
- valor percibido.

No usar “lifetime all future tools” sin una decisión comercial explícita.

---

## 28. Criterio para elegir qué construir después

Puntuar cada idea 1–5 en:

- facilidad;
- utilidad inmediata;
- búsquedas/intención;
- diferenciación;
- bajo soporte;
- cross-platform;
- oportunidad de bundle.

Priorizar herramientas:

- fáciles de demostrar en GIF/video;
- que trabajen offline;
- que ahorren una tarea repetitiva;
- que no requieran cuentas;
- con resultado visible inmediato.

Evitar temprano:

- features dependientes de APIs de pago;
- herramientas reguladas o de alto riesgo;
- cosas que requieran infraestructura costosa;
- clones enormes de software existente.

---

## 29. Regla de documentación

Cuando Codex complete una fase:

- actualizar README si cambió el setup;
- actualizar `HERRAMIENTAS_PENDIENTES.md` si cambió una tool;
- crear ADR sólo para decisiones arquitectónicas importantes;
- no llenar el repo de documentos redundantes.

Los ADR deben responder:

- Contexto.
- Decisión.
- Alternativas.
- Consecuencias.

---

## 30. Primera orden después de leer este archivo

Si el repositorio todavía no tiene aplicación:

1. Inspeccionar el repo.
2. Leer `AGENTS.md` y `CODEX.md`.
3. Crear/actualizar `HERRAMIENTAS_PENDIENTES.md` a partir del catálogo canónico.
4. Inicializar únicamente **Phase 0 — Foundation**.
5. Crear el shell visual funcional con datos mock.
6. Registrar `Count.`, `Time.`, `Awake.` y `Rename.` en el catálogo, pero implementar sólo `Count.` como tool funcional en la primera pasada.
7. Configurar entitlements mock para poder alternar locked/unlocked durante desarrollo.
8. No integrar Gumroad ni backend todavía.
9. Ejecutar validaciones.
10. Dejar un resumen de cambios, comandos de ejecución y siguientes pasos concretos.

Si el repositorio ya contiene código, adaptar la Phase 0 al estado real sin destruir trabajo existente.

---

## 31. Principio final

Cuando exista una tensión entre “más features” y “más simple”, preferir **más simple**.

El proyecto gana cuando una persona instala el hub, abre una tool y entiende inmediatamente qué hacer.
