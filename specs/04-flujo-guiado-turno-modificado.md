# SPEC 04 — Flujo guiado para crear turno modificado

> **Status:** Aprobado
> **Depends on:** SPEC 03 — Pantalla Turno Modificado
> **Date:** 2026-08-20
> **Objective:** Cambiar la creación y edición de turnos modificados para que el usuario seleccionado elija una fecha, vea únicamente los turnos disponibles para ese día y seleccione el turno antes de guardar.

---

## Why this spec exists

La matriz semanal actual permite seleccionar un turno de un día y después introducir una fecha de otro día en el formulario, lo que puede asociar visualmente datos incompatibles y confundir al usuario.

---

## Scope

**In:**

- Modificar el flujo de `Seguimiento > Turno modificado` después de seleccionar un usuario.
- Reemplazar la matriz semanal de turnos clicables por un botón `Nueva modificación`.
- Reutilizar `modificacion-turno.dialog.ng.ts` como formulario guiado.
- Seleccionar primero una fecha válida dentro de la vigencia del horario activo.
- Listar los turnos correspondientes a la fecha elegida.
- Permitir seleccionar un turno del día y precargar sus horas.
- Permitir editar `horaInicio` y `horaFin` después de seleccionar el turno.
- Mostrar un mensaje y deshabilitar el guardado cuando la fecha no tenga turnos disponibles.
- Usar como fecha inicial el día actual si está dentro de la vigencia; de lo contrario, la fecha de inicio de la asignación.
- Limpiar turno y horas seleccionados cuando cambie la fecha.
- Mantener el formulario actual para editar una modificación existente.
- Mantener los filtros de usuarios, el resumen mensual por usuario y los pipes compartidos existentes.
- Mantener los endpoints actuales de creación, consulta individual, actualización y eliminación.

**Out of scope (for future specs):**

- Cambios en `api-scap`, rutas, payloads o procedimientos SQL.
- Creación o edición de horarios.
- Asignación o cambio de horarios de usuarios.
- Permitir crear modificaciones en días sin turnos mediante horas manuales.
- Cambiar las reglas de negocio del backend para duplicados, asistencias o eliminación lógica.
- Cambiar el resumen mensual o agregar nuevos filtros al resumen.
- Persistencia local de la fecha, turno o formulario.
- Pruebas E2E.

---

## Data model

Esta especificación no introduce nuevas estructuras persistidas. Reutiliza `HorarioDetalle`, `HorarioTurno`, `UsuarioHorarioAsignacion`, `TurnoModificado` y `ModificacionTurnoDialogData` de SPEC 03.

El diálogo debe mantener estado temporal para:

- Fecha seleccionada en formato `YYYY-MM-DD`.
- Turnos disponibles para la fecha seleccionada.
- `turnoId` seleccionado.
- Horas precargadas y editables.

La selección de turnos debe derivarse de `HorarioDetalle`:

- Horario regular: usar los turnos del día de la semana seleccionado.
- Horario rotativo: usar los turnos del grupo cuya vigencia contenga la fecha seleccionada.
- Sin grupo vigente o sin turnos: devolver una lista vacía.

---

## Implementation plan

1. Actualizar `horario-usuario-turno-modificado.ng.ts` para mostrar la información del horario activo sin una matriz semanal clicable y emitir una acción `Nueva modificación`.
2. Actualizar `turno-modificado.page.ts` para abrir el diálogo de creación con el usuario seleccionado y el detalle del horario activo.
3. Extender `ModificacionTurnoDialogData` en `modificacion-turno.dialog.ng.ts` para recibir el detalle del horario y el contexto necesario para calcular los turnos de una fecha.
4. Implementar en `modificacion-turno.dialog.ng.ts` la selección inicial de fecha: hoy cuando esté dentro de la vigencia activa; en caso contrario, la fecha de inicio de la asignación.
5. Implementar el cálculo de turnos disponibles por fecha para horarios regulares y rotativos, respetando las vigencias de los grupos rotativos.
6. Actualizar el formulario para mostrar el selector de fecha antes del selector de turno y mostrar solo los turnos disponibles para esa fecha.
7. Limpiar el turno seleccionado, `horaInicio` y `horaFin` cuando cambie la fecha, y deshabilitar `Guardar` hasta seleccionar un turno válido.
8. Al seleccionar un turno, precargar sus horas y conservar los campos de hora editables.
9. Mantener la creación usando `POST /turno/:turnoId/modificar` con el `turnoId` seleccionado y el `usuarioId` del usuario seleccionado.
10. Mantener la edición usando el formulario actual y el `turnoId` original de la modificación.
11. Mantener disponible la eliminación de modificaciones históricas sin cambios en su flujo.
12. Mantener la recarga del detalle del usuario y del resumen mensual después de crear, editar o eliminar una modificación.
13. Ejecutar `npm run build` y corregir cualquier error de TypeScript o `strictTemplates`.

