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
import { ceboDispatchService } from "@/services/domain/cebo-dispatches/ceboDispatchService";
import { formatDate } from "@/helpers/formats/dates/formatDates";
import { Printer } from "lucide-react";
import Loader from "@/components/Utilities/Loader";

const PER_PAGE = 10;

function getDispatchNetWeight(dispatch) {
  if (dispatch.net_weight != null) return Number(dispatch.net_weight);
  const products = dispatch.products ?? [];
  const sum = products.reduce((acc, p) => acc + (Number(p.net_weight) || 0), 0);
  return sum;
}

export default function DispatchesListCard({ storeId = null }) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await ceboDispatchService.list(
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
          <CardTitle>Salidas de cebo</CardTitle>
          <CardDescription>Lista de salidas</CardDescription>
        </div>
        <Button
          asChild
          size="sm"
          variant="default"
        >
          <Link href={storeId != null ? `/warehouse/${storeId}/dispatches/create` : "/admin/cebo-dispatches"}>
            Nueva Salida +
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
                          {`${getDispatchNetWeight(row).toFixed(2)} kg`}
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
