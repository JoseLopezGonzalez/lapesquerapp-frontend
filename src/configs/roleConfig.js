// Valores de rol de la API: tecnico, administrador, direccion, administracion, comercial, operario
const roleConfig = {
  "/admin": ["administrador", "direccion", "tecnico"],
  "/production": ["administrador", "direccion", "operario", "tecnico"],
  "/admin/orders": ["administrador", "direccion", "tecnico"],
  "/warehouse": ["operario", "administrador", "tecnico"],
};

export default roleConfig;
  