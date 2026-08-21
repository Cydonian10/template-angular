# SPEC 05 — Pantalla Motivos (mantenimiento)

> **Status:** Aprobado
> **Depends on:** `api-scap` SPEC 04 — Módulo Motivo con CRUD de catálogo (estado Aprobado)
> **Date:** 2026-08-21
> **Objective:** Crear la pantalla `Mantenimiento > Motivo` en `/mantenimiento/motivo` para administrar el catálogo de motivos con CRUD, búsqueda y paginación local.

---

## Scope

**In:**

- Página `Mantenimiento > Motivo` en `src/app/features/mantenimiento/pages/motivo/motivo.page.ts`.
- Ruta `motivo` en `src/app/features/mantenimiento/mantenimiento.routes.ts` con breadcrumb `Motivo`.
- Listado de motivos activos mediante `GET /motivos`.
- Tabla con las columnas `nombre`, `descripcion`, `documentoRequerido` y acciones.
- Búsqueda local por `nombre` y `descripcion`, ignorando mayúsculas y minúsculas.
- Paginación local con `PaginadorDataSource` y `ng-paginator`, con tamaños configurables y reinicio a la primera página cuando cambie la búsqueda.
- Botón `Nuevo motivo` que abre un diálogo reutilizable para crear un registro.
- Diálogo reutilizable para crear y editar motivos en `src/app/features/mantenimiento/pages/motivo/components/motivo-form.dialog.ng.ts`.
- Campos del diálogo: `nombre`, `descripcion` y `documentoRequerido`.
- Validaciones del formulario alineadas con `api-scap`: `nombre` requerido, no vacío y máximo 100 caracteres; `descripcion` opcional y máximo 255 caracteres; `documentoRequerido` booleano.
- Edición mediante `GET /motivos/:id` antes de abrir el diálogo y `PUT /motivos/:id` al guardar.
- Creación mediante `POST /motivos`.
- Eliminación lógica mediante `DELETE /motivos/:id` después de una confirmación con el diálogo compartido `src/app/shared/dialogs/confirmar.dialog.ng.ts`.
- Recarga del listado después de una creación, actualización o eliminación exitosa.
- Servicio HTTP `src/app/api/motivos.service.ts`.
- Contratos TypeScript en `src/app/core/interfaces/motivo.interface.ts`.
- Estados de carga para la consulta y las operaciones de guardado o eliminación.
- Mensajes de éxito y error mediante toastr, usando `OperationResult.State` y `OperationResult.Message` cuando la API los proporcione.
- Mantener la pantalla abierta y conservar el estado de la lista cuando falle una carga u operación.
- Consumir únicamente los endpoints existentes de `api-scap`; no modificar el backend.

**Out of scope (for future specs):**

- Cambios en `api-scap`, sus rutas, payloads, procedimientos SQL o validaciones.
- Consulta o administración de motivos eliminados lógicamente.
- Paginación, búsqueda, filtros u ordenamiento en el backend.
- Integración de motivos con `Permisos`, `Justificaciones` o `Licencia`.
- Gestión de usuarios, permisos o visibilidad por rol desde esta pantalla.
- Importación, exportación o carga masiva de motivos.
- Pruebas E2E.

---

## Data model

Se crea `src/app/core/interfaces/motivo.interface.ts`:

```ts
import { OperationResult, OperationResultCreate } from "./unidad.interface";

export interface Motivo {
  motivoId: number;
  nombre: string;
  descripcion: string | null;
  documentoRequerido: boolean;
}

export interface CrearMotivoDto {
  nombre: string;
  descripcion?: string | null;
  documentoRequerido?: boolean;
}

export interface ActualizarMotivoDto {
  nombre?: string;
  descripcion?: string | null;
  documentoRequerido?: boolean;
}

export type { OperationResult, OperationResultCreate };
```

Convenciones:

