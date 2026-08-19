import { OverlayModule } from '@angular/cdk/overlay';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../../core/services/icon.service';

export interface BuscarEntidadOpcion {
  id: number;
  nombre: string;
  bloqueada?: boolean;
  detalleBloqueo?: string;
}

@Component({
  selector: 'buscar-entidad-selector',
  imports: [FontAwesomeModule, OverlayModule],
  template: `
    <div class="w-full" cdkOverlayOrigin #origen="cdkOverlayOrigin">
      <label class="input w-full">
        <fa-icon [icon]="iconService.faSearch"></fa-icon>
        <input
          type="search"
          class="grow"
          [value]="busqueda()"
          [placeholder]="placeholder"
          (focus)="abrir()"
          (input)="buscar($event)"
          (keydown.escape)="cerrar()"
        />
      </label>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origen"
      [cdkConnectedOverlayOpen]="abierto()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="cerrar()"
      (detach)="cerrar()"
    >
      <div class="mt-1 max-h-64 w-96 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
        @if (opcionesFiltradas().length) {
          @for (opcion of opcionesFiltradas(); track opcion.id) {
            <button
              type="button"
              class="flex w-full flex-col items-start gap-0.5 rounded-field px-3 py-2 text-left hover:bg-base-200 disabled:cursor-not-allowed disabled:bg-base-200 disabled:text-base-content/60"
              [disabled]="opcion.bloqueada"
              (click)="seleccionar(opcion)"
            >
              <span>{{ opcion.nombre }}</span>
              @if (opcion.detalleBloqueo) {
                <span class="text-xs">{{ opcion.detalleBloqueo }}</span>
              }
            </button>
          }
        } @else {
          <p class="px-3 py-2 text-sm text-base-content/60">
            No hay resultados.
          </p>
        }
      </div>
    </ng-template>
  `,
})
export default class BuscarEntidadSelector {
  @Input({ required: true }) opciones: BuscarEntidadOpcion[] = [];
  @Input() placeholder = 'Buscar...';
  @Output() seleccion = new EventEmitter<BuscarEntidadOpcion>();

  public iconService = inject(FontIconService);
  public abierto = signal(false);
  public busqueda = signal('');

  opcionesFiltradas(): BuscarEntidadOpcion[] {
    const termino = this.busqueda().toLocaleLowerCase().trim();
    if (!termino) return this.opciones;
    return this.opciones.filter((opcion) =>
      `${opcion.nombre} ${opcion.detalleBloqueo ?? ''}`
        .toLocaleLowerCase()
        .includes(termino),
    );
  }

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
    this.abrir();
  }

  seleccionar(opcion: BuscarEntidadOpcion): void {
    this.busqueda.set(opcion.nombre);
    this.seleccion.emit(opcion);
    this.cerrar();
  }
}
