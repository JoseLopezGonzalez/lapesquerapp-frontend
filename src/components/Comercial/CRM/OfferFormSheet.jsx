'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { useOrderFormOptions } from '@/hooks/useOrderFormOptions';
import { useOfferMutations } from '@/hooks/useOffers';
import { useProspectsList, useProspect } from '@/hooks/useProspects';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useTaxOptions } from '@/hooks/useTaxOptions';
import { notify } from '@/lib/notifications';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { formatProspectSelectLabel, prospectWebsiteToHref } from './utils';

function emptyLine(currency = 'EUR') {
  return {
    productId: '',
    description: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    taxId: '',
    boxes: '',
    currency,
  };
}

export default function OfferFormSheet({
  open,
  onOpenChange,
  initialData = null,
  fixedProspectId = null,
  fixedCustomerId = null,
  onSaved = null,
}) {
  const catalogEnabled = open;
  const { options, loading: optionsLoading } = useOrderFormOptions({ enabled: catalogEnabled });
  const { productOptions, loading: productsLoading } = useProductOptions({ enabled: catalogEnabled });
  const { taxOptions } = useTaxOptions({ enabled: catalogEnabled });
  const { data: prospects } = useProspectsList({ perPage: 100, enabled: open && !fixedCustomerId });
  const { data: customers } = useCustomersList({ perPage: 100, enabled: open && !fixedProspectId });
  const { data: linkedProspect } = useProspect(fixedProspectId);
  const { createOffer, updateOffer } = useOfferMutations();
  const [targetType, setTargetType] = useState(fixedCustomerId ? 'customer' : 'prospect');
  const [targetId, setTargetId] = useState(fixedProspectId ? String(fixedProspectId) : fixedCustomerId ? String(fixedCustomerId) : '');
  const [validUntil, setValidUntil] = useState(initialData?.validUntil ? new Date(initialData.validUntil) : null);
  const [incotermId, setIncotermId] = useState('');
  const [paymentTermId, setPaymentTermId] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);

  useEffect(() => {
    if (!open) return;
    setTargetType(fixedCustomerId ? 'customer' : 'prospect');
    setTargetId(
      fixedProspectId
        ? String(fixedProspectId)
        : fixedCustomerId
          ? String(fixedCustomerId)
          : initialData?.prospectId
            ? String(initialData.prospectId)
            : initialData?.customerId
              ? String(initialData.customerId)
              : ''
    );
    setValidUntil(initialData?.validUntil ? new Date(initialData.validUntil) : null);
    setIncotermId(initialData?.incoterm?.id ? String(initialData.incoterm.id) : initialData?.incotermId ? String(initialData.incotermId) : '');
    setPaymentTermId(
      initialData?.paymentTerm?.id ? String(initialData.paymentTerm.id) : initialData?.paymentTermId ? String(initialData.paymentTermId) : ''
    );
    setCurrency(initialData?.currency ?? 'EUR');
    setNotes(initialData?.notes ?? '');
    setLines(
      initialData?.lines?.length
        ? initialData.lines.map((line) => ({
            productId: line.product?.id ? String(line.product.id) : line.productId ? String(line.productId) : '',
            description: line.description ?? '',
            quantity: line.quantity ?? '',
            unit: line.unit ?? 'kg',
            unitPrice: line.unitPrice ?? '',
            taxId: line.tax?.id ? String(line.tax.id) : line.taxId ? String(line.taxId) : '',
            boxes: line.boxes ?? '',
            currency: line.currency ?? initialData?.currency ?? 'EUR',
          }))
        : [emptyLine(initialData?.currency ?? 'EUR')]
    );
  }, [fixedCustomerId, fixedProspectId, initialData, open]);

  const title = useMemo(() => (initialData ? 'Editar oferta' : 'Nueva oferta'), [initialData]);
  const linkedWebsiteTrim = linkedProspect?.website?.trim() ?? '';
  const linkedWebsiteHref = linkedWebsiteTrim ? prospectWebsiteToHref(linkedWebsiteTrim) : null;
  const targetOptions = targetType === 'prospect' ? prospects : customers;
  const isFixedTarget = Boolean(fixedProspectId || fixedCustomerId);

  const updateLine = (index, key, value) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)));
  };

  const addLine = () => setLines((current) => [...current, emptyLine(currency)]);
  const removeLine = (index) => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));

  const handleSubmit = async () => {
    if (!targetId) {
      notify.error({ title: 'Selecciona un destinatario' });
      return;
    }

    const productLabelById = new Map(productOptions.map((option) => [String(option.value), option.label]));

    const cleanedLines = lines
      .map((line) => ({
        productId: line.productId ? Number(line.productId) : null,
        description: (line.description.trim() || productLabelById.get(String(line.productId)) || '').trim(),
        quantity: Number(line.quantity || 0),
        unit: line.unit || 'kg',
        unitPrice: Number(line.unitPrice || 0),
        taxId: line.taxId ? Number(line.taxId) : null,
        boxes: line.boxes === '' ? null : Number(line.boxes),
        currency: line.currency || currency,
      }))
      .filter((line) => line.productId != null || line.description);

    if (cleanedLines.length === 0) {
      notify.error({ title: 'Añade al menos una línea de oferta' });
      return;
    }

    const payload = {
      ...(targetType === 'prospect' ? { prospectId: Number(targetId) } : { customerId: Number(targetId) }),
      validUntil: validUntil ? format(validUntil, 'yyyy-MM-dd') : null,
      incotermId: incotermId ? Number(incotermId) : null,
      paymentTermId: paymentTermId ? Number(paymentTermId) : null,
      currency,
      notes: notes.trim() || null,
      lines: cleanedLines,
    };

    try {
      const response = await notify.promise(
        initialData
          ? updateOffer.mutateAsync({ id: initialData.id, payload })
          : createOffer.mutateAsync(payload),
        {
          loading: initialData ? 'Actualizando oferta...' : 'Creando oferta...',
          success: initialData ? 'Oferta actualizada' : 'Oferta creada',
          error: (error) => error?.message || 'No se pudo guardar la oferta',
        }
      );
      onOpenChange(false);
      onSaved?.(response?.data ?? response ?? null);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="6xl" className="flex h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Condiciones comerciales, líneas y destino de la oferta.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-4 p-4">
            {linkedProspect && (
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="font-medium">{linkedProspect.companyName}</p>
                {linkedProspect.address?.trim() ? (
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{linkedProspect.address.trim()}</p>
                ) : null}
                {linkedWebsiteTrim ? (
                  linkedWebsiteHref ? (
                    <a
                      href={linkedWebsiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm text-primary underline-offset-4 hover:underline break-all"
                    >
                      {linkedWebsiteTrim}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm break-all">{linkedWebsiteTrim}</p>
                  )
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  {linkedProspect.speciesInterest?.join(', ') || 'Sin especies definidas'}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{linkedProspect.commercialInterestNotes || 'Sin contexto comercial adicional.'}</p>
              </div>
            )}

            {!isFixedTarget && (
              <div className="grid gap-2">
                <Label>Tipo de destinatario</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospecto</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Destinatario</Label>
              <Select value={targetId} onValueChange={setTargetId} disabled={isFixedTarget}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={targetType === 'prospect' ? 'Selecciona un prospecto' : 'Selecciona un cliente'} />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {targetType === 'prospect' ? formatProspectSelectLabel(option) : (option.name ?? option.companyName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Incoterm</Label>
                <Select value={incotermId} onValueChange={setIncotermId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona incoterm" />
                  </SelectTrigger>
                  <SelectContent>
                    {(options.incoterms ?? []).map((option) => (
                      <SelectItem key={option.id ?? option.value} value={String(option.id ?? option.value)}>
                        {option.name ?? option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Forma de pago</Label>
                <Select value={paymentTermId} onValueChange={setPaymentTermId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona forma de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {(options.paymentTerms ?? []).map((option) => (
                      <SelectItem key={option.id ?? option.value} value={String(option.id ?? option.value)}>
                        {option.name ?? option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="offer-currency">Moneda</Label>
                <Input id="offer-currency" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="offer-valid-until">Válida hasta</Label>
                <Input
                  id="offer-valid-until"
                  type="date"
                  value={validUntil ? format(validUntil, 'yyyy-MM-dd') : ''}
                  onChange={(event) => setValidUntil(event.target.value ? new Date(event.target.value) : null)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="offer-notes">Notas</Label>
              <Textarea id="offer-notes" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Líneas de oferta</h3>
                <p className="text-sm text-muted-foreground">Producto, descripción y condiciones unitarias.</p>
              </div>
              <Button type="button" variant="outline" onClick={addLine}>
                <Plus className="mr-2 size-4" />
                Añadir línea
              </Button>
            </div>

            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[260px]">Producto</TableHead>
                    <TableHead className="min-w-[260px]">Descripción</TableHead>
                    <TableHead className="w-[120px]">Cajas</TableHead>
                    <TableHead className="w-[120px]">Cantidad</TableHead>
                    <TableHead className="w-[120px]">Unidad</TableHead>
                    <TableHead className="w-[160px]">Precio unit.</TableHead>
                    <TableHead className="w-[220px]">Impuesto</TableHead>
                    <TableHead className="w-[56px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={`line-${index}`}>
                      <TableCell className="align-top">
                        <Select value={line.productId} onValueChange={(value) => updateLine(index, 'productId', value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={productsLoading ? 'Cargando…' : 'Producto'} />
                          </SelectTrigger>
                          <SelectContent>
                            {productOptions.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="align-top">
                        <Input value={line.description} onChange={(event) => updateLine(index, 'description', event.target.value)} />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input type="number" value={line.boxes} onChange={(event) => updateLine(index, 'boxes', event.target.value)} />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input type="number" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input value={line.unit} onChange={(event) => updateLine(index, 'unit', event.target.value)} />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input type="number" value={line.unitPrice} onChange={(event) => updateLine(index, 'unitPrice', event.target.value)} />
                      </TableCell>
                      <TableCell className="align-top">
                        <Select value={line.taxId} onValueChange={(value) => updateLine(index, 'taxId', value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Impuesto" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxOptions.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        {lines.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(index)}>
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>

        <div className="flex flex-col-reverse gap-2 border-t bg-background p-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createOffer.isPending || updateOffer.isPending || optionsLoading}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
