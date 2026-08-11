import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';
import BreadcrumbsNg from '../../../../layout/breadcrumbs/breadcrumbs.ng';

@Component({
  selector: 'lista-unidades-page',
  imports: [FontAwesomeModule, BreadcrumbsNg],
  template: `
    <ng-breadcrumbs />
    <h1>Pagina para lista de unidades</h1>
  `,
})
export default class ListaUnidades {
  title = 'front-scap';

  public iconService = inject(FontIconService);
}
