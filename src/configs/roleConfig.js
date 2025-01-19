const roleConfig = {
    "/admin": ["admin", "manager", "superuser" ],
    "/production": ["admin", "worker" , "superuser"],
    "/admin/orders": ["admin", "manager", "superuser"],
    // Más rutas y roles según sea necesario
  };
  
  export default roleConfig;
  