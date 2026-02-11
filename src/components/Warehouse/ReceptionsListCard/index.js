"use client";

import { useState, useEffect } from "react";
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
import { rawMaterialReceptionService } from "@/services/domain/raw-material-receptions/rawMaterialReceptionService";
import { formatDate } from "@/helpers/formats/dates/formatDates";
import { Printer } from "lucide-react";
import Loader from "@/components/Utilities/Loader";

const PER_PAGE = 10;

export default function ReceptionsListCard({ storeId = null }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await rawMaterialReceptionService.list(
          {},
          { page, perPage: PER_PAGE }
        );
        if (cancelled) return;
        setData(res.data ?? []);
        setTotal(res.total ?? 0);
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

  const cardClass = "flex flex-col h-full min-h-0";

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0">
        <div>
          <CardTitle>Recepciones de Materia Prima</CardTitle>
          <CardDescription>Lista de recepciones</CardDescription>
        </div>
        <Button asChild size="sm" variant="default">
          <Link href={storeId != null ? `/warehouse/${storeId}/receptions/create` : "/admin/raw-material-receptions/create"}>
            Nueva Recepción +
          </Link>
        </Button>
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
                          {row.declared_total_net_weight != null
                            ? `${Number(row.declared_total_net_weight).toFixed(2)} kg`
                            : row.net_weight != null
                              ? `${Number(row.net_weight).toFixed(2)} kg`
                              : "—"}
                        </TableCell>
                        <TableCell>{row.date ? formatDate(row.date) : "—"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled
                            title="Imprimir (próximamente)"
                          >
                            <Printer className="h-4 w-4" />
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
    </Card>
  );
}