- La base URL se toma de `environment.urlScap`, igual que los demás servicios del frontend.
- El servicio usa `GET /motivos`, `GET /motivos/:id`, `POST /motivos`, `PUT /motivos/:id` y `DELETE /motivos/:id`.
- El alta envía `documentoRequerido: false` cuando el usuario no lo activa.
- Los valores de texto se recortan antes de enviarse; una descripción vacía se envía como `null`.
- La lista contiene únicamente los motivos activos porque ese es el contrato de `GET /motivos`.
- Las respuestas de creación, actualización y eliminación siguen los contratos `OperationResultCreate` u `OperationResult` existentes.

---

## Implementation plan

1. Crear `src/app/core/interfaces/motivo.interface.ts` con los contratos de respuesta y de alta/actualización alineados con `api-scap` SPEC 04.
2. Crear `src/app/api/motivos.service.ts` con métodos para listar, obtener por ID, crear, actualizar y eliminar motivos.
3. Agregar la ruta `motivo` en `src/app/features/mantenimiento/mantenimiento.routes.ts` para cargar `motivo.page.ts` con breadcrumb `Motivo`.
4. Crear `motivo-form.dialog.ng.ts` con el formulario reactivo de alta y edición, incluyendo las validaciones del contrato y mensajes bajo los campos inválidos.
5. Implementar en `motivo.page.ts` la carga inicial de motivos y los estados de carga y error de la consulta.
6. Conectar la lista completa al `PaginadorDataSource` y mostrarla mediante `ng-paginator` con búsqueda local por nombre y descripción.
7. Agregar el botón `Nuevo motivo`, abrir el diálogo en modo creación y enviar el DTO a `POST /motivos` cuando el formulario sea válido.
8. Agregar la acción de edición, consultar `GET /motivos/:id`, abrir el diálogo con el detalle recibido y enviar los cambios a `PUT /motivos/:id`.
9. Agregar la acción de eliminación con `confirmar.dialog.ng.ts`, llamar `DELETE /motivos/:id` tras confirmar y recargar la lista después del éxito.
10. Mostrar toastr para resultados exitosos y errores, cerrar el diálogo solo cuando la operación haya terminado correctamente y conservarlo abierto ante errores de guardado.
11. Verificar manualmente la navegación, carga, búsqueda, paginación, alta, edición, confirmación de eliminación y manejo de errores.
12. Ejecutar `npm run build` y corregir cualquier error de TypeScript o `strictTemplates`.

---

## Acceptance criteria

- [ ] El menú existente `Mantenimiento > Motivo` navega a `/mantenimiento/motivo`.
- [ ] La ruta carga `motivo.page.ts` y muestra el breadcrumb `Motivo`.
- [ ] La página consulta `GET /motivos` al cargar.
- [ ] La tabla muestra nombre, descripción, indicador de documento requerido y acciones.
- [ ] La búsqueda local filtra por nombre y descripción sin distinguir mayúsculas y minúsculas.
- [ ] Cambiar la búsqueda reinicia la paginación a la primera página.
- [ ] La tabla usa `PaginadorDataSource` y `ng-paginator` para paginar en frontend.
- [ ] El tamaño de página puede cambiarse mediante las opciones del paginador compartido.
- [ ] `Nuevo motivo` abre el diálogo en modo creación.
- [ ] El formulario exige un nombre no vacío y limita su longitud a 100 caracteres.
- [ ] El formulario permite una descripción opcional de hasta 255 caracteres.
- [ ] El formulario permite activar o desactivar `documentoRequerido`.
- [ ] Crear un motivo válido llama `POST /motivos` con nombre, descripción y valor booleano.
- [ ] Una creación exitosa cierra el diálogo, muestra toastr y actualiza la lista.
- [ ] Una creación inválida no llama a la API y muestra errores bajo los campos correspondientes.
- [ ] Editar un motivo llama `GET /motivos/:id` antes de abrir el diálogo.
- [ ] El diálogo de edición precarga el detalle recibido.
- [ ] Guardar una edición válida llama `PUT /motivos/:id`.
- [ ] Una edición exitosa cierra el diálogo, muestra toastr y actualiza la lista.
- [ ] Eliminar un motivo solicita confirmación antes de llamar a la API.
- [ ] Confirmar la eliminación llama `DELETE /motivos/:id`.
- [ ] Cancelar la eliminación no llama al endpoint DELETE.
- [ ] Una eliminación exitosa muestra toastr y quita el motivo de la lista activa.
- [ ] Los errores de API se muestran con toastr y no abandonan la pantalla.
- [ ] Los estados de carga deshabilitan las acciones afectadas mientras la operación está en curso.
- [ ] No se agregan endpoints ni cambios en `api-scap`.
- [ ] `npm run build` finaliza sin errores.

