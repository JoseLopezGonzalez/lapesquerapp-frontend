'use client'

import React, { useState } from "react";
import { FileText, Mail, Truck, User, Users, Check, Send, Ban, CheckCheck } from "lucide-react";
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
import Order from "..";
import { useOrderContext } from "@/context/OrderContext";
import { useSession } from "next-auth/react";
import { API_URL_V2 } from "@/configs/config";
import toast from "react-hot-toast";
import { darkToastTheme } from "@/customs/reactHotToast";

// Eliminamos tipos TypeScript y usamos solo JavaScript
// (Antes teníamos DocumentStatus, Document, Recipient, etc.)

const OrderDocuments = () => {

    const { order } = useOrderContext();

    // Estado para los documentos seleccionados (estructura de objetos)
    const [selectedDocs, setSelectedDocs] = useState({
        customer: [],
        transport: [],
        salesperson: []
    });

    // Estado para el envío múltiple (documento y destinatarios marcados)
    const [selectedDocument, setSelectedDocument] = useState("");
    const [selectedRecipients, setSelectedRecipients] = useState({
        cliente: false,
        transporte: false,
        comercial: false,
    });

    // Datos de ejemplo
    const recipients = [
        {
            name: "customer",
            label: "Cliente",
            icon: <User className="h-4 w-4" />,
            email: "cliente@empresa.com",
            copyEmail: "supervisión@empresa.com",
            documents: [
                { name: "loading-note", label: "Nota de carga" },
                { name: "packing-list", label: "Packing List" },
            ],
        },
        {
            name: "transport",
            label: "Transporte",
            icon: <Truck className="h-4 w-4" />,
            email: "logistica@transportesxyz.com",
            copyEmail: "seguimiento@transportesxyz.com",
            documents: [
                { name: "loading-note", label: "Nota de carga" },
                { name: "packing-list", label: "Packing List" },
                { name: "CMR", label: "Documento de transporte (CMR)" },
            ],
        },
        {
            name: "salesperson",
            label: "Comercial",
            icon: <Users className="h-4 w-4" />,
            email: "comercial@empresa.com",
            copyEmail: "",
            documents: [
                { name: "loading-note", label: "Nota de carga" },
                { name: "packing-list", label: "Packing List" },
            ],
        },
    ];

    // Documentos disponibles para el envío múltiple
    const availableDocuments = [
        { id: "CMR", name: "CMR" },
        { id: "loading-note", name: "Nota de Carga" },
        { id: 'packing-list', name: 'Packing List' },
    ];

    // Alternar la selección de un documento para un destinatario
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

    // Alternar la selección de un destinatario en envío múltiple
    const toggleRecipientSelection = (recipientName) => {
        setSelectedRecipients((prev) => ({
            ...prev,
            [recipientName]: !prev[recipientName],
        }));
    };

    // Enviar todos los documentos seleccionados
    const sendAllSelected = () => {
        alert("Enviando todos los documentos seleccionados");
        // Aquí iría la lógica para enviar y actualizar estados
    };

    // Envío múltiple
    const sendMultiple = async () => {
        if (!selectedDocument) {
            alert("Por favor seleccione un documento");
            return;
        }
        const selectedRecipientsArray = Object.entries(selectedRecipients)
            .filter(([_, selected]) => selected)
            .map(([id]) => id);

        if (selectedRecipientsArray.length === 0) {
            alert("Por favor seleccione al menos un destinatario");
            return;
        }

        alert(
            `Enviando documento "${selectedDocument}" a: ${selectedRecipientsArray.join(
                ", "
            )}`
        );

        /* format:
        {
  "documents": [
    {
      "type": "nota_carga",
      "recipients": ["cliente", "comercial"]
    },
    {
      "type": "packing_list",
      "recipients": ["transporte"]
    }
  ]
}

         */

        const json = {
            documents: [
                {
                    type: selectedDocument,
                    recipients: selectedRecipientsArray
                }
            ]
        }


        /* setLoading(true); */
        const token = session?.user?.accessToken;
        const toastId = toast.loading("Enviando documentos a multiples destinatarios...", darkToastTheme);

        console.log('json', json);

        return fetch(`${API_URL_V2}orders/${order.id}/send-custom-documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',  // <- Este es el header que necesitas
                'Authorization': `Bearer ${token}`, // Enviar el token
                'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
            },
            body: JSON.stringify(json),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(errorData.message || 'Error ');
                    });
                }
                return response.json();
            })
            .then((data) => {
                toast.success('Documentos enviados correctamente', { id: toastId });
                return data.data;
            })
            .catch((error) => {
                // Manejo adicional de errores, si lo requieres
                toast.error('Error al enviar documentos', { id: toastId });
                throw error;
            })
            .finally(() => {
                console.log('  finalizado');
            });
        // Aquí iría la lógica para enviar y actualizar estados
    };

    const sendSelectedDocuments = async () => {


        /* format:
        {
  "documents": [
    {
      "type": "nota_carga",
      "recipients": ["cliente", "comercial"]
    },
    {
      "type": "packing_list",
      "recipients": ["transporte"]
    }
  ]
}

         */

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

        console.log('json', json);


        /* setLoading(true); */
        const token = session?.user?.accessToken;
        const toastId = toast.loading("Enviando documentos...", darkToastTheme);

        console.log('json', json);

        return fetch(`${API_URL_V2}orders/${order.id}/send-custom-documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',  // <- Este es el header que necesitas
                'Authorization': `Bearer ${token}`, // Enviar el token
                'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
            },
            body: JSON.stringify(json),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(errorData.message || 'Error ');
                    });
                }
                return response.json();
            })
            .then((data) => {
                toast.success('Documentos enviados correctamente', { id: toastId });
                handleOnClickResetSelectedDocs();
            })
            .catch((error) => {
                // Manejo adicional de errores, si lo requieres
                toast.error('Error al enviar documentos', { id: toastId });
                throw error;
            })
            .finally(() => {
                console.log('  finalizado');

            });
        // Aquí iría la lógica para enviar y actualizar estados
    };




    // Contar documentos seleccionados
    const countSelectedDocuments = () => {
        /* contar selectedDocuments uniendo el tamaño de customer, transport, salesperson */
        return Object.values(selectedDocs).reduce((acc, curr) => acc + Object.values(curr).filter(Boolean).length, 0);
    };



    // Determinar la clase de color para el badge según el estado
    const getBadgeClass = (recipientName, docName) => {
        const isSelected = selectedDocs[recipientName]?.includes(docName);
        if (isSelected) {
            return "bg-primary text-primary-foreground hover:bg-primary/90 border-primary";
        }
    };

    const { data: session, status } = useSession();

    const sendStandarDocuments = async () => {
        /* setLoading(true); */
        const token = session?.user?.accessToken;
        const toastId = toast.loading("Enviando documentos estándar...", darkToastTheme);

        return fetch(`${API_URL_V2}orders/${order.id}/send-standard-documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',  // <- Este es el header que necesitas
                'Authorization': `Bearer ${token}`, // Enviar el token
                'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente
            },
            body: JSON.stringify({}),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(errorData.message || 'Error ');
                    });
                }
                return response.json();
            })
            .then((data) => {
                toast.success('Documentos enviados correctamente', { id: toastId });
                return data.data;
            })
            .catch((error) => {
                // Manejo adicional de errores, si lo requieres
                toast.error('Error al enviar documentos', { id: toastId });
                throw error;
            })
            .finally(() => {
                console.log('  finalizado');
            });
    };



    const handleOnClickResetSelectedDocs = () => {
        setSelectedDocs({
            customer: [],
            transport: [],
            salesPerson: []

        });
    }

    return (
        <div className='h-full pb-2'>
            <Card className='h-full flex flex-col'>
                {/*  <CardHeader>
                    <CardTitle className="text-lg font-medium">Documentación</CardTitle>
                    <CardDescription>Envía los documentos a los diferentes destinatarios</CardDescription>
                </CardHeader> */}
                <CardContent className="flex-1 overflow-y-auto py-6 ">
                    <div className="space-y-6 ">
                        {/* Sección 1: Selección por Destinatario */}
                        <div>


                            <Card className="border  shadow-sm " >
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-lg">
                                        Envío Personalizado de Documentos
                                    </CardTitle>
                                    <p className="text-gray-500 text-sm">
                                        Haz una selección personalizada de los documentos a enviar
                                    </p>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 flex w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                        {recipients.map((recipient) => (
                                            <Card
                                                key={recipient.id}
                                                className="border  flex flex-col shadow-sm bg-neutral-900"
                                            >
                                                <CardHeader className="flex flex-row items-center p-3 pb-2 ">
                                                    <div className="flex items-center space-x-2">
                                                        <div className=" p-1.5 rounded-full">
                                                            {recipient.icon}
                                                        </div>
                                                        <CardTitle className="text-base">{recipient.label}</CardTitle>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="p-3 pt-0 ">
                                                    {/* Información de contacto */}
                                                    <div className="mb-2">
                                                        <p className="text-xs font-medium">Correo: {recipient.email}</p>
                                                        {recipient.copyEmail && (
                                                            <p className="text-xs font-medium">CC: {recipient.copyEmail}</p>
                                                        )}
                                                    </div>
                                                </CardContent>

                                                <Separator />

                                                <CardFooter className="p-3 min-h-[80px] flex flex-col items-start flex-grow">
                                                    <p className="text-xs font-medium text-gray-500 mb-2">Documentos:</p>
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
                                                        <p className="text-xs text-gray-500">
                                                            No hay documentos disponibles
                                                        </p>
                                                    )}
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>


                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    {countSelectedDocuments()} documentos seleccionados
                                </p>
                                <div className="flex items-center gap-2">
                                    {selectedDocs &&
                                        <Button
                                            variant="outline"
                                            onClick={handleOnClickResetSelectedDocs}
                                        >
                                            <Ban className="h-4 w-4 mr-2" />
                                            Cancelar selección
                                        </Button>
                                    }
                                    <Button onClick={sendSelectedDocuments}>
                                        <Send className="h-4 w-4 mr-2" />
                                        Enviar selección
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Secciones 2 (Envío Múltiple) y 3 (Envío Estándar) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Envío Múltiple */}
                            <div className="md:col-span-2">
                                <Card className="border  shadow-sm">
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-lg">
                                            Envío Múltiple Destinatario
                                        </CardTitle>
                                        <p className="text-gray-500 text-sm">
                                            Seleccione un documento para enviarlo a múltiples destinatarios
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
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
                                                            className={`flex items-center p-1 px-2 rounded-md cursor-pointer border transition-colors shadow-sm ${selectedRecipients[recipient.name]
                                                                ? " bg-primary/20"
                                                                : ""
                                                                }`}
                                                            onClick={() => toggleRecipientSelection(recipient.name)}
                                                        >
                                                            <div
                                                                className={`p-1 rounded-full mr-2 ${selectedRecipients[recipient.name]
                                                                    ? ""
                                                                    : ""
                                                                    }`}
                                                            >
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
                                    <CardFooter className="p-4 pt-0">
                                        <Button onClick={sendMultiple}>
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar documento
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>

                            {/* Envío Estándar */}
                            <div className="md:col-span-1">
                                <Card className="border  bg-neutral-800 h-full shadow-sm flex flex-col">
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="text-lg">Envío Automático Estándar</CardTitle>
                                        <CardDescription>Envia automaticamente</CardDescription>

                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-center">

                                        <ul className="text-sm space-y-1 mb-4">
                                            <li className="flex items-center">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></div>
                                                <span>Nota de carga ➜ Cliente</span>
                                            </li>
                                            <li className="flex items-center">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></div>
                                                <span>Paacking list ➜ Cliente</span>
                                            </li>
                                            <li className="flex items-center">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></div>
                                                <span>Documento de transporte (CMR) ➜ Transporte</span>
                                            </li>
                                            <li className="flex items-center">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></div>
                                                <span>Nota de carga ➜ Comercial</span>
                                            </li>
                                            <li className="flex items-center">
                                                <div className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></div>
                                                <span>Packing list ➜ Comercial</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0">
                                        <Button onClick={sendStandarDocuments} className="w-full">
                                            <Send className="h-3.5 w-3.5 mr-1" />
                                            Enviar Estándar
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderDocuments;
