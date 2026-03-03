import { Card } from "@/components/ui/card";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { ThermometerSnowflake, Package, Sparkles } from "lucide-react";
import { TbTruckLoading } from "react-icons/tb";
import { REGISTERED_PALLETS_STORE_ID } from "@/hooks/useStores";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";


const StoreCard = ({ store, isSelected, onClick, disabled }) => {
  const isMobile = useIsMobile();
  const isGhostStore = store?.id === REGISTERED_PALLETS_STORE_ID;

  // Calcular porcentaje de llenado, manejando casos donde capacity puede ser null o 0
  const capacity = store.capacity || store.totalNetWeight || 1;
  const fillPercentage = capacity > 0 ? (store.totalNetWeight / capacity) * 100 : 0;

  const occupancyStatus =
    fillPercentage <= 50 ? "low" : fillPercentage <= 80 ? "medium" : "high";

  const borderLClass =
    occupancyStatus === "low"
      ? "border-l-green-500"
      : occupancyStatus === "medium"
        ? "border-l-yellow-500"
        : "border-l-red-600";

  const selectedClass =
    isSelected &&
    (occupancyStatus === "low"
      ? "bg-green-500/10 border-green-500/60"
      : occupancyStatus === "medium"
        ? "bg-yellow-500/10 border-yellow-500/60"
        : "bg-red-500/10 border-red-500/60");

  const handleOnClick = () => {
    if (disabled) return;
    onClick(store.id);
  }

  // Versión para el almacén fantasma - mismo diseño que los otros cards
  if (isGhostStore) {
    return (
      <Card
        key={store.id}
        className={cn(
          "relative flex border-l-4 min-h-[104px] text-sm font-medium leading-5 transition-colors duration-150",
          "p-4 sm:p-5",
          "border-slate-400 dark:border-slate-600",
          store.id === isSelected && "bg-slate-500/10 border-slate-500/70",
          disabled && "cursor-not-allowed pointer-events-none",
          !disabled && [
            "cursor-pointer",
            isMobile &&
            "hover:bg-accent/50 hover:border-accent active:bg-accent/70 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          ]
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={store.name}
        onClick={handleOnClick}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleOnClick();
          }
        }}
      >
        <div className="flex h-full w-full">
          <div className="flex flex-1 flex-col text-start w-full gap-1.5">
            <p className="text-base sm:text-lg font-semibold truncate">
              {store.name}
            </p>
            <p className="mt-0.5 flex items-center font-light text-xs text-muted-foreground">
              <Package className="mr-1 h-4 w-4" aria-hidden="true" />
              Palets sin almacén asignado
            </p>
            <p className="mt-1 text-xs font-light inline-flex items-center text-muted-foreground">
              <Sparkles className="mr-1 h-4 w-4" aria-hidden="true" />
              {(store?.content?.pallets?.length || 0)} palets en espera
            </p>
            <div className="mt-2 flex items-center text-sm pr-1">
              <div className="w-full bg-foreground-300 rounded-full h-2.5 overflow-hidden">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-200",
                    (store?.content?.pallets?.length || 0) > 0
                      ? "bg-slate-500/80 dark:bg-slate-400/90 animate-pulse"
                      : "bg-transparent"
                  )}
                  style={{
                    width:
                      (store?.content?.pallets?.length || 0) > 0 ? "100%" : "0%",
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-sm font-semibold">
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
        "relative flex border-l-4 min-h-[104px] text-sm font-medium leading-5 transition-colors duration-150",
        "p-4 sm:p-5",
        "bg-card",
        borderLClass,
        selectedClass,
        disabled && "cursor-not-allowed pointer-events-none",
        !disabled && [
          "cursor-pointer",
          isMobile &&
          "hover:bg-accent/50 hover:border-accent active:bg-accent/70 active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ]
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={store.name}
      onClick={handleOnClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleOnClick();
        }
      }}
    >
      <div className="flex h-full w-full">
        <div className="flex flex-1 flex-col text-start w-full gap-1.5">
          <p className="text-base sm:text-lg font-semibold truncate">
            {store.name}
          </p>

          {store.temperature !== null && store.temperature !== undefined && (
            <p className="mt-0.5 flex items-center font-light text-xs text-muted-foreground">
              <ThermometerSnowflake
                className="mr-1 h-4 w-4"
                aria-hidden="true"
              />
              Temp: {store.temperature} ºC
            </p>
          )}

          {store.capacity !== null && store.capacity !== undefined && (
            <p className="mt-1 text-xs font-light inline-flex items-center text-muted-foreground">
              <TbTruckLoading className="mr-1 h-4 w-4" aria-hidden="true" />
              Max: {formatDecimalWeight(store.capacity)}
            </p>
          )}

          <div className="mt-2 flex items-center text-sm pr-1">
            <div className="w-full bg-foreground-300 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  "h-2.5 rounded-full transition-all duration-200",
                  occupancyStatus === "low" && "bg-green-500",
                  occupancyStatus === "medium" && "bg-yellow-500",
                  occupancyStatus === "high" && "bg-red-600 animate-pulse"
                )}
                style={{ width: `${Math.min(fillPercentage, 100)}%` }}
              />
            </div>
          </div>

          <p className="mt-2 text-sm font-semibold">
            Total: {formatDecimalWeight(store.totalNetWeight || 0)}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default StoreCard