import {
  Component,
  computed,
  effect,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, finalize, firstValueFrom, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import { Unidad } from '../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../core/interfaces/area.interface';
import {
  Dia,
  DiaInput,
  GrupoVigenciaInput,
  OperationResult,
  OperationResultCreate,
  TurnoInput,
} from '../../../../core/interfaces/horario.interface';
import { HorariosService } from '../../../../api/horarios.service';
import { UnidadesService } from '../../../../api/unidades.service';
import { AreasService } from '../../../../api/areas.service';
import { UsuariosService } from '../../../../api/usuarios.service';
import { Usuario } from '../../../../core/interfaces/usuario.interface';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';

interface DiaEdicion {
  diaId: number;
  nombre: string;
  incluido: boolean;
  turnos: TurnoInput[];
}

interface TurnoGrupal {
  horaInicio: string;
  horaFin: string;
  extendido: boolean;
  diaSalidaId?: number | null;
}

interface GrupoVigenciaEdicion {
  fechaInicio: string;
  fechaFin?: string;
  turnoGrupal: TurnoGrupal;
  dias: DiaEdicion[];
}

@Component({
  selector: 'horario-form-page',
  imports: [ReactiveFormsModule, FontAwesomeModule, BreadcrumbsNg],
  template: `
    <ng-breadcrumbs />

    <div class="mt-4 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">
          {{ esEdicion() ? 'Editar horario' : 'Nuevo horario' }}
        </h1>

        <button class="btn btn-ghost" (click)="volver()">
          <fa-icon [icon]="iconService.faArrowLeft"></fa-icon>
          Volver
        </button>
      </div>

      @if (cargando()) {
        <div class="flex justify-center py-6">
          <fa-icon
            [icon]="iconService.faSpinner"
            [animation]="'spin'"
            class="text-2xl text-primary"
          ></fa-icon>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-6">
          <div class="card bg-base-100 border border-base-300">
            <div class="card-body gap-4">
              <h2 class="card-title">Datos del horario</h2>

              @if (!esEdicion()) {
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Unidad *</legend>
                    <select class="select w-full" formControlName="unidadId">
                      <option [ngValue]="null" disabled>
                        Selecciona una unidad
                      </option>
                      @for (u of unidades(); track u.unidadId) {
                        <option [ngValue]="u.unidadId">
                          {{ u.codigo }} - {{ u.nombre }}
                        </option>
                      }
                    </select>
                    @if (unidadId.invalid && unidadId.touched) {
                      <span class="text-error text-xs mt-1">
                        La unidad es requerida.
                      </span>
                    }
                  </fieldset>

                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Área *</legend>
                    <select
                      class="select w-full"
                      formControlName="areaId"
                      [disabled]="!unidadId.value"
                    >
                      <option [ngValue]="null" disabled>
                        Selecciona un área
                      </option>
                      @for (a of areas(); track a.areaId) {
                        <option [ngValue]="a.areaId">{{ a.nombre }}</option>
                      }
                    </select>
                    @if (areaId.invalid && areaId.touched) {
                      <span class="text-error text-xs mt-1">
                        El área es requerida.
                      </span>
                    }
                  </fieldset>
                </div>
              } @else {
                <p class="text-sm text-base-content/70">
                  Área: <strong>{{ areas()[0].nombre }}</strong>
                </p>
              }

              <fieldset class="fieldset">
                <legend class="fieldset-legend">Nombre *</legend>
                <input
                  type="text"
                  class="input w-full"
                  formControlName="nombre"
                  placeholder="Ej: Turno mañana"
                />
                @if (nombre.invalid && nombre.touched) {
                  <span class="text-error text-xs mt-1">
                    El nombre es requerido.
                  </span>
                }
              </fieldset>

              <div class="flex flex-wrap items-end gap-3">
                <label class="fieldset flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    formControlName="extendido"
                  />
                  <span class="label-text">Extendido</span>
                </label>
                <label class="fieldset flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    formControlName="rotativo"
                  />
                  <span class="label-text">Rotativo</span>
                </label>
                <label class="fieldset flex items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    formControlName="regular"
                  />
                  <span class="label-text">Regular</span>
                </label>

                <fieldset class="fieldset w-36">
                  <legend class="fieldset-legend">Horas laborales</legend>
                  <input
                    type="number"
                    class="input w-full"
                    min="1"
                    formControlName="horasLaborales"
                  />
                </fieldset>
              </div>
            </div>
          </div>

          @if (!esEdicion()) {
            @if (rotativo()) {
              <!-- ========== GRUPOS DE VIGENCIA (ROTATIVO) ========== -->
              <div class="card bg-base-100 border border-base-300">
                <div class="card-body gap-4">
                  <div
                    class="flex flex-wrap items-center justify-between gap-3"
                  >
                    <h2 class="card-title">Grupos de vigencia</h2>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline"
                      (click)="agregarGrupo()"
                    >
                      <fa-icon [icon]="iconService.faPlus"></fa-icon>
                      Agregar grupo
                    </button>
                  </div>
                  <p class="text-sm text-base-content/60">
                    Cada grupo tiene su rango de fechas y sus propios días con
                    turnos. Un mismo día puede repetirse en varios grupos.
                  </p>

                  @for (g of grupos(); track $index; let gi = $index) {
                    <div
                      class="rounded-lg border border-base-300 bg-base-100 p-3"
                    >
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-semibold text-sm">
                          Grupo {{ gi + 1 }}
                        </span>
                        <input
                          type="date"
                          class="input input-xs w-40"
                          [value]="g.fechaInicio"
                          (change)="grupoCampo(gi, 'inicio', $event)"
                        />
                        <span class="text-xs">a</span>
                        <input
                          type="date"
                          class="input input-xs w-40"
                          [value]="g.fechaFin ?? ''"
                          (change)="grupoCampo(gi, 'fin', $event)"
                        />
                        <button
                          type="button"
                          class="btn btn-xs btn-ghost btn-error"
                          (click)="quitarGrupo(gi)"
                        >
                          <fa-icon [icon]="iconService.faTrash"></fa-icon>
                        </button>
                      </div>

                      <!-- Turno grupal del grupo -->
                      <div class="mt-3 flex flex-wrap items-end gap-2">
                        <span class="text-xs font-medium">Turno grupal:</span>
                        <input
                          type="time"
                          class="input input-xs w-24"
                          [value]="g.turnoGrupal.horaInicio"
                          (change)="grupoTurnoGrupal(gi, 'horaInicio', $event)"
                        />
                        <span class="text-xs">a</span>
                        <input
                          type="time"
                          class="input input-xs w-24"
                          [value]="g.turnoGrupal.horaFin"
                          (change)="grupoTurnoGrupal(gi, 'horaFin', $event)"
                        />
                        <label class="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            class="checkbox checkbox-xs"
                            [checked]="g.turnoGrupal.extendido"
                            (change)="grupoTurnoGrupal(gi, 'extendido', $event)"
                          />
                          Extendido
                        </label>
                        @if (g.turnoGrupal.extendido) {
                          <label class="text-xs">Día salida</label>
                          <select
                            class="select select-xs w-28"
                            [value]="g.turnoGrupal.diaSalidaId ?? ''"
                            (change)="grupoTurnoGrupalSalidaDia(gi, $event)"
                          >
                            <option [value]="''" disabled>Selecciona</option>
                            @for (sd of dias(); track sd.diaId) {
                              <option [value]="sd.diaId">
                                {{ sd.nombre }}
                              </option>
                            }
                          </select>
                        }
                        <button
                          type="button"
                          class="btn btn-xs btn-outline"
                          [disabled]="!grupoTurnoGrupalValido(gi)"
                          (click)="aplicarTurnoGrupalGrupo(gi)"
                        >
                          <fa-icon [icon]="iconService.faCheck"></fa-icon>
                          Aplicar a días
                        </button>
                      </div>

                      <!-- Grilla de días del grupo -->
                      <div
                        class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
                      >
                        @for (d of g.dias; track d.diaId) {
                          <div
                            class="rounded-lg border bg-base-200/50 p-2"
                            [class.border-primary]="d.incluido"
                            [class.border-base-300]="!d.incluido"
                          >
                            <label
                              class="flex items-center justify-between gap-1 font-medium text-sm"
                            >
                              {{ d.nombre }}
                              <input
                                type="checkbox"
                                class="checkbox checkbox-xs"
                                [checked]="d.incluido"
                                (change)="toggleDiaGrupo(gi, d.diaId)"
                              />
                            </label>

                            @if (d.incluido) {
                              @for (
                                t of d.turnos;
                                track $index;
                                let ti = $index
                              ) {
                                <div
                                  class="mt-1 space-y-1 rounded bg-base-100 p-1.5"
                                >
                                  <input
                                    type="time"
                                    class="input input-xs w-full"
                                    [value]="t.horaInicio"
                                    (change)="
                                      turnoGrupoCampo(
                                        gi,
                                        d.diaId,
                                        ti,
                                        'horaInicio',
                                        $event
                                      )
                                    "
                                  />
                                  <input
                                    type="time"
                                    class="input input-xs w-full"
                                    [value]="t.horaFin"
                                    (change)="
                                      turnoGrupoCampo(
                                        gi,
                                        d.diaId,
                                        ti,
                                        'horaFin',
                                        $event
                                      )
                                    "
                                  />
                                  <div
                                    class="flex items-center justify-between"
                                  >
                                    <label
                                      class="flex items-center gap-1 text-[10px]"
                                    >
                                      <input
                                        type="checkbox"
                                        class="checkbox checkbox-xs"
                                        [checked]="t.extendido"
                                        (change)="
                                          turnoGrupoCampo(
                                            gi,
                                            d.diaId,
                                            ti,
                                            'extendido',
                                            $event
                                          )
                                        "
                                      />
                                      Ext
                                    </label>
                                    <button
                                      type="button"
                                      class="btn btn-xs btn-ghost btn-error px-1"
                                      (click)="
                                        quitarTurnoGrupo(gi, d.diaId, ti)
                                      "
                                    >
                                      <fa-icon
                                        [icon]="iconService.faTrash"
                                      ></fa-icon>
                                    </button>
                                  </div>
                                  @if (t.extendido) {
                                    <select
                                      class="select select-xs w-full"
                                      [value]="t.diaSalidaId ?? ''"
                                      (change)="
                                        turnoGrupoSalidaDia(
                                          gi,
                                          d.diaId,
                                          ti,
                                          $event
                                        )
                                      "
                                    >
                                      <option [value]="''" disabled>
                                        Día de salida
                                      </option>
                                      @for (sd of dias(); track sd.diaId) {
                                        <option [value]="sd.diaId">
                                          {{ sd.nombre }}
                                        </option>
                                      }
                                    </select>
                                  }
                                </div>
                              }

                              <button
                                type="button"
                                class="btn btn-xs btn-outline mt-1 w-full"
                                (click)="agregarTurnoGrupo(gi, d.diaId)"
                              >
                                <fa-icon [icon]="iconService.faPlus"></fa-icon>
                                Turno
                              </button>
                            } @else {
                              <p
                                class="mt-2 text-center text-xs text-base-content/40"
                              >
                                —
                              </p>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <!-- ========== TURNO GRUPAL (NO ROTATIVO) ========== -->
              <div class="card bg-base-100 border border-base-300">
                <div class="card-body gap-3">
                  <h2 class="card-title">Turno grupal</h2>

                  <div class="flex flex-wrap items-end gap-2">
                    <label class="label">Hora inicio</label>
                    <input
                      type="time"
                      class="input input-sm w-28"
                      [value]="turnoGrupal().horaInicio"
                      (change)="turnoGrupalCampo('horaInicio', $event)"
                    />
                    <label class="label">Hora fin</label>
                    <input
                      type="time"
                      class="input input-sm w-28"
                      [value]="turnoGrupal().horaFin"
                      (change)="turnoGrupalCampo('horaFin', $event)"
                    />
                    <label class="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        [checked]="turnoGrupal().extendido"
                        (change)="turnoGrupalCampo('extendido', $event)"
                      />
                      Extendido
                    </label>
                    @if (turnoGrupal().extendido) {
                      <label class="label">Día salida</label>
                      <select
                        class="select select-sm w-32"
                        [value]="turnoGrupal().diaSalidaId ?? ''"
                        (change)="turnoGrupalSalidaDia($event)"
                      >
                        <option [value]="''" disabled>Selecciona</option>
                        @for (sd of dias(); track sd.diaId) {
                          <option [value]="sd.diaId">{{ sd.nombre }}</option>
                        }
                      </select>
                    }
                  </div>

                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span class="text-xs font-medium">Días:</span>
                    @for (d of dias(); track d.diaId) {
                      <label class="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          class="checkbox checkbox-xs"
                          [checked]="turnoGrupalDias().has(d.diaId)"
                          (change)="toggleDiaGrupal(d.diaId)"
                        />
                        {{ d.nombre }}
                      </label>
                    }
                    <button
                      type="button"
                      class="btn btn-xs btn-ghost"
                      (click)="seleccionarTodosDiasGrupales()"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      class="btn btn-xs btn-ghost"
                      (click)="limpiarDiasGrupales()"
                    >
                      Ninguno
                    </button>
                  </div>

                  <button
                    type="button"
                    class="btn btn-sm btn-primary w-fit"
                    [disabled]="!turnoGrupalValido()"
                    (click)="aplicarTurnoGrupal()"
                  >
                    <fa-icon [icon]="iconService.faCheck"></fa-icon>
                    Aplicar turno a los días seleccionados
                  </button>
                </div>
              </div>

              <!-- ========== GRÁFICA DE DÍAS Y TURNOS (NO ROTATIVO) ========== -->
              <div class="card bg-base-100 border border-base-300">
                <div class="card-body gap-3">
                  <h2 class="card-title">Días y turnos</h2>

                  <div
                    class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7"
                  >
                    @for (d of dias(); track d.diaId) {
                      <div
                        class="rounded-lg border bg-base-100 p-2"
                        [class.border-primary]="d.incluido"
                        [class.border-base-300]="!d.incluido"
                      >
                        <label
                          class="flex items-center justify-between gap-1 font-medium text-sm"
                        >
                          {{ d.nombre }}
                          <input
                            type="checkbox"
                            class="checkbox checkbox-xs"
                            [checked]="d.incluido"
                            (change)="toggleDia(d.diaId)"
                          />
                        </label>

                        @if (d.incluido) {
                          @for (t of d.turnos; track $index) {
                            <div
                              class="mt-1 space-y-1 rounded bg-base-200 p-1.5"
                            >
                              <input
                                type="time"
                                class="input input-xs w-full"
                                [value]="t.horaInicio"
                                (change)="
                                  turnoCampo(
                                    d.diaId,
                                    $index,
                                    'horaInicio',
                                    $event
                                  )
                                "
                              />
                              <input
                                type="time"
                                class="input input-xs w-full"
                                [value]="t.horaFin"
                                (change)="
                                  turnoCampo(d.diaId, $index, 'horaFin', $event)
                                "
                              />
                              <div class="flex items-center justify-between">
                                <label
                                  class="flex items-center gap-1 text-[10px]"
                                >
                                  <input
                                    type="checkbox"
                                    class="checkbox checkbox-xs"
                                    [checked]="t.extendido"
                                    (change)="
                                      turnoCampo(
                                        d.diaId,
                                        $index,
                                        'extendido',
                                        $event
                                      )
                                    "
                                  />
                                  Ext
                                </label>
                                <button
                                  type="button"
                                  class="btn btn-xs btn-ghost btn-error px-1"
                                  (click)="quitarTurno(d.diaId, $index)"
                                >
                                  <fa-icon
                                    [icon]="iconService.faTrash"
                                  ></fa-icon>
                                </button>
                              </div>
                              @if (t.extendido) {
                                <select
                                  class="select select-xs w-full"
                                  [value]="t.diaSalidaId ?? ''"
                                  (change)="
                                    turnoSalidaDia(d.diaId, $index, $event)
                                  "
                                >
                                  <option [value]="''" disabled>
                                    Día de salida
                                  </option>
                                  @for (sd of dias(); track sd.diaId) {
                                    <option [value]="sd.diaId">
                                      {{ sd.nombre }}
                                    </option>
                                  }
                                </select>
                              }
                            </div>
                          }

                          <button
                            type="button"
                            class="btn btn-xs btn-outline mt-1 w-full"
                            (click)="agregarTurno(d.diaId)"
                          >
                            <fa-icon [icon]="iconService.faPlus"></fa-icon>
                            Turno
                          </button>
                        } @else {
                          <p
                            class="mt-2 text-center text-xs text-base-content/40"
                          >
                            —
                          </p>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- ========== ASIGNACIÓN DE USUARIOS ========== -->
            <div class="card bg-base-100 border border-base-300">
              <div class="card-body gap-3">
                <h2 class="card-title">Asignar usuarios (opcional)</h2>

                @if (areaId.value && !usuariosCargados()) {
                  <button
                    type="button"
                    class="btn btn-sm btn-outline w-fit"
                    (click)="cargarUsuarios()"
                  >
                    Cargar usuarios del área
                  </button>
                }

                @if (usuarios().length) {
                  <div class="flex flex-wrap gap-2">
                    @for (u of usuarios(); track u.usuarioId) {
                      <label
                        class="flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          class="checkbox checkbox-sm"
                          [checked]="seleccionados().has(u.usuarioId)"
                          (change)="toggleUsuario(u.usuarioId)"
                        />
                        {{ u.nombres }} {{ u.apellidos }} ({{ u.usuario }})
                      </label>
                    }
                  </div>

                  @if (seleccionados().size) {
                    <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <label class="label">Fecha inicio *</label>
                      <label class="label">Fecha fin (opcional)</label>
                      <input
                        type="date"
                        class="input input-sm w-full"
                        [value]="fechaInicio()"
                        (change)="setFecha('inicio', $event)"
                      />
                      <input
                        type="date"
                        class="input input-sm w-full"
                        [value]="fechaFin()"
                        (change)="setFecha('fin', $event)"
                      />
                    </div>
                  }
                }
              </div>
            </div>
          }

          <div class="flex items-center justify-end gap-2">
            <button type="button" class="btn btn-ghost" (click)="volver()">
              Cancelar
            </button>

            <button
              type="submit"
              [disabled]="guardando()"
              class="btn btn-primary"
            >
              @if (guardando()) {
                <fa-icon
                  [icon]="iconService.faSpinner"
                  [animation]="'spin'"
                ></fa-icon>
              }
              {{ esEdicion() ? 'Guardar cambios' : 'Crear horario' }}
            </button>
          </div>

          @if (intentado() && motivoBloqueo()) {
            <p class="text-right text-xs text-error">{{ motivoBloqueo() }}</p>
          }
        </form>
      }
    </div>
  `,
})
export default class HorarioFormPage {
  public iconService = inject(FontIconService);
  #horariosService = inject(HorariosService);
  #unidadesService = inject(UnidadesService);
  #areasService = inject(AreasService);
  #usuariosService = inject(UsuariosService);
  #fb = inject(FormBuilder);
  #toastr = inject(ToastrService);
  #router = inject(Router);
  #route = inject(ActivatedRoute);
  #destroyRef = inject(DestroyRef);

  public cargando = signal(true);
  public guardando = signal(false);
  public esEdicion = signal(false);
  public intentado = signal(false);

  public unidades = signal<Unidad[]>([]);
  public areas = signal<Area[]>([]);
  public dias = signal<DiaEdicion[]>([]);
  public usuarios = signal<Usuario[]>([]);
  public seleccionados = signal<Set<number>>(new Set());
  public usuariosCargados = signal(false);
  public fechaInicio = signal('');
  public fechaFin = signal('');

  public turnoGrupal = signal<TurnoGrupal>({
    horaInicio: '',
    horaFin: '',
    extendido: false,
  });
  public turnoGrupalDias = signal<Set<number>>(new Set());
  public grupos = signal<GrupoVigenciaEdicion[]>([]);

  public turnoGrupalValido = computed(
    () =>
      !!this.turnoGrupal().horaInicio &&
      !!this.turnoGrupal().horaFin &&
      this.turnoGrupalDias().size > 0,
  );

  public gruposValidos = computed(() => {
    if (this.esEdicion()) {
      return true;
    }
    if (!this.rotativo()) {
      return true;
    }
    const lista = this.grupos();
    if (!lista.length) {
      return false;
    }
    return lista.every((g) => {
      if (!g.fechaInicio) {
        return false;
      }
      if (g.fechaFin && g.fechaFin < g.fechaInicio) {
        return false;
      }
      const activos = g.dias.filter((d) => d.incluido);
      if (!activos.length) {
        return false;
      }
      return activos.every(
        (d) =>
          d.turnos.length > 0 &&
          d.turnos.every(
            (t) =>
              t.horaInicio && t.horaFin && (!t.extendido || !!t.diaSalidaId),
          ),
      );
    });
  });

  public form = this.#fb.group({
    nombre: ['', [Validators.required, Validators.minLength(1)]],
    unidadId: [null as number | null, [Validators.required]],
    areaId: [null as number | null, [Validators.required]],
    extendido: [false],
    rotativo: [false],
    regular: [true],
    horasLaborales: [8, [Validators.required, Validators.min(1)]],
  });

  public rotativo = toSignal(this.form.controls.rotativo.valueChanges, {
    initialValue: this.form.controls.rotativo.value,
  });

  public diasValidos = computed(() => {
    if (this.esEdicion() || this.rotativo()) {
      return true;
    }
    const activos = this.dias().filter((d) => d.incluido);
    if (!activos.length) {
      return false;
    }
    return activos.every((d) => {
      return (
        d.turnos.length > 0 &&
        d.turnos.every(
          (t) => t.horaInicio && t.horaFin && (!t.extendido || !!t.diaSalidaId),
        )
      );
    });
  });

  public motivoBloqueo = computed(() => {
    if (this.guardando()) {
      return null;
    }
    if (this.form.invalid) {
      if (this.nombre.invalid) {
        return 'Falta el nombre del horario.';
      }
      if (this.unidadId.invalid) {
        return 'Falta seleccionar la unidad.';
      }
      if (this.areaId.invalid) {
        return 'Falta seleccionar el área.';
      }
      if (this.form.controls.horasLaborales.invalid) {
        return 'Las horas laborales deben ser mayor o igual a 1.';
      }
    }
    if (this.esEdicion()) {
      return null;
    }
    if (this.rotativo()) {
      const lista = this.grupos();
      if (!lista.length) {
        return 'Agrega al menos un grupo de vigencia.';
      }
      for (let i = 0; i < lista.length; i++) {
        const g = lista[i];
        const etiqueta = `Grupo ${i + 1}`;
        if (!g.fechaInicio) {
          return `${etiqueta}: falta la fecha de inicio.`;
        }
        if (g.fechaFin && g.fechaFin < g.fechaInicio) {
          return `${etiqueta}: la fecha fin es anterior a la de inicio.`;
        }
        const activos = g.dias.filter((d) => d.incluido);
        if (!activos.length) {
          return `${etiqueta}: incluye al menos un día.`;
        }
        for (const d of activos) {
          if (!d.turnos.length) {
            return `${etiqueta}, día ${d.nombre}: agrega al menos un turno.`;
          }
          for (const t of d.turnos) {
            if (!t.horaInicio || !t.horaFin) {
              return `${etiqueta}, día ${d.nombre}: un turno tiene hora incompleta.`;
            }
            if (t.extendido && !t.diaSalidaId) {
              return `${etiqueta}, día ${d.nombre}: un turno extendido debe tener día de salida.`;
            }
          }
        }
      }
      return null;
    }
    const activos = this.dias().filter((d) => d.incluido);
    if (!activos.length) {
      return 'Incluye al menos un día con turnos.';
    }
    for (const d of activos) {
      if (!d.turnos.length) {
        return `Día ${d.nombre}: agrega al menos un turno.`;
      }
      for (const t of d.turnos) {
        if (!t.horaInicio || !t.horaFin) {
          return `Día ${d.nombre}: un turno tiene hora incompleta.`;
        }
        if (t.extendido && !t.diaSalidaId) {
          return `Día ${d.nombre}: un turno extendido debe tener día de salida.`;
        }
      }
    }
    return null;
  });

  #resetIntentado = effect(() => {
    if (this.intentado() && !this.motivoBloqueo()) {
      this.intentado.set(false);
    }
  });

  get nombre() {
    return this.form.controls.nombre;
  }

  get unidadId() {
    return this.form.controls.unidadId;
  }

  get areaId() {
    return this.form.controls.areaId;
  }

  constructor() {
    const paramId = Number(this.#route.snapshot.params['id']);
    const id = Number.isFinite(paramId) ? paramId : null;
    this.esEdicion.set(id !== null);

    this.form.controls.unidadId.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((unidadId) => {
        if (!unidadId) {
          this.areas.set([]);
          this.form.controls.areaId.setValue(null);
          return;
        }
        this.#areasService
          .listar(unidadId)
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe({
            next: (areas) => this.areas.set(areas),
            error: () => this.#toastr.error('No se pudieron cargar las áreas'),
          });
      });

    if (id !== null) {
      this.#cargarEdicion(id);
    } else {
      this.#cargarNuevo();
    }
  }

  async #cargarNuevo(): Promise<void> {
    try {
      const [unidades] = await Promise.all([
        firstValueFrom(this.#unidadesService.listar()),
      ]);
      this.unidades.set(unidades);
    } catch {
      this.#toastr.error('No se pudieron cargar las unidades');
    }
    this.#horariosService
      .listarDias()
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (dias) => {
          this.dias.set(this.#crearDiaEdicion(dias));
          this.grupos.set([
            {
              fechaInicio: '',
              fechaFin: undefined,
              turnoGrupal: { horaInicio: '', horaFin: '', extendido: false },
              dias: this.#crearDiaEdicion(dias),
            },
          ]);
        },
        error: () => this.#toastr.error('No se pudieron cargar los días'),
      });
  }

  async #cargarEdicion(id: number): Promise<void> {
    try {
      const [detalle, unidades] = await Promise.all([
        firstValueFrom(this.#horariosService.obtenerPorId(id)),
        firstValueFrom(this.#unidadesService.listar()),
      ]);
      this.unidades.set(unidades);

      const areas = await firstValueFrom(
        this.#areasService.listar(detalle.unidadId),
      );
      this.areas.set(areas);

      this.form.patchValue({
        nombre: detalle.nombre,
        areaId: detalle.areaId,
        unidadId: detalle.unidadId,
        extendido: detalle.extendido,
        rotativo: detalle.rotativo,
        regular: detalle.regular,
        horasLaborales: detalle.horasLaborales,
      });
    } catch {
      this.#toastr.error('No se pudo cargar el horario');
      this.volver();
      return;
    }
    this.cargando.set(false);
  }

  toggleDia(diaId: number): void {
    this.dias.update((lista) =>
      lista.map((d) =>
        d.diaId === diaId
          ? { ...d, incluido: !d.incluido, turnos: d.incluido ? [] : d.turnos }
          : d,
      ),
    );
  }

  #crearDiaEdicion(
    diasCatalogo: { diaId: number; nombre: string }[],
  ): DiaEdicion[] {
    return diasCatalogo.map((d) => ({
      diaId: d.diaId,
      nombre: d.nombre,
      incluido: false,
      turnos: [] as TurnoInput[],
    }));
  }

  #normalizarTurnos(turnos: TurnoInput[]): TurnoInput[] {
    return turnos.map((t) =>
      t.extendido
        ? t
        : {
            horaInicio: t.horaInicio,
            horaFin: t.horaFin,
            extendido: t.extendido,
          },
    );
  }

  agregarGrupo(): void {
    this.grupos.update((lista) => [
      ...lista,
      {
        fechaInicio: '',
        fechaFin: undefined,
        turnoGrupal: { horaInicio: '', horaFin: '', extendido: false },
        dias: this.#crearDiaEdicion(this.dias()),
      },
    ]);
  }

  quitarGrupo(index: number): void {
    this.grupos.update((lista) => lista.filter((_, i) => i !== index));
  }

  grupoCampo(index: number, campo: 'inicio' | 'fin', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.grupos.update((lista) =>
      lista.map((g, i) =>
        i === index
          ? campo === 'inicio'
            ? { ...g, fechaInicio: value }
            : { ...g, fechaFin: value || undefined }
          : g,
      ),
    );
  }

  grupoTurnoGrupal(
    index: number,
    campo: 'horaInicio' | 'horaFin' | 'extendido',
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    const value = campo === 'extendido' ? target.checked : target.value;
    this.grupos.update((lista) =>
      lista.map((g, i) =>
        i === index
          ? {
              ...g,
              turnoGrupal: {
                ...g.turnoGrupal,
                [campo]: value,
                ...(campo === 'extendido' && !value
                  ? { diaSalidaId: null }
                  : {}),
              },
            }
          : g,
      ),
    );
  }

  grupoTurnoGrupalValido(index: number): boolean {
    const g = this.grupos()[index];
    return !!g && !!g.turnoGrupal.horaInicio && !!g.turnoGrupal.horaFin;
  }

  grupoTurnoGrupalSalidaDia(index: number, event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.grupos.update((lista) =>
      lista.map((g, i) =>
        i === index
          ? {
              ...g,
              turnoGrupal: {
                ...g.turnoGrupal,
                diaSalidaId: raw ? Number(raw) : null,
              },
            }
          : g,
      ),
    );
  }

  aplicarTurnoGrupalGrupo(index: number): void {
    const grupo = this.grupos()[index];
    if (!grupo || !this.grupoTurnoGrupalValido(index)) {
      return;
    }
    const t = grupo.turnoGrupal;
    this.grupos.update((lista) =>
      lista.map((g, i) =>
        i === index
          ? {
              ...g,
              dias: g.dias.map((d) =>
                d.incluido ? { ...d, turnos: [{ ...t }] } : d,
              ),
            }
          : g,
      ),
    );
    this.#toastr.success(
      `Turno ${t.horaInicio} - ${t.horaFin} aplicado a los días incluidos del grupo`,
    );
  }

  toggleDiaGrupo(grupoIndex: number, diaId: number): void {
    this.grupos.update((lista) =>
      lista.map((g, i) =>
        i === grupoIndex
          ? {
              ...g,
              dias: g.dias.map((d) =>
                d.diaId === diaId
                  ? {
                      ...d,
                      incluido: !d.incluido,
                      turnos: d.incluido ? [] : d.turnos,
                    }
                  : d,
              ),
            }
          : g,
      ),
    );
  }

  turnoGrupoCampo(
    grupoIndex: number,
    diaId: number,
    turnoIndex: number,
    campo: 'horaInicio' | 'horaFin' | 'extendido',
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    const value = campo === 'extendido' ? target.checked : target.value;
    const limpiarSalida = campo === 'extendido' && !value;
    this.grupos.update((lista) =>
      lista.map((g, gi) =>
        gi === grupoIndex
          ? {
              ...g,
              dias: g.dias.map((d) =>
                d.diaId === diaId
                  ? {
                      ...d,
                      turnos: d.turnos.map((t, ti) =>
                        ti === turnoIndex
                          ? limpiarSalida
                            ? { ...t, extendido: false, diaSalidaId: null }
                            : { ...t, [campo]: value }
                          : t,
                      ),
                    }
                  : d,
              ),
            }
          : g,
      ),
    );
  }

  turnoGrupoSalidaDia(
    grupoIndex: number,
    diaId: number,
    turnoIndex: number,
    event: Event,
  ): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.grupos.update((lista) =>
      lista.map((g, gi) =>
        gi === grupoIndex
          ? {
              ...g,
              dias: g.dias.map((d) =>
                d.diaId === diaId
                  ? {
                      ...d,
                      turnos: d.turnos.map((t, ti) =>
                        ti === turnoIndex
                          ? { ...t, diaSalidaId: raw ? Number(raw) : null }
                          : t,
                      ),
                    }
                  : d,
              ),
            }
          : g,
      ),
    );
  }

  agregarTurnoGrupo(grupoIndex: number, diaId: number): void {
    this.grupos.update((lista) =>
      lista.map((g, gi) =>
        gi === grupoIndex
          ? {
              ...g,
              dias: g.dias.map((d) =>
                d.diaId === diaId
                  ? {
                      ...d,
                      turnos: [...d.turnos, { horaInicio: '', horaFin: '' }],
                    }
                  : d,
              ),
            }
          : g,
      ),
    );
  }

  quitarTurnoGrupo(
    grupoIndex: number,
    diaId: number,
    turnoIndex: number,
  ): void {
    this.grupos.update((lista) =>
      lista.map((g, gi) =>
        gi === grupoIndex
          ? {
              ...g,
              dias: g.dias.map((d) =>
                d.diaId === diaId
                  ? {
                      ...d,
                      turnos: d.turnos.filter((_, ti) => ti !== turnoIndex),
                    }
                  : d,
              ),
            }
          : g,
      ),
    );
  }

  turnoCampo(
    diaId: number,
    index: number,
    campo: 'horaInicio' | 'horaFin' | 'extendido',
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value;
    const value =
      campo === 'extendido' ? (event.target as HTMLInputElement).checked : raw;
    const limpiarSalida = campo === 'extendido' && !value;
    this.dias.update((lista) =>
      lista.map((d) => {
        if (d.diaId !== diaId) {
          return d;
        }
        const turnos = d.turnos.map((t, i) =>
          i === index
            ? limpiarSalida
              ? { ...t, extendido: false, diaSalidaId: null }
              : { ...t, [campo]: value }
            : t,
        );
        return { ...d, turnos };
      }),
    );
  }

  turnoSalidaDia(diaId: number, index: number, event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.dias.update((lista) =>
      lista.map((d) => {
        if (d.diaId !== diaId) {
          return d;
        }
        const turnos = d.turnos.map((t, i) =>
          i === index ? { ...t, diaSalidaId: raw ? Number(raw) : null } : t,
        );
        return { ...d, turnos };
      }),
    );
  }

  agregarTurno(diaId: number): void {
    this.dias.update((lista) =>
      lista.map((d) =>
        d.diaId === diaId
          ? {
              ...d,
              turnos: [...d.turnos, { horaInicio: '', horaFin: '' }],
            }
          : d,
      ),
    );
  }

  quitarTurno(diaId: number, index: number): void {
    this.dias.update((lista) =>
      lista.map((d) =>
        d.diaId === diaId
          ? { ...d, turnos: d.turnos.filter((_, i) => i !== index) }
          : d,
      ),
    );
  }

  turnoGrupalCampo(
    campo: 'horaInicio' | 'horaFin' | 'extendido',
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    const value = campo === 'extendido' ? target.checked : target.value;
    this.turnoGrupal.update((t) => ({
      ...t,
      [campo]: value,
      ...(campo === 'extendido' && !value ? { diaSalidaId: null } : {}),
    }));
  }

  turnoGrupalSalidaDia(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.turnoGrupal.update((t) => ({
      ...t,
      diaSalidaId: raw ? Number(raw) : null,
    }));
  }

  toggleDiaGrupal(diaId: number): void {
    this.turnoGrupalDias.update((sel) => {
      const next = new Set(sel);
      if (next.has(diaId)) {
        next.delete(diaId);
      } else {
        next.add(diaId);
      }
      return next;
    });
  }

  seleccionarTodosDiasGrupales(): void {
    this.turnoGrupalDias.set(new Set(this.dias().map((d) => d.diaId)));
  }

  limpiarDiasGrupales(): void {
    this.turnoGrupalDias.set(new Set());
  }

  aplicarTurnoGrupal(): void {
    if (!this.turnoGrupalValido()) {
      return;
    }
    const t = this.turnoGrupal();
    const seleccionados = this.turnoGrupalDias();
    this.dias.update((lista) =>
      lista.map((d) =>
        seleccionados.has(d.diaId)
          ? {
              ...d,
              incluido: true,
              turnos: [
                {
                  horaInicio: t.horaInicio,
                  horaFin: t.horaFin,
                  extendido: t.extendido,
                  diaSalidaId: t.diaSalidaId ?? null,
                },
              ],
            }
          : d,
      ),
    );
    this.#toastr.success(
      `Turno ${t.horaInicio} - ${t.horaFin} aplicado a ${seleccionados.size} día(s)`,
    );
  }

  cargarUsuarios(): void {
    const areaId = this.areaId.value;
    if (!areaId) {
      return;
    }
    this.#usuariosService
      .listar({ areaId })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          this.usuariosCargados.set(true);
        },
        error: () =>
          this.#toastr.error('No se pudieron cargar los usuarios del área'),
      });
  }

  toggleUsuario(usuarioId: number): void {
    this.seleccionados.update((sel) => {
      const next = new Set(sel);
      if (next.has(usuarioId)) {
        next.delete(usuarioId);
      } else {
        next.add(usuarioId);
      }
      return next;
    });
  }

  setFecha(campo: 'inicio' | 'fin', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (campo === 'inicio') {
      this.fechaInicio.set(value);
    } else {
      this.fechaFin.set(value);
    }
  }

  guardar(): void {
    this.intentado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.diasValidos()) {
      this.#toastr.error(
        'Cada día incluido debe tener al menos un turno completo',
      );
      return;
    }
    if (!this.gruposValidos()) {
      this.#toastr.error(
        'Un horario rotativo debe tener al menos un grupo válido con días y turnos completos',
      );
      return;
    }

    const value = this.form.value;
    const flat = {
      nombre: (value.nombre ?? '').trim(),
      areaId: value.areaId ?? 0,
      extendido: value.extendido ?? false,
      rotativo: value.rotativo ?? false,
      regular: value.regular ?? true,
      horasLaborales: value.horasLaborales ?? 8,
    };

    if (this.esEdicion()) {
      const id = Number(this.#route.snapshot.params['id']);
      this.#guardarEdicion(id, flat);
      return;
    }

    if (this.rotativo()) {
      const grupos: GrupoVigenciaInput[] = this.grupos()
        .filter((g) => g.fechaInicio)
        .map((g) => ({
          fechaInicio: g.fechaInicio,
          fechaFin: g.fechaFin || null,
          dias: g.dias
            .filter((d) => d.incluido)
            .map((d, i) => ({
              diaId: d.diaId,
              orden: i + 1,
              turnos: this.#normalizarTurnos(d.turnos),
            })),
        }));

      this.#crearHorario({
        ...flat,
        grupos,
        usuarioIds: this.seleccionados().size
          ? [...this.seleccionados()]
          : undefined,
        fechaInicio: this.fechaInicio() || undefined,
        fechaFin: this.fechaFin() || null,
      });
      return;
    }

    const dias: DiaInput[] = this.dias()
      .filter((d) => d.incluido)
      .map((d, i) => ({
        diaId: d.diaId,
        orden: i + 1,
        turnos: this.#normalizarTurnos(d.turnos),
      }));

    this.#crearHorario({
      ...flat,
      dias,
      usuarioIds: this.seleccionados().size
        ? [...this.seleccionados()]
        : undefined,
      fechaInicio: this.fechaInicio() || undefined,
      fechaFin: this.fechaFin() || null,
    });
  }

  #crearHorario(dto: {
    nombre: string;
    areaId: number;
    extendido: boolean;
    rotativo: boolean;
    regular: boolean;
    horasLaborales: number;
    dias?: DiaInput[];
    grupos?: GrupoVigenciaInput[];
    usuarioIds?: number[];
    fechaInicio?: string;
    fechaFin?: string | null;
  }): void {
    this.guardando.set(true);
    this.#horariosService
      .crear(dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap((res) => {
          if (res.State === 1) {
            this.volver();
          }
        }),
        catchError((error) => {
          const errorMessage = error.error.error;
          this.#toastr.error(errorMessage);
          return EMPTY;
        }),
      )
      .subscribe({
        complete: () => this.guardando.set(false),
      });
  }

  #guardarEdicion(
    id: number,
    dto: {
      nombre: string;
      areaId: number;
      extendido: boolean;
      rotativo: boolean;
      regular: boolean;
      horasLaborales: number;
    },
  ): void {
    this.guardando.set(true);
    this.#horariosService
      .actualizar(id, dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        tap((res) => this.procesarResultado(res)),
        tap((res) => {
          if (res.State === 1) {
            this.volver();
          }
        }),
        catchError(() => {
          this.#toastr.error('Error al actualizar el horario');
          return EMPTY;
        }),
      )
      .subscribe({
        complete: () => this.guardando.set(false),
      });
  }

  private procesarResultado(
    res: OperationResult | OperationResultCreate,
  ): void {
    res.State === 1
      ? this.#toastr.success(res.Message)
      : this.#toastr.error(res.Message);
  }

  volver(): void {
    this.#router.navigate(['/configuracion/horario-2']);
  }
}
