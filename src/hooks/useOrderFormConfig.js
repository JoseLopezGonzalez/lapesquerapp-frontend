// /src/hooks/useOrderFormConfig.js
import { useOrderFormOptions } from './useOrderFormOptions';
import { useEffect, useState, useMemo } from 'react';

const initialDefaultValues = {
    orderType: 'standard',
    entryDate: null, // Cambiado de '' a objeto Date
    loadDate: null, // Cambiado de '' a null
    salesperson: '',
    payment: '',
    incoterm: '',
    transport: '',
    billingAddress: '',
    shippingAddress: '',
    productionNotes: '',
    accountingNotes: '',
    transportNotes: '',
    emails: [],
    ccEmails: [],

};

const ORDER_TYPE_OPTIONS = [
    { value: 'standard', label: 'Pedido estándar' },
    { value: 'autoventa', label: 'Autoventa' },
];

const initialFormGroups = [
    {
        group: 'Tipo de pedido',
        grid: 'grid-cols-1 gap-4',
        fields: [
            {
                name: 'orderType',
                label: 'Tipo de pedido',
                component: 'Select',
                options: ORDER_TYPE_OPTIONS,
                props: { placeholder: 'Seleccionar tipo' },
            },
        ],
    },
    {
        group: 'Fechas',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'entryDate',
                label: 'Fecha de entrada',
                component: 'DatePicker',
                rules: { required: 'La fecha de entrada es obligatoria' },
                props: {},
            },
            {
                name: 'loadDate',
                label: 'Fecha de carga',
                component: 'DatePicker',
                rules: { required: 'La fecha de carga es obligatoria' },
                props: {},
            },
        ],
    },
    {
        group: 'Información Comercial',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'salesperson',
                label: 'Comercial',
                component: 'Select',
                rules: { required: 'Seleccione un comercial' },
                options: [],
                props: { placeholder: 'Seleccionar comercial' },
            },
            {
                name: 'payment',
                label: 'Forma de pago',
                component: 'Select',
                rules: { required: 'Seleccione la forma de pago' },
                options: [],
                props: { placeholder: 'Seleccionar forma de pago' },
            },
            {
                name: 'incoterm',
                label: 'Incoterm',
                component: 'Select',
                rules: { required: 'Seleccione un incoterm' },
                options: [],
                props: { placeholder: 'Seleccionar Incoterm' },
            },
            /* buyerReference */
            {
                name: 'buyerReference',
                label: 'Referencia del comprador',
                component: 'Input',
                rules: { required: 'La referencia del comprador es obligatoria' },
                props: { placeholder: 'Referencia del comprador' },
            },
        ],
    },
    {
        group: 'Transporte',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'transport',
                label: 'Empresa de transporte',
                component: 'Combobox',
                rules: { required: 'Seleccione una empresa de transporte' },
                colSpan: 'col-span-2',
                options: [],
                props: {
                    placeholder: 'Seleccionar transporte',
                    searchPlaceholder: 'Buscar transporte...',
                    notFoundMessage: 'No se encontraron resultados',
                },
            },
            /* truckPlate y trailerPlate */
            {
                name: 'truckPlate',
                label: 'Matrícula camión',
                component: 'Input',
                props: { placeholder: '0000 AAA' },
            },
            {
                name: 'trailerPlate',
                label: 'Matrícula remolque',
                component: 'Input',
                props: { placeholder: 'R-0000 AAA' },
            },
            /* transportationNotes */
            {
                name: 'transportationNotes',
                label: 'Observaciones',
                component: 'Textarea',
                rules: { maxLength: { value: 300, message: 'Máximo 300 caracteres' } },
                colSpan: 'col-span-2',
                props: {
                    placeholder: 'Instrucciones especiales para el transporte...',
                    className: 'min-h-[50px]',
                    rows: 4,
                },
            },
        ],
    },
    {
        group: 'Direcciones',
        grid: 'grid-cols-2 gap-4',
        fields: [
            {
                name: 'billingAddress',
                label: 'Dirección de Facturación',
                component: 'Textarea',
                rules: { required: 'La dirección de facturación es obligatoria' },
                props: {
                    placeholder: 'Nombre / Empresa, Calle, Ciudad, etc.',
                    className: 'min-h-[100px]',
                    rows: 5,
                },
            },
            {
                name: 'shippingAddress',
                label: 'Dirección de Entrega',
                component: 'Textarea',
                rules: { required: 'La dirección de entrega es obligatoria' },
                props: {
                    placeholder: 'Nombre / Empresa, Calle, Ciudad, etc.',
                    className: 'min-h-[100px]',
                    rows: 5,
                },
            },
        ],
    },
    {
        group: 'Observaciones',
        grid: 'grid-cols-1 gap-4',
        fields: [
            {
                name: 'productionNotes',
                label: 'Observaciones de producción',
                component: 'Textarea',
                rules: { maxLength: { value: 500, message: 'Máximo 500 caracteres' } },
                props: {
                    placeholder: 'Instrucciones especiales para producción...',
                    className: 'min-h-[100px]',
                    rows: 4,
                },
            },
            {
                name: 'accountingNotes',
                label: 'Observaciones de contabilidad',
                component: 'Textarea',
                rules: { maxLength: { value: 500, message: 'Máximo 500 caracteres' } },
                props: {
                    placeholder: 'Notas para contabilidad...',
                    className: 'min-h-[200px]',
                    rows: 4,
                },
            },

        ],
    },
    {
        group: 'Emails',
        grid: 'grid-cols-1  gap-4',
        fields: [
            {
                name: 'emails',
                label: 'Para',
                component: 'emailList',
                rules: {
                    validate: (emails) =>
                        Array.isArray(emails) && emails.length > 0
                            ? true
                            : 'Debe ingresar al menos un correo',
                },
                props: {
                    placeholder: 'Introduce correos y pulsa Enter',
                },
            },
            {
                name: 'ccEmails',
                label: 'CC',
                component: 'emailList',
                rules: {
                    validate: (emails) =>
                        Array.isArray(emails)
                            ? true
                            : 'Formato inválido en CC',
                },
                props: {
                    placeholder: 'Introduce correos en copia (opcional)',
                },
            },
        ]
    }

]

