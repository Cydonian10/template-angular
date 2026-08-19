# SPEC 02 — Pantalla Controles con asignaciones a áreas, unidades y usuarios

> **Status:** Implemented
> **Depends on:** `api-scap` SPEC 02 (estado Implementado)
> **Date:** 2026-08-19
> **Objective:** Crear la pantalla `Configuración > Controles` en `/configuracion/controles` que lista controles con paginación y búsqueda local, permite crear, editar y eliminar controles, y gestiona asignaciones de un control a áreas, unidades y usuarios mediante modal con selector de búsqueda.

---

## Scope

**In:**

- Página `Configuración > Controles` en `src/app/features/configuracion/pages/controles/`.
- Tabla de controles con paginación en frontend (`PaginadorDataSource` + `ng-paginator`) y búsqueda local por ID y asignaciones.
- Modal de crear/editar control con campos `tolerancia`, `limiteTardanza` y `limiteFalta` como enteros obligatorios `>= 0`.
- Modal de asignación que crea una asignación por vez: selecciona el control, el tipo de entidad (área, unidad o usuario) y la entidad mediante un selector con búsqueda local construido con `@angular/cdk/overlay`.
- Modal de detalle de control que lista sus asignaciones activas (área, unidad y usuario) con nombres resueltos y permite desasignar cada una con confirmación.
- Bloqueo visual en el selector de entidades que ya tienen un control activo, mostrando el control actual.
- Eliminación de control con diálogo de confirmación; si tiene asignaciones activas se muestra el mensaje de error del backend.
- Servicio HTTP nuevo `controles.service.ts` con métodos de CRUD y asignación/desasignación, y contratos en `core/interfaces/control.interface.ts`.
- Ruta `controles` en `configuracion.routes.ts` con breadcrumb "Controles" (el menú ya existe en `dashboard.service.ts` con esa URL).
- Formularios reactivos (Reactive Forms) con validaciones replicando los schemas Zod del backend y mensajes de error bajo cada campo inválido.
- Reutilización de `AreasService`, `UnidadesService` y `UsuariosService` existentes para cargar entidades.
- Actualización local del listado tras cada operación usando las respuestas de la API y mensajes de éxito/error con toastr.
- Solo consumo de la API existente de `api-scap` (`/controles`, `/controles/:id/area`, `/controles/:id/unidad` y `/controles/:id/usuario`).

**Out of scope (for future specs):**

- Cambios en `api-scap` (rutas, payloads o procedimientos SQL).
- Paginación o filtros en el backend.
- Nombre persistido para el control.
- Asignación masiva de controles.
- Cálculo de asistencias, tardanzas o faltas a partir de los controles.
- Pruebas E2E.

---

## Data model

Se crea `src/app/core/interfaces/control.interface.ts`:

```ts
export interface ControlAsignacionArea {
  controlAreaId: number;
  controlId: number;
  areaId: number;
}

export interface ControlAsignacionUnidad {
  controlUnidadId: number;
  controlId: number;
  unidadId: number;
}

export interface ControlAsignacionUsuario {
  controlUsuarioId: number;
  controlId: number;
  usuarioId: number;
}

export interface Control {
  controlId: number;
  tolerancia: number;
  limiteTardanza: number;
  limiteFalta: number;
  areas: ControlAsignacionArea[];
  unidades: ControlAsignacionUnidad[];
  usuarios: ControlAsignacionUsuario[];
}

export interface CrearControlDto {
  tolerancia: number;
  limiteTardanza: number;
  limiteFalta: number;
}

export interface ActualizarControlDto {
  tolerancia?: number;
  limiteTardanza?: number;
  limiteFalta?: number;
}

export interface AsignarControlAreaDto {
  areaId: number;
}

export interface AsignarControlUnidadDto {
  unidadId: number;
}

export interface AsignarControlUsuarioDto {
  usuarioId: number;
}

export interface DesasignarControlAreaDto {
  areaId: number;
}

export interface DesasignarControlUnidadDto {
  unidadId: number;
}

export interface DesasignarControlUsuarioDto {
  usuarioId: number;
}
```

