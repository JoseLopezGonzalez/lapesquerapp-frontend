'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useFieldCustomerOptions } from '@/hooks/useFieldOptions';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Plus, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FieldStep1ClientSelection({ state, setCustomer, setNewCustomerName }) {
  const { options: fieldCustomerOptions, isLoading: loadingCustomers } = useFieldCustomerOptions();
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [draftNewCustomerName, setDraftNewCustomerName] = useState('');

  const customerOptions = useMemo(() => {
    const merged = [];
    if (state.newCustomerName) {
      merged.push({
        value: '__new_customer__',
        label: state.newCustomerName,
        isNewCustomer: true,
      });
    }
    (fieldCustomerOptions || []).forEach((option) => {
      if (!merged.some((item) => String(item.value) === String(option.value))) {
        merged.push(option);
      }
    });
    return merged;
  }, [fieldCustomerOptions, state.newCustomerName]);

  useEffect(() => {
    if (state.customerId == null || state.customerName != null) return;
    const selected = customerOptions.find(
      (option) => String(option.value) === String(state.customerId)
    );
    if (selected) {
      setCustomer(selected.value, selected.label);
    }
  }, [state.customerId, state.customerName, customerOptions, setCustomer]);

  const handleNewCustomerSave = () => {
    const trimmed = draftNewCustomerName.trim();
    if (!trimmed) return;
    setNewCustomerName(trimmed);
    setNewCustomerOpen(false);
    setDraftNewCustomerName('');
  };

  const selectedId = state.customerId != null ? String(state.customerId) : null;
  const isNewCustomerSelected = Boolean(state.newCustomerName) && state.customerId == null;

  return (
    <div className="flex min-h-0 w-full max-w-[420px] flex-1 flex-col gap-4">
      <Sheet
        open={newCustomerOpen}
        onOpenChange={(open) => {
          setNewCustomerOpen(open);
          if (!open) {
            setDraftNewCustomerName('');
          }
        }}
      >
        <SheetTrigger asChild>
          <Button type="button" className="w-full shrink-0" size="lg">
            <Plus className="h-5 w-5 shrink-0" />
            Nuevo cliente
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nuevo cliente</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-new-customer-name">Nombre</Label>
              <Input
                id="field-new-customer-name"
                value={draftNewCustomerName}
                onChange={(event) => setDraftNewCustomerName(event.target.value)}
                placeholder="Nombre del nuevo cliente"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setNewCustomerOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleNewCustomerSave}
                disabled={!draftNewCustomerName.trim()}
              >
                Guardar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-lg border">
        {loadingCustomers ? (
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <Loader />
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-3 pr-4">
            {customerOptions.length === 0 ? (
              <div className="flex min-h-0 w-full flex-1 items-center justify-center py-6">
                <EmptyState
                  icon={<UserRound className="text-primary h-12 w-12" strokeWidth={1.5} />}
                  title="No hay clientes"
                  description="No hay clientes disponibles o crea uno con el botón «Nuevo cliente»."
                />
              </div>
            ) : (
              customerOptions.map((opt, idx) => {
                const isSelected = opt.isNewCustomer
                  ? isNewCustomerSelected
                  : selectedId != null && String(opt.value) === String(selectedId);
                return (
                  <button
                    key={opt.value ?? idx}
                    type="button"
                    onClick={() => {
                      if (opt.isNewCustomer) {
                        setNewCustomerName(isSelected ? '' : opt.label);
                        return;
                      }
                      setCustomer(isSelected ? null : opt.value, isSelected ? null : opt.label);
                    }}
                    className={cn(
                      'flex min-h-[56px] w-full touch-manipulation flex-col justify-center gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5 border-l-4'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-foreground font-medium">{opt.label}</span>
                    {opt.isNewCustomer && (
                      <span className="text-muted-foreground text-sm">
                        Se creará al confirmar la autoventa
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
