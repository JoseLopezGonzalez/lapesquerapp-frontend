/**
 * Utilidades para filtrado de navegación por roles
 */

/**
 * Filtra elementos de navegación basándose en los roles del usuario
 * @param {Array} items - Array de items de navegación
 * @param {Array|string} userRoles - Roles del usuario (puede ser array o string)
 * @returns {Array} - Array de items filtrados
 */
export function filterNavigationByRoles(items, userRoles) {
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
    
    return items
        .filter((item) =>
            item.allowedRoles?.some((role) => roles.includes(role))
        )
        .map((item) => ({
            ...item,
            childrens: item.childrens
                ? item.childrens.filter((child) =>
                    child.allowedRoles?.some((role) => roles.includes(role))
                )
                : null,
        }));
}

/**
 * Filtra elementos de navegación basándose en los feature flags del usuario
 * @param {Array} items - Array de items de navegación
 * @param {Array} userFeatures - Features habilitadas para el usuario
 * @returns {Array} - Array de items filtrados
 */
export function filterNavigationByFeatures(items, userFeatures) {
    const features = userFeatures ?? [];
    return items
        .filter((item) => !item.requiredFeature || features.includes(item.requiredFeature))
        .map((item) => ({
            ...item,
            childrens: item.childrens
                ? item.childrens.filter((c) => !c.requiredFeature || features.includes(c.requiredFeature))
                : null,
        }));
}

/**
 * Verifica si una ruta está activa (incluye rutas anidadas)
 * @param {string} itemHref - Href del item de navegación
 * @param {string} currentPath - Ruta actual
 * @returns {boolean} - true si la ruta está activa
 */
export function isActiveRoute(itemHref, currentPath) {
    if (!itemHref) return false;
    if (itemHref === currentPath) return true;
    if (currentPath.startsWith(itemHref + '/')) return true;
    return false;
}

