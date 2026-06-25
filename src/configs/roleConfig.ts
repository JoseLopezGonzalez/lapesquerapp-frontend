/**
 * Mapa ruta → roles permitidos. Usado por el middleware para autorización.
 */
export type RoleKey =
  | 'administrador'
  | 'direccion'
  | 'tecnico'
  | 'operario'
  | 'administracion'
  | 'comercial'
  | 'repartidor_autoventa'
  | 'supervisor';

export const roleConfig: Record<string, RoleKey[]> = {
  '/operator': ['operario'],
  '/comercial': ['comercial'],
  '/field': ['repartidor_autoventa'],
  '/admin': ['administrador', 'direccion', 'tecnico'],
  '/admin/external-processors': ['administrador', 'direccion', 'tecnico', 'administracion'],
  '/admin/home': ['administrador', 'direccion', 'tecnico', 'supervisor'],
  '/admin/raw-material-receptions': ['administrador', 'direccion', 'tecnico'],
  '/admin/cebo-dispatches': ['administrador', 'direccion', 'tecnico'],
  '/admin/orquestador': ['administrador', 'direccion', 'tecnico'],
  '/admin/stores-manager': ['administrador', 'direccion', 'tecnico'],
  '/admin/nfc-punch-manager': ['administrador', 'direccion', 'tecnico'],
  '/admin/orders': ['administrador', 'direccion', 'tecnico'],
  '/production': ['administrador', 'direccion', 'operario', 'tecnico'],
  '/warehouse': ['administrador', 'tecnico'],
};

export default roleConfig;
