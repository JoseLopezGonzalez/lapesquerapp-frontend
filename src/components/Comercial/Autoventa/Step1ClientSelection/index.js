'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getCustomersOptions } from '@/services/customerService';
import CreateCustomerQuickForm from '../CreateCustomerQuickForm';

export default function Step1ClientSelection({
  state,
  setCustomer,
  setDates,
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

  const entryDate = state.entryDate;
  const loadDate = state.loadDate;
  const entryAsDate = entryDate ? (typeof entryDate === 'string' ? new Date(entryDate) : entryDate) : new Date();
  const loadAsDate = loadDate ? (typeof loadDate === 'string' ? new Date(loadDate) : loadDate) : new Date();

  const handleEntryChange = (date) => {
    const str = date ? date.toISOString().slice(0, 10) : state.entryDate;
    setDates(str, loadDate);
  };
  const handleLoadChange = (date) => {
    const str = date ? date.toISOString().slice(0, 10) : state.loadDate;
    setDates(entryDate, str);
  };

  const handleNewCustomerSuccess = ({ id, name }) => {
    setCustomer(id, name);
    setNewCustomerOpen(false);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha de entrada</label>
          <DatePicker
            date={entryAsDate}
            onChange={handleEntryChange}
            formatStyle="short"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha de carga</label>
          <DatePicker
            date={loadAsDate}
            onChange={handleLoadChange}
            formatStyle="short"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cliente</label>
        <div className="flex gap-2">
          <Select
            value={state.customerId != null ? String(state.customerId) : ''}
            onValueChange={(value) => {
              const opt = customerOptions.find((o) => o.value === value);
              setCustomer(value, opt?.label ?? value);
            }}
            disabled={loadingCustomers}
          >
            <SelectTrigger className="flex-1" loading={loadingCustomers} options={customerOptions}>
              <SelectValue placeholder="Selecciona una opción" options={customerOptions} />
            </SelectTrigger>
            <SelectContent loading={loadingCustomers}>
              {customerOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Sheet open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline">
                + Nuevo cliente
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
        </div>
      </div>

    </div>
  );
}
