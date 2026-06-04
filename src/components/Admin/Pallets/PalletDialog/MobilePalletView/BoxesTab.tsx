'use client';

import { type ChangeEvent, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import type { PalletBox, PalletState } from '@/hooks/pallets/palletHelpers';

interface BoxesTabProps {
  temporalPallet: PalletState;
  onDeleteBox: (boxId: number | string) => void;
  onDuplicateBox: (boxId: number | string) => void;
  onEditLot: (boxId: number | string, lot: string) => void;
  onEditNetWeight: (boxId: number | string, netWeight: number) => void;
  onEditManualCost: (boxId: number | string, value: unknown) => void;
  isReadOnly: boolean;
  canEditCost: boolean;
}

export default function BoxesTab({
  temporalPallet,
  onDeleteBox,
  onDuplicateBox,
  onEditLot,
  onEditNetWeight,
  onEditManualCost,
  isReadOnly,
  canEditCost,
}: BoxesTabProps) {
  const [expandedBoxId, setExpandedBoxId] = useState<number | string | null>(null);

  const boxes: PalletBox[] = temporalPallet.boxes ?? [];
  const totalWeight = boxes.reduce((sum, box) => sum + parseFloat(String(box.netWeight ?? 0)), 0);

  const handleToggle = (boxId: number | string) => {
    setExpandedBoxId((prev) => (prev === boxId ? null : boxId));
  };

  if (boxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="rounded-full bg-muted p-4">
          <Package className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-1 text-center">
          <p className="font-medium">Sin cajas</p>
          <p className="text-sm text-muted-foreground">
            Ve a &ldquo;Añadir&rdquo; para añadir cajas al palet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary strip */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <span className="font-medium">{boxes.length} cajas</span>
        <span className="text-muted-foreground">{formatDecimalWeight(totalWeight)} kg total</span>
      </div>

      {/* Boxes list */}
      <ul className="overflow-hidden rounded-lg border divide-y">
        {boxes.map((box) => {
          const isExpanded = expandedBoxId === box.id;
          const isAvailable = box.isAvailable !== false;
          const canEdit = !isReadOnly && isAvailable;

          return (
            <li key={box.id} className="bg-background">
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
                      {formatDecimalWeight(box.netWeight)} kg
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

              {/* Expanded panel */}
              {isExpanded && (
                <div className="space-y-3 border-t bg-muted/30 px-3 pb-3 pt-2.5">
                  {canEdit ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Lote</label>
                          <Input
                            defaultValue={box.lot}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onEditLot(box.id, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Peso (kg)
                          </label>
                          <Input
                            type="number"
                            defaultValue={box.netWeight}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onEditNetWeight(box.id, parseFloat(e.target.value))}
                            className="h-8 text-right text-sm"
                          />
                        </div>
                      </div>

                      {canEditCost && (
                        <>
                          {(box.traceableCostPerKg as number | null | undefined) != null ? (
                            <p className="text-xs text-green-700">
                              Coste trazable:{' '}
                              {parseFloat(String(box.traceableCostPerKg)).toFixed(2)} €/kg
                            </p>
                          ) : (
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">
                                Coste manual (€/kg)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Opcional"
                                defaultValue={
                                  (box.manualCostPerKg as number | null | undefined) != null
                                    ? String(box.manualCostPerKg)
                                    : ''
                                }
                                onChange={(e: ChangeEvent<HTMLInputElement>) => onEditManualCost(box.id, e.target.value)}
                                className="h-8 text-right text-sm"
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
                          className="h-9 flex-1"
                          onClick={() => onDuplicateBox(box.id)}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Duplicar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                          onClick={() => onDeleteBox(box.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {box.lot && (
                        <p>
                          Lote: <span className="text-foreground">{box.lot}</span>
                        </p>
                      )}
                      <p>
                        Peso:{' '}
                        <span className="text-foreground">
                          {formatDecimalWeight(box.netWeight)} kg
                        </span>
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
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
