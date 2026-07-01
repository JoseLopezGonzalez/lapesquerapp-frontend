import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { ThermometerSnowflake, Package, Sparkles } from 'lucide-react';
import { TbTruckLoading } from 'react-icons/tb';
import { REGISTERED_PALLETS_STORE_ID } from '@/hooks/useStores';
import { cn } from '@/lib/utils';
import { useIsMobileSafe } from '@/hooks/use-mobile';

const StoreCard = ({ store, isSelected, onClick, disabled }) => {
  const { isMobile, mounted } = useIsMobileSafe();
  if (!mounted) return null;
  const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;

  // Calcular porcentaje de llenado, manejando casos donde capacity puede ser null o 0
  const capacity = store.capacity || store.totalNetWeight || 1;
  const fillPercentage = capacity > 0 ? (store.totalNetWeight / capacity) * 100 : 0;

  const occupancyStatus = fillPercentage <= 50 ? 'low' : fillPercentage <= 80 ? 'medium' : 'high';

  const borderLClass =
    occupancyStatus === 'low'
      ? 'border-l-green-500'
      : occupancyStatus === 'medium'
        ? 'border-l-yellow-500'
        : 'border-l-red-600';

  const isThisSelected = store.id === isSelected;
  const selectedClass =
    isThisSelected &&
    (occupancyStatus === 'low'
      ? 'bg-green-500/10 border-green-500/60'
      : occupancyStatus === 'medium'
        ? 'bg-yellow-500/10 border-yellow-500/60'
        : 'bg-red-500/10 border-red-500/60');

  const handleOnClick = () => {
    if (disabled) return;
    onClick(store.id);
  };

  // Versión para el almacén fantasma - mismo diseño que los otros cards
  if (isGhostStore) {
    return (
      <Card
        key={store.id}
        className={cn(
          'relative flex min-h-0 flex-col overflow-hidden border-l-4 text-sm leading-5 font-medium transition-colors duration-150',
          'min-w-56 shrink-0',
          'p-3',
          'border-slate-400 dark:border-slate-600',
          store.id === isSelected && 'border-slate-500/70 bg-slate-500/10',
          disabled && 'pointer-events-none cursor-not-allowed',
          !disabled && [
            'cursor-pointer',
            isMobile &&
              'hover:bg-accent/50 hover:border-accent active:bg-accent/70 active:scale-[0.99]',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          ]
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={store.name}
        onClick={handleOnClick}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleOnClick();
          }
        }}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-hidden text-start">
            <p className="shrink-0 truncate text-sm font-semibold">{store.name}</p>
            <p className="text-muted-foreground mt-0.5 flex shrink-0 items-center text-xs font-light">
              <Package className="mr-1 h-4 w-4" aria-hidden="true" />
              Palets sin almacén asignado
            </p>
            <p className="text-muted-foreground mt-0.5 inline-flex items-center text-xs font-light">
              <Sparkles className="mr-1 h-4 w-4" aria-hidden="true" />
              {store?.content?.pallets?.length || 0} palets en espera
            </p>
            <div className="mt-1.5 flex items-center pr-1 text-sm">
              <Progress
                value={(store?.content?.pallets?.length || 0) > 0 ? 100 : 0}
                className={cn(
                  'h-2',
                  (store?.content?.pallets?.length || 0) > 0 &&
                    '[&_[data-slot=progress-indicator]]:animate-pulse [&_[data-slot=progress-indicator]]:bg-slate-500/80 [&_[data-slot=progress-indicator]]:dark:bg-slate-400/90'
                )}
              />
            </div>
            <p className="mt-auto shrink-0 text-xs font-semibold">
              Total: {formatDecimalWeight(store.totalNetWeight || 0)}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      key={store.id}
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden border-l-4 text-sm leading-5 font-medium transition-colors duration-150',
        'min-w-56 shrink-0',
        'p-3',
        'bg-card',
        borderLClass,
        selectedClass,
        disabled && 'pointer-events-none cursor-not-allowed',
        !disabled && [
          'cursor-pointer',
          isMobile &&
            'hover:bg-accent/50 hover:border-accent active:bg-accent/70 active:scale-[0.99]',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        ]
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={store.name}
      onClick={handleOnClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleOnClick();
        }
      }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-hidden text-start">
          <p className="shrink-0 truncate text-sm font-semibold">{store.name}</p>

          {store.temperature !== null && store.temperature !== undefined && (
            <p className="text-muted-foreground mt-0.5 flex items-center text-xs font-light">
              <ThermometerSnowflake className="mr-1 h-4 w-4" aria-hidden="true" />
              Temp: {store.temperature} ºC
            </p>
          )}

          {store.capacity !== null && store.capacity !== undefined && (
            <p className="text-muted-foreground mt-0.5 inline-flex items-center text-xs font-light">
              <TbTruckLoading className="mr-1 h-4 w-4" aria-hidden="true" />
              Max: {formatDecimalWeight(store.capacity)}
            </p>
          )}

          <div className="mt-1.5 flex items-center pr-1 text-sm">
            <Progress
              value={Math.min(fillPercentage, 100)}
              className={cn(
                'h-2',
                occupancyStatus === 'low' && '[&_[data-slot=progress-indicator]]:bg-green-500',
                occupancyStatus === 'medium' && '[&_[data-slot=progress-indicator]]:bg-yellow-500',
                occupancyStatus === 'high' &&
                  '[&_[data-slot=progress-indicator]]:animate-pulse [&_[data-slot=progress-indicator]]:bg-red-600'
              )}
            />
          </div>

          <p className="mt-auto shrink-0 text-xs font-semibold">
            Total: {formatDecimalWeight(store.totalNetWeight || 0)}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default StoreCard;
