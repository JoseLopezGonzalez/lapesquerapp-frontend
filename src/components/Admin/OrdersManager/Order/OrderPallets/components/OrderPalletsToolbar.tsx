import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Unlink, Link2, Loader2, MoreVertical, PackagePlus, Printer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MOBILE_SAFE_AREAS } from '@/lib/design-tokens-mobile';

interface OrderPalletsToolbarProps {
  isMobile: boolean;
  pallets?: unknown[];
  isUnlinkingAll?: boolean;
  onCreate: () => void;
  onLink: () => void;
  onCreateFromForecast: () => void;
  onUnlinkAll: () => void;
  selectedPalletCount?: number;
  isPrintingExpeditionLabels?: boolean;
  canPrintExpeditionLabels?: boolean;
  onPrintSelectedExpeditionLabels: () => void;
  readOnly?: boolean;
}

const OrderPalletsToolbar = ({
  isMobile,
  pallets,
  isUnlinkingAll,
  onCreate,
  onLink,
  onCreateFromForecast,
  onUnlinkAll,
  selectedPalletCount = 0,
  isPrintingExpeditionLabels = false,
  canPrintExpeditionLabels = true,
  onPrintSelectedExpeditionLabels,
  readOnly = false,
}: OrderPalletsToolbarProps) => {
  const canUnlinkAll = !readOnly && pallets && pallets.length > 0;
  const canPrintSelected = canPrintExpeditionLabels && selectedPalletCount > 0;

  if (isMobile) {
    if (readOnly && !canPrintSelected) return null;
    return (
      <div
        className={cn(
          'bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3',
          MOBILE_SAFE_AREAS.BOTTOM_INSET
        )}
      >
        {!readOnly && (
          <>
            <Button variant="outline" onClick={onLink} size="sm" className="min-h-[44px] flex-1">
              <Link2 />
              Vincular
            </Button>
            <Button
              variant="outline"
              onClick={onCreateFromForecast}
              size="sm"
              className="min-h-[44px] flex-1"
            >
              <PackagePlus />
              Desde previsión
            </Button>
            <Button onClick={onCreate} size="sm" className="min-h-[44px] flex-1">
              <Plus />
              Crear
            </Button>
          </>
        )}
        {(canUnlinkAll || canPrintSelected) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menú acciones palets">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canPrintSelected && (
                <DropdownMenuItem
                  onClick={onPrintSelectedExpeditionLabels}
                  disabled={isPrintingExpeditionLabels}
                >
                  {isPrintingExpeditionLabels ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Printer />
                      Etiquetas expedición ({selectedPalletCount})
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onUnlinkAll} disabled={isUnlinkingAll}>
                {isUnlinkingAll ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Desvinculando...
                  </>
                ) : (
                  <>
                    <Unlink />
                    Desvincular todos
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle className="text-lg font-medium">Gestión de palets</CardTitle>
        <CardDescription>Modifica los palets del pedido</CardDescription>
      </div>
      <div className="flex gap-2">
        {canPrintSelected && (
          <Button
            variant="outline"
            onClick={onPrintSelectedExpeditionLabels}
            disabled={isPrintingExpeditionLabels}
          >
            {isPrintingExpeditionLabels ? (
              <>
                <Loader2 className="animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Printer />
                Etiquetas expedición ({selectedPalletCount})
              </>
            )}
          </Button>
        )}
        {!readOnly && (
          <>
            {canUnlinkAll && (
              <Button variant="outline" onClick={onUnlinkAll} disabled={isUnlinkingAll}>
                {isUnlinkingAll ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Desvinculando...
                  </>
                ) : (
                  <>
                    <Unlink />
                    Desvincular todos
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={onLink}>
              <Link2 />
              Vincular palets existentes
            </Button>
            <Button variant="outline" onClick={onCreateFromForecast}>
              <PackagePlus />
              Crear desde previsión
            </Button>
            <Button onClick={onCreate}>
              <Plus />
              Crear palet
            </Button>
          </>
        )}
      </div>
    </CardHeader>
  );
};

export default OrderPalletsToolbar;
