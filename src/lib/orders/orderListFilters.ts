export type OrderCategory = {
  label: string;
  name: string;
  current?: boolean;
};

export type OrderListItem = Record<string, unknown> & {
  id: number | string;
  status?: string | null;
  loadDate?: string | null;
  customer?: {
    name?: string | null;
  } | null;
};

export const INITIAL_ORDER_CATEGORIES: OrderCategory[] = [
  { label: 'Todos', name: 'all', current: true },
  { label: 'En producción', name: 'pending', current: false },
  { label: 'Terminados', name: 'finished', current: false },
  { label: 'Hoy', name: 'today', current: false },
  { label: 'Mañana', name: 'tomorrow', current: false },
];

function getDateOnly(value: unknown) {
  if (!value) return null;

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function buildOrderReferenceDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return { today, tomorrow };
}

export function buildVisibleOrderCategories(orders: OrderListItem[] = []) {
  const { today, tomorrow } = buildOrderReferenceDates();
  const hasOrdersToday = orders.some(
    (order) => getDateOnly(order.loadDate)?.getTime() === today.getTime()
  );
  const hasOrdersTomorrow = orders.some(
    (order) => getDateOnly(order.loadDate)?.getTime() === tomorrow.getTime()
  );

  const result: OrderCategory[] = [{ label: 'Todos', name: 'all' }];
  if (hasOrdersToday) result.push({ label: 'Hoy', name: 'today' });
  if (hasOrdersTomorrow) result.push({ label: 'Mañana', name: 'tomorrow' });
  result.push(
    { label: 'En producción', name: 'pending' },
    { label: 'Terminados', name: 'finished' }
  );

  return result;
}

export function filterAndSortOrders(
  orders: OrderListItem[] = [],
  {
    searchText = '',
    activeCategoryName = 'all',
  }: {
    searchText?: string;
    activeCategoryName?: string;
  } = {}
) {
  const { today, tomorrow } = buildOrderReferenceDates();
  const normalizedSearch = searchText.trim().toLowerCase();

  return orders
    .filter((order) => {
      const loadDateOnly = getDateOnly(order.loadDate);
      const matchesSearch =
        !normalizedSearch ||
        String(order.customer?.name ?? '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(order.id).includes(normalizedSearch);

      let matchesCategory = true;
      if (activeCategoryName === 'today') {
        matchesCategory = loadDateOnly?.getTime() === today.getTime();
      } else if (activeCategoryName === 'tomorrow') {
        matchesCategory = loadDateOnly?.getTime() === tomorrow.getTime();
      } else if (activeCategoryName !== 'all') {
        matchesCategory = activeCategoryName === order.status;
      }

      const isOldFinishedOrder =
        order.status === 'finished' && loadDateOnly && loadDateOnly < today;
      return matchesSearch && matchesCategory && !isOldFinishedOrder;
    })
    .sort((left, right) => {
      const leftDate = new Date(String(left.loadDate ?? ''));
      const rightDate = new Date(String(right.loadDate ?? ''));
      return leftDate.getTime() - rightDate.getTime();
    });
}
