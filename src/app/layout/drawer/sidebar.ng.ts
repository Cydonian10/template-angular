import {
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
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
        <div
          class="navbar h-14 min-h-14 shrink-0 border-b border-base-300 bg-base-100 px-4"
        >
          <div class="navbar-start gap-2">
            <button
              class="btn btn-ghost btn-sm btn-square"
              (click)="toggle()"
              aria-label="Abrir menú"
            >
              <fa-icon
                [icon]="iconService.faHamburger"
                class="text-xl"
              ></fa-icon>
            </button>
            <img
              src="logo-colegio.png"
              class="h-10 w-auto"
              alt="Logo colegio"
            />
          </div>

          <div class="navbar-center"></div>

          <div class="navbar-end gap-2">
            <div
              #searchContainer
              class="flex items-center gap-2"
              (focusout)="onSearchFocusOut($event)"
            >
              <input
                #searchInput
                type="search"
                placeholder="Buscar..."
                [class.w-0]="!searchOpen()"
                [class.w-40]="searchOpen()"
                [class.px-0]="!searchOpen()"
                [class.px-3]="searchOpen()"
                [class.opacity-0]="!searchOpen()"
                class="input input-sm input-bordered transition-all duration-300"
              />
              <button
                class="btn btn-ghost btn-sm btn-square"
                (click)="toggleSearch()"
                aria-label="Buscar"
              >
                <fa-icon [icon]="iconService.faSearch"></fa-icon>
              </button>
            </div>
            <div class="avatar avatar-placeholder">
              <div class="w-10 rounded-full bg-primary text-primary-content">
                <span class="font-bold">C</span>
              </div>
            </div>
          </div>
        </div>

        <main class="flex-1 overflow-y-auto p-4">
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

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer')
  searchContainer!: ElementRef<HTMLDivElement>;
  public searchOpen = signal(false);

  toggle() {
    this.openSidebar.update((v) => !v);
  }

  toggleSearch() {
    this.searchOpen.update((v) => !v);
    if (this.searchOpen()) {
      this.searchInput?.nativeElement.focus();
    }
  }

  onSearchFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.searchContainer.nativeElement.contains(next)) {
      this.searchOpen.set(false);
    }
  }
}
