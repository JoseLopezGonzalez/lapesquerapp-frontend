'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TablePagination from '../TablePagination';
import { useReceptionsList } from '@/hooks/useReceptionsList';
import { rawMaterialReceptionService } from '@/services/domain/raw-material-receptions/rawMaterialReceptionService';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { Printer, Loader2, Eye, EyeOff, Package } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { notify } from '@/lib/notifications';
import { operatorRoutes } from '@/configs/roleRoutesConfig';
const ReceptionPrintDialog = dynamic(
  () => import('@/components/Admin/RawMaterialReceptions/ReceptionPrintDialog'),
  { ssr: false }
);

const PER_PAGE = 9;

export default function ReceptionsListCard({ storeId = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const { data, total, isLoading: loading } = useReceptionsList(page);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loadingPrintId, setLoadingPrintId] = useState(null);
  const [showAllQuantities, setShowAllQuantities] = useState(false);
  const [revealedRowIds, setRevealedRowIds] = useState(() => new Set());

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const handleNavigateToCreate = () => {
    setIsNavigating(true);
    router.push(operatorRoutes.receptionsCreate);
  };

  const isQuantityVisible = (rowId) => showAllQuantities || revealedRowIds.has(rowId);
  const toggleRowQuantity = (rowId) => {
    setRevealedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  const handlePrintClick = async (row) => {
    setLoadingPrintId(row.id);
    try {
      const reception = await rawMaterialReceptionService.getById(row.id);
      const details = (reception.details || []).map((d) => ({
        ...d,
        productName: d.product?.name,
        product: d.product,
      }));
      setPrintData({
        receptionId: reception.id,
        supplier: reception.supplier,
        date: reception.date,
        notes: reception.notes,
        details,
        pallets: (reception.pallets || []).map((p) => ({ pallet: p })),
        creationMode: reception.creationMode || 'lines',
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

  const cardClass = 'flex flex-col h-full min-h-0';

  return (
    <Card className={cardClass}>
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
            title={
              showAllQuantities ? 'Ocultar todas las cantidades' : 'Mostrar todas las cantidades'
            }
            onClick={() => {
              setShowAllQuantities((v) => !v);
              setRevealedRowIds(new Set());
            }}
          >
            {showAllQuantities ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleNavigateToCreate}
            disabled={isNavigating}
          >
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
            <div className="min-h-0 flex-1 overflow-auto rounded-md border">
              <table className="w-full caption-bottom text-sm">
                <TableHeader className="bg-card sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
                  <TableRow className="bg-card hover:bg-card border-b">
                    <TableHead className="bg-card w-16">N°</TableHead>
                    <TableHead className="bg-card">PROVEEDOR</TableHead>
                    <TableHead className="bg-card">ESPECIE</TableHead>
                    <TableHead className="bg-card text-right">CANTIDAD</TableHead>
                    <TableHead className="bg-card">FECHA</TableHead>
                    <TableHead className="bg-card w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0 align-top">
                        <div className="flex min-h-[280px] w-full items-center justify-center py-12">
                          <EmptyState
                            icon={<Package className="text-primary h-12 w-12" strokeWidth={1.5} />}
                            title="No hay recepciones"
                            description="Aún no se ha registrado ninguna recepción de materia prima. Crea la primera desde el botón superior."
                            button={{
                              name: 'Nueva recepción',
                              onClick: handleNavigateToCreate,
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
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
                                isQuantityVisible(row.id) ? 'Ocultar cantidad' : 'Mostrar cantidad'
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
                                ? row.declaredTotalNetWeight != null &&
                                  row.declaredTotalNetWeight > 0
                                  ? `${Number(row.declaredTotalNetWeight).toFixed(2)} kg`
                                  : row.netWeight != null
                                    ? `${Number(row.netWeight).toFixed(2)} kg`
                                    : '—'
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
                {data.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 border-t">
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Total página
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums">
                        {showAllQuantities
                          ? `${data.reduce((acc, row) => {
                              const w =
                                row.declaredTotalNetWeight != null && row.declaredTotalNetWeight > 0
                                  ? Number(row.declaredTotalNetWeight)
                                  : row.netWeight != null
                                    ? Number(row.netWeight)
                                    : 0;
                              return acc + w;
                            }, 0).toFixed(2)} kg`
                          : '*****'}
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
                total={total}
                perPage={PER_PAGE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </CardContent>
      {printData && (
        <ReceptionPrintDialog
          isOpen={printDialogOpen}
          onClose={() => {
            setPrintDialogOpen(false);
            setPrintData(null);
          }}
          receptionId={printData.receptionId}
          supplier={printData.supplier}
          date={printData.date}
          notes={printData.notes}
          details={printData.details}
          pallets={printData.pallets}
          creationMode={printData.creationMode}
        />
      )}
    </Card>
  );
}
