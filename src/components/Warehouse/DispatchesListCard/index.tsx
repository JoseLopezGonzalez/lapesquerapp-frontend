'use client';

import { useState, useEffect, type ComponentProps } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
import { useDispatchesList } from '@/hooks/useDispatchesList';
import { ceboDispatchService } from '@/services/domain/cebo-dispatches/ceboDispatchService';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { Printer, Loader2, Eye, EyeOff, Truck } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import { EmptyState as _EmptyState } from '@/components/Utilities/EmptyState';
import { notify } from '@/lib/notifications';
import { operatorRoutes } from '@/configs/roleRoutesConfig';
import _DispatchPrintDialog from '../DispatchPrintDialog';

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

interface DispatchPrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchId: unknown;
  supplier: unknown;
  date: unknown;
  notes: unknown;
  details: unknown[];
}
const DispatchPrintDialog = _DispatchPrintDialog as React.ComponentType<DispatchPrintDialogProps>;

type DispatchDetail = { netWeight?: number | null };
type DispatchRow = {
  id: string | number;
  supplier?: { name?: string } | null;
  date?: string | null;
  netWeight?: number | null;
  details?: DispatchDetail[] | null;
};

function getDispatchNetWeight(dispatch: DispatchRow): number {
  if (dispatch.netWeight != null) return Number(dispatch.netWeight);
  const details = dispatch.details ?? [];
  return details.reduce((acc, d) => acc + (Number(d.netWeight) || 0), 0);
}

const PER_PAGE = 9;

interface DispatchesListCardProps {
  storeId?: string | number | null;
}

export default function DispatchesListCard({ storeId = null }: DispatchesListCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const { data, total, isLoading: loading } = useDispatchesList(page);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printData, setPrintData] = useState<unknown>(null);
  const [loadingPrintId, setLoadingPrintId] = useState<string | number | null>(null);
  const [showAllQuantities, setShowAllQuantities] = useState(false);
  const [revealedRowIds, setRevealedRowIds] = useState<Set<string | number>>(() => new Set());

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigateToCreate = () => {
    setIsNavigating(true);
    router.push(operatorRoutes.dispatchesCreate);
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
      const dispatch = await ceboDispatchService.getById(row.id);
      setPrintData({
        dispatchId: (dispatch as { id: unknown }).id,
        supplier: (dispatch as { supplier?: unknown }).supplier,
        date: (dispatch as { date?: unknown }).date,
        notes: (dispatch as { notes?: unknown }).notes,
        details: (dispatch as { details?: unknown[] }).details || [],
      });
      setPrintDialogOpen(true);
    } catch (err) {
      console.error('Error al cargar salida para imprimir:', err);
      notify.error({
        title: 'Error al cargar salida',
        description: 'No se pudo cargar la salida de cebo. Intente de nuevo.',
      });
    } finally {
      setLoadingPrintId(null);
    }
  };

  const rows = (data ?? []) as DispatchRow[];
  const pageTotal = rows.reduce((acc, row) => acc + getDispatchNetWeight(row), 0);

  const pd = printData as {
    dispatchId: unknown;
    supplier: unknown;
    date: unknown;
    notes: unknown;
    details: unknown[];
  } | null;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Salidas de cebo</CardTitle>
          <CardDescription>Lista de salidas</CardDescription>
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
              'Nueva Salida +'
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
                  <Truck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">No hay salidas de cebo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aún no se ha registrado ninguna salida de cebo.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleNavigateToCreate}>
                  Nueva salida +
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
                          {row.date ? formatDate(row.date) : '—'}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <span className="min-w-[4.5rem] text-right text-xs tabular-nums">
                          {isQuantityVisible(row.id)
                            ? `${getDispatchNetWeight(row).toFixed(2)} kg`
                            : '*****'}
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
                          title="Imprimir"
                          onClick={() => handlePrintClick(row)}
                        >
                          {loadingPrintId === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Printer className="h-3.5 w-3.5" />
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
                    <TableHead className="bg-card text-right">CANTIDAD</TableHead>
                    <TableHead className="bg-card">FECHA</TableHead>
                    <TableHead className="bg-card w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0 align-top">
                        <div className="flex min-h-[280px] w-full items-center justify-center py-12">
                          <EmptyState
                            icon={<Truck className="text-primary h-12 w-12" strokeWidth={1.5} />}
                            title="No hay salidas de cebo"
                            description="Aún no se ha registrado ninguna salida de cebo. Crea la primera desde el botón superior."
                            button={{ name: 'Nueva salida', onClick: handleNavigateToCreate }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.supplier?.name ?? '—'}</TableCell>
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
                              {isQuantityVisible(row.id)
                                ? `${getDispatchNetWeight(row).toFixed(2)} kg`
                                : '*****'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{row.date ? formatDate(row.date) : '—'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={loadingPrintId != null}
                            title="Imprimir"
                            onClick={() => handlePrintClick(row)}
                          >
                            {loadingPrintId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 border-t">
                      <td
                        colSpan={2}
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
        <DispatchPrintDialog
          isOpen={printDialogOpen}
          onClose={() => {
            setPrintDialogOpen(false);
            setPrintData(null);
          }}
          dispatchId={pd.dispatchId}
          supplier={pd.supplier}
          date={pd.date}
          notes={pd.notes}
          details={pd.details}
        />
      )}
    </Card>
  );
}
