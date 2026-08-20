import { Component, inject, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Area } from '../../../../../core/interfaces/area.interface';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';
import { FontIconService } from '../../../../../core/services/icon.service';
import PaginatorNg from '../../../../../shared/paginator/paginator.ng';
import { PaginadorDataSource } from '../../../../../core/datasources/paginador-data-source';

@Component({
  selector: 'usuarios-turno-modificado',
  imports: [FontAwesomeModule, PaginatorNg],
  template: `
    <section class="card border border-base-300 bg-base-100">
      <div class="card-body gap-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="card-title">Usuarios activos</h2>
            <p class="text-sm text-base-content/60">
              Selecciona un usuario para ver su horario operativo y sus
              modificaciones.
            </p>
          </div>
          @if (loading()) {
            <fa-icon
              [icon]="iconService.faSpinner"
              animation="spin"
              class="text-xl text-primary"
            />
          }
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Unidad</legend>
            <select
              class="select w-full"
              [value]="unidadId() ?? ''"
              (change)="unitChange.emit($event)"
            >
              <option value="">Todas las unidades</option>
              @for (unidad of unidades(); track unidad.unidadId) {
                <option [value]="unidad.unidadId">{{ unidad.nombre }}</option>
              }
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Área</legend>
            <select
              class="select w-full"
              [value]="areaId() ?? ''"
              [disabled]="unidadId() === undefined"
              (change)="areaChange.emit($event)"
            >
              <option value="">Todas las áreas</option>
              @for (area of areas(); track area.areaId) {
                <option [value]="area.areaId">{{ area.nombre }}</option>
              }
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Buscar</legend>
            <label class="input flex w-full items-center gap-2"
              ><fa-icon [icon]="iconService.faSearch" /><input
                type="search"
                class="grow"
                placeholder="Usuario, nombres, apellidos o DNI"
                (input)="search.emit($event)"
            /></label>
          </fieldset>
        </div>
        @if (!loading() && !users().length) {
          <p class="py-4 text-sm text-base-content/60">
            No se encontraron usuarios activos.
          </p>
        } @else if (!loading() && !filteredUsers().length) {
          <p class="py-4 text-sm text-base-content/60">
            No hay usuarios que coincidan con los filtros seleccionados.
          </p>
        } @else {
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Unidad</th>
                  <th>Área</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (usuario of rows(); track usuario.usuarioId) {
                  <tr
                    [class.bg-primary]="
                      selected()?.usuarioId === usuario.usuarioId
                    "
                  >
                    <td>{{ usuario.usuario }}</td>
                    <td>{{ userName(usuario) }}</td>
                    <td>{{ usuario.unidadNombre }}</td>
                    <td>{{ usuario.areaNombre }}</td>
                    <td class="text-end">
                      <button
                        type="button"
                        class="btn btn-xs"
                        (click)="select.emit(usuario)"
                      >
                        <fa-icon [icon]="iconService.faCalendarDays" /> Ver
                        horario
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <ng-paginator
            [length]="dataSource().length"
            [pageIndex]="dataSource().pageIndex"
            [pageSize]="dataSource().pageSize"
            (pageChange)="page.emit($event)"
          />
        }
      </div>
    </section>
  `,
})
export default class UsuariosTurnoModificado {
  iconService = inject(FontIconService);
  users = input<Usuario[]>([]);
  filteredUsers = input<Usuario[]>([]);
  rows = input<Usuario[]>([]);
  unidades = input<Unidad[]>([]);
  areas = input<Area[]>([]);
  unidadId = input<number | undefined>();
  areaId = input<number | undefined>();
  selected = input<Usuario | null>(null);
  loading = input(false);
  dataSource = input.required<PaginadorDataSource<Usuario>>();
  unitChange = output<Event>();
  areaChange = output<Event>();
  search = output<Event>();
  select = output<Usuario>();
  page = output<{ pageIndex: number; pageSize: number }>();
  userName(user: Usuario): string {
    return `${user.nombres} ${user.apellidos}`.trim() || user.usuario;
  }
}
