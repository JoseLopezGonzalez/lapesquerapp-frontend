"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
import { rawMaterialReceptionService } from "@/services/domain/raw-material-receptions/rawMaterialReceptionService";
import { formatDate } from "@/helpers/formats/dates/formatDates";
import { Printer, Loader2, Eye, EyeOff } from "lucide-react";
import Loader from "@/components/Utilities/Loader";
import toast from "react-hot-toast";
import { getToastTheme } from "@/customs/reactHotToast";

const ReceptionPrintDialog = dynamic(
  () => import("@/components/Admin/RawMaterialReceptions/ReceptionPrintDialog"),
  { ssr: false }
);

const PER_PAGE = 9;

export default function ReceptionsListCard({ storeId = null }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const filters = { dates: { start: today, end: today } };
      try {
        const res = await rawMaterialReceptionService.list(
          filters,
          { page, perPage: PER_PAGE }
        );
        if (cancelled) return;
        setData(res.data ?? []);
        setTotal(res.meta?.total ?? res.total ?? 0);
      } catch (e) {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page]);

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
        creationMode: reception.creationMode || "lines",
      });
      setPrintDialogOpen(true);
    } catch (err) {
      console.error("Error al cargar recepción para imprimir:", err);
      toast.error("No se pudo cargar la recepción", getToastTheme());
    } finally {
      setLoadingPrintId(null);
    }
  };

  const cardClass = "flex flex-col h-full min-h-0";

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
        <div>
          <CardTitle>Recepciones de Materia Prima</CardTitle>
          <CardDescription>Lista de recepciones</CardDescription>
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
            <Link href="/admin/raw-material-receptions/create">
              Nueva Recepción +
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
                    <TableHead className="bg-card">ESPECIE</TableHead>
                    <TableHead className="text-right bg-card">CANTIDAD</TableHead>
                    <TableHead className="bg-card">FECHA</TableHead>
                    <TableHead className="w-12 bg-card" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay recepciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.supplier?.name ?? "—"}</TableCell>
                        <TableCell>{row.species?.name ?? "—"}</TableCell>
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
                              {isQuantityVisible(row.id) ? (
                                row.declaredTotalNetWeight != null && row.declaredTotalNetWeight > 0
                                  ? `${Number(row.declaredTotalNetWeight).toFixed(2)} kg`
                                  : row.netWeight != null
                                    ? `${Number(row.netWeight).toFixed(2)} kg`
                                    : "—"
                              ) : (
                                "*****"
                              )}
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
