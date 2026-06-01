'use client';

import React from 'react';
import { formatWeight } from '@/helpers/production/formatters';
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  Package,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Calculator,
  CheckCircle,
  Box,
  Scan,
  Scale,
  Hand,
  Target,
  Edit,
  Layers,
  Weight,
  Info,
  Tag,
  Unlink,
  ChevronRight as ChevronRightIcon,
  Warehouse,
  Eye,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProductionInputsManager } from '@/hooks/production/useProductionInputsManager';
import ProductionInputsAddDialog from './ProductionInputsAddDialog';
import { cn } from '@/lib/utils';
import { formatCostPerKg, formatTotalCost } from '@/helpers/production/costFormatters';

const ProductionInputsManager = ({
  productionRecordId,
  initialInputs: initialInputsProp = [],
  inputCostsSummary = null,
  onRefresh,
  hideTitle = false,
  renderInCard = false,
  cardTitle,
  cardDescription,
}) => {
  const api = useProductionInputsManager({ productionRecordId, initialInputsProp, onRefresh });
  const {
    inputs,
    loading,
    error,
    addDialogOpen,
    setAddDialogOpen,
    loadExistingDataForEdit,
    resetAddDialog,
    handleDeleteAllInputs,
    deleteInputConfirm,
    setDeleteInputConfirm,
    confirmDeleteInput,
    calculateSummaryByPallet,
    calculateProductsBreakdown,
    lotsDialogOpen,
    setLotsDialogOpen,
    selectedProductLots,
    setSelectedProductLots,
    palletsDialogOpen,
    setPalletsDialogOpen,
  } = api;

  if (loading) {
    return (
      <div className="flex items-center justify-center space-y-4 py-12">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dialog = (
    <Dialog
      open={addDialogOpen}
      onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (open) {
          loadExistingDataForEdit();
        } else {
          resetAddDialog();
        }
      }}
    >
      <ProductionInputsAddDialog api={api} />
    </Dialog>
  );

  // Botón para el header (sin Dialog wrapper)
  const headerButton = (
    <div className="flex items-center gap-2">
      {(() => {
        const pallets = calculateSummaryByPallet();
        const palletCount = pallets.length;
        if (palletCount === 0) return null;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setPalletsDialogOpen(true)}>
                  <Info />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Ver detalle de {palletCount} {palletCount === 1 ? 'palet' : 'palets'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })()}
      {inputs.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" onClick={handleDeleteAllInputs}>
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar todo el consumo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Button
        onClick={() => {
          setAddDialogOpen(true);
          loadExistingDataForEdit();
        }}
        data-icon="inline-start"
      >
        {inputs.length > 0 ? (
          <>
            <Edit />
            Editar Consumo
          </>
        ) : (
          <>
            <Plus />
            Agregar Consumo
          </>
        )}
      </Button>
    </div>
  );

  const mainContent = (
    <>
      {!hideTitle && !renderInCard && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Consumo de Materia Prima</h3>
            <p className="text-muted-foreground text-sm">
              Materia prima consumida desde el stock en este proceso
            </p>
          </div>
        </div>
      )}
      {!renderInCard && (
        <div className={`flex items-center ${hideTitle ? 'justify-end' : 'justify-between'}`}>
          <Dialog
            open={addDialogOpen}
            onOpenChange={(open) => {
              setAddDialogOpen(open);
              if (open) {
                loadExistingDataForEdit();
              } else {
                resetAddDialog();
              }
            }}
          >
            <div className="flex items-center gap-2">
              {(() => {
                const pallets = calculateSummaryByPallet();
                const palletCount = pallets.length;
                if (palletCount === 0) return null;
                return (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPalletsDialogOpen(true)}
                        >
                          <Info />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Ver detalle de {palletCount} {palletCount === 1 ? 'palet' : 'palets'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })()}
              {inputs.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="destructive" size="icon" onClick={handleDeleteAllInputs}>
                        <Trash2 />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar todo el consumo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <DialogTrigger asChild>
                <Button data-icon="inline-start">
                  {inputs.length > 0 ? (
                    <>
                      <Edit />
                      Editar Consumo
                    </>
                  ) : (
                    <>
                      <Plus />
                      Agregar Consumo
                    </>
                  )}
                </Button>
              </DialogTrigger>
            </div>
            {dialog.props.children}
          </Dialog>
        </div>
      )}

      {/* Sección: Inputs desde Stock */}
      <div
        className={cn(
          'space-y-4',
          renderInCard && inputs.length === 0 && 'flex min-h-0 flex-1 flex-col'
        )}
      >
        <div className="flex items-center justify-between">
          {!renderInCard && (
            <div className="flex items-center gap-2">
              {inputs.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAllInputs}
                        data-icon="inline-start"
                      >
                        <Trash2 />
                        Eliminar Todo
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar todo el consumo</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Dialog
                open={addDialogOpen}
                onOpenChange={(open) => {
                  setAddDialogOpen(open);
                  if (open) {
                    loadExistingDataForEdit();
                  } else {
                    resetAddDialog();
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button data-icon="inline-start">
                    {inputs.length > 0 ? (
                      <>
                        <Edit />
                        Editar
                      </>
                    ) : (
                      <>
                        <Plus />
                        Agregar
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                {dialog.props.children}
              </Dialog>
            </div>
          )}
        </div>

        {inputs.length === 0 ? (
          <div
            className={cn(
              renderInCard && 'flex min-h-0 flex-1 flex-col',
              !renderInCard && 'flex items-center justify-center rounded-lg border py-8'
            )}
          >
            <EmptyState
              icon={<Box className="text-primary h-12 w-12" strokeWidth={1.5} />}
              title="No hay consumo desde stock"
              description="Agrega cajas desde un palet para comenzar a registrar el consumo de materia prima"
              className={
                renderInCard
                  ? 'bg-muted/30 h-full min-h-0 flex-1 rounded-lg border border-dashed'
                  : undefined
              }
            />
          </div>
        ) : (
          (() => {
            const productsBreakdown = calculateProductsBreakdown();

            return (
              <div className="space-y-4">
                {/* Desglose por producto */}
                {productsBreakdown.length > 0 && (
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Artículo</TableHead>
                          <TableHead>Cajas</TableHead>
                          <TableHead>Peso Total</TableHead>
                          <TableHead>Coste/kg</TableHead>
                          <TableHead>Coste total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsBreakdown.map((product, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.boxesCount}</TableCell>
                            <TableCell>{formatWeight(product.totalWeight)}</TableCell>
                            <TableCell>{formatCostPerKg(product.costPerKg)}</TableCell>
                            <TableCell>{formatTotalCost(product.totalCost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </div>
            );
          })()
        )}
      </div>
    </>
  );

  // Diálogo para ver detalles de lotes (separado para que esté disponible en ambos renders)
  const lotsDialog = (
    <Dialog open={lotsDialogOpen} onOpenChange={setLotsDialogOpen}>
      <DialogContent size="2xl" className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Lotes - {selectedProductLots?.productName}</DialogTitle>
          <DialogDescription>
            {selectedProductLots?.palletId
              ? `Palet #${selectedProductLots.palletId}`
              : 'Todos los palets'}
          </DialogDescription>
        </DialogHeader>
        {selectedProductLots && (
          <div className="space-y-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" />
              <span>
                {selectedProductLots.lots.length}{' '}
                {selectedProductLots.lots.length === 1 ? 'lote único' : 'lotes diferentes'}
              </span>
            </div>

            {/* Lista de lotes con detalles */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {selectedProductLots.lots.map((lot, idx) => {
                  // Agrupar cajas por lote
                  const boxesInLot = selectedProductLots.boxes.filter((box) => box.lot === lot);
                  const totalWeightInLot = boxesInLot.reduce(
                    (sum, box) => sum + (box.weight || 0),
                    0
                  );

                  return (
                    <div key={idx} className="bg-muted/30 rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {lot}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {boxesInLot.length} {boxesInLot.length === 1 ? 'caja' : 'cajas'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatWeight(totalWeightInLot)}
                        </span>
                      </div>
                      {/* Detalles de cajas individuales si hay múltiples */}
                      {boxesInLot.length > 1 && (
                        <div className="mt-2 space-y-1 border-t pt-2">
                          <p className="text-muted-foreground mb-1 text-xs font-medium">Cajas:</p>
                          {boxesInLot.map((box, boxIdx) => (
                            <div
                              key={boxIdx}
                              className="bg-background flex items-center justify-between rounded px-2 py-1 text-xs"
                            >
                              <span className="text-muted-foreground">
                                Caja #{box.id}
                                {selectedProductLots.palletId &&
                                  ` (Palet #${selectedProductLots.palletId})`}
                              </span>
                              <span className="font-medium">{formatWeight(box.weight)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // Dialog de palets (disponible en ambos renders)
  const palletsDialog = (() => {
    const pallets = calculateSummaryByPallet();
    const palletCount = pallets.length;
    if (palletCount === 0) return null;
    return (
      <Dialog open={palletsDialogOpen} onOpenChange={setPalletsDialogOpen}>
        <DialogContent size="4xl" className="flex max-h-[85vh] flex-col p-0">
          <DialogHeader className="flex-shrink-0 border-b px-6 pt-6 pb-4">
            <DialogTitle>Detalle de Palets</DialogTitle>
            <DialogDescription>
              {palletCount} {palletCount === 1 ? 'palet' : 'palets'} utilizados en este proceso
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(85vh-180px)] px-6 py-4">
            <div className="space-y-4 pr-4">
              {pallets.map((pallet, idx) => (
                <Card key={pallet.palletId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Palet #{pallet.palletId}</CardTitle>
                      <div className="text-muted-foreground text-sm">
                        {pallet.boxesCount} {pallet.boxesCount === 1 ? 'caja' : 'cajas'} •{' '}
                        {formatWeight(pallet.totalWeight)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pallet.productsBreakdown && pallet.productsBreakdown.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cajas</TableHead>
                            <TableHead>Peso</TableHead>
                            <TableHead>Lotes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pallet.productsBreakdown.map((product, productIdx) => (
                            <TableRow key={productIdx}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.boxesCount}</TableCell>
                              <TableCell>{formatWeight(product.totalWeight)}</TableCell>
                              <TableCell>
                                {product.lots && product.lots.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {product.lots.map((lot, lotIdx) => (
                                      <span key={lotIdx} className="text-muted-foreground text-xs">
                                        {lot}
                                        {lotIdx < product.lots.length - 1 ? ',' : ''}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-sm">No hay productos registrados</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  })();

  const deleteConfirmDialog = (
    <AlertDialog
      open={deleteInputConfirm.open}
      onOpenChange={(open) => setDeleteInputConfirm((prev) => ({ ...prev, open }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleteInputConfirm.mode === 'all' ? 'Eliminar todo el consumo' : 'Eliminar entrada'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deleteInputConfirm.mode === 'all'
              ? `Se eliminarán ${inputs.length} ${inputs.length === 1 ? 'entrada' : 'entradas'} de materia prima. Esta acción no se puede deshacer.`
              : 'Esta acción no se puede deshacer. ¿Deseas eliminar esta entrada?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDeleteInput}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Si renderInCard es true, envolver en Card con botón en header
  if (renderInCard) {
    return (
      <>
        {dialog}
        {lotsDialog}
        {palletsDialog}
        {deleteConfirmDialog}
        <Card className={cn(inputs.length === 0 ? 'min-h-[min(22rem,55vh)]' : 'h-fit')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="text-primary h-5 w-5" />
                  {cardTitle || 'Consumo de Materia prima desde stock'}
                </CardTitle>
                <CardDescription>
                  {cardDescription || 'Materia prima consumida desde el stock en este proceso'}
                </CardDescription>
              </div>
              {headerButton}
            </div>
          </CardHeader>
          <CardContent className={cn(inputs.length === 0 && 'flex min-h-0 flex-1 flex-col')}>
            {mainContent}
          </CardContent>
        </Card>
      </>
    );
  }

  // Render normal
  return (
    <>
      {lotsDialog}
      {palletsDialog}
      {deleteConfirmDialog}
      {mainContent}
    </>
  );
};

export default ProductionInputsManager;
