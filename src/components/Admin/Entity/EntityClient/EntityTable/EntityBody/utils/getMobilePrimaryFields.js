/**
 * Obtiene los campos principales para mostrar en mobile según la configuración de la entidad
 * Permite personalización por entidad
 * @param {Array} headers - Array de headers de la configuración
 * @param {string} endpoint - Endpoint de la entidad (para personalización)
 * @returns {Array} Array de headers seleccionados para mobile
 */
export function getMobilePrimaryFields(headers, endpoint) {
  // Configuraciones personalizadas por entidad
  const customConfigs = {
    'pallets': {
      // Para palets: ID, Productos (list), Estado (badge)
      fields: ['id', 'productsNames', 'state'],
      maxFields: 3
    },
    // Agregar más configuraciones personalizadas aquí
  };

  const customConfig = customConfigs[endpoint];

  if (customConfig) {
    // Usar configuración personalizada
    const selectedFields = [];
    for (const fieldName of customConfig.fields) {
      const header = headers.find(h => h.name === fieldName);
      if (header) {
        selectedFields.push(header);
      }
      if (selectedFields.length >= customConfig.maxFields) break;
    }
    return selectedFields;
  }

  // Configuración por defecto: ID, badge, y primeros campos visibles
  const primaryFields = [];
  
  // 1. Buscar campo ID
  const idField = headers.find(h => h.type === 'id');
  if (idField) primaryFields.push(idField);
  
  // 2. Buscar badge (estado)
  const badgeField = headers.find(h => h.type === 'badge');
  if (badgeField && !primaryFields.includes(badgeField)) {
    primaryFields.push(badgeField);
  }
  
  // 3. Completar con primeros campos sin hideOnMobile (priorizando listas)
  const visibleFields = headers.filter(h => 
    !h.hideOnMobile && 
    !primaryFields.includes(h) &&
    h.type !== 'id' &&
    h.type !== 'badge' &&
    h.name !== 'actions'
  );
  
  // Priorizar listas
  const listFields = visibleFields.filter(h => h.type === 'list');
  const otherFields = visibleFields.filter(h => h.type !== 'list');
  
  primaryFields.push(...listFields.slice(0, 1));
  primaryFields.push(...otherFields.slice(0, 3 - primaryFields.length));
  
  return primaryFields.slice(0, 3);
}

