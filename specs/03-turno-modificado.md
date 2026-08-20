# SPEC 03 — Pantalla Turno Modificado (seguimiento)

> **Status:** Aprobado
> **Depends on:** `api-scap` SPEC 03 — Módulo Turno Modificado (estado Implementado)
> **Date:** 2026-08-19
> **Objective:** Crear la pantalla `Seguimiento > Turno modificado` en `/seguimiento/turno-modificado` que lista usuarios activos filtrables por unidad y área, muestra el único horario activo de cada usuario con sus turnos, permite crear, editar y eliminar modificaciones de turno mediante modal reactivo, y presenta un resumen mensual global de todas las modificaciones.

---

## Scope

**In:**

- Página `Seguimiento > Turno modificado` en `src/app/features/seguimiento/pages/turno-modificado/`.
- Filtros opcionales de búsqueda: unidad (todas por defecto) y área dependiente de la unidad seleccionada (todas por defecto).
- Carga inicial con todos los usuarios activos (`activo=true`); sin filtros se muestran todos los usuarios activos.
- Listado de usuarios activos con paginación en frontend (`PaginadorDataSource` + `ng-paginator`) y búsqueda local.
- Al seleccionar un usuario se muestra su única asignación activa con los turnos del horario activo (vista tipo matriz semanal, reutilizando el patrón de `asignar-horario.page.ts`).
- Cada turno activo es clicable y abre un modal reactivo para crear una modificación, con selector de fecha (dentro del mes consultado), `horaInicio`, `horaFin` y `motivo` opcional; validaciones y mensajes de error bajo cada campo.
- Edición de una modificación existente: primero `GET /turno/:turnoId/modificar/:turnoModificadoId`, luego `PUT`; al crear, el modal cierra y se recargan los turnos del usuario y el resumen mensual.
- Eliminación de modificación con diálogo de confirmación (`DELETE /turno/:turnoId/modificar/:turnoModificadoId`).
- Resumen mensual global de modificaciones de todos los usuarios y turnos activos, iniciando en el mes calendario actual y con navegación a meses anterior/posterior; columnas: fecha, usuario, unidad, área, horario y horas.
- Servicio HTTP nuevo `turno-modificado.service.ts` que consume `GET/POST /turno/:turnoId/modificar` y `GET/PUT/DELETE /turno/:turnoId/modificar/:turnoModificadoId`, con contratos en `core/interfaces/turno-modificado.interface.ts`.
- Reutilización de `UsuariosService`, `UnidadesService`, `AreasService` y `HorariosService` existentes para cargar entidades y horarios activos.
- Ruta `turno-modificado` dentro de un nuevo módulo `seguimiento.routes.ts` con breadcrumb "Turno modificado" (el menú ya existe en `dashboard.service.ts` con esa URL).
- Formularios reactivos (Reactive Forms) con validaciones y mensajes de error; estados de `loading` en cargas y guardados; mensajes de éxito/error con toastr según `OperationResult.State`.
- Solo consumo de la API existente de `api-scap` (`/turno/:turnoId/modificar`); no se modifica el backend.

**Out of scope (for future specs):**

- Cambios en `api-scap` (rutas, payloads o procedimientos SQL).
- Creación o edición de horarios desde esta pantalla.
- Asignación de horarios a usuarios (ya cubierta en `asignar-horario.page.ts`).
- Filtros por usuario específico en el resumen mensual (el resumen es global; la selección de usuario solo afecta la vista de turnos).
- Paginación o filtros en el backend para el resumen mensual.
- Pruebas E2E.

---

## Data model

Se crea `src/app/core/interfaces/turno-modificado.interface.ts`:

