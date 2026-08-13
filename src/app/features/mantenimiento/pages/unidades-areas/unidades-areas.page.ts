import { Component, inject, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';

@Component({
  selector: 'unidades-areas-page',
  imports: [FontAwesomeModule, BreadcrumbsNg],
  template: `
    <ng-breadcrumbs />
    <h1>Áreas de la unidad {{ unidadId() }}</h1>
  `,
})
export default class UnidadesAreasPage {
  title = 'front-scap';

  public iconService = inject(FontIconService);
  public unidadId = input.required<string>();
}
