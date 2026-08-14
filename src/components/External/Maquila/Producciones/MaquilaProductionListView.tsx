'use client';

import { useRouter } from 'next/navigation';
import { Factory } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationFooter } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter/PaginationFooter';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { useMaquilaProductionList } from '@/hooks/production/useMaquilaProductionList';
import { useState } from 'react';

const PER_PAGE = 15;

export function MaquilaProductionListView() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, meta, isLoading, error } = useMaquilaProductionList({ page, perPage: PER_PAGE });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex-shrink-0 space-y-1">
        <h1 className="text-xl font-semibold">Producciones</h1>
        <p className="text-muted-foreground text-sm">Tus lotes de producción.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <EmptyState
            title="No se pudieron cargar las producciones"
            description={error}
            icon={<Factory />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length === 0 && (
          <EmptyState
            title="Sin producciones"
            description="Todavía no tienes lotes de producción registrados."
            icon={<Factory />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Especie</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((production) => (
                <TableRow
                  key={production.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/external/maquila/producciones/${production.id}`)}
                >
                  <TableCell className="font-medium">
                    {production.lot ?? `#${production.id}`}
                  </TableCell>
                  <TableCell>{production.species?.name ?? '—'}</TableCell>
                  <TableCell>{production.date ? formatDate(production.date) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={production.isOpen ? 'info' : 'secondary'}>
                      {production.isOpen ? 'Abierto' : 'Cerrado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimalWeight(production.totalInputWeight ?? 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimalWeight(production.totalOutputWeight ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && !error && meta.last_page > 1 && (
        <div className="flex flex-shrink-0 justify-center border-t pt-3">
          <PaginationFooter
            meta={{ totalPages: meta.last_page }}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