```ts
import { OperationResult } from "./unidad.interface";

export interface TurnoModificado {
  turnoModificadoId: number;
  turnoId: number;
  usuarioId: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm o HH:mm:ss
  horaFin: string; // HH:mm o HH:mm:ss
  motivo: string | null;
}

export interface CrearTurnoModificadoDto {
  usuarioId: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  motivo?: string | null;
}

export interface ActualizarTurnoModificadoDto {
  fecha?: string; // YYYY-MM-DD
  horaInicio?: string; // HH:mm
  horaFin?: string; // HH:mm
  motivo?: string | null;
}

export interface TurnoModificadoFiltro {
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD
  usuarioId?: number;
}

export type { OperationResult };
```

Convenciones:

- Base URL de `environment.urlScap` (igual que los servicios existentes).
- `turnoId` se toma de la asignación activa del usuario, nunca del body en `POST`.
- `GET /turno/:turnoId/modificar` es por turno; el resumen mensual global se arma en frontend agregando las modificaciones de cada turno activo de los usuarios visibles.
- El resumen mensual no modifica el backend; solo consulta por rango `fechaDesde`/`fechaHasta` por cada turno relevante.
- Los mensajes de éxito/error provienen de `OperationResult` (`State`, `Message`).

---

## Implementation plan

1. Crear `src/app/core/interfaces/turno-modificado.interface.ts` con los contratos del modelo de datos.
2. Crear `src/app/api/turno-modificado.service.ts` con `listar(turnoId, filtro)`, `obtener(turnoId, id)`, `crear(turnoId, dto)`, `actualizar(turnoId, id, dto)` y `eliminar(turnoId, id)`.
3. Crear `src/app/features/seguimiento/seguimiento.routes.ts` con la ruta `turno-modificado` y breadcrumb "Turno modificado" que carga la página (inicialmente vacía).
4. Registrar `seguimiento` en `app.routes.ts` como hijo de `authGuard` tras `configuracion`, sin modificar el menú (ya existe en `dashboard.service.ts`).
5. Implementar `turno-modificado.page.ts`: carga unidades, áreas (según unidad) y usuarios activos; tabla con paginación en frontend y búsqueda local.
6. Agregar la sección de detalle de usuario seleccionado que carga su única asignación activa (`UsuariosService.listarHorarios`) y el detalle del horario activo (`HorariosService.obtenerPorId`), mostrando la matriz semanal de turnos clicables.
7. Crear el modal de modificación (`modificacion-turno.dialog.ng.ts`): formulario reactivo con `fecha` (selector dentro del mes consultado), `horaInicio`, `horaFin` y `motivo`; soporta crear y editar (al editar primero `GET` individual).
8. Crear el resumen mensual global: selector de mes con navegación anterior/posterior, consulta por rango a todos los turnos activos visibles y tabla con fecha, usuario, unidad, área, horario y horas; botones editar y eliminar por fila.
9. Conectar en la página: selección de usuario, clic en turno (abre modal crear), edición (carga `GET` y abre modal), eliminación (confirmación + `DELETE`) y recarga de turnos del usuario y resumen mensual tras cada operación exitosa.
10. Ejecutar `npm run build` y corregir cualquier error.

---

## Acceptance criteria

- [ ] El menú existente `Seguimiento > Turno modificado` (en `dashboard.service.ts`) navega a `/seguimiento/turno-modificado` y no se modifica.
- [ ] La página lista usuarios activos con paginación en frontend y búsqueda local.
- [ ] Sin filtros se muestran todos los usuarios activos; con unidad/área se filtran opcionalmente y el área depende de la unidad.
- [ ] Al seleccionar un usuario se muestra su única asignación activa y la matriz de turnos del horario activo.
- [ ] Cada turno activo es clicable y abre el modal de creación de modificación.
- [ ] El modal usa Reactive Forms con `fecha` (dentro del mes consultado), `horaInicio`, `horaFin` y `motivo` opcional, y muestra mensajes de error bajo campos inválidos.
- [ ] Crear llama `POST /turno/:turnoId/modificar` con `usuarioId`, `fecha`, `horaInicio`, `horaFin` y cierra recargando turnos del usuario y resumen mensual.
- `GET /turno/:turnoId/modificar/:turnoModificadoId` se invoca antes de abrir el modal de edición.
- [ ] Editar llama `PUT /turno/:turnoId/modificar/:turnoModificadoId` y recarga turnos y resumen.
- [ ] Eliminar pide confirmación y llama `DELETE /turno/:turnoId/modificar/:turnoModificadoId`.
- [ ] El resumen mensual muestra modificaciones de todos los usuarios/turnos activos con columnas fecha, usuario, unidad, área, horario y horas.
- [ ] El resumen inicia en el mes actual y permite navegar a meses anterior/posterior.
- [ ] Las cargas y guardados muestran estado de `loading`.
- [ ] Los mensajes de éxito/error se muestran con toastr según `OperationResult.State`.
- [ ] `npm run build` finaliza sin errores.

