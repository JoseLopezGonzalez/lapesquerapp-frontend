import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import OrderPalletCard from '../OrderPalletCard';
import OrderPalletTableRow from '../OrderPalletTableRow';

const EMPTY_STATE_TITLE = 'No existen palets vinculados';
const EMPTY_STATE_DESCRIPTION = 'No se han añadido palets a este pedido';

interface OrderPalletsContentPallet {
  id: number | string;
  boxes?: Array<{
    isAvailable?: boolean;
    netWeight?: number | string;
    product?: { id: number | string; name?: string } | null;
    [key: string]: unknown;
  }>;
  productsNames?: string[];
  lots?: string[];
  observations?: string | null;
  costPerKg?: number | null;
  totalCost?: number | null;
  receptionId?: number | string | null;
  numberOfBoxes?: number;
  netWeight?: number;
  [key: string]: unknown;
}

interface OrderPalletsContentProps {
  pallets: OrderPalletsContentPallet[];
  isMobile: boolean;
  readOnly?: boolean;
  canViewCostData?: boolean;
  onEdit: (palletId: number | string) => void;
  onClone: (palletId: number | string) => void;
  onUnlink: (palletId: number | string) => void;
  onDelete: (palletId: number | string) => void;
  onPrintLabel?: (palletId: number | string) => void;
  onPrintExpeditionLabel?: (palletId: number | string) => void;
  canPrintExpeditionLabels?: boolean;
  selectedPalletIds?: (number | string)[];
  onToggleSelection?: (palletId: number | string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  isCloning?: boolean;
  unlinkingPalletId?: number | string | null;
  /** Solo se muestra la columna/dato de contenedor cuando el pedido es `maritime_export` */
  showContainerColumn?: boolean;
  containerNumberByPalletId?: Map<string, string>;
}

const OrderPalletsContent = ({
  pallets,
  isMobile,
  readOnly = false,
  canViewCostData = true,
  onEdit,
  onClone,
  onUnlink,
  onDelete,
  onPrintLabel,
  onPrintExpeditionLabel,
  canPrintExpeditionLabels = true,
  selectedPalletIds = [],
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  isCloning,
  unlinkingPalletId,
  showContainerColumn = false,
  containerNumberByPalletId,
}: OrderPalletsContentProps) => {
  if (pallets.length === 0) {
    return (
      <div
        className={
          isMobile
            ? 'flex min-h-0 flex-1 items-center justify-center'
            : 'flex h-full items-center justify-center'
        }
      >
        <EmptyState title={EMPTY_STATE_TITLE} description={EMPTY_STATE_DESCRIPTION} />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {pallets.map((pallet) => (
          <OrderPalletCard
            key={pallet.id}
            pallet={pallet}
            readOnly={readOnly}
            canViewCostData={canViewCostData}
            onEdit={onEdit}
            onClone={onClone}
            onUnlink={onUnlink}
            onDelete={onDelete}
            onPrintLabel={onPrintLabel}
            onPrintExpeditionLabel={onPrintExpeditionLabel}
            canPrintExpeditionLabels={canPrintExpeditionLabels}
            selected={selectedPalletIds.includes(pallet.id)}
            onToggleSelection={onToggleSelection}
            isCloning={isCloning}
            isUnlinking={unlinkingPalletId === pallet.id}
            containerLabel={
              showContainerColumn
                ? (containerNumberByPalletId?.get(String(pallet.id)) ?? null)
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  const selectedCount = selectedPalletIds.length;
  const allSelected = pallets.length > 0 && selectedCount === pallets.length;
  const partiallySelected = selectedCount > 0 && !allSelected;

  return (
    <div className="max-h-[500px] overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {canPrintExpeditionLabels && (
              <TableHead className="w-[48px]">
                <Checkbox
                  checked={allSelected ? true : partiallySelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => {
                    if (checked) onSelectAll?.();
                    else onDeselectAll?.();
                  }}
                  aria-label="Seleccionar todos los palets"
                />
              </TableHead>
            )}
            <TableHead>ID</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Lotes</TableHead>
            <TableHead>Observaciones</TableHead>
            {showContainerColumn && <TableHead>Contenedor</TableHead>}
            <TableHead className="text-right">Cajas</TableHead>
            <TableHead className="text-right">Peso Neto</TableHead>
            {canViewCostData && (
              <>
                <TableHead className="text-right">Coste €/kg</TableHead>
                <TableHead className="text-right">Coste Total</TableHead>
              </>
            )}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pallets.map((pallet) => (
            <OrderPalletTableRow
              key={pallet.id}
              pallet={pallet}
              readOnly={readOnly}
              canViewCostData={canViewCostData}
              onEdit={onEdit}
              onClone={onClone}
              onUnlink={onUnlink}
              onDelete={onDelete}
              onPrintExpeditionLabel={onPrintExpeditionLabel}
              canPrintExpeditionLabels={canPrintExpeditionLabels}
              selected={selectedPalletIds.includes(pallet.id)}
              onToggleSelection={onToggleSelection}
              isCloning={isCloning}
              unlinkingPalletId={unlinkingPalletId}
              showContainerColumn={showContainerColumn}
              containerLabel={
                showContainerColumn
                  ? (containerNumberByPalletId?.get(String(pallet.id)) ?? null)
                  : undefined
              }
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderPalletsContent;
