'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
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
import { useMaquilaReceptionList } from '@/hooks/receptions/useMaquilaReceptionList';

const PER_PAGE = 15;

export function MaquilaReceptionListView() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { data, meta, isLoading, error } = useMaquilaReceptionList({ page, perPage: PER_PAGE });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex-shrink-0 space-y-1">
        <h1 className="text-xl font-semibold">Recepciones</h1>
        <p className="text-muted-foreground text-sm">Tus recepciones de materia prima.</p>
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
            title="No se pudieron cargar las recepciones"
            description={error}
            icon={<PackageCheck />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length === 0 && (
          <EmptyState
            title="Sin recepciones"
            description="Todavía no tienes recepciones registradas."
            icon={<PackageCheck />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Especies</TableHead>
                <TableHead className="text-right">Peso declarado</TableHead>
                <TableHead className="text-right">Peso real</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((reception) => (
                <TableRow
                  key={reception.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/external/maquila/recepciones/${reception.id}`)}
                >
                  <TableCell className="font-medium">{formatDate(reception.date)}</TableCell>
                  <TableCell className="truncate">{reception.species.join(', ') || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimalWeight(reception.declaredTotalNetWeight)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDecimalWeight(reception.netWeight)}
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
