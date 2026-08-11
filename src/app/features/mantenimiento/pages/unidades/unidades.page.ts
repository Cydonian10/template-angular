import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../../../core/services/icon.service';

@Component({
  selector: 'unidades-page',
  imports: [FontAwesomeModule],
  template: ` <h1>Pagina para Unidades</h1> `,
})
export default class UnidadesPage {
  title = 'front-scap';

  public iconService = inject(FontIconService);
}
