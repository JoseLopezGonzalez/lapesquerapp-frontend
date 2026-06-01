import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import OrderPalletCard from '../OrderPalletCard';
import OrderPalletTableRow from '../OrderPalletTableRow';

const EMPTY_STATE_TITLE = 'No existen palets vinculados';
const EMPTY_STATE_DESCRIPTION = 'No se han añadido palets a este pedido';

const OrderPalletsContent = ({
  pallets,
  isMobile,
  readOnly = false,
  onEdit,
  onClone,
  onUnlink,
  onDelete,
  onPrintLabel,
  isCloning,
  unlinkingPalletId,
}) => {
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
            onEdit={onEdit}
            onClone={onClone}
            onUnlink={onUnlink}
            onDelete={onDelete}
            onPrintLabel={onPrintLabel}
            isCloning={isCloning}
            isUnlinking={unlinkingPalletId === pallet.id}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead>Lotes</TableHead>
            <TableHead>Observaciones</TableHead>
            <TableHead className="text-right">Cajas</TableHead>
            <TableHead className="text-right">Peso Neto</TableHead>
            <TableHead className="text-right">Coste €/kg</TableHead>
            <TableHead className="text-right">Coste Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pallets.map((pallet) => (
            <OrderPalletTableRow
              key={pallet.id}
              pallet={pallet}
              readOnly={readOnly}
              onEdit={onEdit}
              onClone={onClone}
              onUnlink={onUnlink}
              onDelete={onDelete}
              isCloning={isCloning}
              unlinkingPalletId={unlinkingPalletId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderPalletsContent;
