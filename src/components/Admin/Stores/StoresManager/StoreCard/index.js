import { Card } from "@/components/ui/card";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { ThermometerSnowflake } from "lucide-react";
import { TbTruckLoading } from "react-icons/tb";


const StoreCard = ({ store, isSelected, onClick, block }) => {


  const fillPercentage = (store.totalNetWeight / store.capacity) * 100;


  return (
    <Card
      key={store.id}

      className={
        `border-0 border-l-4  min-w-56  text-sm font-medium leading-5  
          ${store.id === isSelected && fillPercentage <= 50
          ? 'bg-green-700'
          : store.id === isSelected && fillPercentage <= 80
            ? 'bg-yellow-700'
            : store.id === isSelected && fillPercentage > 80
              ? 'bg-red-700'
              : ' bg-neutral-800 hover:bg-neutral-700 '
        }
        ${fillPercentage <= 50
          ? 'border-green-500'
          : fillPercentage <= 80
            ? 'border-yellow-500'
            : fillPercentage > 80
              ? 'border-red-600'
              : 'border-neutral-200'
        }
        ${block ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div onClick={onClick} className='flex p-4 h-full w-full'>
        <span className="flex flex-1 text-start w-full">
          <span className="flex flex-col w-full">
            <span className="block text-md font-medium text-white">
              {store.name}
            </span>
            <span className="mt-1 flex items-center font-light  text-xs  ">
              <ThermometerSnowflake className='mr-1 h-4 w-4 text-white/75' aria-hidden="true" />Temp: {store.temperature} ºC
            </span>
            <span className="mt-2 text-xs font-light  inline-flex">
              <TbTruckLoading className='mr-1 h-4 w-4 text-white/75' /> Max: {formatDecimalWeight(store.capacity)}
            </span>
            <span className="mt-2 flex items-center text-sm text-neutral-500 pr-2">
              <div className="w-full bg-neutral-900 rounded-full h-2.5 ">
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
            <span className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-200 inline-flex">
              Total: {formatDecimalWeight(store.totalNetWeight)}
            </span>
          </span>
        </span>
      </div>
    </Card>
  )
}

export default StoreCard