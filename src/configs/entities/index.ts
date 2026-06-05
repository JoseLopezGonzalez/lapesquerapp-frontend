// src/configs/entities/index.ts
// Ensamblador de todos los módulos de configuración de entidades.
// Este archivo es el único punto de importación — no importar los módulos directamente.

import productionConfig from './entitiesConfig.production';
import ordersConfig from './entitiesConfig.orders';
import adminConfig from './entitiesConfig.admin';
import catalogConfig from './entitiesConfig.catalog';
import stockConfig from './entitiesConfig.stock';
import crmConfig from './entitiesConfig.crm';
import fieldConfig from './entitiesConfig.field';
import suppliersConfig from './entitiesConfig.suppliers';

export const configs = {
  ...productionConfig,
  ...ordersConfig,
  ...adminConfig,
  ...catalogConfig,
  ...stockConfig,
  ...crmConfig,
  ...fieldConfig,
  ...suppliersConfig,
};
