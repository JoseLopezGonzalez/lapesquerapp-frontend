'use client';

import { useState, useMemo, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSession } from 'next-auth/react';
import {
  Warehouse,
  Check,
  Search,
  X,
  Package,
  Loader2,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import { moveMultiplePalletsToStore } from '@/services/palletService';
import { useStoreContext } from '@/context/StoreContext';
import { useStoresOptions } from '@/hooks/useStoresOptions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import {
  getAvailableBoxes,
  getAvailableBoxesCount,
  getAvailableNetWeight,
} from '@/helpers/pallet/boxAvailability';

type Step = 1 | 2 | 3;

export default function MoveMultiplePalletsToStoreDialog() {
  const {
    closeMoveMultiplePalletsToStoreDialog,
    isOpenMoveMultiplePalletsToStoreDialog: isOpen,
    store,
    updateStoreWhenOnMoveMultiplePalletsToStore,
  } = useStoreContext();

  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreValue, setSelectedStoreValue] = useState<string | number | null>(null);
  const [selectedPalletIds, setSelectedPalletIds] = useState<Set<string | number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);

  const { storeOptions, loading: storesLoading } = useStoresOptions() as {
    storeOptions: { value: string | number; label: string }[];
    loading: boolean;
  };

  const allPallets = useMemo(() => {
    return store?.content?.pallets || [];
  }, [store]);

  const filteredStores = storeOptions.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [palletSearchQuery, setPalletSearchQuery] = useState('');
  const filteredPallets = useMemo(() => {
    if (!palletSearchQuery) return allPallets;
    const query = palletSearchQuery.toLowerCase();
    return allPallets.filter(
      (pallet: { id: string | number; lots?: string[] }) =>
        pallet.id.toString().toLowerCase().includes(query) ||
        pallet.lots?.some((lot) => lot.toLowerCase().includes(query))
    );
  }, [allPallets, palletSearchQuery]);

  const selectedStoreName = useMemo(
    () =>
      storeOptions.find((s) => s.value === selectedStoreValue)?.label ??
      'Almacén',
    [storeOptions, selectedStoreValue]
  );

  const resetAndClose = () => {
    setSelectedStoreValue(null);
    setSearchQuery('');
    setPalletSearchQuery('');
    setSelectedPalletIds(new Set());
    setCurrentStep(1);
    closeMoveMultiplePalletsToStoreDialog();
  };

  const handleTogglePallet = (palletId: string | number) => {
    setSelectedPalletIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(palletId)) {
        newSet.delete(palletId);
      } else {
        newSet.add(palletId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPalletIds.size === filteredPallets.length) {
      setSelectedPalletIds(new Set());
    } else {
      setSelectedPalletIds(new Set(filteredPallets.map((p: { id: string | number }) => p.id)));
    }
  };

  const handleSubmit = async () => {
    if (!selectedStoreValue) {
      notify.error({
        title: 'Almacén de destino requerido',
        description: 'Seleccione un almacén para mover los palets.',
      });
      return;
    }

    if (selectedPalletIds.size === 0) {
      notify.error({
        title: 'Ningún palet seleccionado',
        description: 'Seleccione al menos un palet para mover.',
      });
      return;
    }

    setIsSubmitting(true);
    const palletIdsArray = Array.from(selectedPalletIds).map((id) => Number(id));

    try {
      const response = await moveMultiplePalletsToStore(
        palletIdsArray,
        Number(selectedStoreValue),
        token ?? ''
      );

      const { moved_count, total_count, errors } = response as {
        moved_count: number;
        total_count: number;
        errors?: { pallet_id: number; error: string }[];
      };

      if (moved_count > 0) {
        let desc = `Se movieron ${moved_count} palet(s) correctamente.`;
        if (errors && errors.length > 0) {
          desc += ` ${total_count - moved_count} palet(s) no se pudieron mover.`;
        }
        notify.success({ title: 'Palets movidos', description: desc });
      }

      if (errors && errors.length > 0) {
        errors.forEach(({ pallet_id, error }) => {
          notify.error({
            title: 'Error al mover palet',
            description: `Palet #${pallet_id}: ${error}`,
          });
        });
      }

      updateStoreWhenOnMoveMultiplePalletsToStore({
        palletIds: palletIdsArray,
        storeId: Number(selectedStoreValue),
      });

      resetAndClose();
    } catch (error) {
      const err = error as {
        userMessage?: string;
        data?: { userMessage?: string };
        response?: { data?: { userMessage?: string } };
        message?: string;
      };
      const errorMessage =
        err.userMessage ||
        err.data?.userMessage ||
        err.response?.data?.userMessage ||
        err.message ||
        'No se pudieron mover los palets. Intente de nuevo.';
      notify.error({ title: 'Error al mover palets', description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreClick = (value: string | number) => {
    setSelectedStoreValue((prev) => (prev === value ? null : value));
  };

  const handleNext = () => {
    setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
  };

  const handleBack = () => {
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  if (!isOpen) return null;

  const selectedCount = selectedPalletIds.size;
  const allSelected =
    filteredPallets.length > 0 && selectedPalletIds.size === filteredPallets.length;

  const getPalletInfo = (pallet: { boxes?: unknown[]; [key: string]: unknown }) => {
    const availableBoxes = getAvailableBoxes(pallet.boxes || []);
    const availableBoxCount = getAvailableBoxesCount(pallet);
    const availableNetWeight = getAvailableNetWeight(pallet);

    const productsSummary = availableBoxes.reduce(
      (
        acc: Record<string | number, { name: string; netWeight: number; boxCount: number }>,
        box: { product: { id: string | number; name: string }; netWeight: string | number }
      ) => {
        const product = box.product;
        if (!acc[product.id]) {
          acc[product.id] = {
            name: product.name,
            netWeight: 0,
            boxCount: 0,
          };
        }
        acc[product.id].netWeight += Number(box.netWeight);
        acc[product.id].boxCount += 1;
        return acc;
      },
      {}
    );
    const productsSummaryArray = Object.values(productsSummary) as {
      name: string;
      netWeight: number;
      boxCount: number;
    }[];
    const hasMultipleProducts = productsSummaryArray.length > 1;

    return {
      availableBoxCount,
      availableNetWeight,
      productsSummaryArray,
      hasMultipleProducts,
    };
  };

  /* ------------------------------------------------------------------ */
  /* Secciones reutilizables                                             */
  /* ------------------------------------------------------------------ */

  const PalletSection = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4" />
          Seleccionar palets ({selectedCount} seleccionados)
        </h3>
        {filteredPallets.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          placeholder="Buscar palet por ID o lote..."
          className="pl-9"
          value={palletSearchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPalletSearchQuery(e.target.value)}
        />
        {palletSearchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7"
            onClick={() => setPalletSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-md border">
        {filteredPallets.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">
            {allPallets.length === 0
              ? 'No hay palets en este almacén'
              : 'No se encontraron palets'}
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            {filteredPallets.map(
              (pallet: {
                id: string | number;
                lots?: string[];
                observations?: string;
                boxes?: unknown[];
              }) => {
                const isSelected = selectedPalletIds.has(pallet.id);
                const palletInfo = getPalletInfo(pallet);

                return (
                  <Card
                    key={pallet.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-accent shadow-md'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <CardContent className="p-3" onClick={() => handleTogglePallet(pallet.id)}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleTogglePallet(pallet.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <div className="flex flex-shrink-0 items-center gap-2 rounded-md bg-black p-1.5 text-white">
                              <Layers className="h-4 w-4" />
                            </div>
                            <h4 className="text-foreground truncate text-base font-medium">
                              Palet #{pallet.id}
                            </h4>
                          </div>

                          <div className="mb-2">
                            <div className="text-muted-foreground mb-1.5 text-xs font-medium">
                              Productos:
                            </div>
                            <div className="space-y-2">
                              {palletInfo.productsSummaryArray.map((product, index) => (
                                <div
                                  key={index}
                                  className="flex min-w-0 flex-col overflow-hidden"
                                >
                                  <p className="text-foreground truncate text-sm font-medium">
                                    {product.name}
                                  </p>
                                  {palletInfo.hasMultipleProducts && (
                                    <div className="text-muted-foreground mt-0.5 flex items-center text-xs">
                                      <span className="truncate">
                                        {formatDecimalWeight(product.netWeight)}
                                      </span>
                                      <span className="mx-1.5 flex-shrink-0">|</span>
                                      <span className="flex-shrink-0">
                                        {product.boxCount}{' '}
                                        {product.boxCount === 1 ? 'caja' : 'cajas'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {pallet.lots && pallet.lots.length > 0 && (
                            <div className="mb-2">
                              <div className="text-muted-foreground mb-1 text-xs font-medium">
                                Lotes:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {pallet.lots.map((lot, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-accent text-accent-foreground border-input max-w-full truncate text-xs"
                                  >
                                    <span className="truncate">{lot}</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {pallet.observations && (
                            <div className="mb-2">
                              <div className="text-muted-foreground mb-1 text-xs font-medium">
                                Observaciones:
                              </div>
                              <div className="text-foreground bg-muted/50 line-clamp-3 rounded-md p-2 text-xs break-words">
                                {pallet.observations}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="w-full p-0">
                      <div className="divide-border grid w-full grid-cols-2 divide-x">
                        <div className="bg-accent/40 flex items-center justify-center py-2">
                          <span className="text-sm font-semibold">
                            {palletInfo.availableBoxCount}{' '}
                            {palletInfo.availableBoxCount === 1 ? 'caja' : 'cajas'}
                          </span>
                        </div>
                        <div className="bg-accent/40 flex items-center justify-center py-2">
                          <span className="text-sm font-semibold">
                            {formatDecimalWeight(palletInfo.availableNetWeight)}
                          </span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                );
              }
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const StoreSection = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Warehouse className="h-4 w-4" />
        Almacén de destino
      </h3>

      <div className="relative">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          placeholder="Buscar almacén..."
          className="pl-9"
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {storesLoading ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <Loader />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="text-muted-foreground flex min-h-0 flex-1 flex-col items-center justify-center rounded-md border py-6 text-center text-sm">
          No se encontraron almacenes
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1 rounded-md border">
          <div className="flex flex-col gap-2 p-3">
            {filteredStores.map((s) => {
              const isSelected = selectedStoreValue === s.value;
              return (
                <div
                  key={s.value}
                  className={`hover:bg-accent flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors ${
                    isSelected ? 'border-primary bg-accent' : ''
                  }`}
                  onClick={() => handleStoreClick(s.value)}
                >
                  <div className="flex items-center space-x-2">
                    <Warehouse className="text-muted-foreground h-5 w-5" />
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  {isSelected && <Check className="text-primary h-4 w-4" />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const ConfirmationSection = (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-4 p-1">
        {/* Palets seleccionados */}
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Package className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">{selectedCount} palets seleccionados</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from(selectedPalletIds)
              .slice(0, 8)
              .map((id) => (
                <Badge key={id} variant="outline" className="text-xs">
                  #{id}
                </Badge>
              ))}
            {selectedCount > 8 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedCount - 8} más
              </Badge>
            )}
          </div>
        </div>

        {/* Indicador de dirección */}
        <div className="flex justify-center">
          <div className="bg-muted rounded-full p-2">
            <ArrowRightLeft className="text-muted-foreground h-4 w-4" />
          </div>
        </div>

        {/* Almacén destino */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Warehouse className="text-primary h-4 w-4" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Almacén destino</p>
              <p className="text-sm font-semibold">{selectedStoreName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                               */
  /* ------------------------------------------------------------------ */

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent
        size="7xl"
        className="flex max-h-[90vh] flex-col overflow-hidden max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Traspaso masivo de palets</DialogTitle>
          {isMobile ? (
            <div className="mt-1 space-y-1">
              {/* Indicador de pasos */}
              <div className="flex gap-1">
                {([1, 2, 3] as Step[]).map((step) => (
                  <div
                    key={step}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      currentStep > step
                        ? 'bg-primary/50'
                        : currentStep === step
                          ? 'bg-primary'
                          : 'bg-muted'
                    )}
                  />
                ))}
              </div>
              <DialogDescription className="text-xs">
                {currentStep === 1 &&
                  `Paso 1/3 · Selecciona los palets a mover (${selectedCount} seleccionados)`}
                {currentStep === 2 && 'Paso 2/3 · Selecciona el almacén de destino'}
                {currentStep === 3 && 'Paso 3/3 · Confirma el traspaso'}
              </DialogDescription>
            </div>
          ) : (
            <DialogDescription>
              Seleccione los palets que desea mover y el almacén de destino
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {isMobile ? (
            /* Mobile: flujo por pasos */
            <>
              {currentStep === 1 && PalletSection}
              {currentStep === 2 && StoreSection}
              {currentStep === 3 && ConfirmationSection}
            </>
          ) : (
            /* Desktop: layout de dos columnas */
            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
              {PalletSection}
              <div className="bg-border w-px" />
              {StoreSection}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="mt-4 shrink-0">
          {isMobile ? (
            <div className="flex w-full gap-2">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                  Atrás
                </Button>
              ) : (
                <Button variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && selectedCount === 0) ||
                    (currentStep === 2 && !selectedStoreValue)
                  }
                >
                  Siguiente
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Moviendo...
                    </>
                  ) : (
                    `Mover ${selectedCount} palet(s)`
                  )}
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedStoreValue || selectedCount === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Moviendo...
                  </>
                ) : (
                  `Mover ${selectedCount} palet(s)`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
