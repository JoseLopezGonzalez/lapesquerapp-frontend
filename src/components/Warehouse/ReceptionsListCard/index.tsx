'use client';

import { useState, useEffect, type ComponentProps } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TableBody as _TableBody,
  TableCell as _TableCell,
  TableHead as _TableHead,
  TableHeader as _TableHeader,
  TableRow as _TableRow,
} from '@/components/ui/table';
import TablePagination from '../TablePagination';
import { useReceptionsList } from '@/hooks/useReceptionsList';
import { rawMaterialReceptionService } from '@/services/domain/raw-material-receptions/rawMaterialReceptionService';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { Printer, Loader2, Eye, EyeOff, Package, Tags } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import { EmptyState as _EmptyState } from '@/components/Utilities/EmptyState';
import { notify } from '@/lib/notifications';
import { operatorRoutes } from '@/configs/roleRoutesConfig';
import { usePrintElement } from '@/hooks/usePrintElement';

// JS interop: cast table sub-components to standard HTML element props (className inferred required)
const TableBody = _TableBody as React.FC<ComponentProps<'tbody'>>;
const TableCell = _TableCell as React.FC<ComponentProps<'td'>>;
const TableHead = _TableHead as React.FC<ComponentProps<'th'>>;
const TableHeader = _TableHeader as React.FC<ComponentProps<'thead'>>;
const TableRow = _TableRow as React.FC<ComponentProps<'tr'>>;

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  button?: { name: string; onClick: () => void };
  className?: string;
}
// Double cast required: TypeScript reads JS JSDoc as `{...}: string` destructuring
const EmptyState = _EmptyState as unknown as React.ComponentType<EmptyStateProps>;
const ReceptionPrintDialog = dynamic(
  () => import('@/components/Admin/RawMaterialReceptions/ReceptionPrintDialog'),
  { ssr: false }
) as unknown as React.ComponentType<{
  isOpen: boolean;
  onClose: () => void;
  receptionId: unknown;
  supplier: unknown;
  date: unknown;
  notes: unknown;
  details: unknown[];
  pallets: unknown[];
  creationMode: string;
}>;

const PER_PAGE = 9;
const LOT_LABELS_PRINT_ID = 'receptions-list-lot-labels-print-content';

interface ReceptionsListCardProps {
  storeId?: string | number | null;
}

