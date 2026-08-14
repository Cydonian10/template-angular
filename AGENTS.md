# Instrucciones para agentes

## Proyecto

- Es una aplicación Angular 19 standalone; el punto de entrada es `src/main.ts` y las rutas principales están en `src/app/app.routes.ts`.
- Las funcionalidades viven en `src/app/features`; los servicios HTTP están en `src/app/api` y los contratos TypeScript en `src/app/core/interfaces`.
- El backend está en el repositorio hermano `../api-scap`; los cambios de procedimientos SQL o API deben hacerse allí, no en este frontend.
- El frontend consume `http://localhost:3005/scap` y seguridad `http://localhost:3004/api_seguridad` en desarrollo, según `src/environments/environment.development.ts`.

## Comandos

- Instalar dependencias con `npm install` usando el `package-lock.json`.
- Servidor de desarrollo: `npm start` (`ng serve`), con recarga automática.
- Build de producción: `npm run build` (`ng build`). El resultado se configura en `/var/www/html/scap` y usa `baseHref: /scap/`.
- Build de desarrollo: `npm run watch`.
- Pruebas unitarias Karma/Jasmine: `npm test` (`ng test`). No hay script ni configuración e2e propia en este repositorio.
- No existen scripts de lint, typecheck o format; `npm run build` es la verificación principal y usa TypeScript estricto y templates Angular estrictos.

## UI y estilo

- Los estilos globales usan Tailwind CSS 4 con daisyUI 5 en `src/styles.css`; conservar el tema `ingenieria` y sus tokens al modificar la interfaz.
- Los componentes suelen usar templates inline, signals y componentes standalone; conserva los patrones existentes antes de introducir otra arquitectura.

## Base de datos y backend

- `opencode.json` configura el MCP SQL Server con base predeterminada `master`; no asumas que esa es la base de la aplicación. El backend usa su propia configuración y normalmente apunta a `API_SCAP_DB`.
- Antes de ejecutar o diagnosticar SQL, confirma la base seleccionada y valida el esquema real de esa base; `master` puede contener tablas con columnas distintas.
- Los procedimientos SQL están en `../api-scap/database/sql-scripts`; después de editarlos hay que ejecutar el script `CREATE OR ALTER` en la base correcta para que el endpoint use la versión actualizada.
- Los usuarios sincronizados deben provenir del proceso backend/kafka; no reintroducir en la interfaz formularios o endpoints para crear manualmente `sync_usuario`.

## Verificación

- Tras cambios de TypeScript, templates o estilos, ejecutar `npm run build`.
- Tras cambios de servicios o contratos HTTP, revisar también los procedimientos y rutas correspondientes en `../api-scap` si cambia el payload o endpoint.