export function useOrderFormConfig({ orderData }) {
    const [defaultValues, setDefaultValues] = useState(initialDefaultValues);
    const [formGroups, setFormGroups] = useState(initialFormGroups);
    const { options, loading: optionsLoading } = useOrderFormOptions();

    // Función helper para convertir fechas de forma segura
    const parseDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
    };

    // Actualizar defaultValues cuando cambie orderData
    useEffect(() => {
        if (orderData) {
            setDefaultValues({
                orderType: (orderData.orderType ?? orderData.order_type) === 'autoventa' ? 'autoventa' : 'standard',
                entryDate: parseDate(orderData.entryDate),
                loadDate: parseDate(orderData.loadDate),
                salesperson: `${orderData.salesperson?.id || ''}`,
                payment: `${orderData.paymentTerm?.id || ''}`,
                incoterm: `${orderData.incoterm?.id || ''}`,
                buyerReference: orderData.buyerReference || '',
                transport: `${orderData.transport?.id || ''}`,
                truckPlate: orderData.truckPlate || '',
                trailerPlate: orderData.trailerPlate || '',
                transportationNotes: orderData.transportationNotes || '',
                billingAddress: orderData.billingAddress || '',
                shippingAddress: orderData.shippingAddress || '',
                productionNotes: orderData.productionNotes || '',
                accountingNotes: orderData.accountingNotes || '',
                transportNotes: orderData.transportNotes || '',
                emails: orderData.emails || [],
                ccEmails: orderData.ccEmails || [],
            });
        }
    }, [orderData]);

    // Actualizar formGroups cuando se carguen las opciones
    // Usar useMemo para evitar recrear formGroups innecesariamente
    const formGroupsWithOptions = useMemo(() => {
        // Si está cargando y no tenemos opciones aún, retornar initialFormGroups
        // Pero si ya tenemos opciones cargadas (aunque esté recargando), mantenerlas
        if (optionsLoading && 
            (!options.salespeople?.length && 
             !options.paymentTerms?.length && 
             !options.incoterms?.length && 
             !options.transports?.length)) {
            return initialFormGroups;
        }

        return initialFormGroups.map((group) => {
            if (group.group === 'Información Comercial') {
                return {
                    ...group,
                    fields: group.fields.map((field) => {
                        if (field.name === 'salesperson') {
                            return {
                                ...field,
                                options: options.salespeople.map((sp) => ({
                                    value: `${sp.id}`,
                                    label: `${sp.name}`,
                                })),
                            };
                        }
                        if (field.name === 'payment') {
                            return {
                                ...field,
                                options: options.paymentTerms.map((pt) => ({
                                    value: `${pt.id}`,
                                    label: `${pt.name}`,
                                })),
                            };
                        }
                        if (field.name === 'incoterm') {
                            return {
                                ...field,
                                options: options.incoterms.map((inc) => ({
                                    value: `${inc.id}`,
                                    label: `${inc.name}`,
                                })),
                            };
                        }
                        return field;
                    }),
                };
            }
            if (group.group === 'Transporte') {
                return {
                    ...group,
                    fields: group.fields.map((field) => {
                        if (field.name === 'transport') {
                            return {
                                ...field,
                                options: options.transports.map((tr) => ({
                                    value: `${tr.id}`,
                                    label: `${tr.name}`,
                                })),
                            };
                        }
                        return field;
                    }),
                };
            }
            return group;
        });
    }, [options.salespeople, options.paymentTerms, options.incoterms, options.transports, optionsLoading]);

    // Asegurarse de que loading se actualice correctamente cuando optionsLoading cambia
    // Usar useMemo para calcular loading basándose en si realmente hay opciones
    const actualLoading = useMemo(() => {
        const hasOptions = options.salespeople.length > 0 || 
                          options.incoterms.length > 0 || 
                          options.paymentTerms.length > 0 || 
                          options.transports.length > 0;
        
        const calculatedLoading = hasOptions ? false : (optionsLoading && !hasOptions);
        
        return calculatedLoading;
    }, [optionsLoading, options.salespeople.length, options.incoterms.length, options.paymentTerms.length, options.transports.length]);

    useEffect(() => {
        // Actualizar formGroups cuando las opciones cambien
        // Si está cargando pero ya tenemos opciones, actualizarlas igualmente
        // para mantener los valores visibles durante recargas
        setFormGroups(formGroupsWithOptions);
    }, [formGroupsWithOptions]);

    const loading = actualLoading;
    const loadingProgress = { current: actualLoading ? 0 : 4, total: 4 };

    return { defaultValues, formGroups, loading, loadingProgress };
}


