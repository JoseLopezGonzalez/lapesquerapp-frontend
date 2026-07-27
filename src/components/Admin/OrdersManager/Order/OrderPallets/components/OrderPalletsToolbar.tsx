import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Unlink,
  Link2,
  Loader2,
  MoreVertical,
  PackagePlus,
  Printer,
  Trash2,
  Tag,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  onPrintSelectedLabels: () => void;
  onUnlinkSelected: () => void;
  onDeleteSelected: () => void;
  onCancelSelection: () => void;
  isUnlinkingSelected?: boolean;
  isDeletingSelected?: boolean;
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
  onPrintSelectedLabels,
  onUnlinkSelected,
  onDeleteSelected,
  onCancelSelection,
  isUnlinkingSelected = false,
  isDeletingSelected = false,
  readOnly = false,
}: OrderPalletsToolbarProps) => {
  const canUnlinkAll = !readOnly && pallets && pallets.length > 0;
  const isSelectionMode = selectedPalletCount > 0;
  const canPrintExpeditionSelected = canPrintExpeditionLabels && isSelectionMode;
  const canManageSelected = !readOnly && isSelectionMode;
  const isBulkActionBusy = isUnlinkingSelected || isDeletingSelected;

  if (isMobile) {
    if (readOnly && !canPrintExpeditionSelected) return null;

    if (isSelectionMode) {
      return (
        <div
          className={cn(
            'bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3',
            MOBILE_SAFE_AREAS.BOTTOM_INSET
          )}
        >
          <Button
            variant="outline"
            onClick={onCancelSelection}
            size="sm"
            className="min-h-[44px] flex-1"
            disabled={isBulkActionBusy}
          >
            <X />
            Cancelar ({selectedPalletCount})
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Acciones sobre palets seleccionados"
                disabled={isBulkActionBusy}
              >
                {isBulkActionBusy ? <Loader2 className="animate-spin" /> : <MoreVertical />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canPrintExpeditionSelected && (
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
              {canManageSelected && (
                <>
                  <DropdownMenuItem onClick={onPrintSelectedLabels}>
                    <Tag />
                    Imprimir etiqueta ({selectedPalletCount})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onUnlinkSelected} disabled={isBulkActionBusy}>
                    {isUnlinkingSelected ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Desvinculando...
                      </>
                    ) : (
                      <>
                        <Unlink />
                        Desvincular seleccionados
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDeleteSelected}
                    disabled={isBulkActionBusy}
                    className="text-destructive focus:text-destructive"
                  >
                    {isDeletingSelected ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 />
                        Eliminar seleccionados
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

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
        {canUnlinkAll && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Menú acciones palets">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        <CardTitle className="text-lg font-medium">
          {isSelectionMode
            ? `${selectedPalletCount} palet${selectedPalletCount === 1 ? '' : 's'} seleccionado${selectedPalletCount === 1 ? '' : 's'}`
            : 'Gestión de palets'}
        </CardTitle>
        <CardDescription>
          {isSelectionMode
            ? 'Elige una acción para aplicar a la selección'
            : 'Modifica los palets del pedido'}
        </CardDescription>
      </div>
      <div className="flex gap-2">
        {canPrintExpeditionSelected && (
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
        {canManageSelected && (
          <>
            <Button variant="outline" onClick={onPrintSelectedLabels} disabled={isBulkActionBusy}>
              <Tag />
              Imprimir etiqueta
            </Button>
            <Button variant="outline" onClick={onUnlinkSelected} disabled={isBulkActionBusy}>
              {isUnlinkingSelected ? (
                <>
                  <Loader2 className="animate-spin" />
                  Desvinculando...
                </>
              ) : (
                <>
                  <Unlink />
                  Desvincular seleccionados
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={onDeleteSelected} disabled={isBulkActionBusy}>
              {isDeletingSelected ? (
                <>
                  <Loader2 className="animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 />
                  Eliminar seleccionados
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={onCancelSelection} disabled={isBulkActionBusy}>
              <X />
              Cancelar
            </Button>
          </>
        )}
        {!isSelectionMode && !readOnly && (
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
