/**
 * Mapa ruta → roles permitidos. Usado por el middleware para autorización.
 */
export type RoleKey =
  | "administrador"
  | "direccion"
  | "tecnico"
  | "operario"
  | "administracion"
  | "comercial";

export const roleConfig: Record<string, RoleKey[]> = {
  "/admin": ["administrador", "direccion", "tecnico"],
  "/admin/home": ["operario", "administrador", "direccion", "tecnico"],
  "/admin/raw-material-receptions": ["operario", "administrador", "direccion", "tecnico"],
  "/admin/cebo-dispatches": ["operario", "administrador", "direccion", "tecnico"],
  "/admin/orquestador": ["operario", "administrador", "direccion", "tecnico"],
  "/admin/stores-manager": ["operario", "administrador", "direccion", "tecnico"],
  "/admin/nfc-punch-manager": ["operario", "administrador", "direccion", "tecnico"],
  "/admin/orders": ["administrador", "direccion", "tecnico"],
  "/production": ["administrador", "direccion", "operario", "tecnico"],
  "/warehouse": ["administrador", "tecnico"],
};

export default roleConfig;
