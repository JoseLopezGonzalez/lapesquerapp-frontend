// Valores de rol de la API: tecnico, administrador, direccion, administracion, comercial, operario
const roleConfig = {
  "/admin": ["administrador", "direccion"],
  "/production": ["administrador", "direccion", "operario", "tecnico"],
  "/admin/orders": ["administrador", "direccion"],
  "/warehouse": ["operario", "administrador"],
};

export default roleConfig;
  