---

## Decisions

- **Yes:** Ruta `/seguimiento/turno-modificado`. El menú ya existe en `dashboard.service.ts` con esa URL; no se modifica navegación.
- **Yes:** Solo frontend. El backend `api-scap` SPEC 03 está Implementado y expone el CRUD anidado; no se toca.
- **Yes:** Usuarios activos desde la carga inicial. Son los que tienen horario operativo y coinciden con el flujo de asignación existente.
- **Yes:** Filtro de área dependiente de unidad. Mantiene el patrón de las pantallas actuales y evita selectores gigantes.
- **Yes:** Un único horario activo por usuario. La API garantiza una asignación activa; se muestra sin selector adicional.
- **Yes:** Vista de turnos tipo matriz semanal reutilizando el patrón de `asignar-horario.page.ts`.
- **Yes:** Modal reactivo con selector de fecha dentro del mes consultado. Evita crear modificaciones fuera del periodo visible.
- **Yes:** Crear, editar y eliminar. Aprovecha los endpoints completos del backend y permite corregir registros.
- **Yes:** Edición con `GET` individual previo a `PUT`. Evita editar datos obsoletos.
- **Yes:** Recarga de turnos del usuario y resumen mensual tras crear/editar/eliminar. Mantiene consistencia sin recargar toda la página.
- **Yes:** Resumen mensual global agregado en frontend consultando por rango cada turno activo visible. No requiere cambios de backend.
- **Yes:** Formularios reactivos con validaciones y mensajes de error bajo cada campo, y estados de `loading`. Sigue el estándar de SPEC 01 y SPEC 02.
- **No:** Cambios en `api-scap`. El contrato ya está implementado.
- **No:** Asignación de horarios desde esta pantalla. Ya existe en `asignar-horario.page.ts`.
- **No:** Filtro por usuario en el resumen mensual. El resumen es global por diseño.
- **No:** Pruebas E2E. La verificación es `npm run build` más prueba manual de los flujos.

---

## Risks

| Risk                                           | Mitigation                                                                                   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Resumen mensual con muchos turnos activos      | Consultas por rango agrupadas y `loading` por sección; no se bloquea la selección de usuario |
| `turnoId` sin modificaciones en el mes         | El resumen muestra vacío para ese turno sin error                                            |
| Edición de modificación ya usada en asistencia | El backend rechaza `PUT`/`DELETE`; se muestra el `Message` de error sin romper el modal      |
| Duplicado activo por turno/usuario/fecha       | El backend rechaza `POST`; se muestra el `Message` de error                                  |
| Fecha de modificación fuera del mes consultado | El modal limita el selector al mes visible y valida el formato `YYYY-MM-DD`                  |

---

## What is **not** in this spec

- Cambios en `api-scap` (rutas, payloads, procedimientos SQL).
- Creación o edición de horarios.
- Asignación de horarios a usuarios.
- Filtro por usuario en el resumen mensual.
- Paginación o filtros en el backend para el resumen mensual.
- Pruebas E2E.

Cada uno de estos, si se necesita, va en su propio spec.
