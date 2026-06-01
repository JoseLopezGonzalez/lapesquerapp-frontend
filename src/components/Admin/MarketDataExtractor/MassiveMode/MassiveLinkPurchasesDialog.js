'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Link as LinkIcon, Loader2, Info } from 'lucide-react';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';
import { useLinkPurchases } from './useLinkPurchases';

export default function MassiveLinkPurchasesDialog({
  open,
  onOpenChange,
  documents,
  linkedSummaryGenerators,
}) {
  const {
    allLinkedSummary,
    selectedLinks,
    isValidating,
    isLinking,
    getValidationStatus,
    handleToggleLink,
    handleToggleAll,
    handleLinkPurchases,
  } = useLinkPurchases({
    open,
    documents,
    linkedSummaryGenerators,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="7xl" className="flex max-h-[90vh] flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {allLinkedSummary.length > 0
              ? 'Enlaces de compra/recepción'
              : 'Enlazar Compras - Modo Masivo'}
          </DialogTitle>
          <DialogDescription>
            {allLinkedSummary.length > 0 ? (
              <>
                {allLinkedSummary.length} Compras de {documents?.length || 0} documento(s)
                {allLinkedSummary.some((l) => l.isGrouped) && (
                  <span className="ml-1 text-blue-600">(algunas agrupadas)</span>
                )}
              </>
            ) : (
              'Seleccione las compras que desea enlazar. Puede filtrar por barco y fecha.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-4">
          {allLinkedSummary.length > 0 ? (
            <Card className="flex min-h-0 flex-1 flex-col">
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              allLinkedSummary.filter((l, idx) => {
                                if (l.error) return false;
                                const validation = getValidationStatus(l);
                                return validation?.valid && validation?.canUpdate;
                              }).length > 0 &&
                              selectedLinks.length ===
                                allLinkedSummary.filter((l, idx) => {
                                  if (l.error) return false;
                                  const validation = getValidationStatus(l);
                                  return validation?.valid && validation?.canUpdate;
                                }).length
                            }
                            onCheckedChange={handleToggleAll}
                            disabled={isValidating}
                          />
                        </TableHead>
                        <TableHead className="min-w-[250px]">Barco</TableHead>
                        <TableHead className="w-32">Fecha</TableHead>
                        <TableHead className="w-32 text-right">Peso Neto</TableHead>
                        <TableHead className="w-36 text-right">Importe</TableHead>
                        <TableHead className="w-40">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLinkedSummary.map((linea, index) => {
                        const validation = getValidationStatus(linea);
                        const isDisabled = linea.error || (validation && !validation.valid);
                        const canSelect =
                          !linea.error && validation?.valid && validation?.canUpdate;
                        const isGrouped = linea.isGrouped || false;

                        return (
                          <TableRow
                            key={index}
                            className={`hover:bg-muted/50 ${isGrouped ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedLinks.includes(index)}
                                disabled={isDisabled || isValidating}
                                onCheckedChange={() => handleToggleLink(index)}
                              />
                            </TableCell>
                            <TableCell className="min-w-[250px] font-medium">
                              {isGrouped ? (
                                <span className="flex flex-wrap items-center gap-1">
                                  <span className="font-semibold break-words text-blue-700">
                                    {linea.barcoNombre}
                                  </span>
                                  <span className="flex-shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs whitespace-nowrap text-blue-600">
                                    Agrupado
                                  </span>
                                </span>
                              ) : (
                                <span className="break-words">{linea.barcoNombre}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{linea.date}</TableCell>
                            <TableCell className="text-right">
                              {formatDecimalWeight(linea.declaredTotalNetWeight)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatDecimalCurrency(linea.declaredTotalAmount)}
                            </TableCell>
                            <TableCell>
                              {linea.error ? (
                                <div className="flex items-center gap-2 text-red-500">
                                  <X className="h-4 w-4" />
                                  <span className="text-xs">No enlazable</span>
                                </div>
                              ) : isValidating ? (
                                <div className="text-muted-foreground flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-xs">Validando...</span>
                                </div>
                              ) : validation ? (
                                validation.valid && validation.canUpdate ? (
                                  validation.hasChanges ? (
                                    <div className="flex items-center gap-2 text-green-500">
                                      <Check className="h-4 w-4" />
                                      <span className="text-xs">Listo para actualizar</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-blue-500">
                                      <Info className="h-4 w-4" />
                                      <span className="text-xs">Sin cambios</span>
                                    </div>
                                  )
                                ) : (
                                  <div className="flex items-start gap-2 text-red-500">
                                    <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-medium">
                                        No se puede enlazar
                                      </span>
                                      {validation.message && (
                                        <span
                                          className="cursor-help text-xs text-red-400"
                                          title={validation.tooltip || validation.message}
                                        >
                                          {validation.message}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              ) : (
                                <div className="text-muted-foreground flex items-center gap-2">
                                  <span className="text-xs">Pendiente</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <p>No hay compras disponibles para enlazar.</p>
            </div>
          )}
        </div>

        {allLinkedSummary.length > 0 && (
          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {selectedLinks.length} de{' '}
                {
                  allLinkedSummary.filter((l, idx) => {
                    if (l.error) return false;
                    const validation = getValidationStatus(l);
                    return validation?.valid && validation?.canUpdate;
                  }).length
                }{' '}
                seleccionadas
              </span>
              <Button
                variant="default"
                onClick={handleLinkPurchases}
                disabled={selectedLinks.length === 0 || isLinking || isValidating}
              >
                {isLinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enlazando...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Enlazar Compras ({selectedLinks.length})
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
