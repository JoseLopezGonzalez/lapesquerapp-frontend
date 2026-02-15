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
import { Plus, Trash2, ArrowRight, Package, List, Edit, Loader2 } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import {
  formatDecimal,
  formatDecimalWeight,
  formatDecimalCurrency,
} from '@/helpers/formats/numbers/formatNumbers';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import dynamic from 'next/dynamic';
import { normalizeDate } from '@/helpers/receptionCalculations';
import { useAdminReceptionForm } from '@/hooks/useAdminReceptionForm';
import { VirtualizedTable } from '../VirtualizedTable';

const PalletDialog = dynamic(
  () => import('@/components/Admin/Pallets/PalletDialog'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">Cargando...</div>
    ),
    ssr: false,
  }
);

const TARE_OPTIONS = [
  { value: '1', label: '1kg' },
  { value: '2', label: '2kg' },
  { value: '3', label: '3kg' },
  { value: '4', label: '4kg' },
  { value: '5', label: '5kg' },
];

export default function CreateReceptionForm({ onSuccess }) {
  const form = useAdminReceptionForm({ onSuccess });
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    errors,
    isSubmitting,
    fields,
    remove,
    append,
    currentDetails,
    linesTotals,
    triggerRecalc,
    mode,
    handleModeChange,
    handleConfirmModeChange,
    handleCancelModeChange,
    isModeChangeDialogOpen,
    setIsModeChangeDialogOpen,
    temporalPallets,
    palletsDisplayData,
    updatePalletPrice,
    removePallet,
    openAddPallet,
    openEditPallet,
    isPalletDialogOpen,
    editingPalletIndex,
    handlePalletSave,
    handlePalletClose,
    initialPalletForEdit,
    handleCreate,
    handleSaveClick,
    productOptions,
    productsLoading,
    supplierOptions,
    suppliersLoading,
    announce,
    Announcer,
  } = form;

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
        <h1 className="text-2xl font-semibold mb-4">Recepción de materia prima</h1>
        <Button
          type="button"
          onClick={handleSaveClick}
          disabled={isSubmitting}
          aria-label="Guardar recepción"
          title="Guardar recepción (Ctrl+S)"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando
            </>
          ) : (
            <>
              Aceptar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit(handleCreate)} className="flex flex-col gap-8">
        {/* Supplier and Date */}
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
                      aria-label="Seleccionar fecha de recepción"
                      aria-required="true"
                    />
                  );
                }}
              />
              {errors.date && (
                <p className="text-destructive text-sm">{errors.date.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
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

        {/* Mode Tabs */}
        <div className="w-full">
          <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
            <TabsList className="w-fit">
              <TabsTrigger value="automatic">
                <List className="h-4 w-4 mr-2" />
                Por Líneas
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Package className="h-4 w-4 mr-2" />
                Por Palets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="automatic" className="mt-4">
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
                          <TableHead>Cajas</TableHead>
                          <TableHead>Tara</TableHead>
                          <TableHead>Peso Neto</TableHead>
                          <TableHead>Precio (€/kg)</TableHead>
                          <TableHead>Importe</TableHead>
                          <TableHead>Lote</TableHead>
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
                                rules={{
                                  required:
                                    mode === 'automatic'
                                      ? 'El producto es obligatorio'
                                      : false,
                                }}
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
                                    aria-required={mode === 'automatic'}
                                    loading={productsLoading}
                                  />
                                )}
                              />
                              {errors.details?.[index]?.product && (
                                <p className="text-destructive text-xs mt-1">
                                  {
                                    errors.details[index].product.message
                                  }
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`details.${index}.grossWeight`}
                                control={control}
                                rules={{
                                  required:
                                    mode === 'automatic'
                                      ? 'El peso bruto es obligatorio'
                                      : false,
                                  min:
                                    mode === 'automatic'
                                      ? {
                                          value: 0.01,
                                          message: 'El peso debe ser mayor que 0',
                                        }
                                      : undefined,
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
                                    aria-required={mode === 'automatic'}
                                  />
                                )}
                              />
                              {errors.details?.[index]?.grossWeight && (
                                <p className="text-destructive text-xs mt-1">
                                  {
                                    errors.details[index].grossWeight.message
                                  }
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentBoxes =
                                      parseInt(watch(`details.${index}.boxes`)) ||
                                      1;
                                    if (currentBoxes > 1) {
                                      setValue(
                                        `details.${index}.boxes`,
                                        currentBoxes - 1
                                      );
                                      setTimeout(() => triggerRecalc(), 0);
                                    }
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  -
                                </Button>
                                <Controller
                                  name={`details.${index}.boxes`}
                                  control={control}
                                  rules={{
                                    required:
                                      mode === 'automatic'
                                        ? 'Las cajas son obligatorias'
                                        : false,
                                    min:
                                      mode === 'automatic'
                                        ? {
                                            value: 1,
                                            message: 'Mínimo 1 caja',
                                          }
                                        : undefined,
                                  }}
                                  render={({
                                    field: { onChange, value, ...field },
                                  }) => (
                                    <Input
                                      {...field}
                                      type="number"
                                      min="1"
                                      value={value || 1}
                                      onChange={(e) => onChange(e.target.value)}
                                      className="w-16 text-center"
                                      aria-label={`Número de cajas para línea ${index + 1}`}
                                      aria-required={mode === 'automatic'}
                                    />
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentBoxes =
                                      parseInt(
                                        watch(`details.${index}.boxes`)
                                      ) || 1;
                                    setValue(
                                      `details.${index}.boxes`,
                                      currentBoxes + 1
                                    );
                                    setTimeout(() => triggerRecalc(), 0);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  +
                                </Button>
                              </div>
                              {errors.details?.[index]?.boxes && (
                                <p className="text-destructive text-xs mt-1">
                                  {
                                    errors.details[index].boxes.message
                                  }
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
                                      ? formatDecimal(
                                          parseFloat(netWeight) || 0
                                        )
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
                                render={({
                                  field: { onChange, value, ...field },
                                }) => (
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
                                    const netWeight =
                                      parseFloat(detail?.netWeight) || 0;
                                    const price =
                                      parseFloat(detail?.price) || 0;
                                    return formatDecimalCurrency(
                                      netWeight * price
                                    );
                                  })()
                                }
                                aria-label={`Importe para línea ${index + 1}`}
                                aria-readonly="true"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                {...register(`details.${index}.lot`)}
                                placeholder="Lote (opcional)"
                                className="w-32"
                                aria-label={`Lote para línea ${index + 1}`}
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
                          <TableCell
                            colSpan={4}
                            className="text-right font-semibold"
                          >
                            Total
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatDecimalWeight(linesTotals.totalKg)}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="font-semibold">
                            {formatDecimalCurrency(linesTotals.totalAmount)}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
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
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Palets de la Recepción
                  </h3>
                  <Button type="button" variant="outline" onClick={openAddPallet}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Palet
                  </Button>
                </div>
                <Separator />

                {temporalPallets.length === 0 ? (
                  <Card>
                    <CardContent className="py-8">
                      <EmptyState
                        title="No hay palets agregados"
                        description="Haz clic en 'Agregar Palet' para crear el primer palet de esta recepción"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <VirtualizedTable
                    items={palletsDisplayData}
                    headers={[
                      { label: '#', className: '' },
                      { label: 'Observaciones', className: '' },
                      { label: 'Cajas', className: '' },
                      { label: 'Peso Neto', className: '' },
                      {
                        label: 'Producto - Lote / Precio (€/kg)',
                        className: '',
                      },
                      { label: 'Acciones', className: 'w-[120px]' },
                    ]}
                    threshold={50}
                    rowHeight={80}
                    renderRow={(displayItem, index) => {
                      const { item, pallet, productLotCombinations } =
                        displayItem;
                      const prices = item.prices || {};

                      return (
                        <>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="text-sm">
                              {item.observations || (
                                <span className="text-muted-foreground italic">
                                  Sin observaciones
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pallet.numberOfBoxes || pallet.boxes?.length || 0}
                          </TableCell>
                          <TableCell>
                            {formatDecimalWeight(pallet.netWeight || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {productLotCombinations.length === 0 ? (
                                <span className="text-sm text-muted-foreground">
                                  No hay productos
                                </span>
                              ) : (
                                productLotCombinations.map((combo, comboIdx) => {
                                  const priceKey = `${combo.productId}-${combo.lot}`;
                                  const currentPrice = prices[priceKey] || '';

                                  return (
                                    <div
                                      key={comboIdx}
                                      className="flex items-center gap-3 py-1 border-b last:border-0"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">
                                            {combo.productName}
                                          </span>
                                          <span className="text-xs text-muted-foreground font-mono">
                                            ({combo.lot})
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {combo.boxesCount} cajas ·{' '}
                                            {formatDecimalWeight(
                                              combo.totalNetWeight
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={currentPrice}
                                        onChange={(e) => {
                                          const newPrice = e.target.value;
                                          updatePalletPrice(
                                            index,
                                            priceKey,
                                            newPrice
                                          );
                                          announce(
                                            `Precio actualizado para ${combo.productName}`,
                                            'polite'
                                          );
                                        }}
                                        placeholder="0.00"
                                        className="w-28 h-8"
                                        aria-label={`Precio para ${combo.productName}, lote ${combo.lot}`}
                                      />
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditPallet(index)}
                                aria-label={`Editar palet ${index + 1}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removePallet(index)}
                                aria-label={`Eliminar palet ${index + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      );
                    }}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>

      <PalletDialog
        palletId="new"
        isOpen={isPalletDialogOpen}
        initialPallet={initialPalletForEdit}
        onSaveTemporal={handlePalletSave}
        onChange={() => {}}
        onCloseDialog={handlePalletClose}
      />

      <Dialog
        open={isModeChangeDialogOpen}
        onOpenChange={setIsModeChangeDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Cambiar modo de recepción
            </DialogTitle>
            <DialogDescription>
              {mode === 'automatic'
                ? 'Ya has agregado líneas de producto en el modo "Por Líneas". Si cambias a "Por Palets", se perderán todos los datos ingresados.'
                : 'Ya has agregado palets en el modo "Por Palets". Si cambias a "Por Líneas", se perderán todos los palets ingresados.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas cambiar de modo? Esta acción eliminará
              todos los datos del modo actual y no se puede deshacer.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelModeChange}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmModeChange}>
              Cambiar y eliminar datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
