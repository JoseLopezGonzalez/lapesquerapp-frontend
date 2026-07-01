'use client';

import React, { useState } from 'react';
import { Truck, User, Users, Send, Ban, Factory, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrderContext } from '@/context/OrderContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { notify } from '@/lib/notifications';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderTransport {
  name?: string;
  emails?: string[];
  ccEmails?: string[];
  [key: string]: unknown;
}

interface OrderSalesperson {
  name?: string;
  emails?: string[];
  ccEmails?: string[];
  [key: string]: unknown;
}

interface OrderExternalProcessor {
  id?: number | string;
  name?: string;
  emails?: string[];
  ccEmails?: string[];
  [key: string]: unknown;
}

interface Order {
  emails?: string[];
  ccEmails?: string[];
  transport?: OrderTransport | null;
  salesperson?: OrderSalesperson | null;
  externalProcessor?: OrderExternalProcessor | null;
  externalProcessorId?: number | string | null;
  maquiladorDestination?: string | null;
  id?: number | string;
  [key: string]: unknown;
}

interface SendDocuments {
  customDocuments: (json: unknown) => Promise<unknown>;
  standardDocuments: () => Promise<unknown>;
  maquiladorDocuments: () => Promise<unknown>;
}

interface OrderContextValue {
  order: Order;
  sendDocuments: SendDocuments;
  hasMaquilador: boolean;
}

type SelectedDocs = {
  customer: string[];
  transport: string[];
  salesperson: string[];
  external_processor: string[];
};

type SelectedRecipients = {
  customer: boolean;
  transport: boolean;
  salesperson: boolean;
  external_processor: boolean;
};

