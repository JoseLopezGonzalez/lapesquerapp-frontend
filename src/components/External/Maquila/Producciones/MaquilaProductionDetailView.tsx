'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatDecimalWeight } from '@/helpers/formats/numbers/formatNumbers';
import { useMaquilaProductionDetail } from '@/hooks/production/useMaquilaProductionDetail';
import { MaquilaProductionAttachmentsGrid } from './MaquilaProductionAttachmentsGrid';

const ProductionDiagram = dynamic(
  () => import('@/components/Admin/Productions/ProductionDiagram'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[600px] w-full rounded-lg" />,
  }
);

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium">{value}</span>
    </div>
  );
}

interface MaquilaProductionDetailViewProps {
  productionId: number | string;
}

export function MaquilaProductionDetailView({ productionId }: MaquilaProductionDetailViewProps) {
  const router = useRouter();
  const { production, processTree, isLoading, traceabilityLoading, error } =
    useMaquilaProductionDetail(productionId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/external/maquila/producciones')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              (production?.lot ?? `Lote #${productionId}`)
            )}
          </h1>
        </div>
        {production && (
          <Badge variant={production.isOpen ? 'info' : 'secondary'}>
            {production.isOpen ? 'Abierto' : 'Cerrado'}
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && !isLoading && <p className="text-destructive text-sm">{error}</p>}

      {production && !isLoading && (
        <Tabs defaultValue="resumen" className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="trazabilidad">Trazabilidad</TabsTrigger>
            <TabsTrigger value="adjuntos">Adjuntos</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-5 overflow-y-auto">
            <div className="divide-border divide-y">
              <InfoRow label="Especie" value={production.species?.name ?? '—'} />
              <InfoRow label="Zona de captura" value={production.captureZone?.name ?? '—'} />
              <InfoRow label="Fecha" value={production.date ? formatDate(production.date) : '—'} />
              <InfoRow
                label="Peso de entrada"
                value={formatDecimalWeight(production.totalInputWeight ?? 0)}
              />
              <InfoRow
                label="Peso de salida"
                value={formatDecimalWeight(production.totalOutputWeight ?? 0)}
              />
              <InfoRow label="Cajas de entrada" value={production.totalInputBoxes ?? 0} />
              <InfoRow label="Cajas de salida" value={production.totalOutputBoxes ?? 0} />
              {production.wastePercentage != null && (
                <InfoRow label="Merma" value={`${production.wastePercentage.toFixed(1)}%`} />
              )}
            </div>

            {production.notes && (
              <div>
                <p className="text-muted-foreground mb-1.5 text-[10px] font-medium tracking-wider uppercase">
                  Notas
                </p>
                <p className="text-sm leading-relaxed">{production.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trazabilidad" className="min-h-0 flex-1">
            <ProductionDiagram
              processTree={processTree}
              productionId={production.id}
              loading={traceabilityLoading}
              // El portal no tiene ruta /admin/productions/*/records/* — desactiva el botón
              // "ver detalle" del nodo en vez de dejarlo navegar a una ruta inaccesible.
              onNodeNavigate={null}
            />
          </TabsContent>

          <TabsContent value="adjuntos" className="overflow-y-auto">
            <MaquilaProductionAttachmentsGrid productionId={production.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
