import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'horaAmPm',
  standalone: true,
})
export class HoraAmPmPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    const [hoursValue, minutes = '00'] = value.slice(0, 5).split(':');
    const hours = Number(hoursValue);
    if (!Number.isInteger(hours) || hours < 0 || hours > 23) return value;

    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${suffix}`;
  }
}
