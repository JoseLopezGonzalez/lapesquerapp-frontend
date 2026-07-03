/**
 * Configuración de secciones del pedido: primarias (visibles como cards en mobile) vs overflow (menú ⋮)
 * Ref: docs/mobile-app/analisis/02-ANALISIS-EDITOR-PEDIDO-MOBILE.md
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  Info,
  Package,
  PackagePlus,
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
  type LucideIcon,
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
const OrderAuxiliaryLines = lazy(() => import('../OrderAuxiliaryLines'));
const OrderIncident = lazy(() => import('../OrderIncident'));
const OrderCustomerHistory = lazy(() => import('../OrderCustomerHistory'));
const OrderAttachments = lazy(() => import('../OrderAttachments'));

// Registro polimórfico: cada sección renderiza un componente con props propias distintas.
// Se tipa laxo a propósito para admitir esa heterogeneidad sin duplicar registros.
type OrderSectionComponent = ComponentType<{ readOnly?: boolean; canViewCostData?: boolean }>;

export interface OrderSectionConfig {
  id: string;
  title: string;
  component: OrderSectionComponent | LazyExoticComponent<OrderSectionComponent>;
  lazy?: boolean;
  icon: LucideIcon;
  /** Nivel de énfasis en la grid móvil: 1 = card grande (uso frecuente), 2 = card estándar (consulta) */
  mobileTier?: 1 | 2;
  /** Sublabel mostrado en la grid móvil cuando la sección no tiene un dato dinámico calculado */
  mobileDefaultSublabel?: string;
}

export const SECTIONS_CONFIG: OrderSectionConfig[] = [
  {
    id: 'details',
    title: 'Información',
    component: OrderDetails,
    icon: Info,
    mobileDefaultSublabel: 'Datos generales',
  },
  {
    id: 'products',
    title: 'Previsión',
    component: OrderPlannedProductDetails,
    lazy: true,
    icon: Package,
    mobileDefaultSublabel: 'Producto previsto',
  },
  {
    id: 'productDetails',
    title: 'Detalle productos',
    component: OrderProductDetails,
    lazy: true,
    icon: ListCollapse,
    mobileTier: 1,
  },
  {
    id: 'auxiliary',
    title: 'Otros artículos',
    component: OrderAuxiliaryLines,
    lazy: true,
    icon: PackagePlus,
    mobileDefaultSublabel: 'Nieve, envases, servicios',
  },
  {
    id: 'analysis',
    title: 'Análisis',
    component: OrderCostAnalysis,
    lazy: true,
    icon: ChartColumn,
    mobileDefaultSublabel: 'Rentabilidad del pedido',
  },
  {
    id: 'production',
    title: 'Producción',
    component: OrderProduction,
    lazy: true,
    icon: Factory,
    mobileTier: 1,
  },
  {
    id: 'pallets',
    title: 'Palets',
    component: OrderPallets,
    lazy: true,
    icon: Package,
    mobileTier: 1,
  },
  {
    id: 'labels',
    title: 'Etiquetas',
    component: OrderLabels,
    lazy: true,
    icon: Tickets,
    mobileDefaultSublabel: 'Gestionar etiquetas',
  },
  {
    id: 'documents',
    title: 'Envío de Documentos',
    component: OrderDocuments,
    lazy: true,
    icon: FileCheck,
    mobileDefaultSublabel: 'Enviar documentación',
  },
  {
    id: 'export',
    title: 'Descargas',
    component: OrderExport,
    lazy: true,
    icon: Download,
    mobileDefaultSublabel: 'Descargar PDF/Excel',
  },
  {
    id: 'map',
    title: 'Ruta',
    component: OrderMap,
    lazy: true,
    icon: Map,
    mobileDefaultSublabel: 'Ver ruta de entrega',
  },
  {
    id: 'incident',
    title: 'Incidencia',
    component: OrderIncident,
    lazy: true,
    icon: AlertTriangle,
    mobileDefaultSublabel: 'Sin incidencias',
  },
  {
    id: 'customer-history',
    title: 'Histórico',
    component: OrderCustomerHistory,
    lazy: true,
    icon: History,
    mobileDefaultSublabel: 'Histórico del cliente',
  },
  {
    id: 'attachments',
    title: 'Adjuntos',
    component: OrderAttachments,
    lazy: true,
    icon: Paperclip,
    mobileDefaultSublabel: 'Archivos adjuntos',
  },
];
