// Valores de rol de la API: tecnico, administrador, direccion, administracion, comercial, operario
// Operario (rol de nivel, como tecnico) solo puede acceder a rutas que lo incluyan explícitamente.
const roleConfig = {
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
  