---

## Decisions

- **Sí:** Implementar solo el frontend. `api-scap` SPEC 04 ya expone el CRUD requerido.
- **Sí:** Usar la ruta existente del menú `/mantenimiento/motivo`. Evita modificar la navegación global.
- **Sí:** Mantener un servicio `motivos.service.ts` y una interfaz `motivo.interface.ts`. La entidad tiene un contrato y un recurso HTTP propios.
- **Sí:** Usar un diálogo reutilizable para alta y edición. Sigue el patrón de `@angular/cdk/dialog` del proyecto y evita duplicar formularios.
- **Sí:** Consultar el detalle con `GET /motivos/:id` antes de editar. El formulario se basa en datos actuales del backend.
- **Sí:** Usar eliminación lógica mediante el endpoint existente y pedir confirmación. El catálogo no debe borrar físicamente registros referenciados.
- **Sí:** Buscar y paginar en frontend. El backend devuelve el catálogo completo y la especificación de backend excluye paginación y filtros avanzados.
- **Sí:** Replicar en el formulario los límites de `api-scap`: nombre de 100 caracteres y descripción de 255 caracteres.
- **Sí:** Mostrar `nombre`, `descripcion` y `documentoRequerido` en la tabla. Son todos los campos funcionales del contrato visible.
- **Sí:** Mantener la pantalla ante errores y usar toastr. Permite reintentar sin perder la lista o el formulario.
- **Sí:** Verificar con `npm run build` y recorrido manual. El frontend no tiene suite específica ni pruebas E2E configuradas.
- **No:** Modificar el backend o sus contratos. Ya están definidos en `api-scap` SPEC 04.
- **No:** Consultar motivos eliminados. La API pública del catálogo solo expone registros activos.
- **No:** Integrar motivos con otros módulos. Esa integración requiere decisiones propias de cada dominio.
- **No:** Agregar paginación o búsqueda remota. La lista se filtra y pagina localmente.
- **No:** Crear formularios de importación o administración masiva. No forman parte del CRUD solicitado.

---

## Risks

| Risk                                                                          | Mitigation                                                                                                         |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| El nombre ingresado ya existe entre motivos activos.                          | Mostrar el mensaje de error del backend mediante toastr y mantener abierto el diálogo.                             |
| La lista completa crece y afecta el rendimiento de búsqueda.                  | Mantener la paginación local y aplicar el filtro sobre la colección cargada, con el patrón existente del frontend. |
| Un motivo fue eliminado o modificado entre la carga de la tabla y la edición. | Consultar el detalle antes de editar y mostrar el error del backend si el registro ya no está disponible.          |
| Se intenta eliminar un motivo referenciado por otros módulos.                 | Usar eliminación lógica y conservar las referencias históricas según el contrato de `api-scap`.                    |
| La API falla durante una operación.                                           | Conservar la pantalla, no cerrar el diálogo en alta/edición y permitir reintentar después de mostrar toastr.       |

---

## What is **not** in this spec

- Cambios en `api-scap` o en la base de datos.
- Consulta de motivos eliminados.
- Integración con `Permisos`, `Justificaciones` o `Licencia`.
- Paginación, búsqueda o filtros en el backend.
- Importación, exportación o carga masiva.
- Gestión de permisos de acceso desde esta funcionalidad.
- Pruebas E2E.

Cada elemento podrá definirse en su propio spec si se requiere.
