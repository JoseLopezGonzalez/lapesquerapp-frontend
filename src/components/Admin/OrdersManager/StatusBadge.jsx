'use client';

/**
 * Badge reutilizable para estados de pedido (Terminado, En producción, Incidencia).
 * Usado en Order y OrderCard.
 */
const StatusBadge = ({ color = 'green', label = 'Terminado' }) => {
  const colorVariants = {
    green: {
      bg: 'bg-green-200 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-300',
      border: 'border dark:border-2 border-green-500',
      dot: 'bg-green-500',
    },
    orange: {
      bg: 'bg-orange-200 dark:bg-orange-900',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border dark:border-2 border-orange-500',
      dot: 'bg-orange-500',
    },
    red: {
      bg: 'bg-red-200 dark:bg-red-900',
      text: 'text-red-800 dark:text-red-300',
      border: 'border dark:border-2 border-red-500',
      dot: 'bg-red-500',
    },
  };

  const { bg, text, border, dot } = colorVariants[color] || colorVariants.green;

  return (
    <span
      className={`inline-flex items-center ${bg} ${text} text-xs font-medium px-2.5 py-0.5 rounded-full ${border}`}
    >
      <span className={`w-2 h-2 me-1 ${dot} rounded-full`} aria-hidden />
      {label}
    </span>
  );
};

export default StatusBadge;
