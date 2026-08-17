import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

export interface ConfirmarDialogData {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipoConfirmar?: 'primary' | 'error' | 'warning';
}

export interface ConfirmarDialogResult {
  confirmado: boolean;
}

@Component({
  selector: 'confirmar-dialog',
  imports: [],
  template: `
    <div
      class="card bg-base-100 w-full max-w-md border border-base-300 shadow-xl"
    >
      <div class="card-body gap-4">
        <h2 class="card-title">{{ data.titulo }}</h2>
        <p class="text-sm text-base-content/70">{{ data.mensaje }}</p>

        <div class="card-actions justify-end pt-2">
          <button type="button" class="btn btn-ghost" (click)="cancelar()">
            {{ data.textoCancelar ?? 'Cancelar' }}
          </button>
          <button
            class="btn"
            [class.btn-primary]="(data.tipoConfirmar ?? 'primary') === 'primary'"
            [class.btn-error]="data.tipoConfirmar === 'error'"
            [class.btn-warning]="data.tipoConfirmar === 'warning'"
            (click)="confirmar()"
          >
            {{ data.textoConfirmar ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export default class ConfirmarDialog {
  public data = inject<ConfirmarDialogData>(DIALOG_DATA);
  #dialogRef = inject(DialogRef<ConfirmarDialogResult>);

  confirmar(): void {
    this.#dialogRef.close({ confirmado: true });
  }

  cancelar(): void {
    this.#dialogRef.close({ confirmado: false });
  }
}
