import { CommonModule } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AreasService } from '../../../../api/areas.service';
import { HorariosService } from '../../../../api/horarios.service';
import { TurnoModificadoService } from '../../../../api/turno-modificado.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { UsuariosService } from '../../../../api/usuarios.service';
import { PaginadorDataSource } from '../../../../core/datasources/paginador-data-source';
import { Area } from '../../../../core/interfaces/area.interface';
import {
  HorarioDetalle,
  HorarioTurno,
  UsuarioHorarioAsignacion,
} from '../../../../core/interfaces/horario.interface';
import { TurnoModificado } from '../../../../core/interfaces/turno-modificado.interface';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Usuario } from '../../../../core/interfaces/usuario.interface';
import { FontIconService } from '../../../../core/services/icon.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import { abrirConfirmarDialog } from '../../../../shared/dialogs/confirmar.dialog.ng';
import PaginatorNg from '../../../../shared/paginator/paginator.ng';
import ModificacionTurnoDialog, {
  ModificacionTurnoDialogData,
  ModificacionTurnoDialogResult,
} from './components/modificacion-turno.dialog.ng';

interface ColumnaDia {
  diaId: number;
  diaNombre: string;
  turnos: HorarioTurno[];
}

interface MatrizSemana {
  key: string;
  etiqueta: string;
  columnas: ColumnaDia[];
}

interface TurnoResumen {
  turnoId: number;
  usuario: Usuario;
  asignacion: UsuarioHorarioAsignacion;
}

interface ResumenModificacion extends TurnoResumen {
  modificacion: TurnoModificado;
}

