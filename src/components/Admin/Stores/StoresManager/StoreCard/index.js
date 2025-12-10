import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { ThermometerSnowflake } from "lucide-react";
import { TbTruckLoading } from "react-icons/tb";
import { REGISTERED_PALLETS_STORE_ID } from "@/hooks/useStores";
import { Package, Sparkles } from "lucide-react";


const StoreCard = ({ store, isSelected, onClick, disabled }) => {
  const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;

  // Calcular porcentaje de llenado, manejando casos donde capacity puede ser null o 0
  const capacity = store.capacity || store.totalNetWeight || 1;
  const fillPercentage = capacity > 0 ? (store.totalNetWeight / capacity) * 100 : 0;

  const handleOnClick = () => {
    if (disabled) return;
    onClick(store.id);
  }

  // Versión para el almacén fantasma - mismo diseño que los otros cards
  if (isGhostStore) {
    return (
      <Card
        key={store.id}
        className={
          `border-0 border-l-4 min-w-56  text-sm font-medium leading-5  
          ${store.id === isSelected
            ? 'bg-slate-100 dark:bg-slate-800'
            : ' bg-foreground-100 hover:bg-foreground-200 '
          }
          border-slate-400 dark:border-slate-600
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div onClick={handleOnClick} className='flex p-4 h-full w-full'>
          <span className="flex flex-1 text-start w-full">
            <span className="flex flex-col w-full">
              <span className="block text-md font-medium ">
                {store.name}
              </span>
              {/* Descripción en lugar de temperatura */}
              <span className="mt-1 flex items-center font-light  text-xs  ">
                <Package className='mr-1 h-4 w-4' aria-hidden="true" />
                Palets sin almacén asignado
              </span>
              {/* Información adicional en lugar de capacidad máxima */}
              <span className="mt-2 text-xs font-light  inline-flex">
                <Sparkles className='mr-1 h-4 w-4' /> 
                {store?.content?.pallets?.length || 0} palets en espera
              </span>
              {/* Barra de progreso: completa y parpadeando si hay palets, vacía si no hay */}
              <span className="mt-2 flex items-center text-sm pr-2">
                <div className="w-full bg-foreground-300 rounded-full h-2.5 ">
                  <div
                    className={`h-2.5 rounded-full ${
                      (store?.content?.pallets?.length || 0) > 0
                        ? 'bg-slate-400 dark:bg-slate-500 animate-pulse'
                        : 'bg-transparent'
                    }`}
                    style={{ 
                      width: (store?.content?.pallets?.length || 0) > 0 ? '100%' : '0%' 
                    }}
                  >
                  </div>
                </div>
              </span>
              <span className="mt-2 text-sm font-medium  inline-flex">
                Total: {formatDecimalWeight(store.totalNetWeight || 0)}
              </span>
            </span>
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      key={store.id}

      className={
        `border-0 border-l-4 min-w-56  text-sm font-medium leading-5  
          ${store.id === isSelected && fillPercentage <= 50
          ? 'bg-green-700 text-white'
          : store.id === isSelected && fillPercentage <= 80
            ? 'bg-yellow-700'
            : store.id === isSelected && fillPercentage > 80
              ? 'bg-red-700'
              : ' bg-foreground-100 hover:bg-foreground-200 '
        }
        ${fillPercentage <= 50
          ? 'border-green-500'
          : fillPercentage <= 80
            ? 'border-yellow-500'
            : fillPercentage > 80
              ? 'border-red-600'
              : 'border-neutral-200'
        }
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div onClick={handleOnClick} className='flex p-4 h-full w-full'>
        <span className="flex flex-1 text-start w-full">
          <span className="flex flex-col w-full">
            <span className="block text-md font-medium ">
              {store.name}
            </span>
            {store.temperature !== null && store.temperature !== undefined && (
              <span className="mt-1 flex items-center font-light  text-xs  ">
                <ThermometerSnowflake className='mr-1 h-4 w-4' aria-hidden="true" />Temp: {store.temperature} ºC
              </span>
            )}
            {store.capacity !== null && store.capacity !== undefined && (
              <span className="mt-2 text-xs font-light  inline-flex">
                <TbTruckLoading className='mr-1 h-4 w-4' /> Max: {formatDecimalWeight(store.capacity)}
              </span>
            )}
            <span className="mt-2 flex items-center text-sm pr-2">
              <div className="w-full bg-foreground-300 rounded-full h-2.5 ">
                <div
                  className={
                    `bg-green-600 h-2.5 rounded-full
                    ${fillPercentage <= 50
                      ? 'bg-green-500'
                      : fillPercentage <= 80
                        ? 'bg-yellow-500'
                        : 'bg-red-600 animate-pulse'
                    }
                  `}
                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                >
                </div>
              </div>
            </span>
            <span className="mt-2 text-sm font-medium  inline-flex">
              Total: {formatDecimalWeight(store.totalNetWeight || 0)}
            </span>
          </span>
        </span>
      </div>
    </Card>
  )
}

export default StoreCard