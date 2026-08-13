import { Component, computed, input, output } from '@angular/core';
import { PaginadorState } from '../../core/datasources/paginador-data-source';

@Component({
  selector: 'ng-paginator',
  imports: [],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p class="text-sm text-base-content/70">
        Mostrando {{ desde() }}–{{ hasta() }} de {{ length() }}
      </p>

      <div class="flex items-center gap-2">
        <select class="select select-sm w-32" (change)="cambiarTamano($event)">
          @for (size of pageSizeOptions(); track size) {
            <option [value]="size" [selected]="size === pageSize()">
              {{ size }} por página
            </option>
          }
        </select>

        <div class="join">
          <button
            class="btn btn-sm join-item"
            [disabled]="pageIndex() === 0"
            (click)="anterior()"
            aria-label="Página anterior"
          >
            «
          </button>
          <button
            class="btn btn-sm join-item"
            [disabled]="pageIndex() >= ultimaPagina()"
            (click)="siguiente()"
            aria-label="Página siguiente"
          >
            »
          </button>
        </div>
      </div>
    </div>
  `,
})
export default class PaginatorNg {
  public length = input.required<number>();
  public pageIndex = input.required<number>();
  public pageSize = input.required<number>();
  public pageSizeOptions = input<number[]>([10, 20, 50]);

  public pageChange = output<PaginadorState>();

  public ultimaPagina = computed(() =>
    Math.max(0, Math.ceil(this.length() / this.pageSize()) - 1),
  );

  public desde = computed(() =>
    this.length() === 0 ? 0 : this.pageIndex() * this.pageSize() + 1,
  );

  public hasta = computed(() =>
    Math.min(this.length(), (this.pageIndex() + 1) * this.pageSize()),
  );

  anterior(): void {
    if (this.pageIndex() === 0) {
      return;
    }
    this.pageChange.emit({
      pageIndex: this.pageIndex() - 1,
      pageSize: this.pageSize(),
    });
  }

  siguiente(): void {
    if (this.pageIndex() >= this.ultimaPagina()) {
      return;
    }
    this.pageChange.emit({
      pageIndex: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    });
  }

  cambiarTamano(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageChange.emit({ pageIndex: 0, pageSize: value });
  }
}
