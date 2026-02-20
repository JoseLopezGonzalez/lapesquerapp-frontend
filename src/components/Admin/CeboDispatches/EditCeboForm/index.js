'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import {
  formatDecimal,
  formatDecimalWeight,
  formatDecimalCurrency,
} from '@/helpers/formats/numbers/formatNumbers';
import { normalizeDate } from '@/helpers/receptionCalculations';
import { useAdminCeboFormEdit } from '@/hooks/useAdminCeboFormEdit';
import Loader from '@/components/Utilities/Loader';
import { CEBO_EXPORT_TYPE_OPTIONS, CEBO_EXPORT_TYPE_SENTINEL } from '@/constants/ceboExportTypes';

const TARE_OPTIONS = [
  { value: '1', label: '1kg' },
  { value: '2', label: '2kg' },
  { value: '3', label: '3kg' },
  { value: '4', label: '4kg' },
  { value: '5', label: '5kg' },
];

export default function EditCeboForm({ dispatchId, onSuccess }) {
  const form = useAdminCeboFormEdit({ dispatchId, onSuccess });
  const {
    register,
    handleSubmit,
    control,
    errors,
    isSubmitting,
    fields,
    remove,
    append,
    currentDetails,
    linesTotals,
    triggerRecalc,
    handleCreate,
    handleSaveClick,
    productOptions,
    productsLoading,
    supplierOptions,
    suppliersLoading,
    loading,
    Announcer,
  } = form;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (suppliersLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6">
      <Announcer />

      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-semibold mb-4">Editar salida de cebo</h1>
        <Button
          type="button"
          onClick={handleSaveClick}
          disabled={isSubmitting}
          aria-label="Guardar cambios"
          title="Guardar cambios (Ctrl+S)"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando
            </>
          ) : (
            <>
              Guardar
              <Save className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-8">
        <div className="w-full">
          <h3 className="text-sm font-medium text-muted-foreground">
            Información General
          </h3>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Controller
                name="supplier"
                control={control}
                rules={{ required: 'El proveedor es obligatorio' }}
                render={({ field: { onChange, value } }) => (
                  <Combobox
                    options={supplierOptions}
                    value={value}
                    onChange={onChange}
                    placeholder="Seleccionar proveedor"
                    searchPlaceholder="Buscar proveedor..."
                    notFoundMessage="No se encontraron proveedores"
                    aria-label="Seleccionar proveedor"
                    aria-required="true"
                    loading={suppliersLoading}
                  />
                )}
              />
              {errors.supplier && (
                <p className="text-destructive text-sm">{errors.supplier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Controller
                name="date"
                control={control}
                rules={{ required: 'La fecha es obligatoria' }}
                render={({ field: { onChange, value } }) => {
                  const normalizedValue =
                    value instanceof Date && !isNaN(value.getTime())
                      ? value
                      : normalizeDate(value || new Date());
                  const handleDateChange = (newDate) => {
                    onChange(normalizeDate(newDate));
                  };
                  return (
                    <DatePicker
                      date={normalizedValue}
                      onChange={handleDateChange}
                      formatStyle="short"
                      aria-label="Seleccionar fecha"
                      aria-required="true"
                    />
                  );
                }}
              />
              {errors.date && (
                <p className="text-destructive text-sm">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exportType">Tipo de exportación</Label>
              <Controller
                name="exportType"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    value={value === null || value === '' ? CEBO_EXPORT_TYPE_SENTINEL : value}
                    onValueChange={(v) => onChange(v === CEBO_EXPORT_TYPE_SENTINEL ? null : v)}
                  >
                    <SelectTrigger id="exportType" className="w-full">
                      <SelectValue placeholder="Por defecto del proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {CEBO_EXPORT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-sm font-medium text-muted-foreground">
            Observaciones
          </h3>
          <Separator className="my-2" />
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones / Lonja</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Ingrese observaciones..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Líneas de Producto
          </h3>
          <Separator className="my-2" />
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead>Peso Bruto</TableHead>
                    <TableHead>Tara</TableHead>
                    <TableHead>Peso Neto</TableHead>
                    <TableHead>Precio (€/kg)</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`details.${index}.product`}
                          control={control}
                          rules={{ required: 'El producto es obligatorio' }}
                          render={({ field: { onChange, value } }) => (
                            <Combobox
                              options={productOptions}
                              value={value}
                              onChange={onChange}
                              placeholder="Seleccionar producto"
                              searchPlaceholder="Buscar producto..."
                              notFoundMessage="No se encontraron productos"
                              className="min-w-[200px]"
                              aria-label={`Producto para línea ${index + 1}`}
                              aria-required
                              loading={productsLoading}
                            />
                          )}
                        />
                        {errors.details?.[index]?.product && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.details[index].product.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`details.${index}.grossWeight`}
                          control={control}
                          rules={{
                            required: 'El peso bruto es obligatorio',
                            min: { value: 0.01, message: 'El peso debe ser mayor que 0' },
                          }}
                          render={({ field: { onChange, value, ...field } }) => (
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              value={value || ''}
                              onChange={(e) => {
                                onChange(e.target.value);
                                setTimeout(() => triggerRecalc(), 0);
                              }}
                              placeholder="0.00"
                              className="w-32"
                              aria-label={`Peso bruto para línea ${index + 1}`}
                              aria-required
                            />
                          )}
                        />
                        {errors.details?.[index]?.grossWeight && (
                          <p className="text-destructive text-xs mt-1">
                            {errors.details[index].grossWeight.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`details.${index}.tare`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              value={value}
                              onValueChange={(newValue) => {
                                onChange(newValue);
                                setTimeout(() => triggerRecalc(), 0);
                              }}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TARE_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          readOnly
                          className="w-32 bg-muted"
                          placeholder="0,00"
                          value={
                            (() => {
                              const detail = currentDetails?.[index];
                              const netWeight = detail?.netWeight;
                              return netWeight
                                ? formatDecimal(parseFloat(netWeight) || 0)
                                : '0,00';
                            })()
                          }
                          aria-label={`Peso neto calculado para línea ${index + 1}`}
                          aria-readonly="true"
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`details.${index}.price`}
                          control={control}
                          render={({ field: { onChange, value, ...field } }) => (
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              value={value || ''}
                              onChange={(e) => {
                                onChange(e.target.value);
                                setTimeout(() => triggerRecalc(), 0);
                              }}
                              placeholder="0.00"
                              className="w-32"
                              aria-label={`Precio por kilogramo para línea ${index + 1}`}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          readOnly
                          className="w-32 bg-muted"
                          placeholder="0,00 €"
                          value={
                            (() => {
                              const detail = currentDetails?.[index];
                              const netWeight = parseFloat(detail?.netWeight) || 0;
                              const price = parseFloat(detail?.price) || 0;
                              return formatDecimalCurrency(netWeight * price);
                            })()
                          }
                          aria-label={`Importe para línea ${index + 1}`}
                          aria-readonly="true"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                          aria-label={`Eliminar línea ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatDecimalWeight(linesTotals.totalKg)}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-semibold">
                      {formatDecimalCurrency(linesTotals.totalAmount)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={append}
              className="w-full"
              aria-label="Agregar nueva línea de producto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar línea
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
