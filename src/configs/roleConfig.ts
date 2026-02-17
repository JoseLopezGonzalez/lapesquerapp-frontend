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
  "/operator": ["operario"],
  "/admin": ["administrador", "direccion", "tecnico"],
  "/admin/home": ["administrador", "direccion", "tecnico"],
  "/admin/raw-material-receptions": ["administrador", "direccion", "tecnico"],
  "/admin/cebo-dispatches": ["administrador", "direccion", "tecnico"],
  "/admin/orquestador": ["administrador", "direccion", "tecnico"],
  "/admin/stores-manager": ["administrador", "direccion", "tecnico"],
  "/admin/nfc-punch-manager": ["administrador", "direccion", "tecnico"],
  "/admin/orders": ["administrador", "direccion", "tecnico"],
  "/production": ["administrador", "direccion", "operario", "tecnico"],
  "/warehouse": ["administrador", "tecnico"],
};

export default roleConfig;
