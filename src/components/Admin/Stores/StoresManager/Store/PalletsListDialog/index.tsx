'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useStoreContext } from '@/context/StoreContext';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { PiMicrosoftExcelLogo } from 'react-icons/pi';
import { Edit, Printer, MapPinHouse, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getAvailableBoxesCount, getAvailableNetWeight } from '@/helpers/pallet/boxAvailability';
import { useSession } from 'next-auth/react';
import type { StorePallet } from '@/hooks/useStoreDialogs';
import { PalletImageStrip } from '@/components/Admin/Pallets/PalletAttachments/PalletImageStrip';

interface PalletsListDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SpeciesSummaryItem {
  name: string;
  percentage: number;
  quantity: number;
}

interface PalletBox {
  product?: {
    name?: string;
    species?: { name?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface FilteredPalletRow {
  id: string | number;
  totalWeight: number;
  totalBoxes: number;
}

export function PalletsListDialog({ open, onOpenChange }: PalletsListDialogProps = {}) {
  const isControlled = open !== undefined;
  const {
    speciesSummary,
    store,
    pallets,
    openPalletDialog,
    openPalletLabelDialog,
    openMovePalletToStoreDialog,
    openDuplicatePalletDialog,
    isDuplicatingPallet,
  } = useStoreContext();
  const { data: session } = useSession();
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [filteredPallets, setFilteredPallets] = useState<FilteredPalletRow[]>([]);
  const [searchText, setSearchText] = useState('');

  const storeName = (store?.name as string) ?? '';

  const rawRole = session?.user?.role;
  const isStoreOperator = (Array.isArray(rawRole) ? rawRole[0] : rawRole) === 'operario';

  const safePallets: StorePallet[] = (pallets || []) as StorePallet[];

  useEffect(() => {
    const summary = speciesSummary as SpeciesSummaryItem[];
    if (summary.length) {
      setSelectedSpecies(summary[0].name);
    }
  }, [speciesSummary]);

  useEffect(() => {
    if (!selectedSpecies || !safePallets.length) return;

    const speciesPallets = safePallets.filter((pallet) =>
      (pallet.boxes ?? []).some(
        (box) => (box as PalletBox).product?.species?.name === selectedSpecies
      )
    );

    const search = searchText.trim().toLowerCase();

    const filtered = speciesPallets
      .filter((pallet) => {
        if (!search) return true;

        const idMatch = pallet.id?.toString()?.toLowerCase().includes(search);

        const productNames = (pallet.boxes ?? [])
          .map((box) => (box as PalletBox).product?.name)
          .filter(Boolean);
        const productsMatch = productNames.some((name) =>
          (name as string).toLowerCase().includes(search)
        );

        const lotsArray = Array.isArray(pallet.lots)
          ? pallet.lots
          : pallet.lots
            ? [pallet.lots]
            : [];
        const lotsMatch = lotsArray.some((lot) => lot?.toString().toLowerCase().includes(search));

        const observationsMatch = (pallet.observations ?? '')
          .toString()
          .toLowerCase()
          .includes(search);

        return idMatch || productsMatch || lotsMatch || observationsMatch;
      })
      .map((pallet) => {
        const totalBoxes = getAvailableBoxesCount(pallet);
        const totalWeight = getAvailableNetWeight(pallet);
        return {
          id: pallet.id,
          totalWeight,
          totalBoxes,
        };
      });

    setFilteredPallets(filtered);
  }, [selectedSpecies, searchText, safePallets]);

  const totalPallets = safePallets.length;

  const totalWeight = safePallets.reduce((total, pallet) => {
    return total + getAvailableNetWeight(pallet);
  }, 0);

  const generateExcel = async () => {
    const [XLSX, { saveAs }] = await Promise.all([import('xlsx'), import('file-saver')]);
    const data = filteredPallets.map((p) => {
      const fullPallet = safePallets.find((pa) => pa.id === p.id);
      const productNames = Array.from(
        new Set(fullPallet?.boxes?.map((b) => (b as PalletBox).product?.name))
      ).join(', ');
      const lots =
        fullPallet && Array.isArray(fullPallet.lots) ? fullPallet.lots.join(', ') : '';
      const observations = String(fullPallet?.observations ?? '');

      return {
        Palet: p.id,
        Ubicación: fullPallet?.position || '-',
        Artículos: productNames,
        Lotes: lots,
        Observaciones: observations,
        Cajas: p.totalBoxes,
        'Peso neto (kg)': p.totalWeight.toFixed(2),
        Especie: selectedSpecies,
      };
    });

    const currenDate = new Date();
    const formattedDate = `${currenDate.getDate().toString().padStart(2, '0')}-${(currenDate.getMonth() + 1).toString().padStart(2, '0')}-${currenDate.getFullYear()}`;
    const formattedStoreName = storeName
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PALETS');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.ms-excel' });
    saveAs(blob, `Palets_${formattedStoreName}_${formattedDate}.xlsx`);
  };

  const species = speciesSummary as SpeciesSummaryItem[];

  return (
    <Dialog
      open={isControlled ? open : undefined}
      onOpenChange={isControlled ? onOpenChange : undefined}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="secondary" className="w-full">
            Palets
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        size="full"
        className="max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none"
      >
        <DialogHeader>
          <DialogTitle>Palets</DialogTitle>
        </DialogHeader>

        <div className="bg-background text-foreground w-full px-2 pb-2">
          <div className="text-muted-foreground/90 mb-6 flex items-center text-sm">
            <span>{species.length} especies</span>
            <Separator orientation="vertical" className="mx-2 h-3" />
            <span>{totalPallets} palets</span>
            <Separator orientation="vertical" className="mx-2 h-3" />
            <span>{formatDecimalWeight(totalWeight)}</span>
          </div>

          {/* Especies */}
          <div className="mb-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">Especies</h3>
            <ScrollArea className="w-full pb-4 whitespace-nowrap">
              <div className="flex space-x-2 p-2">
                {species.map((s, idx) => (
                  <Card
                    key={idx}
                    className={cn(
                      'bg-card flex-shrink-0 cursor-pointer border hover:shadow-md',
                      selectedSpecies === s.name ? 'shadow-foreground-400 shadow-md' : 'border-muted'
                    )}
                    onClick={() => setSelectedSpecies(s.name)}
                  >
                    <CardContent className="flex items-center space-x-3 p-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full',
                          selectedSpecies === s.name
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <span className="text-sm font-semibold">{s.name[0]}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="truncate pr-1 text-sm font-medium" title={s.name}>
                            {s.name}
                          </div>
                          <div
                            className={cn(
                              'rounded-sm px-1.5 py-0.5 text-xs font-medium',
                              selectedSpecies === s.name
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {s.percentage.toFixed(0)}%
                          </div>
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {formatDecimalWeight(s.quantity)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Buscador */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <Input
              type="text"
              placeholder="Buscar palet por ID, producto, lote u observaciones..."
              className="max-w-[500px]"
              value={searchText}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
            />
            <div className="bg-muted text-muted-foreground flex flex-shrink-0 items-center justify-center rounded-full px-3 py-1 text-xs">
              {filteredPallets.length} palets
              <Separator orientation="vertical" className="bg-muted-foreground mx-2 h-3" />
              {formatDecimalWeight(filteredPallets.reduce((sum, p) => sum + p.totalWeight, 0))}
            </div>
          </div>

          {/* ── DESKTOP: tabla con columna de fotos ── */}
          <div className="hidden sm:block max-h-[315px] overflow-x-auto overflow-y-auto rounded-md border">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="text-muted-foreground bg-muted text-left font-medium">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Fotos</th>
                  <th className="px-4 py-2">Artículos</th>
                  <th className="px-4 py-2">Lotes</th>
                  <th className="px-4 py-2">Observaciones</th>
                  <th className="px-4 py-2 text-right">Cajas</th>
                  <th className="px-4 py-2 text-right text-nowrap">Peso neto</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPallets.map((pallet) => {
                  const fullPallet = safePallets.find((p) => p.id === pallet.id);
                  if (!fullPallet) return null;

                  const productNames = Array.from(
                    new Set(
                      (fullPallet.boxes ?? []).map((b) => (b as PalletBox).product?.name).filter(Boolean)
                    )
                  ).join('\n');

                  const lots = Array.isArray(fullPallet.lots) ? fullPallet.lots : [];
                  const observations = String(fullPallet.observations ?? '');

                  return (
                    <tr
                      key={pallet.id}
                      className="border-muted hover:bg-muted/20 border-b last:border-0"
                    >
                      <td className="px-4 py-2 font-medium">{pallet.id}</td>
                      <td className="py-1">
                        <PalletImageStrip palletId={fullPallet.id} canInteract={false} />
                      </td>
                      <td className="px-4 py-2 whitespace-pre-wrap">{productNames}</td>
                      <td className="max-w-[150px] truncate px-4 py-2" title={lots.join(', ')}>
                        {lots.join(', ')}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-2" title={observations}>
                        {observations}
                      </td>
                      <td className="px-4 py-2 text-right">{pallet.totalBoxes}</td>
                      <td className="px-4 py-2 text-right text-nowrap">
                        {formatDecimalWeight(pallet.totalWeight)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {(() => {
                            const receptionId = fullPallet?.receptionId;
                            const belongsToReception =
                              receptionId !== null && receptionId !== undefined;
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => openPalletDialog(pallet.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {belongsToReception
                                      ? 'Ver palet (solo lectura - pertenece a una recepción)'
                                      : 'Editar palet'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="default"
                                size="icon"
                                onClick={() => openPalletLabelDialog(pallet.id)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Imprimir etiqueta</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openDuplicatePalletDialog(pallet.id)}
                                disabled={isDuplicatingPallet}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Duplicar</p>
                            </TooltipContent>
                          </Tooltip>
                          {!isStoreOperator && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openMovePalletToStoreDialog(pallet.id)}
                                >
                                  <MapPinHouse className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reubicar</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE: cards apiladas ── */}
          <div className="sm:hidden space-y-2.5">
            {filteredPallets.map((pallet) => {
              const fullPallet = safePallets.find((p) => p.id === pallet.id);
              if (!fullPallet) return null;

              const productNames = Array.from(
                new Set(
                  (fullPallet.boxes ?? []).map((b) => (b as PalletBox).product?.name).filter(Boolean)
                )
              ) as string[];

              const lots = Array.isArray(fullPallet.lots) ? fullPallet.lots : [];
              const observations = String(fullPallet.observations ?? '');

              return (
                <div
                  key={pallet.id}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  {/* Cabecera de la card */}
                  <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
                    <span className="text-sm font-semibold">Palet #{pallet.id}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openPalletDialog(pallet.id)}
                        title="Ver / Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openPalletLabelDialog(pallet.id)}
                        title="Imprimir etiqueta"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openDuplicatePalletDialog(pallet.id)}
                        disabled={isDuplicatingPallet}
                        title="Duplicar"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {!isStoreOperator && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openMovePalletToStoreDialog(pallet.id)}
                          title="Reubicar"
                        >
                          <MapPinHouse className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div className="space-y-1.5 px-3 py-2.5">
                    {productNames.length > 0 && (
                      <p className="text-sm leading-snug text-foreground">
                        {productNames.join(' · ')}
                      </p>
                    )}
                    {lots.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Lotes: {lots.join(', ')}
                      </p>
                    )}
                    {observations && (
                      <p className="line-clamp-1 text-xs italic text-muted-foreground">
                        {observations}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium tabular-nums text-foreground">
                        {pallet.totalBoxes}
                      </span>
                      <span>{pallet.totalBoxes === 1 ? 'caja' : 'cajas'}</span>
                      <span className="opacity-40">·</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatDecimalWeight(pallet.totalWeight)}
                      </span>
                    </div>
                  </div>

                  {/* Strip de fotos — usa su propio padding interno */}
                  <PalletImageStrip palletId={fullPallet.id} canInteract={false} />
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={generateExcel}>
            <PiMicrosoftExcelLogo className="mr-2" />
            Exportar .xlsx
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
