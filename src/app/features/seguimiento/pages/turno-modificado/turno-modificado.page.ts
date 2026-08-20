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
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Usuario } from '../../../../core/interfaces/usuario.interface';
import { FontIconService } from '../../../../core/services/icon.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';
import { abrirConfirmarDialog } from '../../../../shared/dialogs/confirmar.dialog.ng';
import ModificacionTurnoDialog, {
  ModificacionTurnoDialogData,
  ModificacionTurnoDialogResult,
} from './components/modificacion-turno.dialog.ng';
import HorarioUsuarioTurnoModificado from './components/horario-usuario-turno-modificado.ng';
import ResumenMensualTurnoModificado from './components/resumen-mensual-turno-modificado.ng';
import { ResumenModificacion } from './components/turno-modificado.types';
import UsuariosTurnoModificado from './components/usuarios-turno-modificado.ng';

@Component({
  selector: 'turno-modificado-page',
  imports: [
    CommonModule,
    FontAwesomeModule,
    BreadcrumbsNg,
    UsuariosTurnoModificado,
    HorarioUsuarioTurnoModificado,
    ResumenMensualTurnoModificado,
  ],
  template: `
    <ng-breadcrumbs />
    <div class="mt-4 space-y-6">
      <div>
        <h1 class="text-2xl font-bold">Turno modificado</h1>
        <p class="mt-1 text-sm text-base-content/60">
          Consulta los horarios activos y registra modificaciones por fecha.
        </p>
      </div>
      <usuarios-turno-modificado
        [users]="usuarios()"
        [filteredUsers]="usuariosFiltrados()"
        [rows]="filas()"
        [unidades]="unidades()"
        [areas]="areas()"
        [unidadId]="unidadIdFiltro()"
        [areaId]="areaIdFiltro()"
        [selected]="usuarioSeleccionado()"
        [loading]="cargandoUsuarios()"
        [dataSource]="dataSource"
        (unitChange)="cambiarUnidad($event)"
        (areaChange)="cambiarArea($event)"
        (search)="buscar($event)"
        (select)="seleccionarUsuario($event)"
        (page)="dataSource.paginar($event)"
      />
      <horario-usuario-turno-modificado
        [usuario]="usuarioSeleccionado()"
        [assignment]="asignacionActiva()"
        [detail]="horarioDetalle()"
        [loading]="cargandoDetalle()"
        (turnSelected)="crearModificacion($event)"
      />
      @if (usuarioSeleccionado()) {
        <resumen-mensual-turno-modificado
          [items]="resumen()"
          [monthName]="nombreMes()"
          [loading]="cargandoResumen()"
          [editingId]="editandoId()"
          [deletingId]="eliminandoId()"
          (monthChange)="cambiarMes($event)"
          (edit)="editarModificacion($event)"
          (remove)="eliminarModificacion($event)"
        />
      }
    </div>
  `,
})
export default class TurnoModificadoPage {
  iconService = inject(FontIconService);
  #destroyRef = inject(DestroyRef);
  #dialog = inject(Dialog);
  #toastr = inject(ToastrService);
  #areasService = inject(AreasService);
  #horariosService = inject(HorariosService);
  #turnoModificadoService = inject(TurnoModificadoService);
  #unidadesService = inject(UnidadesService);
  #usuariosService = inject(UsuariosService);
  unidades = toSignal(this.#unidadesService.listar(), {
    initialValue: [] as Unidad[],
  });
  areas = signal<Area[]>([]);
  usuarios = signal<Usuario[]>([]);
  unidadIdFiltro = signal<number | undefined>(undefined);
  areaIdFiltro = signal<number | undefined>(undefined);
  busqueda = signal('');
  cargandoUsuarios = signal(true);
  usuarioSeleccionado = signal<Usuario | null>(null);
  asignacionActiva = signal<UsuarioHorarioAsignacion | null>(null);
  horarioDetalle = signal<HorarioDetalle | null>(null);
  cargandoDetalle = signal(false);
  mes = signal(this.primerDiaMes(new Date()));
  resumen = signal<ResumenModificacion[]>([]);
  cargandoResumen = signal(false);
  editandoId = signal<number | null>(null);
  eliminandoId = signal<number | null>(null);
  dataSource = new PaginadorDataSource<Usuario>();
  filas = toSignal(this.dataSource.connect(), {
    initialValue: [] as Usuario[],
  });
  usuariosFiltrados = computed(() => {
    const search = this.busqueda().toLocaleLowerCase();
    return this.usuarios().filter(
      (user) =>
        (this.unidadIdFiltro() === undefined ||
          user.unidadId === this.unidadIdFiltro()) &&
        (this.areaIdFiltro() === undefined ||
          user.areaId === this.areaIdFiltro()) &&
        (!search ||
          [user.usuario, user.nombres, user.apellidos, user.dni ?? '']
            .join(' ')
            .toLocaleLowerCase()
            .includes(search)),
    );
  });
  nombreMes = computed(() => {
    const [year, month] = this.mes().split('-').map(Number);
    return new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
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
    const id = value ? Number(value) : undefined;
    this.unidadIdFiltro.set(id);
    this.areaIdFiltro.set(undefined);
    this.areas.set([]);
    if (id === undefined) return;
    this.#areasService
      .listar(id)
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
  seleccionarUsuario(user: Usuario): void {
    this.usuarioSeleccionado.set(user);
    this.cargarDetalleUsuario();
    this.cargarResumen();
  }
  crearModificacion(turno: HorarioTurno): void {
    const user = this.usuarioSeleccionado();
    if (!user) return;
    this.abrirDialog({
      turnoId: turno.turnoId,
      usuarioId: user.usuarioId,
      ...this.rangoMes(),
    });
  }
  editarModificacion(item: ResumenModificacion): void {
    this.editandoId.set(item.modificacion.turnoModificadoId);
    this.#turnoModificadoService
      .obtener(item.modificacion.turnoId, item.modificacion.turnoModificadoId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (modificacion) => {
          this.editandoId.set(null);
          this.abrirDialog({
            turnoId: item.modificacion.turnoId,
            usuarioId: modificacion.usuarioId,
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
      mensaje: `¿Eliminar la modificación del ${this.formatFecha(item.modificacion.fecha)}?`,
      textoConfirmar: 'Eliminar',
    });
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.confirmado) return;
        this.eliminandoId.set(item.modificacion.turnoModificadoId);
        this.#turnoModificadoService
          .eliminar(
            item.modificacion.turnoId,
            item.modificacion.turnoModificadoId,
          )
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (response) => {
              this.eliminandoId.set(null);
              if (response.State === 1) {
                this.#toastr.success(response.Message);
                this.cargarDetalleUsuario();
                this.cargarResumen();
              } else this.#toastr.error(response.Message);
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
    const [year, month] = this.mes().split('-').map(Number);
    this.mes.set(
      this.primerDiaMes(new Date(Date.UTC(year, month - 1 + delta, 1))),
    );
    if (this.usuarioSeleccionado()) this.cargarResumen();
  }
  formatFecha(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }
  private cargarUsuarios(): void {
    this.#usuariosService
      .listar({ activo: true })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (users) => {
          this.usuarios.set(users);
          this.cargandoUsuarios.set(false);
        },
        error: () => {
          this.cargandoUsuarios.set(false);
          this.#toastr.error('No se pudieron cargar los usuarios activos');
        },
      });
  }
  private cargarDetalleUsuario(): void {
    const user = this.usuarioSeleccionado();
    if (!user) return;
    this.cargandoDetalle.set(true);
    this.asignacionActiva.set(null);
    this.horarioDetalle.set(null);
    this.#usuariosService
      .listarHorarios(user.usuarioId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (items) => {
          const assignment =
            items.find((item) => item.estado === 'activo') ?? null;
          this.asignacionActiva.set(assignment);
          if (!assignment) {
            this.cargandoDetalle.set(false);
            return;
          }
          this.#horariosService
            .obtenerPorId(assignment.horarioId)
            .pipe(takeUntilDestroyed(this.#destroyRef))
            .subscribe({
              next: (detail) => {
                this.horarioDetalle.set(detail);
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
    const user = this.usuarioSeleccionado();
    if (!user) {
      this.resumen.set([]);
      return;
    }
    this.cargandoResumen.set(true);
    this.#turnoModificadoService
      .listarPorUsuario(user.usuarioId, this.rangoMes())
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (items) => {
          this.resumen.set(
            items.map((item) => ({
              modificacion: item,
              horarioNombre: item.horarioNombre,
            })),
          );
          this.cargandoResumen.set(false);
        },
        error: () => {
          this.cargandoResumen.set(false);
          this.#toastr.error('No se pudo cargar el resumen mensual');
        },
      });
  }
  private abrirDialog(data: ModificacionTurnoDialogData): void {
    const ref = this.#dialog.open<ModificacionTurnoDialogResult>(
      ModificacionTurnoDialog,
      { data, width: '560px', disableClose: true },
    );
    ref.closed
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((result) => {
        if (!result?.guardado) return;
        this.cargarDetalleUsuario();
        this.cargarResumen();
      });
  }
  private rangoMes(): {
    fechaDesde: string;
    fechaHasta: string;
    fechaMinima: string;
    fechaMaxima: string;
  } {
    const fechaDesde = this.mes();
    const [year, month] = fechaDesde.split('-').map(Number);
    const fechaHasta = new Date(Date.UTC(year, month, 0))
      .toISOString()
      .slice(0, 10);
    return {
      fechaDesde,
      fechaHasta,
      fechaMinima: fechaDesde,
      fechaMaxima: fechaHasta,
    };
  }
  private primerDiaMes(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }
}
