'use client';

import { fetchWithTenant } from '@lib/fetchWithTenant';
import { notify } from '@/lib/notifications';
import { API_URL_V2 } from '@/configs/config';
import type { Order } from '@/services/orderService';
import type { Session } from 'next-auth';

// Nota técnica: fetchWithTenant se usa directamente aquí porque exportDocument
// necesita acceso al blob binario de respuesta, no al JSON parseado.
// Candidato a refactorizar a downloadFileGeneric en un GAP futuro.

interface ExportDocumentConfig {
  name: string;
  label: string;
  types: string[];
  fields: string[];
}

interface FastExportDocumentConfig {
  name: string;
  label: string;
  type: string;
}

const COMMERCIAL_RESTRICTED_DOCUMENT_NAMES = new Set([
  'restricted-loading-note',
  'restricted-order-signs',
  'pallet-expedition-labels',
]);

function getSessionRoles(session: Session | null): string[] {
  const role = session?.user?.role;
  if (!role) return [];
  return Array.isArray(role) ? role.map(String) : [String(role)];
}

function isCommercialSession(session: Session | null): boolean {
  return getSessionRoles(session).includes('comercial');
}

function isCommercialRestrictedDocument(documentName: string): boolean {
  return COMMERCIAL_RESTRICTED_DOCUMENT_NAMES.has(documentName);
}

function getOrderExportUrl({
  orderId,
  documentName,
  type,
}: {
  orderId: number | string;
  documentName: string;
  type: string;
}): string {
  if (documentName === 'restricted-order-signs' && type === 'pdf') {
    return `${API_URL_V2}orders/${orderId}/pdf/restricted-order-signs`;
  }
  return `${API_URL_V2}orders/${orderId}/${type}/${documentName}`;
}