const OrderDocuments = () => {
  const { order, sendDocuments, hasMaquilador } = useOrderContext() as OrderContextValue;
  const isMobile = useIsMobile();

  const [selectedDocs, setSelectedDocs] = useState<SelectedDocs>({
    customer: [],
    transport: [],
    salesperson: [],
    external_processor: [],
  });

  const [selectedDocument, setSelectedDocument] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipients>({
    customer: false,
    transport: false,
    salesperson: false,
    external_processor: false,
  });

  const [showMaquiladorWarning, setShowMaquiladorWarning] = useState(false);
  const [pendingMaquiladorSend, setPendingMaquiladorSend] = useState(false);

  const recipients = [
    {
      name: 'customer' as const,
      label: 'Cliente',
      icon: <User />,
      email: order.emails ?? [],
      copyEmail: order.ccEmails ?? [],
      documents: [
        { name: 'loading-note', label: 'Nota de carga' },
        { name: 'packing-list', label: 'Packing List' },
        { name: 'valued-loading-note', label: 'Nota de carga valorada' },
        { name: 'order-confirmation', label: 'Confirmación de pedido' },
      ],
    },
    ...(order.transport != null
      ? [
          {
            name: 'transport' as const,
            label: 'Transporte',
            icon: <Truck />,
            email: order.transport?.emails ?? [],
            copyEmail: order.transport?.ccEmails ?? [],
            documents: [
              { name: 'loading-note', label: 'Nota de carga' },
              { name: 'packing-list', label: 'Packing List' },
              { name: 'CMR', label: 'Documento de transporte (CMR)' },
              { name: 'transport-pickup-request', label: 'Solicitud de recogida' },
            ],
          },
        ]
      : []),
    ...(order.salesperson != null
      ? [
          {
            name: 'salesperson' as const,
            label: 'Comercial',
            icon: <Users />,
            email: (order.salesperson as OrderSalesperson)?.emails ?? [],
            copyEmail: (order.salesperson as OrderSalesperson)?.ccEmails ?? [],
            documents: [
              { name: 'loading-note', label: 'Nota de carga' },
              { name: 'packing-list', label: 'Packing List' },
              { name: 'valued-loading-note', label: 'Nota de carga valorada' },
              { name: 'order-confirmation', label: 'Confirmación de pedido' },
            ],
          },
        ]
      : []),
    ...(hasMaquilador && order.externalProcessor != null
      ? [
          {
            name: 'external_processor' as const,
            label: 'Maquilador',
            icon: <Factory />,
            email: order.externalProcessor?.emails ?? [],
            copyEmail: order.externalProcessor?.ccEmails ?? [],
            documents: [
              { name: 'maquilador-cmr', label: 'CMR Maquilador' },
              { name: 'maquilador-signs', label: 'Letreros Maquilador' },
            ],
          },
        ]
      : []),
  ];

  const availableDocuments = [
    { id: 'CMR', name: 'CMR' },
    { id: 'loading-note', name: 'Nota de Carga' },
    { id: 'packing-list', name: 'Packing List' },
    { id: 'valued-loading-note', name: 'Nota de Carga Valorada' },
    { id: 'order-confirmation', name: 'Confirmación de Pedido' },
    { id: 'transport-pickup-request', name: 'Solicitud de Recogida' },
    ...(hasMaquilador
      ? [
          { id: 'maquilador-cmr', name: 'CMR Maquilador' },
          { id: 'maquilador-signs', name: 'Letreros Maquilador' },
        ]
      : []),
  ];

  const toggleDocumentSelection = (recipientName: keyof SelectedDocs, documentName: string) => {
    const isSelected = selectedDocs[recipientName].includes(documentName);
    setSelectedDocs((prev) => ({
      ...prev,
      [recipientName]: isSelected
        ? prev[recipientName].filter((doc) => doc !== documentName)
        : [...prev[recipientName], documentName],
    }));
  };

  const toggleRecipientSelection = (recipientName: keyof SelectedRecipients) => {
    setSelectedRecipients((prev) => ({
      ...prev,
      [recipientName]: !prev[recipientName],
    }));
  };

  const handleOnClickSendMultiple = async () => {
    if (!selectedDocument) {
      notify.error({ title: 'Por favor seleccione un documento' });
      return;
    }
    const selectedRecipientsArray = (
      Object.entries(selectedRecipients) as [keyof SelectedRecipients, boolean][]
    )
      .filter(([_, selected]) => selected)
      .map(([id]) => id);

    if (selectedRecipientsArray.length === 0) {
      notify.error({ title: 'Por favor seleccione al menos un destinatario' });
      return;
    }

    const json = {
      documents: [{ type: selectedDocument, recipients: selectedRecipientsArray }],
    };

    notify.promise(sendDocuments.customDocuments(json), {
      loading: 'Enviando documentos a múltiples destinatarios...',
      success: 'Documentos enviados correctamente',
      error: (err: unknown) => {
        const e = err as { userMessage?: string; data?: { userMessage?: string }; response?: { data?: { userMessage?: string } }; message?: string };
        const desc = e?.userMessage || e?.data?.userMessage || e?.response?.data?.userMessage || e?.message || 'No se pudieron enviar los documentos. Intente de nuevo.';
        return { title: 'Error al enviar documentos', description: desc };
      },
    });
  };

  const handleOnClickSendSelectedDocuments = async () => {
    const recipientsByDocuments = (
      Object.entries(selectedDocs) as [keyof SelectedDocs, string[]][]
    ).reduce<Record<string, string[]>>((acc, [recipient, documents]) => {
      documents.forEach((doc) => {
        if (!acc[doc]) acc[doc] = [];
        acc[doc].push(recipient);
      });
      return acc;
    }, {});

    const json = {
      documents: Object.entries(recipientsByDocuments).map(([doc, recips]) => ({
        type: doc,
        recipients: recips,
      })),
    };

    notify
      .promise(sendDocuments.customDocuments(json), {
        loading: 'Enviando documentos...',
        success: 'Documentos enviados correctamente',
        error: (err: unknown) => {
          const e = err as { userMessage?: string; data?: { userMessage?: string }; response?: { data?: { userMessage?: string } }; message?: string };
          const desc = e?.userMessage || e?.data?.userMessage || e?.response?.data?.userMessage || e?.message || 'No se pudieron enviar los documentos. Intente de nuevo.';
          return { title: 'Error al enviar documentos', description: desc };
        },
      })
      .then(() => handleOnClickResetSelectedDocs());
  };

  const handleOnClickSendStandarDocuments = async () => {
    notify.promise(sendDocuments.standardDocuments(), {
      loading: 'Enviando documentos estándar...',
      success: 'Documentos enviados correctamente',
      error: (err: unknown) => {
        const e = err as { userMessage?: string; data?: { userMessage?: string }; response?: { data?: { userMessage?: string } }; message?: string };
        const desc = e?.userMessage || e?.data?.userMessage || e?.response?.data?.userMessage || e?.message || 'No se pudieron enviar los documentos. Intente de nuevo.';
        return { title: 'Error al enviar documentos', description: desc };
      },
    });
  };

  const handleSendMaquiladorDocuments = () => {
    if (!order.maquiladorDestination) {
      setShowMaquiladorWarning(true);
      return;
    }
    doSendMaquiladorDocuments();
  };

  const doSendMaquiladorDocuments = () => {
    setPendingMaquiladorSend(false);
    notify.promise(sendDocuments.maquiladorDocuments(), {
      loading: 'Enviando documentación al maquilador...',
      success: 'Documentación enviada al maquilador correctamente',
      error: (err: unknown) => {
        const e = err as { userMessage?: string; data?: { userMessage?: string }; response?: { data?: { userMessage?: string } }; message?: string };
        const desc = e?.userMessage || e?.data?.userMessage || e?.response?.data?.userMessage || e?.message || 'No se pudo enviar la documentación. Intente de nuevo.';
        return { title: 'Error al enviar al maquilador', description: desc };
      },
    });
  };

  const numberOfSelectedDocuments = Object.values(selectedDocs).reduce(
    (acc, curr) => acc + curr.length,
    0
  );

  const getBadgeClass = (recipientName: keyof SelectedDocs, docName: string) => {
    const isSelected = selectedDocs[recipientName]?.includes(docName);
    if (isSelected) {
      return 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary';
    }
    return '';
  };

  const handleOnClickResetSelectedDocs = () => {
    setSelectedDocs({ customer: [], transport: [], salesperson: [], external_processor: [] });
  };

  // Sección: Envío Automático Estándar
  const standardSection = (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Envío Automático Estándar</CardTitle>
        <CardDescription>
          Envía automáticamente los documentos estándar a los destinatarios configurados.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        <ul className="mb-4 space-y-1 text-sm">
          <li className="flex items-center">
            <div className="mr-1.5 h-1 w-1 rounded-full bg-neutral-400"></div>
            <span>Nota de carga ➜ Cliente</span>
          </li>
          <li className="flex items-center">
            <div className="mr-1.5 h-1 w-1 rounded-full bg-neutral-400"></div>
            <span>Packing list ➜ Cliente</span>
          </li>
          <li className="flex items-center">
            <div className="mr-1.5 h-1 w-1 rounded-full bg-neutral-400"></div>
            <span>Documento de transporte (CMR) ➜ Transporte</span>
          </li>
          <li className="flex items-center">
            <div className="mr-1.5 h-1 w-1 rounded-full bg-neutral-400"></div>
            <span>Nota de carga ➜ Comercial</span>
          </li>
          <li className="flex items-center">
            <div className="mr-1.5 h-1 w-1 rounded-full bg-neutral-400"></div>
            <span>Packing list ➜ Comercial</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={handleOnClickSendStandarDocuments} className="w-full">
          <Send />
          Enviar Estándar
        </Button>
      </CardFooter>
    </Card>
  );

  // Sección: Envío al Maquilador (condicional)
  const maquiladorSection = hasMaquilador ? (
    <Card className="flex h-full flex-col border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="size-4" />
          Envío al Maquilador
        </CardTitle>
        <CardDescription>
          Envía el CMR y los letreros anonimizados al transformador externo asignado.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        <ul className="mb-4 space-y-1 text-sm">
          <li className="flex items-center">
            <div className="mr-1.5 h-1 w-1 rounded-full bg-neutral-400"></div>
            <span>CMR Maquilador ➜ Emails del maquilador</span>
          </li>
          <li className="flex items-center">
            <div className="mr-1.5 h-1 w-1 rounded-full bg-neutral-400"></div>
            <span>Letreros Maquilador ➜ Emails del maquilador</span>
          </li>
        </ul>
        {order.externalProcessor?.emails && order.externalProcessor.emails.length > 0 && (
          <div className="text-muted-foreground text-xs space-y-0.5">
            {order.externalProcessor.emails.map((email) => (
              <div key={email} className="flex items-center gap-1">
                <Send className="size-3" />
                <a href={`mailto:${email}`} className="hover:underline">{email}</a>
              </div>
            ))}
            {(order.externalProcessor?.ccEmails ?? []).map((email) => (
              <div key={email} className="flex items-center gap-1">
                <Badge variant="outline" className="px-1 text-[10px]">CC</Badge>
                <a href={`mailto:${email}`} className="hover:underline">{email}</a>
              </div>
            ))}
          </div>
        )}
        {!order.maquiladorDestination && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            <span>
              El campo &apos;Destino para docs&apos; está vacío. Los documentos mostrarán &apos;Cliente #{order.id}&apos;.
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSendMaquiladorDocuments} className="w-full" variant="secondary">
          <Send />
          Enviar al Maquilador
        </Button>
      </CardFooter>
    </Card>
  ) : null;

  // Sección: Envío Personalizado de Documentos
  const customSection = (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Envío Personalizado de Documentos</CardTitle>
          <CardDescription>
            Haz una selección personalizada de los documentos a enviar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recipients.map((recipient) => (
              <Card key={recipient.name} className="flex flex-col">
                <CardHeader className="flex flex-row items-center gap-2">
                  <div className="bg-muted rounded-full p-1.5 [&_svg]:size-4">{recipient.icon}</div>
                  <CardTitle className="text-base">{recipient.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2">
                    <div className="text-muted-foreground text-sm whitespace-pre-line">
                      <ul className="list-disc px-5 pl-8">
                        {recipient.email.map((email) => (
                          <li key={email} className="text-xs font-medium">
                            <a href={`mailto:${email}`} className="hover:underline">
                              {email}
                            </a>
                          </li>
                        ))}
                        {recipient.copyEmail.map((copyEmail) => (
                          <li key={copyEmail} className="text-xs font-medium">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="px-1">
                                CC
                              </Badge>
                              <a href={`mailto:${copyEmail}`} className="hover:underline">
                                {copyEmail}
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <Separator />
                <CardFooter className="flex flex-col items-stretch gap-2">
                  <p className="text-muted-foreground text-xs font-medium">Documentos</p>
                  {recipient.documents.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recipient.documents.map((doc) => (
                        <Badge
                          key={doc.name}
                          variant="outline"
                          className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium shadow-sm transition-all ${getBadgeClass(
                            recipient.name as keyof SelectedDocs,
                            doc.name
                          )}`}
                          onClick={() =>
                            toggleDocumentSelection(
                              recipient.name as keyof SelectedDocs,
                              doc.name
                            )
                          }
                        >
                          {doc.label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">No hay documentos disponibles</p>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className={isMobile ? 'flex-col items-stretch gap-3' : 'justify-between'}>
          <div className={`flex items-center ${isMobile ? 'w-full justify-between' : ''}`}>
            <p className="text-sm font-medium">
              {numberOfSelectedDocuments}{' '}
              {numberOfSelectedDocuments === 1
                ? 'documento seleccionado'
                : 'documentos seleccionados'}
            </p>
            {numberOfSelectedDocuments > 0 && isMobile && (
              <Button variant="outline" size="sm" onClick={handleOnClickResetSelectedDocs}>
                <Ban />
                Cancelar
              </Button>
            )}
          </div>
          <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
            {numberOfSelectedDocuments > 0 && !isMobile && (
              <Button variant="outline" onClick={handleOnClickResetSelectedDocs}>
                <Ban />
                Cancelar selección
              </Button>
            )}
            <Button
              onClick={handleOnClickSendSelectedDocuments}
              className={isMobile ? 'w-full' : ''}
              disabled={numberOfSelectedDocuments === 0}
            >
              <Send />
              Enviar selección
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  // Sección: Envío Múltiple Destinatario
  const multipleSection = (
    <Card>
      <CardHeader>
        <CardTitle>Envío Múltiple Destinatario</CardTitle>
        <CardDescription>
          Seleccione un documento para enviarlo a múltiples destinatarios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Documento a enviar:</label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione un documento" />
              </SelectTrigger>
              <SelectContent>
                {availableDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Destinatarios:</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {recipients.map((recipient) => (
                <Button
                  key={recipient.name}
                  type="button"
                  variant="outline"
                  className={`h-auto w-full justify-start gap-2 rounded-md p-2 transition-colors ${
                    selectedRecipients[recipient.name as keyof SelectedRecipients]
                      ? 'border-primary bg-primary/20'
                      : ''
                  }`}
                  onClick={() => toggleRecipientSelection(recipient.name as keyof SelectedRecipients)}
                >
                  <div className="bg-muted rounded-full p-1 [&_svg]:size-4">{recipient.icon}</div>
                  <span className="text-sm font-medium">{recipient.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleOnClickSendMultiple}>
          <Send />
          Enviar documento
        </Button>
      </CardFooter>
    </Card>
  );

  const content = (
    <div className="space-y-6">
      {isMobile ? (
        <>
          {standardSection}
          {hasMaquilador && (
            <>
              <Separator />
              {maquiladorSection}
            </>
          )}
          <Separator />
          {customSection}
          <Separator />
          {multipleSection}
        </>
      ) : (
        <>
          {customSection}
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className={hasMaquilador ? 'md:col-span-1' : 'md:col-span-2'}>{multipleSection}</div>
            <div className="md:col-span-1">{standardSection}</div>
            {hasMaquilador && <div className="md:col-span-1">{maquiladorSection}</div>}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div
        className={
          isMobile
            ? 'flex min-h-0 flex-1 flex-col'
            : 'flex min-h-0 flex-1 flex-col overflow-hidden pb-2'
        }
      >
        {isMobile ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ScrollArea className="min-h-0 flex-1">
              <div className="py-6">{content}</div>
            </ScrollArea>
          </div>
        ) : (
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardContent className="min-h-0 flex-1 overflow-y-auto py-6">{content}</CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de advertencia: destino maquilador vacío */}
      <Dialog open={showMaquiladorWarning} onOpenChange={setShowMaquiladorWarning}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Destino del maquilador no configurado
            </DialogTitle>
            <DialogDescription>
              El campo &quot;Destino para docs del maquilador&quot; está vacío. Los documentos
              mostrarán <strong>&quot;Cliente #{order.id}&quot;</strong> como destinatario en el CMR
              y los letreros. ¿Deseas continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowMaquiladorWarning(false);
                setPendingMaquiladorSend(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowMaquiladorWarning(false);
                setPendingMaquiladorSend(true);
                doSendMaquiladorDocuments();
              }}
            >
              <Send />
              Enviar igualmente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderDocuments;
