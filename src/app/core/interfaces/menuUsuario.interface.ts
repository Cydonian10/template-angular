export interface SubMenuUsuario {
  menuId: number;
  menu: string;
  orden: number;
  icon: string;
  url: string;
  moduloId: number;
  externo: boolean;
  permisos?: unknown[];
  route?: string;
}

export interface ModuloUsuario {
  id: number;
  modulo: string;
  orden: number;
  active: boolean;
  icon: string;
  menus: SubMenuUsuario[];
}
