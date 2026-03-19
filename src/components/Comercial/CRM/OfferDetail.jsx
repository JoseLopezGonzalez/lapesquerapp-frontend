'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, FileDown, Mail, MessageSquare, MoreVertical, Pencil, ShoppingCart, X, Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useOffer, useOfferMutations } from '@/hooks/useOffers';
import { crmService } from '@/services/crmService';
import OfferFormSheet from './OfferFormSheet';
import StatusPill from './StatusPill';
import { formatCurrency, formatDateValue, offerStatusLabels } from './utils';
import { notify } from '@/lib/notifications';
import Loader from '@/components/Utilities/Loader';

function ActionDialog({ open, onOpenChange, title, description, children, footer }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OfferDetail({ offerId, embedded = false }) {
  const router = useRouter();
  const { data: offer, isLoading } = useOffer(offerId);
  const { acceptOffer, rejectOffer, expireOffer, sendOffer, sendOfferEmail, createOrderFromOffer } = useOfferMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState('pdf');
  const [sendEmail, setSendEmail] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [orderPayload, setOrderPayload] = useState({
    entryDate: '',
    loadDate: '',
    transport: '',
    buyerReference: '',
    emails: '',
    ccEmails: '',
    plannedProducts: '',
  });
  const isMutatingOffer =
    acceptOffer.isPending ||
    rejectOffer.isPending ||
    expireOffer.isPending ||
    sendOffer.isPending ||
    sendOfferEmail.isPending ||
    createOrderFromOffer.isPending;

  const incompleteLinesForOrder = (offer?.lines ?? []).filter(
    (line) => !line.product?.id && !line.productId || !line.tax?.id && !line.taxId || line.boxes == null || line.boxes === ''
  );

  const handleDownloadPdf = async () => {
    try {
      const blob = await crmService.downloadOfferPdf(offer.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `oferta-${offer.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notify.error({ title: error?.message || 'No se pudo descargar el PDF' });
    }
  };

  const handleSend = async () => {
    try {
      if (sendChannel === 'whatsapp_text') {
        const response = await crmService.getOfferWhatsappText(offer.id);
        setWhatsappText(response?.data?.text ?? '');
      }
      if (sendChannel === 'email') {
        await notify.promise(
          sendOfferEmail.mutateAsync({
            id: offer.id,
            payload: {
              email: sendEmail,
              subject: sendSubject || undefined,
            },
          }),
          {
            loading: 'Enviando email...',
            success: 'Email de oferta enviado',
            error: (error) => error?.message || 'No se pudo enviar el email',
          }
        );
      } else {
        await notify.promise(
          sendOffer.mutateAsync({
            id: offer.id,
            payload: {
              channel: sendChannel,
            },
          }),
          {
            loading: 'Enviando oferta...',
            success: 'Oferta enviada',
            error: (error) => error?.message || 'No se pudo enviar la oferta',
          }
        );
      }
      setSendOpen(false);
    } catch {}
  };

  const handleCreateOrder = async () => {
    if (incompleteLinesForOrder.length > 0) {
      notify.error({ title: 'Completa producto, impuesto y cajas en todas las líneas antes de crear el pedido' });
      return;
    }
    try {
      const plannedProducts = orderPayload.plannedProducts.trim()
        ? JSON.parse(orderPayload.plannedProducts)
        : [];
      const response = await notify.promise(
        createOrderFromOffer.mutateAsync({
          id: offer.id,
          payload: {
            entryDate: orderPayload.entryDate,
            loadDate: orderPayload.loadDate,
            transport: orderPayload.transport ? Number(orderPayload.transport) : null,
            buyerReference: orderPayload.buyerReference || null,
            emails: orderPayload.emails ? orderPayload.emails.split(',').map((value) => value.trim()).filter(Boolean) : [],
            ccEmails: orderPayload.ccEmails ? orderPayload.ccEmails.split(',').map((value) => value.trim()).filter(Boolean) : [],
            plannedProducts,
          },
        }),
        {
          loading: 'Creando pedido desde oferta...',
          success: 'Pedido creado desde la oferta',
          error: (error) => error?.message || 'No se pudo crear el pedido',
        }
      );
      setCreateOrderOpen(false);
      if (response?.data?.id) {
        router.push(`/comercial/pedidos?orderId=${response.data.id}`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        notify.error({ title: 'plannedProducts extra debe ser JSON válido' });
      }
    }
  };

  const body = isLoading ? (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <Loader />
    </div>
  ) : !offer ? (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-sm text-muted-foreground">No se ha encontrado la oferta.</div>
  ) : (
    <>
      <CardHeader className="w-full min-w-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl">Oferta #{offer.id}</CardTitle>
              <StatusPill label={offerStatusLabels[offer.status] ?? offer.status} status={offer.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {offer.prospect?.companyName ?? offer.customer?.name ?? 'Sin destinatario'} · {offer.validUntil ? `Válida hasta ${formatDateValue(offer.validUntil)}` : 'Sin fecha de validez'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {offer.status === 'draft' && <Button variant="outline" onClick={() => setEditOpen(true)} disabled={isMutatingOffer}>Editar</Button>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Acciones sobre la oferta"
                  data-slot="button"
                  disabled={isMutatingOffer}
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                {offer.status === 'draft' && (
                  <DropdownMenuItem onClick={() => setSendOpen(true)}>
                    <Mail />
                    Enviar
                  </DropdownMenuItem>
                )}
                {offer.status === 'sent' && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await notify.promise(acceptOffer.mutateAsync(offer.id), {
                          loading: 'Aceptando oferta...',
                          success: 'Oferta aceptada',
                          error: (error) => error?.message || 'No se pudo aceptar la oferta',
                        });
                      } catch {}
                    }}
                  >
                    <Check />
                    Aceptar
                  </DropdownMenuItem>
                )}
                {offer.status === 'sent' && (
                  <DropdownMenuItem onClick={() => setRejectOpen(true)}>
                    <X />
                    Rechazar
                  </DropdownMenuItem>
                )}
                {['draft', 'sent', 'rejected'].includes(offer.status) && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await notify.promise(expireOffer.mutateAsync(offer.id), {
                          loading: 'Expirando oferta...',
                          success: 'Oferta expirada',
                          error: (error) => error?.message || 'No se pudo expirar la oferta',
                        });
                      } catch {}
                    }}
                  >
                    <Clock3 />
                    Expirar
                  </DropdownMenuItem>
                )}
                {offer.status === 'accepted' && (
                  <DropdownMenuItem onClick={() => setCreateOrderOpen(true)}>
                    <ShoppingCart />
                    Crear pedido
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex w-full min-w-0 flex-1 min-h-0 flex-col py-4">
        <Tabs defaultValue="offer" className="flex h-full w-full min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
          <TabsList>
            <TabsTrigger value="offer">Oferta</TabsTrigger>
            <TabsTrigger value="send">Envío</TabsTrigger>
          </TabsList>

          <TabsContent value="offer" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Incoterm</p>
                <p className="font-medium">{offer.incoterm?.name ?? 'Sin incoterm'}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Forma de pago</p>
                <p className="font-medium">{offer.paymentTerm?.name ?? 'Sin forma de pago'}</p>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground mb-1">Notas</p>
              <p className="whitespace-pre-wrap">{offer.notes || 'Sin notas'}</p>
            </div>

            {offer.status === 'accepted' && incompleteLinesForOrder.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <p className="font-medium text-amber-800 dark:text-amber-300">La oferta no está lista para crear pedido</p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Faltan `producto`, `impuesto` o `cajas` en {incompleteLinesForOrder.length} línea(s). Corrige la oferta antes de continuar.
                </p>
                <div className="mt-3">
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    Editar oferta
                  </Button>
                </div>
              </div>
            )}

            {(offer.lines ?? []).length === 0 ? (
              <div className="flex min-h-0 flex-1">
                <EmptyState
                  title="Sin líneas"
                  description="Esta oferta no tiene líneas visibles."
                  className="h-full w-full border bg-muted/20 !min-h-0"
                />
              </div>
            ) : (
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripcion</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Cajas</TableHead>
                      <TableHead>Impuesto</TableHead>
                      <TableHead className="text-right">Precio unit.</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offer.lines.map((line, index) => {
                      const isIncomplete =
                        ((!line.product?.id && !line.productId) || (!line.tax?.id && !line.taxId) || line.boxes == null || line.boxes === '');

                      return (
                        <TableRow key={line.id ?? `${line.description}-${index}`}>
                          <TableCell className="align-top whitespace-normal">
                            <div className="min-w-0">
                              <p className="font-medium">{line.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top whitespace-normal text-muted-foreground">
                            {line.product?.name ?? 'Sin producto vinculado'}
                          </TableCell>
                          <TableCell className="align-top text-right">
                            {line.quantity}
                          </TableCell>
                          <TableCell className="align-top">
                            {line.unit || 'kg'}
                          </TableCell>
                          <TableCell className="align-top">
                            {line.boxes ?? 'Sin'}
                          </TableCell>
                          <TableCell className="align-top">
                            {line.tax?.rate ?? '—'}
                          </TableCell>
                          <TableCell className="align-top text-right">
                            {formatCurrency(line.unitPrice, line.currency ?? offer.currency ?? 'EUR')}
                          </TableCell>
                          <TableCell className="align-top whitespace-normal">
                            {isIncomplete ? (
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                Incompleta para crear pedido
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Completa</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="send" className="flex h-full w-full min-w-0 min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start" onClick={handleDownloadPdf}>
                <FileDown className="mr-2 size-4" />
                Descargar PDF
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setSendOpen(true)}>
                <Mail className="mr-2 size-4" />
                Enviar por email / registrar envío
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={async () => {
                  try {
                    const response = await crmService.getOfferWhatsappText(offer.id);
                    const text = response?.data?.text ?? '';
                    await navigator.clipboard.writeText(text);
                    notify.success({ title: 'Texto copiado al portapapeles' });
                    setWhatsappText(text);
                  } catch (error) {
                    notify.error({ title: error?.message || 'No se pudo copiar el texto' });
                  }
                }}
              >
                <MessageSquare className="mr-2 size-4" />
                Copiar texto WhatsApp
              </Button>
              {whatsappText && (
                <Textarea rows={8} readOnly value={whatsappText} />
              )}
            </div>

            {offer.orderId && (
              <Button asChild variant="ghost">
                <Link href={`/comercial/pedidos?orderId=${offer.orderId}`}>
                  <ShoppingCart className="mr-2 size-4" />
                  Ver pedido generado
                </Link>
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );

  return (
    <>
      <Card className="flex h-full w-full max-w-none min-h-0 min-w-0 flex-1 basis-0 self-stretch flex-col overflow-hidden">
        {body}
      </Card>

      <OfferFormSheet open={editOpen} onOpenChange={setEditOpen} initialData={offer} />

      <ActionDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Enviar oferta"
        description="Registra el canal de envío y, si aplica, los datos del email."
        footer={
          <>
            <Button variant="outline" onClick={() => setSendOpen(false)} disabled={isMutatingOffer}>Cancelar</Button>
            <Button onClick={handleSend} disabled={isMutatingOffer}>Enviar</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Canal</Label>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={sendChannel}
              onChange={(event) => setSendChannel(event.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="email">Email</option>
              <option value="whatsapp_text">WhatsApp</option>
            </select>
          </div>
          {sendChannel === 'email' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="send-email">Email</Label>
                <Input id="send-email" value={sendEmail} onChange={(event) => setSendEmail(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="send-subject">Asunto</Label>
                <Input id="send-subject" value={sendSubject} onChange={(event) => setSendSubject(event.target.value)} />
              </div>
            </>
          )}
        </div>
      </ActionDialog>

      <ActionDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Rechazar oferta"
        description="Registra el motivo para mantener histórico comercial útil."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={isMutatingOffer}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={isMutatingOffer}
              onClick={async () => {
                try {
                  await notify.promise(rejectOffer.mutateAsync({ id: offer.id, reason: rejectionReason }), {
                    loading: 'Rechazando oferta...',
                    success: 'Oferta rechazada',
                    error: (error) => error?.message || 'No se pudo rechazar la oferta',
                  });
                  setRejectOpen(false);
                } catch {}
              }}
            >
              Rechazar
            </Button>
          </>
        }
      >
        <div className="grid gap-2">
          <Label htmlFor="rejection-reason">Motivo</Label>
          <Textarea id="rejection-reason" rows={4} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} />
        </div>
      </ActionDialog>

      <ActionDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        title="Crear pedido desde oferta"
        description="Completa los campos que exige el flujo estándar de pedidos y añade líneas extra si hace falta."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOrderOpen(false)} disabled={isMutatingOffer}>Cancelar</Button>
            <Button onClick={handleCreateOrder} disabled={isMutatingOffer}>Crear pedido</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="entry-date">Fecha entrada</Label>
              <Input id="entry-date" type="date" value={orderPayload.entryDate} onChange={(event) => setOrderPayload((current) => ({ ...current, entryDate: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="load-date">Fecha carga</Label>
              <Input id="load-date" type="date" value={orderPayload.loadDate} onChange={(event) => setOrderPayload((current) => ({ ...current, loadDate: event.target.value }))} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="transport">Transporte</Label>
              <Input id="transport" value={orderPayload.transport} onChange={(event) => setOrderPayload((current) => ({ ...current, transport: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buyer-reference">Referencia comprador</Label>
              <Input id="buyer-reference" value={orderPayload.buyerReference} onChange={(event) => setOrderPayload((current) => ({ ...current, buyerReference: event.target.value }))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emails">Emails</Label>
            <Input id="emails" value={orderPayload.emails} onChange={(event) => setOrderPayload((current) => ({ ...current, emails: event.target.value }))} placeholder="compras@cliente.test, logistica@cliente.test" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cc-emails">CC</Label>
            <Input id="cc-emails" value={orderPayload.ccEmails} onChange={(event) => setOrderPayload((current) => ({ ...current, ccEmails: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="planned-products">plannedProducts extra (JSON)</Label>
            <Textarea
              id="planned-products"
              rows={6}
              value={orderPayload.plannedProducts}
              onChange={(event) => setOrderPayload((current) => ({ ...current, plannedProducts: event.target.value }))}
              placeholder='[{"product":99,"quantity":2,"boxes":1,"unitPrice":8.5,"tax":1}]'
            />
            <p className="text-xs text-muted-foreground">
              Este JSON solo añade líneas extra al pedido. No corrige líneas incompletas de la oferta aceptada.
            </p>
          </div>
        </div>
      </ActionDialog>
    </>
  );
}