Convenciones:

- Base URL de `environment.urlScap` (igual que los servicios existentes).
- El nombre visible del control es `Control #<controlId>`; el backend no almacena nombre.
- Las asignaciones llegan con solo IDs; los nombres se resuelven cruzando con las listas de áreas, unidades y usuarios cargadas por los servicios existentes, con fallback `#<id>` si el registro no se encuentra.
- `PUT /controles/:id` es parcial: al editar se envían solo los campos modificados.
- Los mensajes de éxito/error provienen de `OperationResult` (`State`, `Message`).

---

## Implementation plan

1. Crear `src/app/core/interfaces/control.interface.ts` con los contratos del modelo de datos.
2. Crear `src/app/api/controles.service.ts` con `listarControles`, `crearControl`, `actualizarControl`, `eliminarControl`, `asignarArea`, `asignarUnidad`, `asignarUsuario`, `desasignarArea`, `desasignarUnidad` y `desasignarUsuario`.
3. Agregar en `configuracion.routes.ts` la ruta `controles` con breadcrumb "Controles" que carga la página (inicialmente vacía).
4. Implementar `controles.page.ts`: carga controles, áreas, unidades y usuarios; tabla con paginación en frontend y búsqueda local.
5. Crear el modal de control (`control-form.dialog.ng.ts`): formulario reactivo con `tolerancia`, `limiteTardanza` y `limiteFalta` (enteros `>= 0`); soporta crear y editar según el registro recibido.
6. Crear el selector con búsqueda local (`buscar-entity-selector.ng.ts` o equivalente) usando `@angular/cdk/overlay`: filtra mientras se escribe, marca como bloqueadas las entidades con control activo mostrando el control actual y deshabilita su selección.
7. Crear el modal de asignación (`asignar-control.dialog.ng.ts`): selector de control, selector de tipo de entidad y selector con búsqueda de la entidad; crea una asignación por vez.
8. Crear el modal de detalle (`control-asignaciones.dialog.ng.ts`): lista las asignaciones activas con nombres resueltos y permite desasignar cada una con confirmación.
9. Conectar en la página los botones de tabla: crear/editar control (modal), ver asignaciones (modal), asignar (modal) y eliminar (confirmación + `DELETE`).
10. Tras cada operación exitosa, actualizar el control afectado en el listado local usando la respuesta de la API y mostrar toastr según `OperationResult.State`.
11. Ejecutar `npm run build` y corregir cualquier error.

---

## Acceptance criteria

- [x] El menú existente `Configuración > Controles` (en `dashboard.service.ts`) navega a `/configuracion/controles` y no se modifica.
- [x] La página lista los controles con su etiqueta `Control #<controlId>`, `tolerancia`, `limiteTardanza`, `limiteFalta` y el resumen de asignaciones activas.
- [x] La paginación es en frontend con `PaginadorDataSource` y `ng-paginator`; no se modificó `api-scap`.
- [x] La búsqueda local filtra la lista por ID y por asignaciones.
- [x] El botón "Nuevo control" abre un modal con los tres campos numéricos.
- [x] Crear un control llama `POST /controles/` y la lista se actualiza sin recargar la página.
- [x] El formulario exige `tolerancia`, `limiteTardanza` y `limiteFalta` como enteros `>= 0` y muestra mensajes de error bajo cada campo inválido.
- [x] Editar un control precarga sus valores y llama `PUT /controles/:id` con solo los campos modificados.
- [x] Eliminar un control pide confirmación y llama `DELETE /controles/:id`.
- [x] Eliminar un control con asignaciones activas muestra el mensaje de error del backend y no lo quita de la lista.
- [x] El botón "Asignar" abre un modal que crea una asignación por vez (control + tipo + entidad).
- [x] El selector de entidades filtra localmente mientras se escribe usando `@angular/cdk/overlay`.
- [x] Las entidades con control activo aparecen bloqueadas en el selector y muestran su control actual.
- [x] Asignar llama a `POST /controles/:id/area`, `POST /controles/:id/unidad` o `POST /controles/:id/usuario` según el tipo.
- [x] El modal de detalle lista las asignaciones activas con nombres resueltos y fallback `#<id>`.
- [x] Desasignar pide confirmación y llama al `DELETE` correspondiente de la asignación.
- [x] Asignar una entidad que ya tiene control muestra el mensaje de error del backend si la condición de carrera lo permite.
- [x] Los mensajes de éxito/error se muestran con toastr según `OperationResult.State`.
- [x] `npm run build` finaliza sin errores.

