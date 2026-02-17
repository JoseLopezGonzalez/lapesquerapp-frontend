"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TablePagination from "../TablePagination";
import { useDispatchesList } from "@/hooks/useDispatchesList";
import { ceboDispatchService } from "@/services/domain/cebo-dispatches/ceboDispatchService";
import { formatDate } from "@/helpers/formats/dates/formatDates";
import { Printer, Loader2, Eye, EyeOff } from "lucide-react";
import Loader from "@/components/Utilities/Loader";
import DispatchPrintDialog from "../DispatchPrintDialog";function getDispatchNetWeight(dispatch) {
  if (dispatch.netWeight != null) return Number(dispatch.netWeight);
  const details = dispatch.details ?? [];
  const sum = details.reduce((acc, d) => acc + (Number(d.netWeight) || 0), 0);
  return sum;
}

const PER_PAGE = 9;

export default function DispatchesListCard({ storeId = null }) {
  const [page, setPage] = useState(1);
  const { data, total, isLoading: loading } = useDispatchesList(page);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loadingPrintId, setLoadingPrintId] = useState(null);
  const [showAllQuantities, setShowAllQuantities] = useState(false);
  const [revealedRowIds, setRevealedRowIds] = useState(() => new Set());

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
      const dispatch = await ceboDispatchService.getById(row.id);
      setPrintData({
        dispatchId: dispatch.id,
        supplier: dispatch.supplier,
        date: dispatch.date,
        notes: dispatch.notes,
        details: dispatch.details || [],
      });
      setPrintDialogOpen(true);
    } catch (err) {
      console.error("Error al cargar salida para imprimir:", err);
      notify.error({
        title: 'Error al cargar salida',
        description: 'No se pudo cargar la salida de cebo. Intente de nuevo.',
      });
    } finally {
      setLoadingPrintId(null);
    }
  };

  const cardClass = "flex flex-col h-full min-h-0";

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
        <div>
          <CardTitle>Salidas de cebo</CardTitle>
          <CardDescription>Lista de salidas</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title={showAllQuantities ? "Ocultar todas las cantidades" : "Mostrar todas las cantidades"}
            onClick={() => {
              setShowAllQuantities((v) => !v);
              setRevealedRowIds(new Set());
            }}
          >
            {showAllQuantities ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button asChild size="sm" variant="default">
            <Link href={storeId != null ? `/warehouse/${storeId}/dispatches/create` : "/admin/cebo-dispatches"}>
              Nueva Salida +
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden pt-0">
        {loading ? (
          <div className="flex justify-center py-8 flex-1">
            <Loader />
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-auto flex-1 min-h-0">
              <table className="w-full caption-bottom text-sm">
                <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
                  <TableRow className="bg-card hover:bg-card border-b">
                    <TableHead className="w-16 bg-card">N°</TableHead>
                    <TableHead className="bg-card">PROVEEDOR</TableHead>
                    <TableHead className="text-right bg-card">CANTIDAD</TableHead>
                    <TableHead className="bg-card">FECHA</TableHead>
                    <TableHead className="w-12 bg-card" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay salidas de cebo
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.supplier?.name ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              title={isQuantityVisible(row.id) ? "Ocultar cantidad" : "Mostrar cantidad"}
                              onClick={() => toggleRowQuantity(row.id)}
                            >
                              {isQuantityVisible(row.id) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <span className="tabular-nums min-w-[4rem]">
                              {isQuantityVisible(row.id)
                                ? `${getDispatchNetWeight(row).toFixed(2)} kg`
                                : "*****"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{row.date ? formatDate(row.date) : "—"}</TableCell>
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
        <DispatchPrintDialog
          isOpen={printDialogOpen}
          onClose={() => {
            setPrintDialogOpen(false);
            setPrintData(null);
          }}
          dispatchId={printData.dispatchId}
          supplier={printData.supplier}
          date={printData.date}
          notes={printData.notes}
          details={printData.details}
        />
      )}
    </Card>
  );
}
