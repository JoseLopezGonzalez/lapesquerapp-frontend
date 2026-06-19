type NavItem = {
  href?: string | null;
  name?: string;
  [key: string]: unknown;
};

/** Items del BottomNav móvil para el rol operario (compartido entre /operator y /production). */
export function getOperarioBottomNavItems(
  filteredNavigationConfig: NavItem[],
  navigationManagersItems: NavItem[]
) {
  const inicioItem = filteredNavigationConfig.find((item) => item.href === '/operator');

  const almacenesItem = navigationManagersItems.find(
    (item) => item.href === '/operator/stores-manager'
  );
  const almacenesNavItem = almacenesItem ? { ...almacenesItem, name: 'Almacenes' } : null;

  const etiquetasItem = navigationManagersItems.find(
    (item) => item.href === '/production/number_label'
  );
  const etiquetasNavItem = etiquetasItem ? { ...etiquetasItem, name: 'Etiquetas' } : null;

  const fichajeItem = navigationManagersItems.find(
    (item) => item.href === '/operator/nfc-punch-manager'
  );
  const fichajeNavItem = fichajeItem ? { ...fichajeItem, name: 'Fichaje' } : null;

  return [inicioItem, almacenesNavItem, etiquetasNavItem, fichajeNavItem].filter(Boolean);
}