@Component({
  selector: 'turno-modificado-page',
  imports: [CommonModule, FontAwesomeModule, BreadcrumbsNg, PaginatorNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Turno modificado</h1>
        <p class="mt-1 text-sm text-base-content/60">
          Consulta los horarios activos y registra modificaciones por fecha.
        </p>
      </div>

      <section class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="card-title">Usuarios activos</h2>
              <p class="text-sm text-base-content/60">
                Selecciona un usuario para ver su horario operativo.
              </p>
            </div>
            @if (cargandoUsuarios()) {
              <fa-icon
                [icon]="iconService.faSpinner"
                [animation]="'spin'"
                class="text-xl text-primary"
              ></fa-icon>
            }
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Unidad</legend>
              <select
                class="select w-full"
                [value]="unidadIdFiltro() ?? ''"
                (change)="cambiarUnidad($event)"
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
                [value]="areaIdFiltro() ?? ''"
                [disabled]="unidadIdFiltro() === undefined"
                (change)="cambiarArea($event)"
              >
                <option value="">Todas las áreas</option>
                @for (area of areas(); track area.areaId) {
                  <option [value]="area.areaId">{{ area.nombre }}</option>
                }
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Buscar</legend>
              <label class="input flex w-full items-center gap-2">
                <fa-icon [icon]="iconService.faSearch"></fa-icon>
                <input
                  type="search"
                  class="grow"
                  placeholder="Usuario, nombres, apellidos o DNI"
                  (input)="buscar($event)"
                />
              </label>
            </fieldset>
          </div>

          @if (!cargandoUsuarios() && !usuarios().length) {
            <p class="py-4 text-sm text-base-content/60">
              No se encontraron usuarios activos.
            </p>
          } @else if (!cargandoUsuarios() && !usuariosFiltrados().length) {
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
                  @for (usuario of filas(); track usuario.usuarioId) {
                    <tr
                      [class.bg-primary]="
                        usuarioSeleccionado()?.usuarioId === usuario.usuarioId
                      "
                    >
                      <td>{{ usuario.usuario }}</td>
                      <td>{{ nombreUsuario(usuario) }}</td>
                      <td>{{ usuario.unidadNombre }}</td>
                      <td>{{ usuario.areaNombre }}</td>
                      <td class="text-end">
                        <button
                          type="button"
                          class="btn btn-xs"
                          (click)="seleccionarUsuario(usuario)"
                        >
                          <fa-icon
                            [icon]="iconService.faCalendarDays"
                          ></fa-icon>
                          Ver horario
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <ng-paginator
              [length]="dataSource.length"
              [pageIndex]="dataSource.pageIndex"
              [pageSize]="dataSource.pageSize"
              (pageChange)="dataSource.paginar($event)"
            />
          }
        </div>
      </section>

      @if (usuarioSeleccionado(); as usuario) {
        <section class="card border border-base-300 bg-base-100">
          <div class="card-body gap-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="card-title">
                  Horario de {{ nombreUsuario(usuario) }}
                </h2>
                <p class="text-sm text-base-content/60">
                  Los turnos activos se pueden seleccionar para registrar una
                  modificación.
                </p>
              </div>
              @if (cargandoDetalle()) {
                <fa-icon
                  [icon]="iconService.faSpinner"
                  [animation]="'spin'"
                  class="text-xl text-primary"
                ></fa-icon>
              }
            </div>

            @if (!cargandoDetalle() && !asignacionActiva()) {
              <div role="alert" class="alert alert-warning">
                <span>Este usuario no tiene un horario activo.</span>
              </div>
            } @else if (asignacionActiva()) {
              @if (asignacionActiva(); as asignacion) {
                <div class="rounded-box border border-info/40 bg-base-200 p-4">
                  <div
                    class="mb-4 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <h3 class="font-semibold">
                        {{ asignacion.horarioNombre }}
                      </h3>
                      <p class="text-sm text-base-content/60">
                        Vigente desde {{ formatFecha(asignacion.fechaInicio) }}
                      </p>
                    </div>
                    <span class="badge badge-info">Activo</span>
                  </div>
                  @if (horarioDetalle(); as detalle) {
                    @for (matriz of matricesSemana(detalle); track matriz.key) {
                      <div class="mb-4">
                        @if (matriz.etiqueta) {
                          <p class="mb-2 text-sm font-medium">
                            Vigencia: {{ matriz.etiqueta }}
                          </p>
                        }
                        <div
                          class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7"
                        >
                          @for (dia of matriz.columnas; track dia.diaId) {
                            <div
                              class="rounded-box border border-base-300 bg-base-100 p-2"
                            >
                              <p class="text-center text-sm font-semibold">
                                {{ dia.diaNombre }}
                              </p>
                              <div class="mt-2 space-y-1">
                                @for (
                                  turno of dia.turnos;
                                  track turno.turnoId
                                ) {
                                  <button
                                    type="button"
                                    class="btn btn-sm btn-block font-mono"
                                    (click)="crearModificacion(turno)"
                                  >
                                    {{ formatHora(turno.horaInicio) }} -
                                    {{ formatHora(turno.horaFin) }}
                                  </button>
                                } @empty {
                                  <p
                                    class="py-1 text-center text-xs text-base-content/50"
                                  >
                                    Libre
                                  </p>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  } @else if (!cargandoDetalle()) {
                    <p class="text-sm text-base-content/60">
                      No se pudo cargar el detalle del horario.
                    </p>
                  }
                </div>
              }
            }
          </div>
        </section>
      }

      <section class="card border border-base-300 bg-base-100">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="card-title">Resumen mensual global</h2>
              <p class="text-sm text-base-content/60">
                Modificaciones de todos los usuarios y turnos activos.
              </p>
            </div>
            <div class="join">
              <button
                type="button"
                class="btn btn-sm join-item"
                (click)="cambiarMes(-1)"
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <span class="btn btn-sm join-item pointer-events-none">{{
                nombreMes()
              }}</span>
              <button
                type="button"
                class="btn btn-sm join-item"
                (click)="cambiarMes(1)"
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>
          </div>

          @if (cargandoResumen()) {
            <div class="flex justify-center py-8">
              <fa-icon
                [icon]="iconService.faSpinner"
                [animation]="'spin'"
                class="text-2xl text-primary"
              ></fa-icon>
            </div>
          } @else if (!resumen().length) {
            <p class="py-4 text-sm text-base-content/60">
              No hay modificaciones registradas en
              {{ nombreMes().toLocaleLowerCase() }}.
            </p>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Unidad</th>
                    <th>Área</th>
                    <th>Horario</th>
                    <th>Horas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (
                    item of resumen();
                    track item.modificacion.turnoModificadoId
                  ) {
                    <tr>
                      <td>{{ formatFecha(item.modificacion.fecha) }}</td>
                      <td>{{ nombreUsuario(item.usuario) }}</td>
                      <td>{{ item.usuario.unidadNombre }}</td>
                      <td>{{ item.usuario.areaNombre }}</td>
                      <td>{{ item.asignacion.horarioNombre }}</td>
                      <td class="font-mono">
                        {{ formatHora(item.modificacion.horaInicio) }} -
                        {{ formatHora(item.modificacion.horaFin) }}
                      </td>
                      <td class="space-x-1 text-end">
                        <button
                          type="button"
                          class="btn btn-xs"
                          [disabled]="
                            editandoId() === item.modificacion.turnoModificadoId
                          "
                          (click)="editarModificacion(item)"
                          aria-label="Editar modificación"
                        >
                          <fa-icon [icon]="iconService.faPencil"></fa-icon>
                        </button>
                        <button
                          type="button"
                          class="btn btn-xs btn-error"
                          [disabled]="
                            eliminandoId() ===
                            item.modificacion.turnoModificadoId
                          "
                          (click)="eliminarModificacion(item)"
                          aria-label="Eliminar modificación"
                        >
                          <fa-icon [icon]="iconService.faTrash"></fa-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export default class TurnoModificadoPage {
  public iconService = inject(FontIconService);
  #destroyRef = inject(DestroyRef);
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);
  #areasService = inject(AreasService);
  #horariosService = inject(HorariosService);
  #turnoModificadoService = inject(TurnoModificadoService);
  #unidadesService = inject(UnidadesService);
  #usuariosService = inject(UsuariosService);
  #resumenCargaId = 0;

  public unidades = toSignal(this.#unidadesService.listar(), {
    initialValue: [] as Unidad[],
  });
  public areas = signal<Area[]>([]);
  public usuarios = signal<Usuario[]>([]);
  public unidadIdFiltro = signal<number | undefined>(undefined);
  public areaIdFiltro = signal<number | undefined>(undefined);
  public busqueda = signal('');
  public cargandoUsuarios = signal(true);
  public usuarioSeleccionado = signal<Usuario | null>(null);
  public asignacionActiva = signal<UsuarioHorarioAsignacion | null>(null);
  public horarioDetalle = signal<HorarioDetalle | null>(null);
  public cargandoDetalle = signal(false);
  public mes = signal(this.primerDiaMes(new Date()));
  public resumen = signal<ResumenModificacion[]>([]);
  public cargandoResumen = signal(false);
  public editandoId = signal<number | null>(null);
  public eliminandoId = signal<number | null>(null);

  public usuariosFiltrados = computed(() => {
    const busqueda = this.busqueda().toLocaleLowerCase();
    return this.usuarios().filter(
      (usuario) =>
        (this.unidadIdFiltro() === undefined ||
          usuario.unidadId === this.unidadIdFiltro()) &&
        (this.areaIdFiltro() === undefined ||
          usuario.areaId === this.areaIdFiltro()) &&
        (!busqueda ||
          [
            usuario.usuario,
            usuario.nombres,
            usuario.apellidos,
            usuario.dni ?? '',
          ]
            .join(' ')
            .toLocaleLowerCase()
            .includes(busqueda)),
    );
  });
  public nombreMes = computed(() => {
    const [anio, mes] = this.mes().split('-').map(Number);
    return new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(anio, mes - 1, 1)));
  });
  public dataSource = new PaginadorDataSource<Usuario>();
  public filas = toSignal(this.dataSource.connect(), {
    initialValue: [] as Usuario[],
  });

  constructor() {
    effect(() => {
      this.dataSource.setData(this.usuariosFiltrados());
      this.dataSource.paginar({
        pageIndex: 0,
        pageSize: this.dataSource.pageSize,
      });
    });
    this.cargarUsuarios();
  }

  cambiarUnidad(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const unidadId = value ? Number(value) : undefined;
    this.unidadIdFiltro.set(unidadId);
    this.areaIdFiltro.set(undefined);
    this.areas.set([]);
    if (unidadId === undefined) return;
    this.#areasService
      .listar(unidadId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (areas) => this.areas.set(areas),
        error: () => this.#toastr.error('No se pudieron cargar las áreas'),
      });
  }

  cambiarArea(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.areaIdFiltro.set(value ? Number(value) : undefined);
  }

  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value.trim());
  }

  seleccionarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado.set(usuario);
    this.cargarDetalleUsuario();
  }

  crearModificacion(turno: HorarioTurno): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) return;
    this.abrirDialog({
      turnoId: turno.turnoId,
      usuarioId: usuario.usuarioId,
      ...this.rangoMes(),
    });
  }

  editarModificacion(item: ResumenModificacion): void {
    this.editandoId.set(item.modificacion.turnoModificadoId);
    this.#turnoModificadoService
      .obtener(item.turnoId, item.modificacion.turnoModificadoId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (modificacion) => {
          this.editandoId.set(null);
          this.abrirDialog({
            turnoId: item.turnoId,
            usuarioId: item.usuario.usuarioId,
            modificacion,
            ...this.rangoMes(),
          });
        },
        error: () => {
          this.editandoId.set(null);
          this.#toastr.error('No se pudo cargar la modificación del turno');
        },
      });
  }

  eliminarModificacion(item: ResumenModificacion): void {
    const ref = abrirConfirmarDialog(this.#dialog, {
      titulo: 'Eliminar modificación',
      mensaje: `¿Eliminar la modificación del ${this.formatFecha(item.modificacion.fecha)} para ${this.nombreUsuario(item.usuario)}?`,
      textoConfirmar: 'Eliminar',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((resultado) => {
        if (!resultado?.confirmado) return;
        this.eliminandoId.set(item.modificacion.turnoModificadoId);
        this.#turnoModificadoService
          .eliminar(item.turnoId, item.modificacion.turnoModificadoId)
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (respuesta) => {
              this.eliminandoId.set(null);
              if (respuesta.State === 1) {
                this.#toastr.success(respuesta.Message);
                this.cargarDetalleUsuario();
                this.cargarResumen();
              } else this.#toastr.error(respuesta.Message);
            },
            error: () => {
              this.eliminandoId.set(null);
              this.#toastr.error(
                'No se pudo eliminar la modificación del turno',
              );
            },
          });
      });
  }

  cambiarMes(delta: number): void {
    const [anio, mes] = this.mes().split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1 + delta, 1));
    this.mes.set(this.primerDiaMes(fecha));
    this.cargarResumen();
  }

  nombreUsuario(usuario: Usuario): string {
    return `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.usuario;
  }

  formatFecha(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';
    const [anio, mes, dia] = value.slice(0, 10).split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : value;
  }

  formatHora(value: string): string {
    return value.slice(0, 5);
  }

  matricesSemana(detalle: HorarioDetalle): MatrizSemana[] {
    const grupos = detalle.rotativo
      ? detalle.grupos.map((grupo) => ({
          key: `grupo-${grupo.vigenciaGrupoId}`,
          etiqueta: `${this.formatFecha(grupo.fechaInicio)} - ${this.formatFecha(grupo.fechaFin)}`,
          dias: grupo.dias,
        }))
      : [{ key: 'semanal', etiqueta: '', dias: detalle.dias }];
    return grupos.map((grupo) => ({
      key: grupo.key,
      etiqueta: grupo.etiqueta,
      columnas: [...grupo.dias]
        .sort((a, b) => a.orden - b.orden)
        .map((dia) => ({
          diaId: dia.diaId,
          diaNombre: dia.diaNombre,
          turnos: dia.turnos,
        })),
    }));
  }

  private cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.#usuariosService
      .listar({ activo: true })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          this.cargandoUsuarios.set(false);
          this.cargarResumen();
        },
        error: () => {
          this.cargandoUsuarios.set(false);
          this.#toastr.error('No se pudieron cargar los usuarios activos');
        },
      });
  }

  private cargarDetalleUsuario(): void {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) return;
    this.cargandoDetalle.set(true);
    this.asignacionActiva.set(null);
    this.horarioDetalle.set(null);
    this.#usuariosService
      .listarHorarios(usuario.usuarioId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (asignaciones) => {
          const asignacion =
            asignaciones.find((item) => item.estado === 'activo') ?? null;
          this.asignacionActiva.set(asignacion);
          if (!asignacion) {
            this.cargandoDetalle.set(false);
            return;
          }
          this.#horariosService
            .obtenerPorId(asignacion.horarioId)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe({
              next: (detalle) => {
                this.horarioDetalle.set(detalle);
                this.cargandoDetalle.set(false);
              },
              error: () => {
                this.cargandoDetalle.set(false);
                this.#toastr.error('No se pudo cargar el detalle del horario');
              },
            });
        },
        error: () => {
          this.cargandoDetalle.set(false);
          this.#toastr.error('No se pudo cargar el horario del usuario');
        },
      });
  }

  private cargarResumen(): void {
    const cargaId = ++this.#resumenCargaId;
    const usuarios = this.usuarios();
    if (!usuarios.length) {
      this.resumen.set([]);
      this.cargandoResumen.set(false);
      return;
    }
    this.cargandoResumen.set(true);
    forkJoin(
      usuarios.map((usuario) =>
        this.#usuariosService.listarHorarios(usuario.usuarioId),
      ),
    )
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (listas) => {
          const asignaciones = listas.flatMap((lista, indice) =>
            lista
              .filter((item) => item.estado === 'activo')
              .map((asignacion) => ({ usuario: usuarios[indice], asignacion })),
          );
          this.cargarResumenConAsignaciones(asignaciones, cargaId);
        },
        error: () => this.errorResumen(cargaId),
      });
  }

  private cargarResumenConAsignaciones(
    asignaciones: Array<{
      usuario: Usuario;
      asignacion: UsuarioHorarioAsignacion;
    }>,
    cargaId: number,
  ): void {
    if (!asignaciones.length) {
      this.finalizarResumen([], cargaId);
      return;
    }
    const horarioIds = [
      ...new Set(asignaciones.map((item) => item.asignacion.horarioId)),
    ];
    forkJoin(horarioIds.map((id) => this.#horariosService.obtenerPorId(id)))
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (horarios) => {
          const detalles = new Map(
            horarios.map((horario) => [horario.horarioId, horario]),
          );
          const turnos = asignaciones.flatMap((item) =>
            this.turnosHorario(detalles.get(item.asignacion.horarioId)).map(
              (turnoId) => ({ ...item, turnoId }),
            ),
          );
          this.cargarModificaciones(turnos, cargaId);
        },
        error: () => this.errorResumen(cargaId),
      });
  }

  private cargarModificaciones(turnos: TurnoResumen[], cargaId: number): void {
    if (!turnos.length) {
      this.finalizarResumen([], cargaId);
      return;
    }
    const rango = this.rangoMes();
    forkJoin(
      turnos.map((turno) =>
        this.#turnoModificadoService.listar(turno.turnoId, {
          ...rango,
          usuarioId: turno.usuario.usuarioId,
        }),
      ),
    )
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (listas) => {
          const resumen = listas.flatMap((lista, indice) =>
            lista.map((modificacion) => ({ ...turnos[indice], modificacion })),
          );
          resumen.sort((a, b) =>
            a.modificacion.fecha.localeCompare(b.modificacion.fecha),
          );
          this.finalizarResumen(resumen, cargaId);
        },
        error: () => this.errorResumen(cargaId),
      });
  }

  private turnosHorario(detalle: HorarioDetalle | undefined): number[] {
    if (!detalle) return [];
    const dias = detalle.rotativo
      ? detalle.grupos.flatMap((grupo) => grupo.dias)
      : detalle.dias;
    return [
      ...new Set(
        dias.flatMap((dia) => dia.turnos.map((turno) => turno.turnoId)),
      ),
    ];
  }

  private abrirDialog(data: ModificacionTurnoDialogData): void {
    const ref = this.#dialog.open<ModificacionTurnoDialogResult>(
      ModificacionTurnoDialog,
      { data, width: '560px', disableClose: true },
    );
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((resultado) => {
        if (!resultado?.guardado) return;
        this.cargarDetalleUsuario();
        this.cargarResumen();
      });
  }

  private rangoMes(): { fechaMinima: string; fechaMaxima: string } {
    const fechaMinima = this.mes();
    const [anio, mes] = fechaMinima.split('-').map(Number);
    const fechaMaxima = new Date(Date.UTC(anio, mes, 0))
      .toISOString()
      .slice(0, 10);
    return { fechaMinima, fechaMaxima };
  }

  private primerDiaMes(fecha: Date): string {
    return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }

  private finalizarResumen(
    resumen: ResumenModificacion[],
    cargaId: number,
  ): void {
    if (cargaId !== this.#resumenCargaId) return;
    this.resumen.set(resumen);
    this.cargandoResumen.set(false);
  }

  private errorResumen(cargaId: number): void {
    if (cargaId !== this.#resumenCargaId) return;
    this.cargandoResumen.set(false);
    this.#toastr.error('No se pudo cargar el resumen mensual');
  }
}