const exportDocuments: ExportDocumentConfig[] = [
  {
    name: 'loading-note',
    label: 'Nota de Carga',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes'],
  },
  {
    name: 'restricted-loading-note',
    label: 'Nota de Carga (Restringida)',
    types: ['pdf'],
    fields: [
      'Datos básicos - sin nombre de cliente',
      'Direcciones',
      'Observaciones',
      'Fechas',
      'Lotes',
    ],
  },
  {
    name: 'order-cmr',
    label: 'Documento de transporte (CMR)',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
  },
  {
    name: 'order-signs',
    label: 'Letreros de transporte',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Transportes'],
  },
  {
    name: 'restricted-order-signs',
    label: 'Letreros de transporte (Restringidos)',
    types: ['pdf'],
    fields: ['Expedidor', 'Información del palet', 'QR del palet', 'QR del pedido'],
  },
  {
    name: 'pallet-expedition-labels',
    label: 'Etiquetas de expedición de palets',
    types: ['pdf'],
    fields: [
      'Empresa',
      'QR del palet',
      'Nº de palet',
      'Pedido',
      'Cliente/destino',
      'Transporte',
      'Cajas',
      'Peso neto',
    ],
  },
  {
    name: 'order-packing-list',
    label: 'Packing List',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Palets', 'Lotes', 'Productos'],
  },
  {
    name: 'order-sheet',
    label: 'Hoja de pedido',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Fechas', 'Lotes', 'Productos'],
  },
  {
    name: 'lots-report',
    label: 'Reporte de Lotes',
    types: ['xlsx'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Lotes', 'Productos'],
  },
  {
    name: 'boxes-report',
    label: 'Reporte de Cajas',
    types: ['xlsx'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Cajas', 'Productos'],
  },
  {
    name: 'A3ERP-sales-delivery-note',
    label: 'Albarán de venta A3ERP',
    types: ['xls'],
    fields: ['Datos básicos', 'Direcciones', 'A3ERP', 'Productos'],
  },
  {
    name: 'valued-loading-note',
    label: 'Nota de carga valorada',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
  },
  {
    name: 'order-confirmation',
    label: 'Confirmación de pedido',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
  },
  {
    name: 'transport-pickup-request',
    label: 'Solicitud de recogida de transporte',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Productos'],
  },
  {
    name: 'incident',
    label: 'Reporte de Incidencias',
    types: ['pdf'],
    fields: ['Datos básicos', 'Direcciones', 'Observaciones', 'Incidencias'],
  },
  {
    name: 'maquilador-cmr',
    label: 'CMR Maquilador',
    types: ['pdf'],
    fields: ['Expedidor', 'Destinatario (anonimizado)', 'Transporte', 'Lugar de carga'],
  },
  {
    name: 'maquilador-signs',
    label: 'Letreros Maquilador',
    types: ['pdf'],
    fields: ['Expedidor', 'Consignatario (anonimizado)', 'Datos de palet', 'QR codes'],
  },
];

const fastExportDocuments: FastExportDocumentConfig[] = [
  { name: 'order-sheet', label: 'Hoja de pedido', type: 'pdf' },
  { name: 'loading-note', label: 'Nota de carga', type: 'pdf' },
  { name: 'restricted-loading-note', label: 'Nota de carga (Restringida)', type: 'pdf' },
  { name: 'order-cmr', label: 'Documento de transporte (CMR)', type: 'pdf' },
  { name: 'order-signs', label: 'Letreros de transporte', type: 'pdf' },
  { name: 'restricted-order-signs', label: 'Letreros de transporte (Restringidos)', type: 'pdf' },
  { name: 'pallet-expedition-labels', label: 'Etiquetas de expedición de palets', type: 'pdf' },
  { name: 'order-packing-list', label: 'Packing List', type: 'pdf' },
  { name: 'maquilador-cmr', label: 'CMR Maquilador', type: 'pdf' },
  { name: 'maquilador-signs', label: 'Letreros Maquilador', type: 'pdf' },
];

interface UseOrderDocumentsParams {
  order: Order | null;
  session: Session | null;
}

export interface UseOrderDocumentsResult {
  exportDocument: (documentName: string, type: string, documentLabel: string) => Promise<void>;
  exportDocuments: ExportDocumentConfig[];
  fastExportDocuments: FastExportDocumentConfig[];
  sendDocuments: {
    customDocuments: (json: unknown) => Promise<unknown>;
    standardDocuments: () => Promise<unknown>;
    maquiladorDocuments: () => Promise<unknown>;
  };
  hasMaquilador: boolean;
}

export function useOrderDocuments({
  order,
  session,
}: UseOrderDocumentsParams): UseOrderDocumentsResult {
  const isCommercial = isCommercialSession(session);

  const exportDocument = async (documentName: string, type: string, documentLabel: string) => {
    if (!order) return;
    if (isCommercial && isCommercialRestrictedDocument(documentName)) {
      notify.error({
        title: 'Documento no disponible',
        description: 'Este documento no está disponible para el rol Comercial.',
      });
      return;
    }

    const toastId = `order-export-${order.id}-${documentName}-${type}`;
    const doExport = async () => {
      const response = await fetchWithTenant(
        getOrderExportUrl({ orderId: order.id, documentName, type }),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
            'User-Agent': navigator.userAgent,
          },
        }
      );
      if (!response.ok) throw new Error('Error al exportar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentLabel}_${order.id}.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    };
    await notify.promise(
      doExport(),
      {
        loading: {
          title: `Generando ${documentLabel}`,
          description: `Preparando el archivo ${type.toUpperCase()} para descarga.`,
        },
        success: {
          title: 'Exportación completada',
          description: `${documentLabel}.${type} ya está listo para descargarse.`,
        },
        error: (error: unknown) => {
          const e = error as Record<string, unknown>;
          const data = e?.data as Record<string, unknown> | undefined;
          const response = e?.response as Record<string, unknown> | undefined;
          const responseData = response?.data as Record<string, unknown> | undefined;
          const desc =
            (e?.userMessage as string) ||
            (data?.userMessage as string) ||
            (responseData?.userMessage as string) ||
            (e?.message as string) ||
            'No se pudo completar la exportación. Intente de nuevo.';
          return { title: 'Error al exportar', description: desc };
        },
      },
      { id: toastId }
    );
  };

  const sendCustomDocuments = async (json: unknown): Promise<unknown> => {
    if (!order) return;
    const token = session?.user?.accessToken;
    return fetchWithTenant(`${API_URL_V2}orders/${order.id}/send-custom-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': navigator.userAgent,
      },
      body: JSON.stringify(json),
    }).then((response: Response) => {
      if (!response.ok) {
        return response.json().then(async (errorData: unknown) => {
          const { getErrorMessage } = await import('@/lib/api/apiHelpers');
          throw new Error(getErrorMessage(errorData as object) || 'Error ');
        });
      }
      return response.json();
    });
  };

  const sendMaquiladorDocuments = async (): Promise<unknown> => {
    if (!order) return;
    if (isCommercial) {
      notify.error({
        title: 'Acción no disponible',
        description: 'El envío de documentación al maquilador no está disponible para el rol Comercial.',
      });
      return;
    }
    const token = session?.user?.accessToken;
    return fetchWithTenant(`${API_URL_V2}orders/${order.id}/send-maquilador-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': navigator.userAgent,
      },
    }).then((response: Response) => {
      if (!response.ok) {
        return response.json().then(async (errorData: unknown) => {
          const { getErrorMessage } = await import('@/lib/api/apiHelpers');
          throw new Error(getErrorMessage(errorData as object) || 'Error');
        });
      }
      return response.json();
    });
  };

  const sendStandarDocuments = async (): Promise<unknown> => {
    if (!order) return;
    const token = session?.user?.accessToken;
    return fetchWithTenant(`${API_URL_V2}orders/${order.id}/send-standard-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': navigator.userAgent,
      },
    })
      .then((response: Response) => {
        if (!response.ok) {
          return response.json().then(async (errorData: unknown) => {
            const { getErrorMessage } = await import('@/lib/api/apiHelpers');
            throw new Error(getErrorMessage(errorData as object) || 'Error ');
          });
        }
        return response.json();
      })
      .then((data: { data: unknown }) => data.data);
  };

  const visibleExportDocuments = isCommercial
    ? exportDocuments.filter((doc) => !isCommercialRestrictedDocument(doc.name))
    : exportDocuments;

  const visibleFastExportDocuments = isCommercial
    ? fastExportDocuments.filter((doc) => !isCommercialRestrictedDocument(doc.name))
    : fastExportDocuments;

  const hasMaquilador = !!(order as { externalProcessorId?: number | string | null } | null)?.externalProcessorId ||
    !!(order as { externalProcessor?: { id?: number | string } | null } | null)?.externalProcessor?.id;

  return {
    exportDocument,
    exportDocuments: visibleExportDocuments,
    fastExportDocuments: visibleFastExportDocuments,
    sendDocuments: {
      customDocuments: sendCustomDocuments,
      standardDocuments: sendStandarDocuments,
      maquiladorDocuments: sendMaquiladorDocuments,
    },
    hasMaquilador,
  };
}