---

## Acceptance criteria

- [ ] Después de seleccionar un usuario con horario activo se muestra el botón `Nueva modificación`.
- [ ] La matriz semanal actual deja de mostrar turnos clicables para crear modificaciones.
- [ ] `Nueva modificación` abre el diálogo con el usuario y el horario activo seleccionados.
- [ ] La fecha inicial es hoy cuando está dentro de la vigencia del horario activo.
- [ ] La fecha inicial es la fecha de inicio de la asignación cuando hoy está fuera de la vigencia.
- [ ] El diálogo muestra la fecha antes de listar los turnos disponibles.
- [ ] Un horario regular lista únicamente los turnos del día de la semana elegido.
- [ ] Un horario rotativo lista únicamente los turnos del grupo vigente para la fecha elegida.
- [ ] Una fecha sin turnos muestra un mensaje explicativo.
- [ ] Guardar está deshabilitado cuando la fecha no tiene turnos o no hay un turno seleccionado.
- [ ] Cambiar la fecha limpia el turno y las horas previamente seleccionados.
- [ ] Seleccionar un turno precarga `horaInicio` y `horaFin` con las horas del turno.
- [ ] `horaInicio` y `horaFin` pueden editarse antes de guardar.
- [ ] Crear envía el `turnoId` del turno seleccionado y no el de un turno de otro día.
- [ ] Crear conserva el `usuarioId`, la fecha y el motivo del formulario actual.
- [ ] Editar conserva el formulario actual y usa el `turnoId` original de la modificación.
- [ ] Una modificación histórica continúa pudiendo eliminarse con confirmación.
- [ ] Después de una operación exitosa se recargan el detalle del usuario y su resumen mensual.
- [ ] No se agregan endpoints ni procedimientos SQL nuevos.
- [ ] `npm run build` finaliza sin errores.

---

## Decisions

- **Sí:** Botón `Nueva modificación` después de seleccionar usuario. Evita ocupar la matriz con acciones ambiguas.
- **Sí:** Diálogo existente como contenedor del formulario. Conserva el patrón de modales y mantiene la página compacta.
- **Sí:** Fecha antes del turno. El día elegido determina los turnos válidos y elimina la posibilidad de escoger un turno de otro día.
- **Sí:** Fecha inicial automática. Hoy es la opción más directa cuando es válida; la fecha de inicio evita abrir el formulario sin un contexto operativo.
- **Sí:** Horas precargadas y editables. Conserva las horas del turno como referencia y permite registrar una modificación real.
- **Sí:** Limpiar selección al cambiar fecha. Evita guardar un turno y unas horas pertenecientes a otra fecha.
- **Sí:** Días sin turnos no permiten horas manuales. Una modificación debe partir de un turno operativo existente.
- **Sí:** Edición con el formulario actual. El endpoint de actualización no permite cambiar `turnoId` y no se cambia el backend.
- **Sí:** Solo frontend. Los endpoints actuales ya reciben `turnoId`, `usuarioId`, fecha y horas suficientes para el flujo.
- **No:** Mantener la matriz semanal como acción de creación. La selección de fecha posterior provoca la ambigüedad que esta especificación corrige.
- **No:** Mostrar horas manuales en días libres. Permitirlo rompería la relación entre una modificación y un turno configurado.
- **No:** Cambiar el turno durante edición. `PUT /turno/:turnoId/modificar/:id` no admite reasignar el turno.
- **No:** Cambiar backend. No se requiere modificar contratos ni procedimientos SQL.
- **No:** Persistir el estado del diálogo. La selección solo pertenece a la operación actual.

---

## Risks

| Risk                                                         | Mitigation                                                                                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| La fecha seleccionada no pertenece a ningún grupo rotativo   | Mostrar fecha sin turnos y mantener deshabilitado el guardado.                                                                          |
| La asignación activa cambia mientras el diálogo está abierto | Validar contra el detalle recibido y dejar que el backend rechace inconsistencias; mostrar su mensaje.                                  |
| Una modificación histórica no coincide con el horario actual | Mantener el formulario de edición actual, que opera con el turno original.                                                              |
| El turno seleccionado se desincroniza con la fecha           | Limpiar selección al cambiar fecha y enviar siempre el `turnoId` seleccionado.                                                          |
| La fecha de inicio de asignación es nula                     | Usar hoy como fecha inicial solo si está dentro de una vigencia calculable; de lo contrario, abrir sin turno y exigir una fecha válida. |

---

## What is **not** in this spec

- Cambios en `api-scap`.
- Creación o edición de horarios.
- Asignación de horarios a usuarios.
- Creación manual en días sin turnos.
- Nuevos filtros o cambios en el resumen mensual.
- Persistencia local del formulario.
- Pruebas E2E.

Cada uno de estos temas, si se necesita, va en su propio spec.
