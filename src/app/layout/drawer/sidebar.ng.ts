import { Component, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../core/services/icon.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ng-sidebar',
  imports: [FontAwesomeModule, RouterOutlet],
  template: `
    <div class="flex flex-1 overflow-hidden">
      <!-- ========== OVERLAY: fondo oscuro que cierra el sidebar al hacer clic (solo móvil) ========== -->
      <div
        class="fixed inset-0 z-30 bg-base-content/50 lg:hidden"
        [class.hidden]="!openSidebar()"
        (click)="toggle()"
      ></div>

      <!-- ========== SIDEBAR PRINCIPAL ========== -->
      <div
        id="dashboard-sidebar"
        [class.w-64]="openSidebar()"
        [class.w-0]="!openSidebar()"
        class="fixed inset-y-0 inset-s-0 z-40 flex flex-col overflow-hidden border-e border-base-300 bg-base-100 transition-all duration-300 lg:static lg:shrink-0 lg:h-full"
      >
        <div class="flex-1 overflow-y-auto">
          <!-- ========== ENCABEZADO: logo ========== -->
          <div class="p-4">
            <span class="text-base-content lg:text-2xl text-center font-bold">
              <h3>SUB SISTEMAS</h3>
            </span>

            <div class="h-1 bg-base-300 my-4"></div>

            <!-- ========== NAVEGACIÓN: menú de enlaces ========== -->
            <nav aria-label="Dashboard" class="mt-4">
              <ul class="space-y-1">
                <!-- Enlace: Overview -->
                <li>
                  <a
                    href="#"
                    class="block rounded-lg px-4 py-2 text-sm font-medium text-base-content transition-colors hover:bg-base-200"
                  >
                    Inicio
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <!-- ========== PIE: perfil del usuario ========== -->
        <div class="shrink-0 border-t border-base-300">
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

      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- ========== HEADER: barra superior ========== -->
        <div class="h-14 shrink-0 border-b-[0.2px]">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <img src="logo-colegio.png" width="50" height="50" />
              <button class="btn btn-soft btn-sm" (click)="toggle()">
                <fa-icon
                  [icon]="iconService.faHamburger"
                  class="text-2xl"
                ></fa-icon>
              </button>
            </div>

            <div class="flex gap-3">
              <button class="btn btn-soft btn-primary">
                <fa-icon [icon]="iconService.faSearch"></fa-icon>
              </button>
              <div>
                <!-- Inical del usuario si no tiene imagen -->
                <div>C</div>
              </div>
            </div>
          </div>
        </div>

        <main class="flex-1 overflow-y-auto p-4">
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto
            porro id nihil dignissimos, a consequuntur maxime neque ut non
            blanditiis sint nostrum beatae dolores, suscipit quia, rerum
            voluptatem molestias possimus.
          </p>
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  host: {
    class: 'flex h-dvh',
  },
})
export default class SidebarNg {
  title = 'front-scap';

  // ========== Servicio de iconos Font Awesome inyectado ==========
  public iconService = inject(FontIconService);
  public openSidebar = signal(true);

  toggle() {
    this.openSidebar.update((v) => !v);
  }
}
