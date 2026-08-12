import {
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../core/services/icon.service';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'ng-sidebar',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex flex-1 overflow-hidden">
      <!-- ========== OVERLAY: fondo oscuro que cierra el sidebar al hacer clic (solo móvil) ========== -->
      <div
        class="fixed inset-0 z-30 bg-neutral/50 lg:hidden"
        [class.hidden]="!openSidebar()"
        (click)="toggle()"
      ></div>

      <!-- ========== SIDEBAR PRINCIPAL ========== -->
      <div
        id="dashboard-sidebar"
        [class.w-64]="openSidebar()"
        [class.w-0]="!openSidebar()"
        class="fixed inset-y-0 inset-s-0 z-40 flex flex-col overflow-hidden border-e border-neutral-content/10 bg-neutral text-neutral-content transition-all duration-300 lg:static lg:shrink-0 lg:h-full"
      >
        <div class="flex-1 overflow-y-auto">
          <!-- ========== ENCABEZADO: logo ========== -->
          <div class="p-4">
            <span
              class="text-neutral-content lg:text-2xl text-center font-bold"
            >
              <h3>SUB SISTEMAS</h3>
            </span>

            <div class="h-1 bg-neutral-content/10 my-4"></div>

            <!-- ========== NAVEGACIÓN: menú de enlaces ========== -->
            <nav aria-label="Dashboard" class="mt-4">
              <ul class="space-y-1">
                <!-- Enlace: Inicio -->
                <li>
                  <a
                    routerLink="/inicio"
                    routerLinkActive="bg-primary text-primary-content"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-neutral-content transition-colors hover:bg-neutral-content/10"
                  >
                    <fa-icon
                      [icon]="iconService.faHouse"
                      class="text-base"
                    ></fa-icon>
                    Inicio
                  </a>
                </li>

                <!-- ========== MÓDULOS DINÁMICOS ========== -->
                @for (modulo of dashboardService.menu(); track modulo.id) {
                  <li>
                    <button
                      type="button"
                      (click)="dashboardService.toggleModulo(modulo.id)"
                      class="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-neutral-content transition-colors hover:bg-neutral-content/10"
                      [class.bg-primary]="modulo.active"
                      [class.text-primary-content]="modulo.active"
                    >
                      <fa-icon
                        [icon]="dashboardService.parseIcon(modulo.icon)"
                        class="text-base"
                      ></fa-icon>
                      <span class="flex-1 text-start">{{ modulo.modulo }}</span>
                      <fa-icon
                        [icon]="iconService.faChevronDown"
                        class="text-sm transition-transform duration-300"
                        [class.rotate-180]="modulo.active"
                      ></fa-icon>
                    </button>

                    <!-- ========== SUB-ITEMS con animación ========== -->
                    <div
                      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
                      [class.grid-rows-[0fr]]="!modulo.active"
                      [class.grid-rows-[1fr]]="modulo.active"
                    >
                      <div class="overflow-hidden">
                        <ul class="mt-1 space-y-1 ps-4">
                          @for (sub of modulo.menus; track sub.menuId) {
                            <li>
                              <a
                                [routerLink]="sub.url"
                                routerLinkActive="bg-primary/70 text-primary-content"
                                (click)="
                                  dashboardService.setActiveModulo(modulo.id)
                                "
                                class="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-neutral-content/80 transition-colors hover:bg-neutral-content/10 hover:text-neutral-content"
                              >
                                <fa-icon
                                  [icon]="iconService.faCoffee"
                                  class="text-xs opacity-60"
                                ></fa-icon>
                                {{ sub.menu }}
                              </a>
                            </li>
                          }
                        </ul>
                      </div>
                    </div>
                  </li>
                }
              </ul>
            </nav>
          </div>
        </div>

        <!-- ========== PIE: perfil del usuario ========== -->
        <div class="shrink-0 border-t border-neutral-content/10">
          <a
            href="#"
            class="flex items-center gap-2 bg-neutral p-4 transition-colors hover:bg-neutral-content/10"
          >
            <!-- Avatar del usuario -->
            <img
              alt=""
              src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&q=80&w=1160"
              class="size-10 rounded-full object-cover"
            />

            <!-- Nombre y correo del usuario -->
            <p class="text-xs text-neutral-content">
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

  // ========== Servicios inyectados ==========
  public iconService = inject(FontIconService);
  public dashboardService = inject(DashboardService);
  private router = inject(Router);

  public openSidebar = signal(true);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer')
  searchContainer!: ElementRef<HTMLDivElement>;
  public searchOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncActiveModulo());
  }

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

  /** Abre automáticamente el módulo que contenga la ruta activa. */
  private syncActiveModulo(): void {
    const url = this.router.url;
    const match = this.dashboardService
      .menu()
      .find((modulo) => modulo.menus.some((sub) => url.startsWith(sub.url)));
    if (match) {
      this.dashboardService.setActiveModulo(match.id);
    } else {
      this.dashboardService.closeAll();
    }
  }
}
