import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';

@Component({
  selector: 'unidades-page',
  imports: [FontAwesomeModule, BreadcrumbsNg],
  template: `
    <ng-breadcrumbs />
    <h1>Pagina para Unidades</h1>
  `,
})
export default class UnidadesPage {
  title = 'front-scap';

  public iconService = inject(FontIconService);
}
