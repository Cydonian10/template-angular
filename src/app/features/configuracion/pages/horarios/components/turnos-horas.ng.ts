import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurnoInput } from '../../../../../core/interfaces/horario.interface';

@Component({
  selector: 'turnos-horas',
  imports: [CommonModule],
  template: `
    <span [class]="clase()" class="flex gap-2">
      @if (etiqueta()) {
        <span class="opacity-70">{{ etiqueta() }}:</span>
      }
      <span class="font-mono">{{ total() | number: '1.1-1' }}h</span>
    </span>
  `,
  host: {
    class: 'block',
  },
})
export default class TurnosHoras {
  public turnos = input<TurnoInput[]>([]);
  public etiqueta = input('');
  public clase = input('');

  public total = computed(() =>
    this.turnos().reduce((sum, t) => sum + this.#horasTurno(t), 0),
  );

  #horasTurno(t: TurnoInput): number {
    if (!t?.horaInicio || !t.horaFin) {
      return 0;
    }
    const [hi, mi] = t.horaInicio.split(':').map(Number);
    const [hf, mf] = t.horaFin.split(':').map(Number);
    if ([hi, mi, hf, mf].some(Number.isNaN)) {
      return 0;
    }
    let diff = (hf * 60 + mf - (hi * 60 + mi)) / 60;
    if (t.extendido || diff <= 0) {
      diff += 24;
    }
    return diff;
  }
}
