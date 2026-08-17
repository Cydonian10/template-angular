# Instrucciones para agentes

## Proyecto

- Aplicación Angular 19 standalone. Punto de entrada: `src/main.ts`. Rutas principales: `src/app/app.routes.ts`.
- Funcionalidades en `src/app/features`; servicios HTTP en `src/app/api`; contratos TypeScript en `src/app/core/interfaces`.
- Backend hermano: `../api-scap`. Los cambios de procedimientos SQL o de rutas/payloads API deben hacerse allí, no en este frontend.

## Comandos

- `npm install` — usar el `package-lock.json` existente.
- `npm start` — `ng serve` en modo desarrollo, puerto **4210**, recarga automática.
- `npm run build` — build de producción. Salida: `/var/www/html/scap` con `baseHref: /scap/`. Puede advertir por budget (1.5 MB warning / 2 MB error) pero compila.
- `npm run watch` — build de desarrollo con `--watch`.
- `npm test` — Karma/Jasmine. Solo existe `src/app/app.component.spec.ts`; no hay suite propia ni configuración e2e.
- **No hay scripts de lint, typecheck ni format.** `npm run build` es la verificación principal.

## Configuración y estilo

- TypeScript estricto y `strictTemplates` activados en `tsconfig.json`.
- Tailwind CSS 4 y daisyUI 5 se configuran directamente en `src/styles.css`; **no hay** `tailwind.config.*`. El tema por defecto es el custom `ingenieria`; conservar sus tokens si se toca la UI.
- Patrón dominante: componentes standalone, templates inline, signals y `inject()`.
- Diálogos reutilizables en `src/app/shared/dialogs` usan `@angular/cdk/dialog`.

## Autenticación y entornos

- En desarrollo (`src/environments/environment.development.ts` → `requireAuth: false`), `authGuard` permite el acceso y carga un usuario de prueba hardcodeado.
- En producción, el guarda espera `token`/`refreshToken` en query params o `localStorage` y llama a `AuthService.profile()` / `refreshToken()`.
- **Gocha:** los servicios y el guarda importan directamente `environment.development.ts`; `environment.ts` está vacío. Cambios de URLs deben hacerse en `environment.development.ts`.

## Backend y base de datos

- `opencode.json` configura el MCP SQL Server apuntando a `API_SCAP_DB` y una referencia a `../api-scap`.
- Antes de ejecutar o diagnosticar SQL, confirma la base seleccionada y valida el esquema real de esa base.
- Los procedimientos SQL están en `../api-scap/database/sql-scripts`; después de editarlos hay que ejecutar el `CREATE OR ALTER` en la base correcta para que el endpoint use la versión actualizada.
- Los usuarios sincronizados deben provenir del proceso backend/kafka; no reintroducir en la interfaz formularios o endpoints para crear manualmente `sync_usuario`.

## Verificación

- Tras cambios de TypeScript, templates o estilos: `npm run build`.
