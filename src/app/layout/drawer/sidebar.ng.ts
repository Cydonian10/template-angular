import { Component, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontIconService } from '../../core/services/icon.service';

@Component({
  selector: 'ng-sidebar',
  imports: [FontAwesomeModule],
  template: `
    <input type="checkbox" id="sidebar-toggle" class="peer sr-only" />

    <label
      for="sidebar-toggle"
      aria-hidden="true"
      class="fixed inset-0 z-30 hidden bg-gray-900/50 peer-checked:block lg:hidden"
    ></label>

    <div
      id="dashboard-sidebar"
      class="fixed inset-y-0 inset-s-0 z-40 flex w-64 -translate-x-full flex-col justify-between overflow-y-auto border-e border-gray-200 bg-white transition-transform duration-300 peer-checked:translate-x-0 lg:static lg:shrink-0 lg:translate-x-0"
    >
      <div class="p-4">
        <span
          class="grid h-12 w-32 place-content-center rounded-lg bg-gray-100 text-sm text-gray-600"
        >
          Logo
        </span>

        <nav aria-label="Dashboard" class="mt-4">
          <ul class="space-y-1">
            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Overview
              </a>
            </li>

            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Customers
              </a>
            </li>

            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Orders
              </a>
            </li>

            <li>
              <a
                href="#"
                class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                Billing
              </a>
            </li>

            <li>
              <a
                href="#"
                class="block rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900"
              >
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div class="sticky inset-x-0 bottom-0 border-t border-gray-200">
        <a
          href="#"
          class="flex items-center gap-2 bg-white p-4 hover:bg-gray-50 hover:transition-colors"
        >
          <img
            alt=""
            src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&q=80&w=1160"
            class="size-10 rounded-full object-cover"
          />

          <p class="text-xs text-gray-900">
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

  public iconService = inject(FontIconService);

  constructor() {}
}
