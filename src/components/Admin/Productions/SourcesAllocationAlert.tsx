'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatWeight } from '@/helpers/production/formatters';
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers';
import { calculateSourcesAllocation } from '@/helpers/production/sourcesAllocation';
import type {
  ProductionInputNormalized,
  ProductionOutputConsumptionNormalized,
  ProductionOutputNormalized,
} from '@/types/production';

interface SourcesAllocationAlertProps {
  inputs?: ProductionInputNormalized[] | null;
  parentOutputConsumptions?: ProductionOutputConsumptionNormalized[] | null;
  outputs?: ProductionOutputNormalized[] | null;
}

/**
 * Aviso de integridad de datos: indica si alguna fuente (materia prima de stock o consumo del
 * proceso padre) del nodo no está completamente repartida entre sus salidas — señal de que el
 * reparto se hizo con una merma/rendimiento desactualizada. No se muestra si todo está dentro
 * de la tolerancia de redondeo esperada (ver src/helpers/production/sourcesAllocation.ts).
 */
export function SourcesAllocationAlert({
  inputs,
  parentOutputConsumptions,
  outputs,
}: SourcesAllocationAlertProps) {
  const allocation = useMemo(
    () => calculateSourcesAllocation(inputs, parentOutputConsumptions, outputs),
    [inputs, parentOutputConsumptions, outputs]
  );

  if (!allocation.hasIssues) return null;

  const flaggedSources = allocation.sources.filter((source) => source.status !== 'ok');
  const isCritical = allocation.worstSeverity === 'critical';

  return (
    <Alert
      className={
        isCritical
          ? 'mb-4 border-destructive/40 bg-destructive/5'
          : 'mb-4 border-warning/40 bg-warning/10'
      }
    >
      <AlertTriangle className={isCritical ? 'text-destructive' : 'text-warning-foreground'} />
      <AlertTitle className={isCritical ? 'text-destructive' : 'text-warning-foreground'}>
        Reparto de fuentes incompleto
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Alguna fuente de este proceso no está asignada al 100% a las salidas. Revisa el
          reparto en &quot;Gestionar salidas&quot; — puede deberse a que se asignaron fuentes antes
          de que la merma/rendimiento del nodo estuviera actualizada.
        </p>
        <ul className="space-y-1">
          {flaggedSources.map((source) => (
            <li key={source.key} className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 truncate">
                {source.productName || (source.sourceType === 'parent_output' ? 'Proceso anterior' : 'Producto')}
              </span>
              <Badge variant={source.severity === 'critical' ? 'destructive' : 'warning'} className="shrink-0">
                {source.status === 'over_allocated'
                  ? `Sobre-asignado ${formatWeight(Math.abs(source.gapWeight))}`
                  : `${formatWeight(source.gapWeight)} sin asignar (${formatDecimal(source.gapPercentage)}%)`}
              </Badge>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export default SourcesAllocationAlert;
