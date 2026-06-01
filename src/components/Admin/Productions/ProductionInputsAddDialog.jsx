'use client';

import React from 'react';
import { formatWeight } from '@/helpers/production/formatters';
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
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
  Unlink,
  Plus,
  Save,
  Loader2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/Utilities/EmptyState';

const NO_PALLET_ID = '__no_pallet__';

/**
 * Diálogo para agregar/editar materia prima (inputs) en un registro de producción.
 * Recibe el objeto api retornado por useProductionInputsManager.
 */
export default function ProductionInputsAddDialog({ api }) {
  const {
    inputs,
    loadingPallet,
    savingInputs,
    palletSearch,
    setPalletSearch,
    handleSearchPallet,
    loadedPallets,
    getSelectedBoxesForPallet,
    selectedPalletId,
    setSelectedPalletId,
    handleRemovePallet,
    getPalletBoxes,
    selectionMode,
    setSelectionMode,
    targetWeight,
    setTargetWeight,
    handleCalculateByWeight,
    targetWeightResults,
    handleSelectTargetWeightResults,
    setTargetWeightResults,
    scannedCode,
    setScannedCode,
    handleScanGS1Code,
    weightSearch,
    setWeightSearch,
    weightTolerance,
    setWeightTolerance,
    hasSelectionChanges,
    handleSearchByWeight,
    weightSearchResults,
    handleSelectWeightSearchResults,
    setWeightSearchResults,
    selectedBoxes,
    setSelectedBoxes,
    calculateWeightByProduct,
    calculateTotalWeight,
    calculateWeightByPallet,
    handleToggleBox,
    isBoxSelected,
    wasPreviouslyConsumed,
    setAddDialogOpen,
    resetAddDialog,
    handleAddInputs,
    isBoxAvailable,
  } = api;

  const formatPalletLabel = (palletId) =>
    String(palletId) === NO_PALLET_ID ? 'Sin palet (histórico)' : `Palet #${palletId}`;

  return (
    <DialogContent
      className="flex h-[90vh] max-h-[90vh] min-h-0 flex-col overflow-hidden"
      size="full"
    >
      <DialogHeader className="shrink-0">
        <DialogTitle>
          {inputs.length > 0 ? 'Editar materia prima' : 'Agregar materia prima'}
        </DialogTitle>
        <DialogDescription>
          {inputs.length > 0
            ? 'Modifica la materia prima que se consumirá desde el stock en este proceso'
            : 'Busca un palet y selecciona las cajas de materia prima que se consumirán desde el stock en este proceso'}
        </DialogDescription>
      </DialogHeader>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {(loadingPallet || savingInputs) && (
          <div
            className="bg-background/80 absolute inset-0 z-50 flex items-center justify-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        )}
        <div className="grid min-h-0 flex-1 grid-cols-12 gap-4 overflow-hidden">
          {/* Columna izquierda: Listado de palets y buscador */}
          <div className="col-span-3 flex flex-col overflow-hidden rounded-lg border">
            <div className="bg-muted/50 flex-shrink-0 border-b p-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  id="pallet-search"
                  placeholder="Buscar por ID del palet o lote..."
                  value={palletSearch}
                  onChange={(e) => setPalletSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchPallet();
                    }
                  }}
                  className="h-9 pr-9 pl-9"
                />
                {palletSearch && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-7 w-7"
                    onClick={() => setPalletSearch('')}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Limpiar búsqueda</span>
                  </Button>
                )}
              </div>
              {palletSearch && (
                <Button
                  onClick={handleSearchPallet}
                  disabled={loadingPallet || !palletSearch.trim()}
                  className="mt-2 h-9 w-full"
                  size="sm"
                >
                  {loadingPallet ? 'Buscando...' : 'Buscar Palet'}
                </Button>
              )}
            </div>

            {/* Lista de palets cargados */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-2 p-2">
                {loadedPallets.map((pallet) => {
                  const selectedCount = getSelectedBoxesForPallet(pallet.id).length;
                  const isSelected = selectedPalletId === pallet.id;
                  const totalWeight = (pallet.boxes || []).reduce(
                    (sum, box) => sum + parseFloat(box.netWeight || 0),
                    0
                  );

                  return (
                    <div
                      key={pallet.id}
                      className={`hover:bg-accent flex cursor-pointer items-start space-x-3 rounded-md border p-3 transition-colors ${
                        isSelected ? 'border-primary bg-accent' : ''
                      }`}
                      onClick={() => setSelectedPalletId(pallet.id)}
                    >
                      <div className="mt-1 flex h-5 w-5 items-center justify-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => setSelectedPalletId(pallet.id)}
                          className="pointer-events-none"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Package className="text-muted-foreground mr-2 h-4 w-4" />
                            <span className="font-medium">{formatPalletLabel(pallet.id)}</span>
                            {selectedCount > 0 && (
                              <Badge variant="default" className="ml-2 text-xs">
                                {selectedCount} seleccionadas
                              </Badge>
                            )}
                          </div>
                          {String(pallet.id) !== NO_PALLET_ID && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-destructive/20 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePallet(pallet.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Productos y lotes */}
                        {pallet.boxes &&
                          pallet.boxes.length > 0 &&
                          (() => {
                            const productsMap = {};
                            pallet.boxes.forEach((box) => {
                              if (box.product) {
                                const productId = box.product.id;
                                if (!productsMap[productId]) {
                                  productsMap[productId] = {
                                    name: box.product.name,
                                    lots: new Set(),
                                  };
                                }
                                if (box.lot) {
                                  productsMap[productId].lots.add(box.lot);
                                }
                              }
                            });
                            const productsArray = Object.values(productsMap);

                            return (
                              <div className="mt-1.5 space-y-1">
                                {productsArray.slice(0, 2).map((product, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="text-foreground font-medium">
                                      {product.name}
                                    </span>
                                    {product.lots.size > 0 && (
                                      <span className="text-muted-foreground ml-1">
                                        (Lotes: {Array.from(product.lots).slice(0, 2).join(', ')}
                                        {product.lots.size > 2 ? '...' : ''})
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {productsArray.length > 2 && (
                                  <span className="text-muted-foreground text-xs">
                                    +{productsArray.length - 2} producto
                                    {productsArray.length - 2 > 1 ? 's' : ''} más
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                        <div className="text-muted-foreground mt-1.5 flex items-center text-xs">
                          <span>Total: {formatWeight(totalWeight)}</span>
                          <span className="mx-1.5">|</span>
                          <span>
                            {pallet.boxes?.length || 0}{' '}
                            {pallet.boxes?.length === 1 ? 'caja' : 'cajas'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loadedPallets.length === 0 && (
                  <div className="flex h-full items-center justify-center py-8">
                    <EmptyState
                      icon={<Package className="text-primary h-12 w-12" strokeWidth={1.5} />}
                      title="No hay palets cargados"
                      description="Busca un palet por su ID para comenzar a registrar el consumo de materia prima"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Columna central: Cajas del palet seleccionado */}
          <div className="col-span-6 flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Tabs para modo de selección */}
            {selectedPalletId && (
              <Tabs
                value={selectionMode}
                onValueChange={setSelectionMode}
                className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
              >
                <TabsList className="mb-2 grid w-full flex-shrink-0 grid-cols-4">
                  <TabsTrigger value="manual">
                    <Hand className="mr-1 h-4 w-4" />
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="weight">
                    <Target className="mr-1 h-4 w-4" />
                    Peso Total Objetivo
                  </TabsTrigger>
                  <TabsTrigger value="scanner">
                    <Scan className="mr-1 h-4 w-4" />
                    GS1-128
                  </TabsTrigger>
                  <TabsTrigger value="weight-search">
                    <Scale className="mr-1 h-4 w-4" />
                    Búsqueda Peso Caja
                  </TabsTrigger>
                </TabsList>

                {/* Transfer List - Solo mostrar en modo manual */}
                <TabsContent
                  value="manual"
                  className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                  {selectedPalletId && getPalletBoxes(selectedPalletId).length > 0 && (
                    <div className="grid min-h-0 flex-1 grid-cols-11 gap-4 overflow-hidden">
                      {/* Cajas disponibles del palet seleccionado */}
                      <div className="col-span-5 flex h-full flex-col overflow-hidden rounded-lg border">
                        <div className="bg-muted/50 flex-shrink-0 border-b p-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Disponibles</Label>
                            <Badge variant="secondary" className="text-xs">
                              {
                                getPalletBoxes(selectedPalletId).filter(
                                  (box) =>
                                    isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)
                                ).length
                              }
                            </Badge>
                          </div>
                        </div>
                        <ScrollArea className="min-h-0 flex-1">
                          <div className="space-y-1 p-2">
                            {getPalletBoxes(selectedPalletId)
                              .filter(
                                (box) =>
                                  isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)
                              )
                              .map((box) =>
                                (() => {
                                  const isPreviouslyConsumed =
                                    inputs.length > 0 && wasPreviouslyConsumed(box.id);
                                  return (
                                    <div
                                      key={`${selectedPalletId}-${box.id}`}
                                      className={`hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border p-2 ${isPreviouslyConsumed ? 'border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-950/30' : ''}`}
                                      onClick={() => handleToggleBox(box.id, selectedPalletId)}
                                    >
                                      <Checkbox
                                        checked={false}
                                        onCheckedChange={() =>
                                          handleToggleBox(box.id, selectedPalletId)
                                        }
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                          {box.product?.name || 'Sin producto'}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">
                                          Lote: {box.lot || 'N/A'}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                          Peso Neto: {formatWeight(box.netWeight)}
                                        </p>
                                      </div>
                                      {isPreviouslyConsumed && (
                                        <Badge
                                          variant="secondary"
                                          className="border-amber-300 bg-amber-100 text-[10px] text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                        >
                                          Consumida antes
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })()
                              )}
                            {getPalletBoxes(selectedPalletId).filter(
                              (box) =>
                                isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)
                            ).length === 0 && (
                              <div className="flex h-full items-center justify-center py-8">
                                <EmptyState
                                  icon={
                                    <CheckCircle
                                      className="text-primary h-12 w-12"
                                      strokeWidth={1.5}
                                    />
                                  }
                                  title="Todas las cajas seleccionadas"
                                  description="Todas las cajas de este palet ya están en la lista de seleccionadas"
                                />
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Botones de transferencia */}
                      <div className="col-span-1 flex flex-shrink-0 flex-col items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const availableBoxes = getPalletBoxes(selectedPalletId).filter(
                              (box) =>
                                isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)
                            );
                            if (availableBoxes.length > 0) {
                              handleToggleBox(availableBoxes[0].id, selectedPalletId);
                            }
                          }}
                          disabled={
                            getPalletBoxes(selectedPalletId).filter(
                              (box) =>
                                isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)
                            ).length === 0
                          }
                          title="Mover seleccionada"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const availableBoxes = getPalletBoxes(selectedPalletId)
                              .filter(
                                (box) =>
                                  isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)
                              )
                              .map((box) => ({ boxId: box.id, palletId: selectedPalletId }));
                            setSelectedBoxes((prev) => [...prev, ...availableBoxes]);
                          }}
                          disabled={
                            getPalletBoxes(selectedPalletId).filter(
                              (box) =>
                                isBoxAvailable(box) && !isBoxSelected(box.id, selectedPalletId)
                            ).length === 0
                          }
                          title="Mover todas"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const selectedForPallet = getSelectedBoxesForPallet(selectedPalletId);
                            if (selectedForPallet.length > 0) {
                              setSelectedBoxes((prev) =>
                                prev.filter(
                                  (box) =>
                                    !(
                                      box.palletId === selectedPalletId &&
                                      box.boxId ===
                                        selectedForPallet[selectedForPallet.length - 1].boxId
                                    )
                                )
                              );
                            }
                          }}
                          disabled={getSelectedBoxesForPallet(selectedPalletId).length === 0}
                          title="Quitar seleccionada"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedBoxes((prev) =>
                              prev.filter((box) => box.palletId !== selectedPalletId)
                            );
                          }}
                          disabled={getSelectedBoxesForPallet(selectedPalletId).length === 0}
                          title="Quitar todas"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Cajas seleccionadas del palet seleccionado */}
                      <div className="col-span-5 flex h-full flex-col overflow-hidden rounded-lg border">
                        <div className="bg-muted/50 flex-shrink-0 border-b p-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Seleccionadas</Label>
                            <Badge variant="default" className="text-xs">
                              {getSelectedBoxesForPallet(selectedPalletId).length}
                            </Badge>
                          </div>
                        </div>
                        <ScrollArea className="min-h-0 flex-1">
                          <div className="space-y-1 p-2">
                            {getSelectedBoxesForPallet(selectedPalletId).map((selectedBox) => {
                              const box = getPalletBoxes(selectedPalletId).find(
                                (b) => Number(b.id) === Number(selectedBox.boxId)
                              );
                              if (!box) return null;
                              return (
                                <div
                                  key={`${selectedPalletId}-${selectedBox.boxId}`}
                                  className="hover:bg-muted bg-primary/5 flex cursor-pointer items-center gap-2 rounded-md border p-2"
                                  onClick={() => handleToggleBox(box.id, selectedPalletId)}
                                >
                                  <Checkbox
                                    checked={true}
                                    onCheckedChange={() =>
                                      handleToggleBox(box.id, selectedPalletId)
                                    }
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                      {box.product?.name || 'Sin producto'}
                                    </p>
                                    <p className="text-muted-foreground truncate text-xs">
                                      Lote: {box.lot || 'N/A'}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      Peso Neto: {formatWeight(box.netWeight)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            {getSelectedBoxesForPallet(selectedPalletId).length === 0 && (
                              <div className="flex h-full items-center justify-center py-8">
                                <EmptyState
                                  icon={
                                    <Box className="text-primary h-12 w-12" strokeWidth={1.5} />
                                  }
                                  title="No hay cajas seleccionadas"
                                  description="Selecciona cajas del palet para agregarlas a la producción"
                                />
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  )}
                  {selectedPalletId && getPalletBoxes(selectedPalletId).length === 0 && (
                    <div className="flex h-full items-center justify-center py-8">
                      <EmptyState
                        icon={<Package className="text-primary h-12 w-12" strokeWidth={1.5} />}
                        title="Palet sin cajas"
                        description="Este palet no contiene cajas disponibles"
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Modo por peso */}
                <TabsContent
                  value="weight"
                  className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                  {selectedPalletId && (
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      <Card className="mb-2 flex-shrink-0 p-4">
                        <div className="space-y-3">
                          <div>
                            <Label
                              htmlFor={`target-weight-${selectedPalletId}`}
                              className="text-sm font-semibold"
                            >
                              Peso Objetivo Total (kg) - {formatPalletLabel(selectedPalletId)}
                            </Label>
                            <Input
                              id={`target-weight-${selectedPalletId}`}
                              type="number"
                              step="0.01"
                              placeholder="Ej: 100.50"
                              value={targetWeight[selectedPalletId] || ''}
                              onChange={(e) =>
                                setTargetWeight((prev) => ({
                                  ...prev,
                                  [selectedPalletId]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCalculateByWeight(selectedPalletId);
                                }
                              }}
                              className="mt-1"
                            />
                            <p className="text-muted-foreground mt-1 text-xs">
                              Ingresa un peso objetivo total y el sistema calculará las cajas de{' '}
                              {formatPalletLabel(selectedPalletId).toLowerCase()} cuya suma se
                              acerque lo más posible al peso objetivo sin excederlo.
                            </p>
                          </div>
                          <Button
                            onClick={() => handleCalculateByWeight(selectedPalletId)}
                            disabled={
                              !targetWeight[selectedPalletId] ||
                              parseFloat(targetWeight[selectedPalletId]) <= 0
                            }
                            className="w-full"
                            size="sm"
                          >
                            <Calculator className="mr-2 h-4 w-4" />
                            Calcular
                          </Button>
                        </div>
                      </Card>

                      {/* Resultados del cálculo de peso objetivo */}
                      {targetWeightResults.length > 0 && (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
                          <div className="bg-muted/50 flex-shrink-0 border-b p-2">
                            <div className="mb-2 flex items-center justify-between">
                              <div>
                                <Label className="text-sm font-semibold">
                                  Resultados ({targetWeightResults.length} cajas)
                                </Label>
                                {targetWeightResults.length > 0 &&
                                  targetWeightResults[0].totalWeight !== undefined && (
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                      Peso total: {formatWeight(targetWeightResults[0].totalWeight)}{' '}
                                      | Objetivo:{' '}
                                      {formatWeight(targetWeightResults[0].targetWeight)} |
                                      Diferencia: {formatWeight(targetWeightResults[0].difference)}
                                    </p>
                                  )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={handleSelectTargetWeightResults}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                >
                                  Seleccionar Todas
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setTargetWeightResults([]);
                                    setTargetWeight((prev) => ({
                                      ...prev,
                                      [selectedPalletId]: '',
                                    }));
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <ScrollArea className="min-h-0 flex-1">
                            <div className="space-y-1 p-2">
                              {targetWeightResults.map((result, idx) => {
                                const box = result.box;
                                return (
                                  <div
                                    key={`target-weight-result-${box.id}-${result.palletId}-${idx}`}
                                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border p-2"
                                    onClick={() => {
                                      setSelectedPalletId(result.palletId);
                                      handleToggleBox(box.id, result.palletId);
                                    }}
                                  >
                                    <Checkbox
                                      checked={isBoxSelected(box.id, result.palletId)}
                                      onCheckedChange={() => {
                                        setSelectedPalletId(result.palletId);
                                        handleToggleBox(box.id, result.palletId);
                                      }}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="truncate text-sm font-medium">
                                          {box.product?.name || 'Sin producto'}
                                        </p>
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          {formatPalletLabel(result.palletId)}
                                        </Badge>
                                      </div>
                                      <p className="text-muted-foreground truncate text-xs">
                                        Lote: {box.lot || 'N/A'}
                                      </p>
                                      <div className="mt-1 flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">
                                          Peso: {formatWeight(box.netWeight)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                      {targetWeightResults.length === 0 && (
                        <div className="flex h-full items-center justify-center py-8">
                          <EmptyState
                            icon={<Target className="text-primary h-12 w-12" strokeWidth={1.5} />}
                            title="Calcula el peso objetivo"
                            description="Ingresa un peso objetivo y haz clic en Calcular para ver las cajas que se ajustan"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Modo lector GS1-128 */}
                <TabsContent
                  value="scanner"
                  className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                  <Card className="mb-2 flex-shrink-0 p-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="gs1-scanner" className="text-sm font-semibold">
                          Escanear código GS1-128
                        </Label>
                        <Input
                          id="gs1-scanner"
                          type="text"
                          placeholder="Escanea aquí o pega el código..."
                          value={scannedCode}
                          onChange={(e) => setScannedCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleScanGS1Code();
                            }
                          }}
                          className="mt-1 font-mono"
                          autoFocus
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                          Escanea o pega un código GS1-128 para buscar y seleccionar automáticamente
                          la caja correspondiente en{' '}
                          {formatPalletLabel(selectedPalletId).toLowerCase()}. El sistema reconocerá
                          códigos con peso en kilogramos (3100) o libras (3200).
                        </p>
                      </div>
                      <Button
                        onClick={handleScanGS1Code}
                        disabled={!scannedCode.trim()}
                        className="w-full"
                        size="sm"
                      >
                        <Scan className="mr-2 h-4 w-4" />
                        Buscar y Seleccionar
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                {/* Modo búsqueda por peso */}
                <TabsContent
                  value="weight-search"
                  className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <Card className="mb-2 flex-shrink-0 p-4">
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="weight-search-input" className="text-sm font-semibold">
                            Buscar cajas por peso (kg)
                          </Label>
                          <Input
                            id="weight-search-input"
                            type="number"
                            step="0.01"
                            placeholder="Ej: 10.50"
                            value={weightSearch}
                            onChange={(e) => setWeightSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSearchByWeight();
                              }
                            }}
                            className="mt-1"
                          />
                          <p className="text-muted-foreground mt-1 text-xs">
                            Ingresa un peso para encontrar cajas de{' '}
                            {formatPalletLabel(selectedPalletId).toLowerCase()} que coincidan con
                            ese peso. Puedes ajustar la tolerancia de búsqueda para controlar la
                            precisión de coincidencia.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Label
                              htmlFor="weight-tolerance"
                              className="text-muted-foreground text-xs"
                            >
                              Tolerancia (kg):
                            </Label>
                            <Input
                              id="weight-tolerance"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={weightTolerance}
                              onChange={(e) =>
                                setWeightTolerance(parseFloat(e.target.value) || 0.01)
                              }
                              className="h-8 w-20"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleSearchByWeight}
                          disabled={!weightSearch.trim()}
                          className="w-full"
                          size="sm"
                        >
                          Buscar
                        </Button>
                      </div>
                    </Card>

                    {/* Resultados de búsqueda por peso */}
                    {weightSearchResults.length > 0 && (
                      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
                        <div className="bg-muted/50 flex-shrink-0 border-b p-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">
                              Resultados ({weightSearchResults.length})
                            </Label>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={handleSelectWeightSearchResults}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                              >
                                Seleccionar Todas
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setWeightSearchResults([]);
                                  setWeightSearch('');
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <ScrollArea className="min-h-0 flex-1">
                          <div className="space-y-1 p-2">
                            {weightSearchResults.map((result, idx) => {
                              const box = result.box;
                              return (
                                <div
                                  key={`weight-result-${box.id}-${result.palletId}-${idx}`}
                                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md border p-2"
                                  onClick={() => {
                                    setSelectedPalletId(result.palletId);
                                    handleToggleBox(box.id, result.palletId);
                                  }}
                                >
                                  <Checkbox
                                    checked={isBoxSelected(box.id, result.palletId)}
                                    onCheckedChange={() => {
                                      setSelectedPalletId(result.palletId);
                                      handleToggleBox(box.id, result.palletId);
                                    }}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="truncate text-sm font-medium">
                                        {box.product?.name || 'Sin producto'}
                                      </p>
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {formatPalletLabel(result.palletId)}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs">
                                      <span className="text-muted-foreground">
                                        Peso: {formatWeight(box.netWeight)}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        Diferencia: {formatDecimal(result.difference)} kg
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                    {weightSearchResults.length === 0 && (
                      <div className="flex h-full items-center justify-center py-8">
                        <EmptyState
                          icon={<Scale className="text-primary h-12 w-12" strokeWidth={1.5} />}
                          title="Busca cajas por peso"
                          description="Ingresa uno o más pesos para encontrar cajas que coincidan"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {!selectedPalletId && loadedPallets.length > 0 && (
              <div className="flex h-full items-center justify-center py-8">
                <EmptyState
                  icon={<Package className="text-primary h-12 w-12" strokeWidth={1.5} />}
                  title="Selecciona un palet"
                  description="Haz clic en un palet de la lista para ver y seleccionar sus cajas"
                />
              </div>
            )}
          </div>

          {/* Columna derecha: Selección total de todos los palets */}
          <div className="col-span-3 flex flex-col overflow-hidden rounded-lg border">
            <div className="bg-muted/50 flex-shrink-0 border-b p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Selección Total</Label>
                <Badge variant="default" className="text-xs">
                  {selectedBoxes.length} {selectedBoxes.length === 1 ? 'caja' : 'cajas'}
                </Badge>
              </div>
            </div>

            {/* Resumen compacto */}
            {selectedBoxes.length > 0 && (
              <div className="bg-primary/5 border-b p-3">
                <div className="space-y-1 text-xs">
                  {/* <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cajas:</span>
                                            <span className="font-semibold">{selectedBoxes.length}</span>
                                        </div> */}

                  <div className="mb-2 border-b pb-2">
                    {/* <p className="text-muted-foreground mb-1 font-semibold">Por Producto:</p> */}
                    {calculateWeightByProduct().map((product, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground truncate">{product.name}</span>
                        <span className="ml-2 font-semibold">{formatWeight(product.weight)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso Total</span>
                    <span className="font-semibold">{formatWeight(calculateTotalWeight())}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de todas las cajas seleccionadas agrupadas por palet */}
            <ScrollArea className="min-h-0 flex-1" style={{ maxHeight: 'calc(90vh - 300px)' }}>
              <div className="space-y-2 p-2">
                {loadedPallets.map((pallet) => {
                  const selectedForPallet = getSelectedBoxesForPallet(pallet.id);
                  if (selectedForPallet.length === 0) return null;

                  return (
                    <div key={pallet.id} className="space-y-1">
                      <div className="bg-muted flex items-center justify-between gap-2 rounded-md px-2 py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-semibold">
                            {formatPalletLabel(pallet.id)}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {selectedForPallet.length} cajas
                          </span>
                        </div>
                        <span className="text-xs font-semibold">
                          {formatWeight(calculateWeightByPallet(pallet.id))}
                        </span>
                      </div>
                      <div className="border-muted space-y-1 border-l-2 pl-2">
                        {selectedForPallet.map((selectedBox) => {
                          const box = getPalletBoxes(pallet.id).find(
                            (b) => Number(b.id) === Number(selectedBox.boxId)
                          );
                          if (!box) return null;
                          return (
                            <div
                              key={`${pallet.id}-${selectedBox.boxId}`}
                              className="group hover:bg-muted flex cursor-pointer items-center gap-2 rounded border p-2 text-xs"
                              onClick={() => handleToggleBox(box.id, pallet.id)}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {box.product?.name || 'Sin producto'}
                                </p>
                                <p className="text-muted-foreground truncate">
                                  Lote: {box.lot || 'N/A'}
                                </p>
                                <p className="text-muted-foreground truncate">
                                  Peso Neto: {formatWeight(box.netWeight)}
                                </p>
                              </div>
                              <div className="pr-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <Unlink className="text-destructive h-3.5 w-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {selectedBoxes.length === 0 && (
                  <div className="flex h-full items-center justify-center py-8">
                    <EmptyState
                      icon={<Box className="text-primary h-12 w-12" strokeWidth={1.5} />}
                      title="No hay cajas seleccionadas"
                      description="Selecciona cajas de los palets para verlas aquí"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <DialogFooter className="shrink-0">
        <Button
          variant="outline"
          onClick={() => {
            setAddDialogOpen(false);
            resetAddDialog();
          }}
          disabled={savingInputs}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleAddInputs}
          disabled={
            selectedBoxes.length === 0 ||
            savingInputs ||
            (inputs.length > 0 && !hasSelectionChanges)
          }
          data-icon="inline-start"
        >
          {savingInputs ? (
            <>
              <Loader2 className="animate-spin" />
              {inputs.length > 0 ? 'Guardando...' : 'Agregando...'}
            </>
          ) : (
            <>
              {inputs.length > 0 ? <Save /> : <Plus />}
              {inputs.length > 0 ? 'Guardar' : 'Agregar'}
              {selectedBoxes.length > 0 ? ` (${selectedBoxes.length})` : ''}
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
