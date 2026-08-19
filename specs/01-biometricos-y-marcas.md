# SPEC 01 — Pantalla Biométricos con gestión de marcas

> **Status:** Aprobado
> **Depends on:** Ninguno (el backend ya está implementado en `api-scap`, SPEC 01)
> **Date:** 2026-08-18
> **Objective:** Crear la pantalla `Configuración > Biométricos` que lista dispositivos biométricos con paginación y búsqueda local, permite crear y editar biométricos mediante modal, e incluye un modal para administrar marcas de biométricos (listar, crear, editar y eliminar).

---

## Scope

**In:**

- Página `Configuración > Biométricos` en `src/app/features/configuracion/pages/biometricos/`.
- Tabla de biométricos con paginación en frontend (`PaginadorDataSource` + `ng-paginator`) y búsqueda local por nombre, marca, IP, serie y ubicación.
- Modal de crear/editar biométrico con campos: marca, nombre, IP, serie, ubicación, tarjeta, huella y rostro.
- Modal de marcas con tabla (nombre, tipoDB, detalle) y acciones crear, editar y eliminar.
- Formularios reactivos (Reactive Forms) con validaciones `required` y `maxLength` (según los schemas Zod del backend) y mensajes de error mostrados bajo cada campo inválido.
- Eliminación con diálogo de confirmación para biométricos y marcas.
- Servicios HTTP nuevos: `biometricos.service.ts` (biométricos) y `marca-biometrico.service.ts` (marcas), con contratos en `core/interfaces/biometrico.interface.ts`.
- Ruta `/configuracion/biometricos` en `configuracion.routes.ts`.
- Solo consumo de la API existente de `api-scap` (`/biometrico` y `/marca-biometrico`).

**Out of scope (for future specs):**

- Cambios en `api-scap` (rutas, payloads o procedimientos SQL).
- Paginación o filtros en el backend.
- Comunicación con dispositivos biométricos reales.
- Sincronización de marcas de los dispositivos.
- Menú separado `Mantenimiento > Marcas`.

---

## Data model

Se crea `src/app/core/interfaces/biometrico.interface.ts`:

```ts
export interface MarcaBiometrico {
  marcaBiometricoId: number;
  nombre: string;
  tipoDB: string;
  detalle: string;
}

export interface Biometrico {
  biometricoId: number;
  marcaBiometricoId: number;
  marcaNombre: string;
  nombre: string;
  ip: string;
  serie: string;
  ubicacion: string;
  tarjeta: boolean;
  huella: boolean;
  rostro: boolean;
}

export interface CrearMarcaBiometricoDto {
  nombre: string;
  tipoDB: string;
  detalle: string;
}

export interface ActualizarMarcaBiometricoDto {
  nombre: string;
  tipoDB: string;
  detalle: string;
}

export interface CrearBiometricoDto {
  marcaBiometricoId: number;
  nombre: string;
  ip: string;
  serie: string;
  ubicacion: string;
  tarjeta: boolean;
  huella: boolean;
  rostro: boolean;
}

export interface ActualizarBiometricoDto {
  marcaBiometricoId: number;
  nombre: string;
  ip: string;
  serie: string;
  ubicacion: string;
  tarjeta: boolean;
  huella: boolean;
  rostro: boolean;
}
```

Convenciones:

- Base URL de `environment.urlScap` (igual que los servicios existentes).
- Los endpoints de `api-scap` usan `biometrico` y `marca-biometrico` en singular.
- Los DTOs de operación replican los schemas Zod del backend (validaciones idénticas).
- Los mensajes de éxito/error provienen de `OperationResult` (`State`, `Message`).

---

## Implementation plan

1. Crear `src/app/core/interfaces/biometrico.interface.ts` con los contratos del modelo de datos.
2. Crear `src/app/api/biometricos.service.ts` con los métodos `listarBiometricos`, `crearBiometrico`, `actualizarBiometrico` y `eliminarBiometrico`, y `src/app/api/marca-biometrico.service.ts` con `listarMarcas`, `crearMarca`, `actualizarMarca` y `eliminarMarca`.
3. Agregar en `configuracion.routes.ts` la ruta `biometricos` que carga la página (inicialmente vacía con breadcrumb "Biométricos").
4. Implementar `biometricos.page.ts`: carga biométricos y marcas, tabla con paginación en frontend y búsqueda local.
5. Crear el modal de marcas (`marcas.dialog.ng.ts`): tabla con nombre, tipoDB y detalle; botones "Nueva marca", editar y eliminar (con confirmación); al cambiar la lista se refresca el selector del formulario de biométrico.
6. Crear el modal de biométrico (`biometrico-form.dialog.ng.ts`): formulario con selector de marca y campos nombre, IP, serie, ubicación, tarjeta, huella y rostro; soporta crear y editar según el registro recibido.
7. Conectar en la página los botones de tabla: editar biométrico (abre modal con datos) y eliminar biométrico (confirmación + `DELETE`).
8. Ejecutar `npm run build` y corregir cualquier error.

