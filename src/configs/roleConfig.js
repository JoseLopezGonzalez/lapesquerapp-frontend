const roleConfig = {
    "/admin": ["admin", "manager", "superuser" ],
    "/production": ["admin", "worker" , "superuser"],
    "/admin/orders": ["admin", "manager", "superuser"],
    "/warehouse": ["store_operator", "superuser"], // Nueva ruta para operadores de almacén y superuser
    // Más rutas y roles según sea necesario
  };
  
  export default roleConfig;
  