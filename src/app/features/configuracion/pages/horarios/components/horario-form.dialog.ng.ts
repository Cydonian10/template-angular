import { Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';
import { Unidad } from '../../../../../core/interfaces/unidad.interface';
import { Area } from '../../../../../core/interfaces/area.interface';
import {
  Dia,
  DiaInput,
  Horario,
  TurnoInput,
} from '../../../../../core/interfaces/horario.interface';
import { HorariosService } from '../../../../../api/horarios.service';
import { AreasService } from '../../../../../api/areas.service';
import { UsuariosService } from '../../../../../api/usuarios.service';
import { Usuario } from '../../../../../core/interfaces/usuario.interface';

export interface HorarioFormDialogData {
  horario: Horario | null;
  unidades: Unidad[];
  areas: Area[];
}

export interface HorarioFormDialogResult {
  nombre: string;
  areaId: number;
  extendido: boolean;
  rotativo: boolean;
  regular: boolean;
  horasLaborales: number;
  dias: DiaInput[];
  usuarioIds?: number[];
  fechaInicio?: string;
  fechaFin?: string | null;
}

interface DiaEdicion {
  diaId: number;
  nombre: string;
  incluido: boolean;
  vigenciaInicio?: string;
  vigenciaFin?: string;
  turnos: TurnoInput[];
}

@Component({
  selector: 'horario-form-dialog',
  imports: [ReactiveFormsModule, FontAwesomeModule],
  template: `
    <div class="card bg-base-100 w-full border border-base-300 shadow-xl">
      <div class="card-body gap-4 max-h-[85vh] overflow-y-auto">
        <h2 class="card-title">
          {{ data.horario ? 'Editar horario' : 'Nuevo horario' }}
        </h2>

        @if (data.horario) {
          <p class="text-sm text-base-content/70">
            Unidad: <strong>{{ data.horario.areaNombre }}</strong>
          </p>
        }

        <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-4">
          @if (!data.horario) {
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Unidad *</legend>
              <select class="select w-full" formControlName="unidadId">
                <option [ngValue]="null" disabled>
                  Selecciona una unidad
                </option>
                @for (u of data.unidades; track u.unidadId) {
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

          @if (!data.horario) {
            <!-- ========== DÍAS Y TURNOS ========== -->
            <div class="card bg-base-200/50 border border-base-300">
              <div class="card-body gap-2">
                <h3 class="font-semibold">Días y turnos</h3>
                @for (d of dias(); track d.diaId) {
                  <div class="rounded-lg border border-base-300 bg-base-100 p-3">
                    <label
                      class="flex items-center gap-2 font-medium"
                    >
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        [checked]="d.incluido"
                        (change)="toggleDia(d.diaId)"
                      />
                      {{ d.nombre }}
                    </label>

                    @if (d.incluido) {
                      @if (form.value.rotativo) {
                        <div class="mt-2 grid grid-cols-2 gap-2">
                          <label class="label">Vigencia inicio</label>
                          <label class="label">Vigencia fin</label>
                          <input
                            type="date"
                            class="input input-sm w-full"
                            [value]="d.vigenciaInicio ?? ''"
                            (change)="vigenciaDia(d.diaId, 'inicio', $event)"
                          />
                          <input
                            type="date"
                            class="input input-sm w-full"
                            [value]="d.vigenciaFin ?? ''"
                            (change)="vigenciaDia(d.diaId, 'fin', $event)"
                          />
                        </div>
                      }

                      @for (t of d.turnos; track $index) {
                        <div class="mt-2 flex flex-wrap items-end gap-2">
                          <label class="label">Hora inicio</label>
                          <label class="label">Hora fin</label>
                          <input
                            type="time"
                            class="input input-sm w-32"
                            [value]="t.horaInicio"
                            (change)="
                              turnoCampo(d.diaId, $index, 'horaInicio', $event)
                            "
                          />
                          <input
                            type="time"
                            class="input input-sm w-32"
                            [value]="t.horaFin"
                            (change)="
                              turnoCampo(d.diaId, $index, 'horaFin', $event)
                            "
                          />
                          <label class="flex items-center gap-1 text-xs">
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
                            Extendido
                          </label>
                          <button
                            type="button"
                            class="btn btn-xs btn-ghost btn-error"
                            (click)="quitarTurno(d.diaId, $index)"
                          >
                            <fa-icon [icon]="iconService.faTrash"></fa-icon>
                          </button>
                        </div>
                      }
                      <button
                        type="button"
                        class="btn btn-xs btn-outline mt-2"
                        (click)="agregarTurno(d.diaId)"
                      >
                        <fa-icon [icon]="iconService.faPlus"></fa-icon>
                        Agregar turno
                      </button>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- ========== ASIGNACIÓN DE USUARIOS ========== -->
            <div class="card bg-base-200/50 border border-base-300">
              <div class="card-body gap-2">
                <h3 class="font-semibold">Asignar usuarios (opcional)</h3>

                @if (areaId.value && !usuariosCargados()) {
                  <button
                    type="button"
                    class="btn btn-xs btn-outline w-fit"
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
                    <div class="grid grid-cols-2 gap-2">
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

          <div class="card-actions justify-end pt-2">
            <button type="button" class="btn btn-ghost" (click)="cancelar()">
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="form.invalid"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export default class HorarioFormDialog {
  public data = inject<HorarioFormDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<HorarioFormDialogResult>);
  #fb = inject(FormBuilder);
  #horariosService = inject(HorariosService);
  #areasService = inject(AreasService);
  #usuariosService = inject(UsuariosService);
  #toastr = inject(ToastrService);
  public iconService = inject(FontIconService);

  public areas = signal<Area[]>(this.data.areas);
  public dias = signal<DiaEdicion[]>([]);
  public usuarios = signal<Usuario[]>([]);
  public seleccionados = signal<Set<number>>(new Set());
  public usuariosCargados = signal(false);
  public fechaInicio = signal('');
  public fechaFin = signal('');

  public form = this.#fb.group({
    nombre: [
      this.data.horario?.nombre ?? '',
      [Validators.required, Validators.minLength(1)],
    ],
    unidadId: [
      (this.data.horario?.unidadId ?? null) as number | null,
      [Validators.required],
    ],
    areaId: [
      (this.data.horario?.areaId ?? null) as number | null,
      [Validators.required],
    ],
    extendido: [this.data.horario?.extendido ?? false],
    rotativo: [this.data.horario?.rotativo ?? false],
    regular: [this.data.horario?.regular ?? true],
    horasLaborales: [
      this.data.horario?.horasLaborales ?? 8,
      [Validators.required, Validators.min(1)],
    ],
  });

  public diasValidos = computed(() => {
    if (this.data.horario) {
      return true;
    }
    const activos = this.dias().filter((d) => d.incluido);
    if (!activos.length) {
      return false;
    }
    return activos.every((d) => {
      const turnosOk =
        d.turnos.length > 0 &&
        d.turnos.every((t) => t.horaInicio && t.horaFin);
      if (!turnosOk) {
        return false;
      }
      if (this.form.value.rotativo) {
        return !!d.vigenciaInicio;
      }
      return true;
    });
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
    this.form.controls.unidadId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((unidadId) => {
        if (!unidadId) {
          this.areas.set([]);
          this.form.controls.areaId.setValue(null);
          return;
        }
        this.#areasService
          .listar(unidadId)
          .pipe(takeUntilDestroyed())
          .subscribe({
            next: (areas) => this.areas.set(areas),
            error: () =>
              this.#toastr.error('No se pudieron cargar las áreas'),
          });
      });

    if (!this.data.horario) {
      this.#horariosService
        .listarDias()
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (dias) =>
            this.dias.set(
              dias.map((d: Dia) => ({
                diaId: d.diaId,
                nombre: d.nombre,
                incluido: false,
                turnos: [] as TurnoInput[],
              })),
            ),
          error: () =>
            this.#toastr.error('No se pudieron cargar los días'),
        });
    }
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

  vigenciaDia(
    diaId: number,
    campo: 'inicio' | 'fin',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement).value;
    this.dias.update((lista) =>
      lista.map((d) =>
        d.diaId === diaId
          ? campo === 'inicio'
            ? { ...d, vigenciaInicio: value }
            : { ...d, vigenciaFin: value }
          : d,
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
      campo === 'extendido'
        ? (event.target as HTMLInputElement).checked
        : raw;
    this.dias.update((lista) =>
      lista.map((d) => {
        if (d.diaId !== diaId) {
          return d;
        }
        const turnos = d.turnos.map((t, i) =>
          i === index ? { ...t, [campo]: value } : t,
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

  cargarUsuarios(): void {
    const areaId = this.areaId.value;
    if (!areaId) {
      return;
    }
    this.#usuariosService
      .listar({ areaId })
      .pipe(takeUntilDestroyed())
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.diasValidos()) {
      this.#toastr.error(
        'Cada día incluido debe tener al menos un turno completo y su vigencia si es rotativo',
      );
      return;
    }

    const value = this.form.value;
    const base = {
      nombre: (value.nombre ?? '').trim(),
      areaId: value.areaId ?? 0,
      extendido: value.extendido ?? false,
      rotativo: value.rotativo ?? false,
      regular: value.regular ?? true,
      horasLaborales: value.horasLaborales ?? 8,
    };

    if (this.data.horario) {
      this.#dialogRef.close(base as HorarioFormDialogResult);
      return;
    }

    const dias: DiaInput[] = this.dias()
      .filter((d) => d.incluido)
      .map((d, i) => ({
        diaId: d.diaId,
        orden: i + 1,
        vigencia:
          (value.rotativo ?? false) && d.vigenciaInicio
            ? {
                fechaInicio: d.vigenciaInicio,
                fechaFin: d.vigenciaFin || null,
              }
            : undefined,
        turnos: d.turnos,
      }));

    const result: HorarioFormDialogResult = {
      ...base,
      dias,
      usuarioIds: this.seleccionados().size
        ? [...this.seleccionados()]
        : undefined,
      fechaInicio: this.fechaInicio() || undefined,
      fechaFin: this.fechaFin() || null,
    };
    this.#dialogRef.close(result);
  }

  cancelar(): void {
    this.#dialogRef.close();
  }
}
