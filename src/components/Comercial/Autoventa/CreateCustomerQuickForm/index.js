'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customerService } from '@/services/domain/customers/customerService';

export default function CreateCustomerQuickForm({ onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = name?.trim();
    if (!trimmed) {
      setError('El nombre es obligatorio.');
      return;
    }
    setLoading(true);
    try {
      const data = await customerService.create({ name: trimmed });
      const id = data?.id ?? data?.value;
      const customerName = data?.name ?? trimmed;
      onSuccess?.({ id, name: customerName });
    } catch (err) {
      if (typeof err?.json === 'function') {
        try {
          const errData = await err.json();
          const messages = errData?.errors ? Object.values(errData.errors).flat() : [errData?.message || 'Error al crear el cliente'];
          setError(messages.join(' '));
        } catch (_) {
          setError('Error al crear el cliente.');
        }
      } else {
        setError(err?.message || 'Error al crear el cliente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="customer-name">Nombre</Label>
        <Input
          id="customer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del cliente"
          disabled={loading}
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