---

## Decisions

- **Yes:** Solo frontend. El backend `api-scap` SPEC 02 está Implementado y expone todo el CRUD y las asignaciones; no se toca.
- **Yes:** URL `/configuracion/controles`. El menú ya existe en `dashboard.service.ts` con esa URL; no se modifica navegación.
- **Yes:** Sin nombre persistido para el control. El contrato del backend no lo define; la interfaz muestra `Control #<controlId>`.
- **Yes:** Modal de asignación que crea una asignación por vez. Reproduce las pantallas de referencia y coincide con los endpoints de SPEC 02.
- **Yes:** Modal de detalle que lista y permite quitar asignaciones. Da visibilidad de las relaciones activas de cada control.
- **Yes:** Selector con búsqueda local usando `@angular/cdk/overlay`. El proyecto ya usa `@angular/cdk` para diálogos y no requiere paginación en backend.
- **Yes:** Bloquear en el selector las entidades con control activo. Evita asignaciones que el backend rechazaría y coincide con las pantallas de referencia.
- **Yes:** Reutilizar `AreasService`, `UnidadesService` y `UsuariosService` existentes. Evita duplicar servicios o contratos.
- **Yes:** Resolver nombres de asignaciones cruzando IDs con las listas cargadas, con fallback `#<id>`. El backend devuelve solo IDs.
- **Yes:** Actualización local del listado con las respuestas de la API tras cada operación. Mantiene la lista consistente sin recargar todo.
- **Yes:** Paginación y búsqueda en frontend. La API devuelve la lista completa y el proyecto ya tiene `PaginadorDataSource`.
- **Yes:** Formularios reactivos con validaciones replicando los schemas Zod del backend y mensajes de error bajo cada campo.
- **No:** Cambios en `api-scap`. El contrato ya está implementado.
- **No:** Nombre persistido para el control. Requeriría cambiar modelo y procedimientos en backend; va en otro spec si se necesita.
- **No:** Asignación masiva. Cada asignación se crea individualmente.
- **No:** Pruebas E2E. La verificación es `npm run build` más prueba manual de los flujos.

---

## Risks

| Risk                                                              | Mitigation                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Condición de carrera al asignar dos controles al mismo objetivo   | El backend mantiene índices únicos filtrados; mostrar el `Message` sin romper el modal |
| Entidad no encontrada al cruzar nombres con las listas cargadas   | Fallback `#<id>` en tablas y diálogos                                                  |
| Listas de entidades grandes y búsqueda lenta                      | Búsqueda local con `debounce` sobre la lista completa en memoria                       |
| Error del backend al eliminar un control con asignaciones activas | Mostrar el `Message` de error y conservar el control en la lista                       |

---

## What is **not** in this spec

- Cambios en `api-scap` (rutas, payloads, procedimientos SQL).
- Nombre persistido para el control.
- Asignación masiva de controles.
- Cálculo de asistencias, tardanzas o faltas a partir de los controles.
- Pruebas E2E.

Cada uno de estos, si se necesita, va en su propio spec.
