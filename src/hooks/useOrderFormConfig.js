// /src/hooks/useOrderFormConfig.js
import { useMemo } from 'react';

export function useOrderFormConfig(orderData) {
    const defaultValues = useMemo(() => ({
        entryDate: orderData?.entryDate || '',
        loadDate: orderData?.loadDate || '',
        commercial: orderData?.commercial || '',
        payment: orderData?.payment || '',
        incoterm: orderData?.incoterm || '',
        transport: orderData?.transport?.name || '',
        billingAddress: orderData?.billingAddress || '',
        shippingAddress: orderData?.shippingAddress || '',
        productionNotes: orderData?.productionNotes || '',
        accountingNotes: orderData?.accountingNotes || '',
        transportNotes: orderData?.transportNotes || '',
        emails: orderData?.emails || '',
    }), [orderData]);

    const formGroups = useMemo(() => ([
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
                    name: 'commercial',
                    label: 'Comercial',
                    component: 'Select',
                    rules: { required: 'Seleccione un comercial' },
                    options: [
                        { value: 'juan', label: 'Juan Pérez' },
                        { value: 'maria', label: 'María García' },
                        { value: 'carlos', label: 'Carlos López' },
                    ],
                    props: { placeholder: 'Seleccionar comercial' },
                },
                {
                    name: 'payment',
                    label: 'Forma de pago',
                    component: 'Select',
                    rules: { required: 'Seleccione la forma de pago' },
                    options: [
                        { value: 'transfer', label: 'Transferencia bancaria' },
                        { value: 'credit', label: 'Crédito 30 días' },
                        { value: 'cash', label: 'Efectivo' },
                        { value: 'check', label: 'Cheque' },
                    ],
                    props: { placeholder: 'Seleccionar forma de pago' },
                },
                {
                    name: 'incoterm',
                    label: 'Incoterm',
                    component: 'Select',
                    rules: { required: 'Seleccione un incoterm' },
                    options: [
                        { value: 'exw', label: 'EXW - Ex Works' },
                        { value: 'fob', label: 'FOB - Free on Board' },
                        { value: 'cif', label: 'CIF - Cost, Insurance & Freight' },
                        { value: 'dap', label: 'DAP - Delivered at Place' },
                    ],
                    props: { placeholder: 'Seleccionar Incoterm' },
                },
            ],
        },
        {
            group: 'Transporte',
            grid: 'grid-cols-1',
            fields: [
                {
                    name: 'transport',
                    label: 'Empresa de transporte',
                    component: 'Combobox',
                    rules: { required: 'Seleccione una empresa de transporte' },
                    options: [
                        { value: 'seur', label: 'SEUR' },
                        { value: 'dhl', label: 'DHL' },
                        { value: 'ups', label: 'UPS' },
                        { value: 'propio', label: 'Transporte Propio' },
                    ],
                    props: {
                        placeholder: 'Seleccionar transporte',
                        searchPlaceholder: 'Buscar transporte...',
                        notFoundMessage: 'No se encontraron resultados',
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
                    },
                },
                {
                    name: 'accountingNotes',
                    label: 'Observaciones de contabilidad',
                    component: 'Textarea',
                    rules: { maxLength: { value: 500, message: 'Máximo 500 caracteres' } },
                    props: {
                        placeholder: 'Notas para contabilidad...',
                        className: 'min-h-[100px]',
                    },
                },
                {
                    name: 'transportNotes',
                    label: 'Observaciones de transporte',
                    component: 'Textarea',
                    rules: { maxLength: { value: 300, message: 'Máximo 300 caracteres' } },
                    props: {
                        placeholder: 'Instrucciones especiales para el transporte...',
                        className: 'min-h-[50px]',
                    },
                },
            ],
        },
        {
            group: 'Emails',
            grid: 'grid-cols-1',
            fields: [
                {
                    name: 'emails',
                    label: 'Lista de emails',
                    component: 'Textarea',
                    rules: {
                        required: 'Ingrese al menos un email',
                        /* Validacion para que en cada linea haya un texto formato email terminado de ; o CC: email; por ejemplo:
                        ejemplo@ejemplo.com;
                        cc:ejemplo@ejemplo.com;
                         */
                        validate: (value) => {
                            // Separamos las líneas y eliminamos líneas vacías
                            const emails = value.split('\n').filter(Boolean);
                            // Verificamos que cada línea tenga un formato válido:
                            // Si la línea contiene ":", asumimos que es de la forma "cc:email" (ignorando mayúsculas)
                            // de lo contrario, se espera un email normal.
                            const validEmails = emails.every((line) => {
                                const parts = line.split(':');
                                if (parts.length > 1) {
                                    // Si hay ":", asumimos que el primer valor es el tipo (ej. "cc") y el segundo es el email.
                                    const [type, emailValue] = parts;
                                    return type.trim().toLowerCase() === 'cc' && emailValue.trim().includes('@');
                                }
                                // Si no tiene ":", se valida que la línea contenga '@'
                                return line.trim().includes('@');
                            });
                            return validEmails || 'Ingrese un email válido por línea';
                        },
                        // Aquí podrías agregar validaciones adicionales (por ejemplo, validación custom para múltiples emails)
                    },
                    props: {
                        placeholder: 'ejemplo1@dominio.com\nejemplo2@dominio.com\nejemplo3@dominio.com',
                        className: 'min-h-[100px]',
                    },
                },
            ],
        },
    ]), [orderData]);

    return { defaultValues, formGroups };
}


