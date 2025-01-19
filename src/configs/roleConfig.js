const roleConfig = {
    "/admin": ["admin", "manager", "superuser" ],
    "/production": ["admin", "worker" , "superuser"],
    "/admin/orders": ["admin", "manager"],
    // Más rutas y roles según sea necesario
  };
  
  export default roleConfig;
  