import { Component } from '@angular/core';

@Component({
  selector: 'ng-inicio',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold">Bienvenido</h1>
      <p class="mt-2 text-base-content/70">
        Selecciona un módulo del menú lateral.
      </p>
    </div>
  `,
})
export default class InicioPage {}