export default function ReceptionsListCard({ storeId = null }: ReceptionsListCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const { data, total, isLoading: loading } = useReceptionsList(page);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printData, setPrintData] = useState<unknown>(null);
  const [loadingPrintId, setLoadingPrintId] = useState<string | number | null>(null);
  const [loadingLotPrintId, setLoadingLotPrintId] = useState<string | number | null>(null);
  const [lotLabelsToPrint, setLotLabelsToPrint] = useState<(string | null)[] | null>(null);
  const [showAllQuantities, setShowAllQuantities] = useState(false);
  const [revealedRowIds, setRevealedRowIds] = useState<Set<string | number>>(() => new Set());

  const { onPrint: onPrintLotLabels } = usePrintElement({
    id: LOT_LABELS_PRINT_ID,
    freeSize: true,
  });

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigateToCreate = () => {
    setIsNavigating(true);
    router.push(operatorRoutes.receptionsCreate);
  };

  const isQuantityVisible = (rowId: string | number) =>
    showAllQuantities || revealedRowIds.has(rowId);

  const toggleRowQuantity = (rowId: string | number) => {
    setRevealedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const lastPage = Math.max(1, Math.ceil((total ?? 0) / PER_PAGE));

  const handlePrintClick = async (row: { id: string | number }) => {
    setLoadingPrintId(row.id);
    try {
      const reception = await rawMaterialReceptionService.getById(row.id);
      const details = ((reception as { details?: unknown[] }).details || []).map((d: unknown) => ({
        ...(d as object),
        productName: (d as { product?: { name?: string } }).product?.name,
        product: (d as { product?: unknown }).product,
      }));
      setPrintData({
        receptionId: (reception as { id: unknown }).id,
        supplier: (reception as { supplier?: unknown }).supplier,
        date: (reception as { date?: unknown }).date,
        notes: (reception as { notes?: unknown }).notes,
        details,
        pallets: ((reception as { pallets?: unknown[] }).pallets || []).map((p: unknown) => ({
          pallet: p,
        })),
        creationMode: (reception as { creationMode?: string }).creationMode || 'lines',
      });
      setPrintDialogOpen(true);
    } catch (err) {
      console.error('Error al cargar recepción para imprimir:', err);
      notify.error({
        title: 'Error al cargar recepción',
        description: 'No se pudo cargar la recepción. Intente de nuevo.',
      });
    } finally {
      setLoadingPrintId(null);
    }
  };

  const handlePrintLotClick = async (row: { id: string | number }) => {
    setLoadingLotPrintId(row.id);
    try {
      const reception = await rawMaterialReceptionService.getById(row.id);
      const details = ((reception as { details?: unknown[] }).details || []) as Array<{
        lot?: string | null;
        boxes?: number | string | null;
      }>;
      const lots = details
        .filter((d) => d.lot)
        .flatMap((d) => {
          const count = Math.max(1, parseInt(String(d.boxes ?? 1), 10) || 1);
          return Array.from({ length: count }, () => d.lot ?? null);
        });
      if (lots.length === 0) {
        notify.error({
          title: 'Sin lotes',
          description: 'No hay líneas con lote en esta recepción para imprimir etiquetas.',
        });
        return;
      }
      setLotLabelsToPrint(lots);
    } catch (err) {
      console.error('Error al cargar recepción para imprimir lotes:', err);
      notify.error({
        title: 'Error al cargar recepción',
        description: 'No se pudo cargar la recepción. Intente de nuevo.',
      });
    } finally {
      setLoadingLotPrintId(null);
    }
  };

  useEffect(() => {
    if (!lotLabelsToPrint?.length) return;
    const t = setTimeout(() => {
      onPrintLotLabels();
      setLotLabelsToPrint(null);
    }, 200);
    return () => clearTimeout(t);
  }, [lotLabelsToPrint, onPrintLotLabels]);

  const rows = (data ?? []) as Array<{
    id: string | number;
    supplier?: { name?: string } | null;
    species?: { name?: string } | null;
    date?: string | null;
    declaredTotalNetWeight?: number | null;
    netWeight?: number | null;
  }>;

  const getWeightStr = (row: (typeof rows)[0]): string => {
    if (row.declaredTotalNetWeight != null && row.declaredTotalNetWeight > 0)
      return `${Number(row.declaredTotalNetWeight).toFixed(2)} kg`;
    if (row.netWeight != null) return `${Number(row.netWeight).toFixed(2)} kg`;
    return '—';
  };

  const pageTotal = rows.reduce((acc, row) => {
    const w =
      row.declaredTotalNetWeight != null && row.declaredTotalNetWeight > 0
        ? Number(row.declaredTotalNetWeight)
        : row.netWeight != null
          ? Number(row.netWeight)
          : 0;
    return acc + w;
  }, 0);

  const pd = printData as {
    receptionId: unknown;
    supplier: unknown;
    date: unknown;
    notes: unknown;
    details: unknown[];
    pallets: unknown[];
    creationMode: string;
  } | null;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recepciones de Materia Prima</CardTitle>
          <CardDescription>Lista de recepciones</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title={showAllQuantities ? 'Ocultar todas las cantidades' : 'Mostrar todas las cantidades'}
            onClick={() => {
              setShowAllQuantities((v) => !v);
              setRevealedRowIds(new Set());
            }}
          >
            {showAllQuantities ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="default" onClick={handleNavigateToCreate} disabled={isNavigating}>
            {isNavigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              'Nueva Recepción +'
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
        {loading ? (
          <div className="flex flex-1 justify-center py-8">
            <Loader />
          </div>
        ) : (
          <>
            {/* ── Mobile (< sm): empty state — no overflow, content always fits ── */}
            {rows.length === 0 && (
              <div className="sm:hidden min-h-0 flex-1 rounded-md border flex flex-col items-center justify-center gap-3 px-6 py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">No hay recepciones</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aún no se ha registrado ninguna recepción de materia prima.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleNavigateToCreate}>
                  Nueva recepción +
                </Button>
              </div>
            )}

            {/* ── Mobile (< sm): list with overflow scroll ── */}
            {rows.length > 0 && (
              <div className="sm:hidden min-h-0 flex-1 overflow-auto rounded-md border">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-3 border-b px-3 py-3 last:border-0"
                  >
                    <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {row.id}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium leading-tight">
                        {row.supplier?.name ?? '—'}
                      </span>
                      <span className="text-muted-foreground mt-0.5 text-xs">
                        {[row.species?.name, row.date ? formatDate(row.date) : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <span className="min-w-[4.5rem] text-right text-xs tabular-nums">
                        {isQuantityVisible(row.id) ? getWeightStr(row) : '*****'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={isQuantityVisible(row.id) ? 'Ocultar cantidad' : 'Mostrar cantidad'}
                        onClick={() => toggleRowQuantity(row.id)}
                      >
                        {isQuantityVisible(row.id) ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={loadingPrintId != null}
                        title="Imprimir recibo"
                        onClick={() => handlePrintClick(row)}
                      >
                        {loadingPrintId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Printer className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={loadingLotPrintId != null}
                        title="Imprimir etiquetas de lote"
                        onClick={() => handlePrintLotClick(row)}
                      >
                        {loadingLotPrintId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Tags className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="bg-muted/50 flex items-center justify-between border-t px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Total página
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {showAllQuantities ? `${pageTotal.toFixed(2)} kg` : '*****'}
                  </span>
                </div>
              </div>
            )}

            {/* ── Desktop table (≥ sm) ── */}
            <div className="hidden sm:block min-h-0 flex-1 overflow-auto rounded-md border">
              <table className="w-full caption-bottom text-sm">
                <TableHeader className="bg-card sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
                  <TableRow className="bg-card hover:bg-card border-b">
                    <TableHead className="bg-card w-16">N°</TableHead>
                    <TableHead className="bg-card">PROVEEDOR</TableHead>
                    <TableHead className="bg-card">ESPECIE</TableHead>
                    <TableHead className="bg-card text-right">CANTIDAD</TableHead>
                    <TableHead className="bg-card">FECHA</TableHead>
                    <TableHead className="bg-card w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 align-top">
                        <div className="flex min-h-[280px] w-full items-center justify-center py-12">
                          <EmptyState
                            icon={<Package className="text-primary h-12 w-12" strokeWidth={1.5} />}
                            title="No hay recepciones"
                            description="Aún no se ha registrado ninguna recepción de materia prima. Crea la primera desde el botón superior."
                            button={{ name: 'Nueva recepción', onClick: handleNavigateToCreate }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.supplier?.name ?? '—'}</TableCell>
                        <TableCell>{row.species?.name ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              title={
                                isQuantityVisible(row.id)
                                  ? 'Ocultar cantidad'
                                  : 'Mostrar cantidad'
                              }
                              onClick={() => toggleRowQuantity(row.id)}
                            >
                              {isQuantityVisible(row.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <span className="min-w-[4rem] tabular-nums">
                              {isQuantityVisible(row.id) ? getWeightStr(row) : '*****'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{row.date ? formatDate(row.date) : '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={loadingPrintId != null}
                              title="Imprimir recibo"
                              onClick={() => handlePrintClick(row)}
                            >
                              {loadingPrintId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Printer className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={loadingLotPrintId != null}
                              title="Imprimir etiquetas de lote"
                              onClick={() => handlePrintLotClick(row)}
                            >
                              {loadingLotPrintId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Tags className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 border-t">
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        Total página
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums">
                        {showAllQuantities ? `${pageTotal.toFixed(2)} kg` : '*****'}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="shrink-0">
              <TablePagination
                page={page}
                lastPage={lastPage}
                total={total ?? 0}
                perPage={PER_PAGE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </CardContent>

      {pd && (
        <ReceptionPrintDialog
          isOpen={printDialogOpen}
          onClose={() => {
            setPrintDialogOpen(false);
            setPrintData(null);
          }}
          receptionId={pd.receptionId}
          supplier={pd.supplier}
          date={pd.date}
          notes={pd.notes}
          details={pd.details}
          pallets={pd.pallets}
          creationMode={pd.creationMode}
        />
      )}

      {lotLabelsToPrint && lotLabelsToPrint.length > 0 && (
        <div id={LOT_LABELS_PRINT_ID} className="hidden print:block">
          <div className="space-y-4 p-4">
            {lotLabelsToPrint.map((lot, i) => (
              <div
                key={`lot-${lot}-${i}`}
                className="flex min-h-[80px] items-center justify-center p-6"
                style={{ pageBreakAfter: i < lotLabelsToPrint.length - 1 ? 'always' : 'auto' }}
              >
                <span className="text-center text-3xl font-bold break-words">{lot}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
