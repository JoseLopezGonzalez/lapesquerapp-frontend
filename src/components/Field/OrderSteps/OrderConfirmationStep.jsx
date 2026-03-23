'use client';

import { Card, CardContent } from '@/components/ui/card';
import { WizardEmptyStep } from './WizardEmptyStep';

export function OrderConfirmationStep({ totalAmount }) {
  const canSave = Number(totalAmount) > 0;

  return (
    <div className="w-full max-w-[420px] space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          {canSave ? (
            <>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Total estimado a guardar</p>
                <p className="text-2xl font-semibold">{Number(totalAmount ?? 0).toFixed(2)} €</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Se guardará el conjunto completo de líneas servidas del pedido, sin modificar su estado.
              </p>
            </>
          ) : (
            <WizardEmptyStep
              title="Nada que confirmar todavía"
              description="Antes de guardar tienes que registrar cajas para construir el contenido real del pedido."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
