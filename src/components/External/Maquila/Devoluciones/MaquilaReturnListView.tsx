'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Undo2 } from 'lucide-react';
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
import { useMaquilaReturnList } from '@/hooks/tollClientReturns/useMaquilaReturnList';

const PER_PAGE = 15;

export function MaquilaReturnListView() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, meta, isLoading, error } = useMaquilaReturnList({ page, perPage: PER_PAGE });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex-shrink-0 space-y-1">
        <h1 className="text-xl font-semibold">Devoluciones</h1>
        <p className="text-muted-foreground text-sm">Mercancía devuelta a tu almacén.</p>
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
            title="No se pudieron cargar las devoluciones"
            description={error}
            icon={<Undo2 />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length === 0 && (
          <EmptyState
            title="Sin devoluciones"
            description="No tienes devoluciones registradas todavía."
            icon={<Undo2 />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Palets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tollClientReturn) => (
                <TableRow
                  key={tollClientReturn.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() =>
                    router.push(`/external/maquila/devoluciones/${tollClientReturn.id}`)
                  }
                >
                  <TableCell className="font-medium">{formatDate(tollClientReturn.date)}</TableCell>
                  <TableCell className="truncate">
                    {tollClientReturn.documentReference ?? '—'}
                  </TableCell>
                  <TableCell className="truncate">{tollClientReturn.reason ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tollClientReturn.pallets.length}
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
