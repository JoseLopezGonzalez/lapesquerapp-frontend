'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getCustomersOptions } from '@/services/customerService';
import CreateCustomerQuickForm from '../CreateCustomerQuickForm';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { UserRound, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Step1ClientSelection({
  state,
  setCustomer,
}) {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [customerOptions, setCustomerOptions] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoadingCustomers(true);
    getCustomersOptions(token)
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.data ?? [];
        setCustomerOptions(raw.map((c) => ({ value: String(c.id), label: c.name })));
      })
      .catch(() => setCustomerOptions([]))
      .finally(() => setLoadingCustomers(false));
  }, [token]);

  const fetchCustomers = () => {
    if (!token) return;
    getCustomersOptions(token)
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.data ?? [];
        setCustomerOptions(raw.map((c) => ({ value: String(c.id), label: c.name })));
      })
      .catch(() => {});
  };

  const handleNewCustomerSuccess = ({ id, name }) => {
    setCustomer(id, name);
    setNewCustomerOpen(false);
    fetchCustomers();
  };

  const selectedId = state.customerId != null ? String(state.customerId) : null;

  return (
    <div className="w-full max-w-[420px] flex flex-col flex-1 min-h-0 gap-4">
      <Sheet open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
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
          <div className="mt-4">
            <CreateCustomerQuickForm
              onSuccess={handleNewCustomerSuccess}
              onCancel={() => setNewCustomerOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1 min-h-0 rounded-lg border overflow-y-auto overflow-x-hidden flex flex-col">
        {loadingCustomers ? (
          <div className="flex flex-1 items-center justify-center w-full min-h-0">
            <Loader />
          </div>
        ) : (
        <div className="flex flex-col gap-2 p-3 pr-4">
          {customerOptions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center w-full py-6 min-h-0">
              <EmptyState
                icon={<UserRound className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                title="No hay clientes"
                description="No hay clientes disponibles o crea uno con el botón «Nuevo cliente»."
              />
            </div>
          ) : (
            customerOptions.map((opt, idx) => {
              const isSelected = selectedId != null && String(opt.value) === String(selectedId);
              return (
                <button
                  key={opt.value ?? idx}
                  type="button"
                  onClick={() => setCustomer(isSelected ? null : opt.value, isSelected ? null : opt.label)}
                  className={cn(
                    'w-full text-left rounded-lg border-2 px-4 py-3 transition-colors touch-manipulation min-h-[56px] flex flex-col justify-center gap-0.5',
                    isSelected
                      ? 'border-primary border-l-4 bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  )}
                >
                  <span className="font-medium text-foreground">{opt.label}</span>
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
