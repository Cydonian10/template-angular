import { Component, inject, model } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../core/services/icon.service';

@Component({
  selector: 'ng-sidebar',
  imports: [FontAwesomeModule],
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
  template: `
    <!-- ========== INPUT: checkbox oculto que controla el drawer en móvil ========== -->
    <input type="checkbox" id="sidebar-toggle" class="peer sr-only" />

    <!-- ========== OVERLAY: fondo oscuro que cierra el sidebar al hacer clic (solo móvil) ========== -->
    <label
      for="sidebar-toggle"
      aria-hidden="true"
      class="fixed inset-0 z-30 hidden bg-base-content/50 peer-checked:block lg:hidden"
    ></label>

    <!-- ========== SIDEBAR PRINCIPAL ========== -->
    <div
      id="dashboard-sidebar"
      class="fixed top-16 bottom-0 inset-s-0 z-40 flex w-64 -translate-x-full flex-col justify-between overflow-y-auto border-e border-base-300 bg-base-100 transition-transform duration-300 peer-checked:translate-x-0 lg:static lg:shrink-0 lg:translate-x-0 lg:h-full"
    >
      <!-- ========== ENCABEZADO: logo ========== -->
      <div class="p-4">
        <span
          class="grid h-12 w-32 place-content-center rounded-lg bg-base-200 text-sm text-base-content"
        >
          Logo
        </span>

        <!-- ========== NAVEGACIÓN: menú de enlaces ========== -->
        <nav aria-label="Dashboard" class="mt-4">
          <ul class="space-y-1">
            <!-- Enlace: Overview -->
            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
              >
                Overview
              </a>
            </li>

            <!-- Enlace: Customers -->
            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
              >
                Customers
              </a>
            </li>

            <!-- Enlace: Orders -->
            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
              >
                Orders
              </a>
            </li>

            <!-- Enlace: Billing -->
            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
              >
                Billing
              </a>
            </li>

            <!-- Enlace: Settings (enlace activo) -->
            <li>
              <a
                href="#"
                class="block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content"
              >
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <!-- ========== PIE: perfil del usuario ========== -->
      <div class="sticky inset-x-0 bottom-0 border-t border-base-300">
        <a
          href="#"
          class="flex items-center gap-2 bg-base-100 p-4 hover:bg-base-200 hover:transition-colors"
        >
          <!-- Avatar del usuario -->
          <img
            alt=""
            src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&q=80&w=1160"
            class="size-10 rounded-full object-cover"
          />

          <!-- Nombre y correo del usuario -->
          <p class="text-xs text-base-content">
            <strong class="block font-medium">Priya Natarajan</strong>

            <span>priyaorbitly.com</span>
          </p>
        </a>
      </div>
    </div>
  `,
})
export class SidebarNg {
  title = 'front-scap';

  // ========== Servicio de iconos Font Awesome inyectado ==========
  public iconService = inject(FontIconService);
  public openSidebar = model(false);

  constructor() {}
}
