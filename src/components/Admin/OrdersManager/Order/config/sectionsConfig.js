/**
 * Configuración de secciones del pedido: primarias (visibles como cards en mobile) vs overflow (menú ⋮)
 * Ref: docs/mobile-app/analisis/02-ANALISIS-EDITOR-PEDIDO-MOBILE.md
 */
import { lazy } from 'react';
import {
  Info,
  Package,
  ListCollapse,
  Factory,
  ChartColumn,
  Tickets,
  FileCheck,
  Download,
  Map,
  AlertTriangle,
  History,
  Paperclip,
} from 'lucide-react';
import OrderDetails from '../OrderDetails';

const OrderPallets = lazy(() => import('../OrderPallets'));
const OrderDocuments = lazy(() => import('../OrderDocuments'));
const OrderExport = lazy(() => import('../OrderExport'));
const OrderLabels = lazy(() => import('../OrderLabels'));
const OrderMap = lazy(() => import('../OrderMap'));
const OrderProduction = lazy(() => import('../OrderProduction'));
const OrderCostAnalysis = lazy(() => import('../OrderCostAnalysis'));
const OrderProductDetails = lazy(() => import('../OrderProductDetails'));
const OrderPlannedProductDetails = lazy(() => import('../OrderPlannedProductDetails'));
const OrderIncident = lazy(() => import('../OrderIncident'));
const OrderCustomerHistory = lazy(() => import('../OrderCustomerHistory'));
const OrderAttachments = lazy(() => import('../OrderAttachments'));

export const SECTIONS_CONFIG = [
  { id: 'details', title: 'Información', component: OrderDetails, icon: Info },
  {
    id: 'products',
    title: 'Previsión',
    component: OrderPlannedProductDetails,
    lazy: true,
    icon: Package,
  },
  {
    id: 'productDetails',
    title: 'Detalle productos',
    component: OrderProductDetails,
    lazy: true,
    icon: ListCollapse,
  },
  {
    id: 'analysis',
    title: 'Análisis',
    component: OrderCostAnalysis,
    lazy: true,
    icon: ChartColumn,
  },
  { id: 'production', title: 'Producción', component: OrderProduction, lazy: true, icon: Factory },
  { id: 'pallets', title: 'Palets', component: OrderPallets, lazy: true, icon: Package },
  { id: 'labels', title: 'Etiquetas', component: OrderLabels, lazy: true, icon: Tickets },
  {
    id: 'documents',
    title: 'Envío de Documentos',
    component: OrderDocuments,
    lazy: true,
    icon: FileCheck,
  },
  { id: 'export', title: 'Descargas', component: OrderExport, lazy: true, icon: Download },
  { id: 'map', title: 'Ruta', component: OrderMap, lazy: true, icon: Map },
  {
    id: 'incident',
    title: 'Incidencia',
    component: OrderIncident,
    lazy: true,
    icon: AlertTriangle,
  },
  {
    id: 'customer-history',
    title: 'Histórico',
    component: OrderCustomerHistory,
    lazy: true,
    icon: History,
  },
  {
    id: 'attachments',
    title: 'Adjuntos',
    component: OrderAttachments,
    lazy: true,
    icon: Paperclip,
  },
];

export const PRIMARY_SECTION_IDS_MOBILE = ['products', 'production', 'documents'];
