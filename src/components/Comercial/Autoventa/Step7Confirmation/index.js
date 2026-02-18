'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Step7Confirmation({
  state,
  totalAmount,
  submitAutoventa,
  setCreatedOrder,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const order = await submitAutoventa();
      setCreatedOrder(order);
    } catch (err) {
      setError(err?.message ?? 'Error al crear la autoventa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p>
        Has completado todos los datos para generar una autoventa.
      </p>
      <p className="text-lg font-semibold">
        Total: {Number(totalAmount ?? 0).toFixed(2)} €
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button variant="destructive" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creando...' : 'Terminar'}
        </Button>
      </div>
    </div>
  );
}
