'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
 * Aviso de reparto pendiente: indica si alguna fuente (materia prima de stock o consumo del
 * proceso padre) del nodo todavía no está asignada por completo a las salidas. No implica que
 * haya un error — puede ser simplemente que falte terminar de repartir, manual o
 * automáticamente. El detalle por fuente se consulta en "Gestionar salidas", no aquí.
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
        Reparto de fuentes pendiente
      </AlertTitle>
      <AlertDescription>
        Revisa el apartado de fuentes en &quot;Gestionar salidas&quot; para completar el reparto.
      </AlertDescription>
    </Alert>
  );
}

export default SourcesAllocationAlert;
