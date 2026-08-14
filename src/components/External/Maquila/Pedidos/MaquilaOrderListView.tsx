'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useMaquilaOrderList } from '@/hooks/orders/useMaquilaOrderList';
import { MaquilaOrderFormSheet } from './MaquilaOrderFormSheet';
import type { MaquilaOrderStatus } from '@/types/maquilaOrder';

const PER_PAGE = 15;

const STATUS_TABS: { value: MaquilaOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'incident', label: 'Incidencia' },
  { value: 'finished', label: 'Finalizados' },
];

const STATUS_BADGE_VARIANT: Record<MaquilaOrderStatus, 'info' | 'destructive' | 'success'> = {
  pending: 'info',
  incident: 'destructive',
  finished: 'success',
};

const STATUS_LABEL: Record<MaquilaOrderStatus, string> = {
  pending: 'Pendiente',
  incident: 'Incidencia',
  finished: 'Finalizado',
};

export function MaquilaOrderListView() {
  const [status, setStatus] = useState<MaquilaOrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  const { data, meta, isLoading, error } = useMaquilaOrderList({
    status: status === 'all' ? undefined : status,
    page,
    perPage: PER_PAGE,
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-shrink-0 items-start justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Pedidos</h1>
          <p className="text-muted-foreground text-sm">Tus pedidos hacia tus clientes finales.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </Button>
      </div>

      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as MaquilaOrderStatus | 'all');
          setPage(1);
        }}
        className="flex-shrink-0"
      >
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
            title="No se pudieron cargar los pedidos"
            description={error}
            icon={<ClipboardList />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length === 0 && (
          <EmptyState
            title="Sin pedidos"
            description="Todavía no tienes pedidos en esta categoría."
            icon={<ClipboardList />}
            className="h-full"
          />
        )}

        {!isLoading && !error && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Fecha de carga</TableHead>
                <TableHead>Transporte</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Palets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/external/maquila/pedidos/${order.id}`)}
                >
                  <TableCell className="font-medium">
                    {order.buyerReference ?? `#${order.id}`}
                  </TableCell>
                  <TableCell>{order.loadDate ? formatDate(order.loadDate) : '—'}</TableCell>
                  <TableCell className="truncate">{order.transport?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{order.pallets}</TableCell>
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

      <MaquilaOrderFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(order) => router.push(`/external/maquila/pedidos/${order.id}`)}
      />
    </div>
  );
}
