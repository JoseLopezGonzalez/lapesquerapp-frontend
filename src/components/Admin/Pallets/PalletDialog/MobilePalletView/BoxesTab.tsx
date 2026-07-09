'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Package, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { parseDecimalInput, type PalletBox, type PalletState } from '@/hooks/pallets/palletHelpers';
import { MobilePalletScreenHeader } from './MobilePalletScreenHeader';

interface BoxesTabProps {
  temporalPallet: PalletState;
  onDeleteBox: (boxId: number | string) => void;
  onDuplicateBox: (boxId: number | string) => void;
  onEditLot: (boxId: number | string, lot: string) => void;
  onEditNetWeight: (boxId: number | string, netWeight: number) => void;
  onEditManualCost: (boxId: number | string, value: unknown) => void;
  isReadOnly: boolean;
  canEditCost: boolean;
  onBack?: () => void;
  onNavigateToAdd?: () => void;
}

// ─── Controlled expanded panel ────────────────────────────────────────────────

interface BoxExpandedPanelProps {
  box: PalletBox;
  canEdit: boolean;
  canEditCost: boolean;
  onEditLot: (lot: string) => void;
  onEditNetWeight: (w: number) => void;
  onEditManualCost: (v: unknown) => void;
  onDuplicateBox: () => void;
  onRequestDelete: () => void;
}

function BoxExpandedPanel({
  box,
  canEdit,
  canEditCost,
  onEditLot,
  onEditNetWeight,
  onEditManualCost,
  onDuplicateBox,
  onRequestDelete,
}: BoxExpandedPanelProps) {
  const [localLot, setLocalLot] = useState(String(box.lot ?? ''));
  const [localWeight, setLocalWeight] = useState(String(box.netWeight ?? ''));
  const [localCost, setLocalCost] = useState(
    (box.manualCostPerKg as number | null | undefined) != null
      ? String(box.manualCostPerKg)
      : ''
  );
  const isAvailable = box.isAvailable !== false;

  if (!canEdit) {
    return (
      <div className="space-y-1 text-xs text-muted-foreground">
        {box.lot && (
          <p>
            Lote: <span className="text-foreground">{box.lot}</span>
          </p>
        )}
        <p>
          Peso: <span className="text-foreground">{formatDecimalWeight(box.netWeight)}</span>
        </p>
        {box.gs1128 && (
          <p className="break-all font-mono text-[10px]">{String(box.gs1128)}</p>
        )}
        {!isAvailable && (
          <p className="flex items-center gap-1 text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            En uso en producción
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Lote</label>
          <Input
            value={localLot}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setLocalLot(e.target.value);
              onEditLot(e.target.value);
            }}
            className="h-10 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Peso (kg)</label>
          <Input
            type="text"
            inputMode="decimal"
            value={localWeight}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setLocalWeight(e.target.value);
              onEditNetWeight(parseDecimalInput(e.target.value));
            }}
            className="h-10 text-right text-sm"
          />
        </div>
      </div>

      {canEditCost && (
        <>
          {(box.traceableCostPerKg as number | null | undefined) != null ? (
            <p className="text-xs text-green-700">
              Coste trazable: {parseFloat(String(box.traceableCostPerKg)).toFixed(2)} €/kg
            </p>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Coste manual (€/kg)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Opcional"
                value={localCost}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setLocalCost(e.target.value);
                  onEditManualCost(e.target.value);
                }}
                className="h-10 text-right text-sm"
              />
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 flex-1"
          onClick={onDuplicateBox}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Duplicar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={onRequestDelete}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Eliminar
        </Button>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BoxesTab({
  temporalPallet,
  onDeleteBox,
  onDuplicateBox,
  onEditLot,
  onEditNetWeight,
  onEditManualCost,
  isReadOnly,
  canEditCost,
  onBack,
  onNavigateToAdd,
}: BoxesTabProps) {
  const [expandedBoxId, setExpandedBoxId] = useState<number | string | null>(null);
  const [confirmDeleteBoxId, setConfirmDeleteBoxId] = useState<number | string | null>(null);
  const expandedRef = useRef<HTMLLIElement | null>(null);

  const boxes: PalletBox[] = temporalPallet.boxes ?? [];
  const totalWeight = boxes.reduce((sum, box) => sum + parseFloat(String(box.netWeight ?? 0)), 0);

  const handleToggle = (boxId: number | string) => {
    const isOpening = expandedBoxId !== boxId;
    setExpandedBoxId(isOpening ? boxId : null);
    if (isOpening) {
      // Scroll the row into view after the panel animates open
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  };

  if (boxes.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {onBack && <MobilePalletScreenHeader title="Cajas del palet" onBack={onBack} />}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
          <div className="rounded-full bg-muted p-4">
            <Package className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-medium">Sin cajas</p>
            <p className="text-sm text-muted-foreground">
              Añade cajas usando Escanear o Añadir manual.
            </p>
          </div>
          {!isReadOnly && onNavigateToAdd && (
            <Button variant="outline" size="sm" onClick={onNavigateToAdd}>
              <span>Añadir caja</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {onBack && <MobilePalletScreenHeader title="Cajas del palet" onBack={onBack} />}

      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {/* Summary strip */}
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="font-medium">{boxes.length} cajas</span>
          <span className="text-muted-foreground">{formatDecimalWeight(totalWeight)} total</span>
        </div>

        {/* Boxes list */}
        <ul className="divide-y overflow-hidden rounded-lg border">
          {boxes.map((box) => {
            const isExpanded = expandedBoxId === box.id;
            const isAvailable = box.isAvailable !== false;
            const canEdit = !isReadOnly && isAvailable;

            return (
              <li
                key={box.id}
                className="bg-background"
                ref={isExpanded ? expandedRef : null}
              >
                {/* Main row */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  onClick={() => handleToggle(box.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {(box.product as { name?: string } | null)?.name ?? '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {box.lot ? `Lote: ${box.lot} · ` : ''}
                      <span className="font-medium text-foreground">
                        {formatDecimalWeight(box.netWeight)}
                      </span>
                      {!isAvailable && (
                        <Badge variant="secondary" className="ml-1.5 py-0 text-[10px]">
                          En prod.
                        </Badge>
                      )}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {/* Expanded panel — key resets local state when switching boxes */}
                {isExpanded && (
                  <div
                    key={String(box.id)}
                    className="space-y-3 border-t bg-muted/30 px-3 pb-3 pt-2.5"
                  >
                    <BoxExpandedPanel
                      box={box}
                      canEdit={canEdit}
                      canEditCost={canEditCost}
                      onEditLot={(lot) => onEditLot(box.id, lot)}
                      onEditNetWeight={(w) => onEditNetWeight(box.id, w)}
                      onEditManualCost={(v) => onEditManualCost(box.id, v)}
                      onDuplicateBox={() => onDuplicateBox(box.id)}
                      onRequestDelete={() => setConfirmDeleteBoxId(box.id)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Confirmation dialog for single-box delete */}
      <AlertDialog
        open={confirmDeleteBoxId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteBoxId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta caja?</AlertDialogTitle>
            <AlertDialogDescription>
              La caja se eliminará del palet. Esta acción no se puede deshacer una vez guardado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteBoxId !== null) {
                  onDeleteBox(confirmDeleteBoxId);
                  setExpandedBoxId(null);
                }
                setConfirmDeleteBoxId(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
