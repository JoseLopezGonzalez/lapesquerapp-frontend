/**
 * Identifica los campos principales para mostrar en el trigger del accordion
 * @param {Array} headers - Array de headers de la configuración
 * @param {number} maxFields - Máximo de campos a retornar (default: 3)
 * @returns {Array} Array de headers seleccionados
 */
export function getPrimaryFields(headers, maxFields = 3) {
  const primaryFields = [];
  
  // 1. Buscar campo ID
  const idField = headers.find(h => h.type === 'id');
  if (idField) primaryFields.push(idField);
  
  // 2. Buscar badge (estado)
  const badgeField = headers.find(h => h.type === 'badge');
  if (badgeField && !primaryFields.includes(badgeField)) {
    primaryFields.push(badgeField);
  }
  
  // 3. Completar con primeros campos sin hideOnMobile
  const visibleFields = headers.filter(h => 
    !h.hideOnMobile && 
    !primaryFields.includes(h) &&
    h.type !== 'id' &&
    h.type !== 'badge' &&
    h.name !== 'actions' // Excluir columna de acciones
  );
  
  primaryFields.push(...visibleFields.slice(0, maxFields - primaryFields.length));
  
  return primaryFields.slice(0, maxFields);
}

