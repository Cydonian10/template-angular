import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaCorta',
  standalone: true,
})
export class FechaCortaPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';

    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }
}