---

## Acceptance criteria

- [ ] El menú `Configuración > Biométricos` (ya existente en `dashboard.service.ts`) navega a `/configuracion/biometricos`.
- [ ] La página lista los biométricos con nombre, marca, IP, serie, ubicación y modos (tarjeta/huella/rostro).
- [ ] La paginación es en frontend con `PaginadorDataSource` y `ng-paginator`; no se modificó `api-scap`.
- [ ] La búsqueda local filtra la lista por nombre, marca, IP, serie y ubicación.
- [ ] El botón "Nuevo biométrico" abre un modal con marca, nombre, IP, serie, ubicación, tarjeta, huella y rostro.
- [ ] Crear un biométrico llama `POST /biometrico` y la lista se actualiza.
- [ ] Editar un biométrico precarga sus valores en el modal y llama `PUT /biometrico/:id`.
- [ ] Eliminar un biométrico pide confirmación y llama `DELETE /biometrico/:id`.
- [ ] El botón "Marcas" abre un modal con tabla de nombre, tipoDB y detalle.
- [ ] El modal de marcas permite crear (`POST /marca-biometrico`), editar (`PUT /marca-biometrico/:id`) y eliminar (`DELETE /marca-biometrico/:id`) con confirmación.
- [ ] Si una marca tiene biométricos asociados, la eliminación falla y se muestra el mensaje de error del backend.
- [ ] Las marcas nuevas quedan disponibles en el selector del formulario de biométrico sin recargar la página.
- [ ] Los mensajes de éxito/error se muestran con toastr según `OperationResult.State`.
- [ ] `npm run build` finaliza sin errores.

---

## Decisions

- **Yes:** Una sola pantalla `Configuración > Biométricos` con las marcas en un modal. El menú ya existe en el frontend con esa URL, así que no se toca el sidebar.
- **Yes:** Paginación y búsqueda en frontend. La API devuelve la lista completa y el proyecto ya tiene `PaginadorDataSource`; no se pide paginación al backend.
- **Yes:** Crear/editar biométrico mediante modal (patrón de diálogos `@angular/cdk/dialog` del proyecto).
- **Yes:** Modal de marcas con CRUD completo dentro de la página. El backend ya expone las rutas y el usuario lo prefirió a un menú separado en Mantenimiento.
- **Yes:** Dos servicios separados: `biometricos.service.ts` (biométricos) y `marca-biometrico.service.ts` (marcas). Cada entidad con su propio servicio, alineado con la separación de módulos del backend.
- **Yes:** Contratos e interfaces nuevos en `core/interfaces/biometrico.interface.ts` siguiendo la convención del proyecto.
- **Yes:** Formularios reactivos (Reactive Forms) con validaciones `required` y `maxLength` replicando los schemas Zod del backend, y mensajes de error bajo cada input inválido. Aplica al formulario de marcas y al de biométrico.
- **No:** Menú separado `Mantenimiento > Marcas`. Se concentra todo en `Configuración > Biométricos`.
- **No:** Cambios en `api-scap`. El CRUD ya está implementado (SPEC 01 del backend, estado Implementado).
- **No:** Comunicación con dispositivos biométricos reales. Solo gestión administrativa de registros.

---

## Risks

| Risk                                                          | Mitigation                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Eliminar una marca con biométricos asociados falla en backend | Mostrar el `Message` de error de la API sin romper la lista de marcas       |
| Crear biométrico sin marcas disponibles                       | El formulario deshabilita el guardado y muestra aviso si no hay marcas      |
| Recarga con lista grande y búsqueda lenta                     | La búsqueda local usa `debounce` y opera sobre la lista completa en memoria |

---

## What is **not** in this spec

- Cambios en `api-scap` (rutas, payloads, procedimientos SQL).
- Paginación o filtros en el backend.
- Conexión con dispositivos biométricos reales.
- Menú separado `Mantenimiento > Marcas`.

Cada uno de estos, si se necesita, va en su propio spec.
