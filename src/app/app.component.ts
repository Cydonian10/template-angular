import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { FontIconService } from './core/services/icon.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FontAwesomeModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'front-scap';

  openSiebar = signal(true);

  public iconService = inject(FontIconService);

  handleOpenSidebar() {
    this.openSiebar.update((v) => !v);
  }
}
