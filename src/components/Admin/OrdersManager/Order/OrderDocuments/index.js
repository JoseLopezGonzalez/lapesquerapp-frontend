'use client'

import React, { useState } from "react";
import { Truck, User, Users, Send, Ban } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrderContext } from "@/context/OrderContext";import { useIsMobile } from "@/hooks/use-mobile";
import { notify } from "@/lib/notifications";
import { ScrollArea } from "@/components/ui/scroll-area";


const OrderDocuments = () => {

    const { order, sendDocuments } = useOrderContext();
    const isMobile = useIsMobile();

    const [selectedDocs, setSelectedDocs] = useState({
        customer: [],
        transport: [],
        salesperson: []
    });

    const [selectedDocument, setSelectedDocument] = useState("");
    const [selectedRecipients, setSelectedRecipients] = useState({
        customer: false,
        transport: false,
        salesperson: false,
    });

    const recipients = [
        {
            name: "customer",
            label: "Cliente",
            icon: <User />,
            email: order.emails ?? [],
            copyEmail: order.ccEmails ?? [],
            documents: [
                { name: "loading-note", label: "Nota de carga" },
                { name: "packing-list", label: "Packing List" },
                { name: "valued-loading-note", label: "Nota de carga valorada" },
                { name: "order-confirmation", label: "Confirmación de pedido" },
            ],
        },
        ...(order.transport != null
            ? [
                  {
                      name: "transport",
                      label: "Transporte",
                      icon: <Truck />,
                      email: order.transport?.emails ?? [],
                      copyEmail: order.transport?.ccEmails ?? [],
                      documents: [
                          { name: "loading-note", label: "Nota de carga" },
                          { name: "packing-list", label: "Packing List" },
                          { name: "CMR", label: "Documento de transporte (CMR)" },
                          { name: "transport-pickup-request", label: "Solicitud de recogida" },
                      ],
                  },
              ]
            : []),
        ...(order.salesperson != null
            ? [
                  {
                      name: "salesperson",
                      label: "Comercial",
                      icon: <Users />,
                      email: order.salesperson?.emails ?? [],
                      copyEmail: order.salesperson?.ccEmails ?? [],
                      documents: [
                          { name: "loading-note", label: "Nota de carga" },
                          { name: "packing-list", label: "Packing List" },
                          { name: "valued-loading-note", label: "Nota de carga valorada" },
                          { name: "order-confirmation", label: "Confirmación de pedido" },
                      ],
                  },
              ]
            : []),
    ];

    const availableDocuments = [
        { id: "CMR", name: "CMR" },
        { id: "loading-note", name: "Nota de Carga" },
        { id: 'packing-list', name: 'Packing List' },
        { id: 'valued-loading-note', name: 'Nota de Carga Valorada' },
        { id: 'order-confirmation', name: 'Confirmación de Pedido' },
        { id: 'transport-pickup-request', name: 'Solicitud de Recogida' },
    ];

    const toggleDocumentSelection = (recipientName, documentName) => {

        const isSelected = selectedDocs[recipientName].includes(documentName);

        if (isSelected) {
            setSelectedDocs((prev) => ({
                ...prev,
                [recipientName]: prev[recipientName].filter((doc) => doc !== documentName),
            }));
        } else {
            setSelectedDocs((prev) => ({
                ...prev,
                [recipientName]: [
                    ...prev[recipientName],
                    documentName,
                ],
            }));
        }

    };

    const toggleRecipientSelection = (recipientName) => {
        setSelectedRecipients((prev) => ({
            ...prev,
            [recipientName]: !prev[recipientName],
        }));
    };

    const handleOnClickSendMultiple = async () => {
        if (!selectedDocument) {
            notify.error({ title: "Por favor seleccione un documento" });
            return;
        }
        const selectedRecipientsArray = Object.entries(selectedRecipients)
            .filter(([_, selected]) => selected)
            .map(([id]) => id);

        if (selectedRecipientsArray.length === 0) {
            notify.error({ title: "Por favor seleccione al menos un destinatario" });
            return;
        }

        const json = {
            documents: [
                {
                    type: selectedDocument,
                    recipients: selectedRecipientsArray
                }
            ]
        }

        notify.promise(sendDocuments.customDocuments(json), {
            loading: "Enviando documentos a múltiples destinatarios...",
            success: 'Documentos enviados correctamente',
            error: (error) => {
                const desc = error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'No se pudieron enviar los documentos. Intente de nuevo.';
                return { title: 'Error al enviar documentos', description: desc };
            },
        });
    };

    const handleOnClickSendSelectedDocuments = async () => {

        /* Agrupar por recipients por documento */
        const recipientsByDocuments = Object.entries(selectedDocs).reduce((acc, [recipient, documents]) => {
            documents.forEach((doc) => {
                if (!acc[doc]) {
                    acc[doc] = [];
                }
                acc[doc].push(recipient);
            });
            return acc;
        }, {});

        const json = {
            documents: Object.entries(recipientsByDocuments).map(([doc, recipients]) => ({
                type: doc,
                recipients
            }))
        }

        notify.promise(sendDocuments.customDocuments(json), {
            loading: "Enviando documentos...",
            success: 'Documentos enviados correctamente',
            error: (error) => {
                const desc = error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'No se pudieron enviar los documentos. Intente de nuevo.';
                return { title: 'Error al enviar documentos', description: desc };
            },
        }).then(() => handleOnClickResetSelectedDocs());
    };

    const handleOnClickSendStandarDocuments = async () => {
        notify.promise(sendDocuments.standardDocuments(), {
            loading: "Enviando documentos estándar...",
            success: 'Documentos enviados correctamente',
            error: (error) => {
                const desc = error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'No se pudieron enviar los documentos. Intente de nuevo.';
                return { title: 'Error al enviar documentos', description: desc };
            },
        });
    };


    const numberOfSelectedDocuments = Object.values(selectedDocs).reduce((acc, curr) => acc + Object.values(curr).filter(Boolean).length, 0);


    const getBadgeClass = (recipientName, docName) => {
        const isSelected = selectedDocs[recipientName]?.includes(docName);
        if (isSelected) {
            return "bg-primary text-primary-foreground hover:bg-primary/90 border-primary";
        }
    };


    const handleOnClickResetSelectedDocs = () => {
        setSelectedDocs({
            customer: [],
            transport: [],
            salesperson: []
        });
    }

    // Sección: Envío Automático Estándar
    const standardSection = (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Envío Automático Estándar</CardTitle>
                <CardDescription>Envía automáticamente los documentos estándar a los destinatarios configurados.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
                <ul className="text-sm space-y-1 mb-4">
                    <li className="flex items-center">
                        <div className="w-1 h-1 bg-neutral-400 rounded-full mr-1.5"></div>
                        <span>Nota de carga ➜ Cliente</span>
                    </li>
                    <li className="flex items-center">
                        <div className="w-1 h-1 bg-neutral-400 rounded-full mr-1.5"></div>
                        <span>Packing list ➜ Cliente</span>
                    </li>
                    <li className="flex items-center">
                        <div className="w-1 h-1 bg-neutral-400 rounded-full mr-1.5"></div>
                        <span>Documento de transporte (CMR) ➜ Transporte</span>
                    </li>
                    <li className="flex items-center">
                        <div className="w-1 h-1 bg-neutral-400 rounded-full mr-1.5"></div>
                        <span>Nota de carga ➜ Comercial</span>
                    </li>
                    <li className="flex items-center">
                        <div className="w-1 h-1 bg-neutral-400 rounded-full mr-1.5"></div>
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

    // Sección: Envío Personalizado de Documentos
    const customSection = (
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Envío Personalizado de Documentos</CardTitle>
                                    <CardDescription>Haz una selección personalizada de los documentos a enviar.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recipients.map((recipient) => (
                                            <Card key={recipient.name} className="flex flex-col">
                                                <CardHeader className="flex flex-row items-center gap-2">
                                                    <div className="rounded-full bg-muted p-1.5 [&_svg]:size-4">
                                                        {recipient.icon}
                                                    </div>
                                                    <CardTitle className="text-base">{recipient.label}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="mb-2">
                                                        <div className="text-sm text-muted-foreground whitespace-pre-line">
                                                            <ul className="list-disc px-5 pl-8">
                                                                {recipient.email.map((email) => (
                                                                    <li key={email} className="text-xs font-medium">
                                                                        <a href={`mailto:${email}`} className=" hover:underline">
                                                                            {email}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                                {recipient.copyEmail.map((copyEmail) => (
                                                                    <li key={copyEmail} className="text-xs font-medium">
                                                                        <div className="flex gap-1 items-center">
                                                                            <Badge variant="outline" className="px-1">CC</Badge>
                                                                            <a href={`mailto:${copyEmail}`} className=" hover:underline">
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
                                                    <p className="text-xs font-medium text-muted-foreground">Documentos</p>
                                                    {recipient.documents.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {recipient.documents.map((doc) => (
                                                                <Badge
                                                                    key={doc.name}
                                                                    variant="outline"
                                                                    className={`cursor-pointer flex items-center gap-1.5 py-1 px-2.5 font-medium text-xs rounded-md shadow-sm transition-all 
                                                                        ${getBadgeClass(
                                                                        recipient.name,
                                                                        doc.name,
                                                                    )}
                                                                    `}
                                                                    onClick={() => toggleDocumentSelection(recipient.name, doc.name)}
                                                                >
                                                                    {doc.label}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">
                                                            No hay documentos disponibles
                                                        </p>
                                                    )}
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className={isMobile ? 'flex-col gap-3 items-stretch' : 'justify-between'}>
                                    <div className={`flex items-center ${isMobile ? 'w-full justify-between' : ''}`}>
                                <p className="text-sm font-medium">
                                            {numberOfSelectedDocuments} {numberOfSelectedDocuments === 1 ? 'documento seleccionado' : 'documentos seleccionados'}
                                </p>
                                        {numberOfSelectedDocuments > 0 && isMobile && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleOnClickResetSelectedDocs}
                                            >
                                                <Ban />
                                                Cancelar
                                            </Button>
                                        )}
                                    </div>
                                    <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
                                        {numberOfSelectedDocuments > 0 && !isMobile && (
                                        <Button
                                            variant="outline"
                                            onClick={handleOnClickResetSelectedDocs}
                                        >
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
                                        <CardDescription>Seleccione un documento para enviarlo a múltiples destinatarios.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Documento a enviar:
                                                </label>
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
                                                <label className="text-sm font-medium mb-2 block">
                                                    Destinatarios:
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    {recipients.map((recipient) => (
                                                        <div
                                                            key={recipient.name}
                                                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-colors ${selectedRecipients[recipient.name]
                                                                ? "bg-primary/20 border-primary"
                                                                : "bg-background"
                                                                }`}
                                                            onClick={() => toggleRecipientSelection(recipient.name)}
                                                        >
                                                            <div className="rounded-full bg-muted p-1 [&_svg]:size-4">
                                                                {recipient.icon}
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {recipient.label}
                                                            </span>
                                                        </div>
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
                // Orden para mobile: Estándar primero
                <>
                    {standardSection}
                    <Separator />
                    {customSection}
                    <Separator />
                    {multipleSection}
                </>
            ) : (
                // Orden para desktop: Personalizado primero
                <>
                    {customSection}
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            {multipleSection}
                            </div>
                            <div className="md:col-span-1">
                            {standardSection}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className={isMobile ? "flex-1 flex flex-col min-h-0" : "h-full pb-2"}>
            {isMobile ? (
                <div className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="py-6">
                            {content}
                        </div>
                    </ScrollArea>
                </div>
            ) : (
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardContent className="flex-1 overflow-y-auto py-6">
                        {content}
                </CardContent>
            </Card>
            )}
        </div>
    );
};

export default OrderDocuments;
