'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { RouteMap } from '@/components/Maps/RouteMap';
import { geocodeAddress, hasMapboxToken } from '@/lib/maps/geocoding';
import { getRouteDirections } from '@/lib/maps/directions';
import { useFieldOperatorOptions } from '@/hooks/useFieldOptions';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useProspectsList } from '@/hooks/useProspects';
import { useRouteMutations, useRoutes } from '@/hooks/useRoutes';
import { useRouteTemplateMutations, useRouteTemplates } from '@/hooks/useRouteTemplates';
import { useSpainAverageDieselPrice } from '@/hooks/useSpainAverageDieselPrice';
import { notify } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CopyPlus,
  Droplets,
  FileText,
  GripVertical,
  Info,
  MapPinPlus,
  MapPinned,
  PanelLeftOpen,
  Pencil,
  Plus,
  Route,
  Save,
  Loader2,
  UserRound,
  X,
} from 'lucide-react';

function normalizeStops(stops = []) {
  return stops.map((stop, index) => ({
    id: stop.id ?? `temp-${index}-${Date.now()}`,
    position: index + 1,
    stopType: stop.stopType ?? 'obligatoria',
    targetType: stop.targetType ?? 'location',
    customerId: stop.customerId ?? null,
    prospectId: stop.prospectId ?? null,
    label: stop.label ?? '',
    address: stop.address ?? '',
    notes: stop.notes ?? '',
    lat: stop.lat ?? null,
    lng: stop.lng ?? null,
  }));
}

function createDraftStop(overrides = {}) {
  return {
    id: overrides.id ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    position: overrides.position ?? 1,
    stopType: overrides.stopType ?? 'obligatoria',
    targetType: overrides.targetType ?? 'location',
    customerId: overrides.customerId ?? null,
    prospectId: overrides.prospectId ?? null,
    label: overrides.label ?? '',
    address: overrides.address ?? '',
    notes: overrides.notes ?? '',
    lat: overrides.lat ?? null,
    lng: overrides.lng ?? null,
  };
}

function createEmptyRouteDraft(overrides = {}) {
  return {
    id: null,
    name: '',
    description: '',
    routeDate: '',
    fieldOperatorId: '',
    routeTemplateId: '',
    sourceMode: 'manual',
    stopsEdited: false,
    stops: [],
    ...overrides,
  };
}

function createEmptyTemplateDraft(overrides = {}) {
  return {
    id: null,
    name: '',
    description: '',
    fieldOperatorId: '',
    stops: [],
    ...overrides,
  };
}

function createEmptyNewItemDraft(overrides = {}) {
  return {
    name: '',
    description: '',
    routeDate: '',
    fieldOperatorId: '',
    sourceMode: 'manual',
    routeTemplateId: '',
    ...overrides,
  };
}

function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters <= 0) return 'Sin calcular';
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Sin calcular';
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes.toString().padStart(2, '0')} min`;
}

function formatCurrency(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return 'No disponible';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStopTypeLabel(value) {
  const labels = {
    obligatoria: 'Obligatoria',
    sugerida: 'Sugerida',
    oportunidad: 'Oportunidad',
  };

  return labels[value] ?? value ?? 'Sin tipo';
}

function getTargetTypeLabel(value) {
  const labels = {
    location: 'Ubicación',
    customer: 'Cliente',
    prospect: 'Prospecto',
  };

  return labels[value] ?? value ?? 'Sin objetivo';
}

function getRouteStatusLabel(value) {
  const normalizedValue = typeof value === 'string' ? value.trim().toLowerCase() : value;
  const labels = {
    pending: 'Pendiente',
    planned: 'Planificada',
    draft: 'Borrador',
    assigned: 'Asignada',
    active: 'Activa',
    in_progress: 'En curso',
    completed: 'Completada',
    finished: 'Finalizada',
    cancelled: 'Cancelada',
    canceled: 'Cancelada',
    incident: 'Incidencia',
    skipped: 'Omitida',
  };

  return labels[normalizedValue] ?? value ?? 'Pendiente';
}

async function enrichStopsWithCoordinates(stops) {
  return Promise.all(
    (stops ?? []).map(async (stop) => {
      if (stop?.lat != null && stop?.lng != null) return stop;
      const query = stop?.address || stop?.label;
      if (!query) return stop;
      try {
        const [feature] = await geocodeAddress(query);
        if (!feature?.center) return stop;
        return { ...stop, lng: feature.center[0], lat: feature.center[1] };
      } catch (_) {
        return stop;
      }
    })
  );
}

function SortableStopItem({ stop, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stop.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border bg-background p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 rounded-md border p-1 text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onEdit(stop)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">#{stop.position}</span>
            <Badge variant="outline">{getStopTypeLabel(stop.stopType)}</Badge>
            <Badge variant="secondary">{getTargetTypeLabel(stop.targetType)}</Badge>
          </div>
          <p className="mt-2 font-medium">{stop.label || 'Parada sin título'}</p>
          <p className="truncate text-sm text-muted-foreground">{stop.address || 'Sin dirección'}</p>
        </button>
      </div>
    </div>
  );
}

function StopEditorDialog({
  open,
  onOpenChange,
  initialStop,
  onSave,
  customerOptions,
  prospectOptions,
  mode = 'edit',
}) {
  const [draft, setDraft] = useState(initialStop);

  useEffect(() => {
    setDraft(initialStop);
  }, [initialStop]);

  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nueva parada' : 'Editar parada'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Define primero la parada antes de añadirla a la ruta o plantilla.'
              : 'Define el tipo de parada, su objetivo y el contexto visible.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de parada</Label>
              <Select value={draft.stopType} onValueChange={(value) => setDraft((current) => ({ ...current, stopType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="obligatoria">Obligatoria</SelectItem>
                  <SelectItem value="sugerida">Sugerida</SelectItem>
                  <SelectItem value="oportunidad">Oportunidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select
                value={draft.targetType}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    targetType: value,
                    customerId: value === 'customer' ? current.customerId : null,
                    prospectId: value === 'prospect' ? current.prospectId : null,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Ubicación</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="prospect">Prospecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {draft.targetType === 'customer' && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={draft.customerId != null ? String(draft.customerId) : ''}
                onValueChange={(value) => {
                  const selected = customerOptions.find((option) => option.value === value);
                  setDraft((current) => ({
                    ...current,
                    customerId: value ? Number(value) : null,
                    prospectId: null,
                    label: selected?.label || current.label,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {draft.targetType === 'prospect' && (
            <div className="space-y-2">
              <Label>Prospecto</Label>
              <Select
                value={draft.prospectId != null ? String(draft.prospectId) : ''}
                onValueChange={(value) => {
                  const selected = prospectOptions.find((option) => option.value === value);
                  setDraft((current) => ({
                    ...current,
                    prospectId: value ? Number(value) : null,
                    customerId: null,
                    label: selected?.label || current.label,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un prospecto" />
                </SelectTrigger>
                <SelectContent>
                  {prospectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Etiqueta</Label>
            <Input value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(draft)}>{mode === 'create' ? 'Añadir parada' : 'Guardar parada'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetadataEditorDialog({
  open,
  onOpenChange,
  tab,
  draft,
  fieldOperatorOptions,
  onChange,
}) {
  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{tab === 'routes' ? 'Editar datos de la ruta' : 'Editar datos de la plantilla'}</DialogTitle>
          <DialogDescription>
            Ajusta el contexto general sin cargar la superficie principal del planner.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={draft.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder={tab === 'routes' ? 'Ruta costa norte' : 'Plantilla martes'}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <UserRound className="h-4 w-4" />
                Repartidor
              </Label>
              <Select value={draft.fieldOperatorId || ''} onValueChange={(value) => onChange('fieldOperatorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un repartidor" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOperatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tab === 'routes' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Fecha
                </Label>
                <Input type="date" value={draft.routeDate || ''} onChange={(event) => onChange('routeDate', event.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Descripción
            </Label>
            <Textarea
              value={draft.description || ''}
              onChange={(event) => onChange('description', event.target.value)}
              rows={4}
              placeholder="Resumen corto o nota operativa"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreatePlannerItemDialog({
  open,
  onOpenChange,
  tab,
  draft,
  fieldOperatorOptions,
  templateOptions,
  onChange,
  onConfirm,
}) {
  if (!draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{tab === 'routes' ? 'Nueva ruta' : 'Nueva plantilla'}</DialogTitle>
          <DialogDescription>
            Completa los datos iniciales antes de abrir el editor visual del planner.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={draft.name}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder={tab === 'routes' ? 'Ruta costa norte' : 'Plantilla martes'}
            />
          </div>

          {tab === 'routes' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Origen de la ruta</Label>
                <Select value={draft.sourceMode || 'manual'} onValueChange={(value) => onChange('sourceMode', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Desde cero</SelectItem>
                    <SelectItem value="template">Desde plantilla</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.sourceMode === 'template' && (
                <div className="space-y-2">
                  <Label>Plantilla</Label>
                  <Select value={draft.routeTemplateId || ''} onValueChange={(value) => onChange('routeTemplateId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <UserRound className="h-4 w-4" />
                Repartidor
              </Label>
              <Select value={draft.fieldOperatorId || ''} onValueChange={(value) => onChange('fieldOperatorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un repartidor" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOperatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tab === 'routes' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Fecha
                </Label>
                <Input type="date" value={draft.routeDate || ''} onChange={(event) => onChange('routeDate', event.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Descripción
            </Label>
            <Textarea
              value={draft.description || ''}
              onChange={(event) => onChange('description', event.target.value)}
              rows={4}
              placeholder="Resumen corto o nota operativa"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={onConfirm}
            disabled={!draft.name.trim() || (tab === 'routes' && draft.sourceMode === 'template' && !draft.routeTemplateId)}
          >
            Crear y abrir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoutesPlannerPage({ initialTab = 'routes', routeId = null, templateId = null }) {
  const MEDIUM_VAN_DIESEL_CONSUMPTION_L_PER_100KM = 9.5;
  const router = useRouter();
  const loadedRouteIdRef = useRef(null);
  const loadedTemplateIdRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { options: fieldOperatorOptions } = useFieldOperatorOptions();
  const { data: customersData } = useCustomersList({ perPage: 250 });
  const { data: prospectsData } = useProspectsList({ perPage: 250 });
  const { data: routesData, isLoading: loadingRoutes } = useRoutes({ perPage: 50 });
  const { data: templatesData, isLoading: loadingTemplates } = useRouteTemplates({ perPage: 50 });
  const { createRoute, updateRoute, isSavingRoute } = useRouteMutations();
  const { createTemplate, updateTemplate, isSavingTemplate } = useRouteTemplateMutations();
  const dieselAverage = useSpainAverageDieselPrice();
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [geocodeResults, setGeocodeResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchState, setSearchState] = useState({ type: 'idle', message: '' });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [creatingStop, setCreatingStop] = useState(null);
  const [loadingSelectedItem, setLoadingSelectedItem] = useState(Boolean(routeId || templateId));
  const [detailNotFound, setDetailNotFound] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [directionsError, setDirectionsError] = useState('');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [detailMode, setDetailMode] = useState(Boolean(routeId || templateId));
  const [stopsPanelExpanded, setStopsPanelExpanded] = useState(true);
  const [routeDraft, setRouteDraft] = useState(createEmptyRouteDraft());
  const [templateDraft, setTemplateDraft] = useState(createEmptyTemplateDraft());
  const [newItemDraft, setNewItemDraft] = useState(createEmptyNewItemDraft());

  const routes = useMemo(() => routesData?.items ?? [], [routesData]);
  const templates = useMemo(() => templatesData?.items ?? [], [templatesData]);
  const routeTemplateOptions = useMemo(
    () => templates.map((template) => ({ value: String(template.id), label: template.name ?? `Plantilla ${template.id}` })),
    [templates]
  );
  const customerOptions = useMemo(
    () => (customersData ?? []).map((customer) => ({ value: String(customer.id), label: customer.name })),
    [customersData]
  );
  const prospectOptions = useMemo(
    () => (prospectsData ?? []).map((prospect) => ({ value: String(prospect.id), label: prospect.name })),
    [prospectsData]
  );
  const currentDraft = tab === 'routes' ? routeDraft : templateDraft;
  const currentDraftHasContent = useMemo(() => {
    if (tab === 'routes') {
      return Boolean(
        routeDraft.id ||
          routeDraft.name ||
          routeDraft.description ||
          routeDraft.routeDate ||
          routeDraft.fieldOperatorId ||
          routeDraft.routeTemplateId ||
          routeDraft.stops.length
      );
    }

    return Boolean(
      templateDraft.id ||
        templateDraft.name ||
        templateDraft.description ||
        templateDraft.fieldOperatorId ||
        templateDraft.stops.length
    );
  }, [routeDraft, tab, templateDraft]);
  const routeMetrics = useMemo(() => {
    const coordinatesCount = currentDraft.stops.filter((stop) => stop?.lat != null && stop?.lng != null).length;
    const distanceMeters = routeGeometry?.properties?.distance ?? null;
    const distanceKm = Number.isFinite(distanceMeters) ? distanceMeters / 1000 : null;
    return {
      stopCount: currentDraft.stops.length,
      mappedStopCount: coordinatesCount,
      distanceKm,
      distanceLabel: formatDistance(routeGeometry?.properties?.distance),
      durationLabel: formatDuration(routeGeometry?.properties?.duration),
      ready: coordinatesCount >= 2 && Boolean(routeGeometry?.properties),
    };
  }, [currentDraft.stops, routeGeometry]);
  const dieselCostEstimate = useMemo(() => {
    if (!Number.isFinite(routeMetrics.distanceKm) || !Number.isFinite(dieselAverage.value)) {
      return null;
    }

    const litersNeeded = (routeMetrics.distanceKm * MEDIUM_VAN_DIESEL_CONSUMPTION_L_PER_100KM) / 100;
    const totalCost = litersNeeded * dieselAverage.value;

    return {
      litersNeeded,
      totalCost,
      formattedTotalCost: formatCurrency(totalCost),
      consumptionLabel: `${String(MEDIUM_VAN_DIESEL_CONSUMPTION_L_PER_100KM).replace('.', ',')} l/100 km`,
    };
  }, [dieselAverage.value, routeMetrics.distanceKm]);

  useEffect(() => {
    setDetailMode(Boolean(routeId || templateId));
  }, [routeId, templateId]);

  useEffect(() => {
    if (!routeId) return;

    if (loadedRouteIdRef.current && String(loadedRouteIdRef.current) === String(routeId)) {
      setLoadingSelectedItem(false);
      setDetailNotFound(null);
      return;
    }

    const source = routeId
      ? routes.find((item) => String(item.id) === String(routeId))
      : null;

    if (!source) {
      if (loadingRoutes) {
        setLoadingSelectedItem(true);
        return;
      }

      setLoadingSelectedItem(false);
      setDetailNotFound('route');
      return;
    }

    let cancelled = false;
    setLoadingSelectedItem(true);
    setDetailNotFound(null);

    enrichStopsWithCoordinates(normalizeStops(source.stops ?? [])).then((stops) => {
      if (cancelled) return;

      setRouteDraft(
        createEmptyRouteDraft({
          id: source.id,
          name: source.name ?? '',
          description: source.description ?? '',
          routeDate: source.routeDate ?? '',
          fieldOperatorId: source.fieldOperator?.id != null ? String(source.fieldOperator.id) : '',
          routeTemplateId:
            source.routeTemplateId != null
              ? String(source.routeTemplateId)
              : source.routeTemplate?.id != null
                ? String(source.routeTemplate.id)
                : '',
          sourceMode:
            source.routeTemplateId != null || source.routeTemplate?.id != null
              ? 'template'
              : 'manual',
          stopsEdited: false,
          stops,
        })
      );
      loadedRouteIdRef.current = source.id;
      setLoadingSelectedItem(false);
    });

    return () => {
      cancelled = true;
    };
  }, [routeId, routes, loadingRoutes]);

  useEffect(() => {
    if (!templateId) return;

    if (loadedTemplateIdRef.current && String(loadedTemplateIdRef.current) === String(templateId)) {
      setLoadingSelectedItem(false);
      setDetailNotFound(null);
      return;
    }

    const source = templateId
      ? templates.find((item) => String(item.id) === String(templateId))
      : null;

    if (!source) {
      if (loadingTemplates) {
        setLoadingSelectedItem(true);
        return;
      }

      setLoadingSelectedItem(false);
      setDetailNotFound('template');
      return;
    }

    let cancelled = false;
    setLoadingSelectedItem(true);
    setDetailNotFound(null);

    enrichStopsWithCoordinates(normalizeStops(source.stops ?? [])).then((stops) => {
      if (cancelled) return;

      setTemplateDraft(
        createEmptyTemplateDraft({
          id: source.id,
          name: source.name ?? '',
          description: source.description ?? '',
          fieldOperatorId: source.fieldOperator?.id != null ? String(source.fieldOperator.id) : '',
          stops,
        })
      );
      loadedTemplateIdRef.current = source.id;
      setLoadingSelectedItem(false);
    });

    return () => {
      cancelled = true;
    };
  }, [templateId, templates, loadingTemplates]);

  useEffect(() => {
    let cancelled = false;
    setDirectionsError('');

    const stopsWithCoordinates = currentDraft.stops.filter((stop) => stop?.lat != null && stop?.lng != null);
    if (stopsWithCoordinates.length < 2) {
      setRouteGeometry(null);
      setIsCalculatingRoute(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadDirections() {
      setIsCalculatingRoute(true);
      try {
        const geometry = await getRouteDirections(currentDraft.stops);
        if (!cancelled) {
          setRouteGeometry(geometry);
          setIsCalculatingRoute(false);
        }
      } catch (error) {
        if (!cancelled) {
          setRouteGeometry(null);
          setDirectionsError(error?.message ?? 'No se pudo calcular la ruta por carretera.');
          setIsCalculatingRoute(false);
        }
      }
    }

    loadDirections();

    return () => {
      cancelled = true;
    };
  }, [currentDraft.stops]);

  const handleSelectRoute = (route) => {
    setLoadingSelectedItem(true);
    setDetailNotFound(null);
    setTab('routes');
    setDetailMode(true);
    router.push(`/comercial/rutas/${route.id}`);
  };

  const handleSelectTemplate = (template) => {
    setLoadingSelectedItem(true);
    setDetailNotFound(null);
    setTab('templates');
    setDetailMode(true);
    router.push(`/comercial/rutas/plantillas/${template.id}`);
  };

  const saveCurrent = async () => {
    const payload = {
      name: currentDraft.name,
      description: currentDraft.description || undefined,
      fieldOperatorId: currentDraft.fieldOperatorId ? Number(currentDraft.fieldOperatorId) : undefined,
      ...(tab === 'routes' ? { routeDate: routeDraft.routeDate || undefined } : {}),
    };

    const normalizedStops = currentDraft.stops.map((stop, index) => ({
      position: index + 1,
      stopType: stop.stopType,
      targetType: stop.targetType,
      customerId: stop.targetType === 'customer' ? stop.customerId || undefined : undefined,
      prospectId: stop.targetType === 'prospect' ? stop.prospectId || undefined : undefined,
      label: stop.label || undefined,
      address: stop.address || undefined,
      notes: stop.notes || undefined,
    }));

    if (tab === 'routes') {
      const canInstantiateFromTemplate =
        !routeDraft.id && routeDraft.routeTemplateId && routeDraft.sourceMode === 'template' && !routeDraft.stopsEdited;

      if (canInstantiateFromTemplate) {
        payload.routeTemplateId = Number(routeDraft.routeTemplateId);
      } else {
        payload.stops = normalizedStops;
      }
    } else {
      payload.stops = normalizedStops;
    }

    try {
      if (tab === 'routes') {
        if (routeDraft.id) {
          await notify.promise(
            updateRoute({ routeId: routeDraft.id, payload }),
            {
              loading: { title: 'Actualizando ruta', description: 'Guardando cambios en la ruta programada.' },
              success: { title: 'Ruta actualizada', description: 'La ruta se ha guardado correctamente.' },
              error: (err) => ({
                title: 'No se pudo guardar la ruta',
                description: err?.message ?? 'Inténtalo de nuevo.',
              }),
            }
          );
        } else {
          const response = await notify.promise(
            createRoute(payload),
            {
              loading: { title: 'Creando ruta', description: 'Guardando la nueva ruta programada.' },
              success: { title: 'Ruta creada', description: 'La ruta se ha creado correctamente.' },
              error: (err) => ({
                title: 'No se pudo crear la ruta',
                description: err?.message ?? 'Inténtalo de nuevo.',
              }),
            }
          );
          const created = response?.data ?? response;
          if (created?.id) router.push(`/comercial/rutas/${created.id}`);
        }
      } else if (templateDraft.id) {
        await notify.promise(
          updateTemplate({ templateId: templateDraft.id, payload }),
          {
            loading: { title: 'Actualizando plantilla', description: 'Guardando cambios en la plantilla de ruta.' },
            success: { title: 'Plantilla actualizada', description: 'La plantilla se ha guardado correctamente.' },
            error: (err) => ({
              title: 'No se pudo guardar la plantilla',
              description: err?.message ?? 'Inténtalo de nuevo.',
            }),
          }
        );
      } else {
        const response = await notify.promise(
          createTemplate(payload),
          {
            loading: { title: 'Creando plantilla', description: 'Guardando la nueva plantilla de ruta.' },
            success: { title: 'Plantilla creada', description: 'La plantilla se ha creado correctamente.' },
            error: (err) => ({
              title: 'No se pudo crear la plantilla',
              description: err?.message ?? 'Inténtalo de nuevo.',
            }),
          }
        );
        const created = response?.data ?? response;
        if (created?.id) router.push(`/comercial/rutas/plantillas/${created.id}`);
      }
    } catch (_) {
      return;
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    if (!hasMapboxToken()) {
      setGeocodeResults([]);
      setSearchState({
        type: 'error',
        message: 'Falta configurar el token de Mapbox para buscar ubicaciones.',
      });
      return;
    }

    setLoadingSearch(true);
    setSearchState({ type: 'idle', message: '' });
    try {
      const results = await geocodeAddress(search.trim());
      setGeocodeResults(results);
      setSearchState(
        results.length === 0
          ? { type: 'empty', message: 'No encontramos resultados para esa búsqueda.' }
          : { type: 'success', message: `Se han encontrado ${results.length} resultados.` }
      );
    } catch (error) {
      setGeocodeResults([]);
      setSearchState({
        type: 'error',
        message: error?.message ?? 'No se pudo completar la búsqueda geográfica.',
      });
    } finally {
      setLoadingSearch(false);
    }
  };

  const addStopToCurrentDraft = (stop) => {
    if (tab === 'routes') {
      setRouteDraft((current) => ({
        ...current,
        stopsEdited: true,
        stops: normalizeStops([...current.stops, stop]),
      }));
      return;
    }

    setTemplateDraft((current) => ({
      ...current,
      stops: normalizeStops([...current.stops, stop]),
    }));
  };

  const openCreateStopDialog = (overrides = {}) => {
    const nextPosition = currentDraft.stops.length + 1;
    setCreatingStop(createDraftStop({ position: nextPosition, ...overrides }));
  };

  const resetDraftForCurrentTab = () => {
    setLoadingSelectedItem(false);
    setDetailNotFound(null);
    if (tab === 'routes') {
      loadedRouteIdRef.current = null;
      setRouteDraft(createEmptyRouteDraft());
      router.push('/comercial/rutas');
      return;
    }

    loadedTemplateIdRef.current = null;
    setTemplateDraft(createEmptyTemplateDraft());
    router.push('/comercial/rutas/plantillas');
  };

  const openNewDraft = () => {
    setNewItemDraft(createEmptyNewItemDraft());
    resetDraftForCurrentTab();
    setCreateDialogOpen(true);
  };

  const returnToListing = () => {
    setDetailMode(false);
    setLoadingSelectedItem(false);
    setDetailNotFound(null);
    loadedRouteIdRef.current = null;
    loadedTemplateIdRef.current = null;
    router.push(tab === 'routes' ? '/comercial/rutas' : '/comercial/rutas/plantillas');
  };

  const confirmCreateDraft = async () => {
    if (!newItemDraft.name.trim()) return;

    if (tab === 'routes') {
      const selectedTemplate =
        newItemDraft.sourceMode === 'template'
          ? templates.find((item) => String(item.id) === String(newItemDraft.routeTemplateId))
          : null;

      if (newItemDraft.sourceMode === 'template' && !selectedTemplate) return;

      const templateStops = selectedTemplate
        ? await enrichStopsWithCoordinates(normalizeStops(selectedTemplate.stops ?? []))
        : [];

      setRouteDraft(
        createEmptyRouteDraft({
          name: newItemDraft.name.trim(),
          description: newItemDraft.description || '',
          routeDate: newItemDraft.routeDate || '',
          fieldOperatorId: newItemDraft.fieldOperatorId || '',
          routeTemplateId: selectedTemplate ? String(selectedTemplate.id) : '',
          sourceMode: selectedTemplate ? 'template' : 'manual',
          stopsEdited: false,
          stops: templateStops,
        })
      );
      loadedRouteIdRef.current = null;
      setLoadingSelectedItem(false);
      router.push('/comercial/rutas');
    } else {
      setTemplateDraft(
        createEmptyTemplateDraft({
          name: newItemDraft.name.trim(),
          description: newItemDraft.description || '',
          fieldOperatorId: newItemDraft.fieldOperatorId || '',
          stops: [],
        })
      );
      loadedTemplateIdRef.current = null;
      setLoadingSelectedItem(false);
      router.push('/comercial/rutas/plantillas');
    }

    setCreateDialogOpen(false);
    setDetailMode(true);
  };

  const markRouteStopsEdited = (updater) => {
    setRouteDraft((current) => ({
      ...updater(current),
      stopsEdited: true,
    }));
  };

  const handleMapClick = (event) => {
    openCreateStopDialog({
      label: `Parada ${currentDraft.stops.length + 1}`,
      address: `${event.lngLat.lat.toFixed(5)}, ${event.lngLat.lng.toFixed(5)}`,
      lat: event.lngLat.lat,
      lng: event.lngLat.lng,
      targetType: 'location',
      stopType: 'oportunidad',
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (tab === 'routes') {
      markRouteStopsEdited((current) => {
        const oldIndex = current.stops.findIndex((stop) => stop.id === active.id);
        const newIndex = current.stops.findIndex((stop) => stop.id === over.id);
        const reordered = arrayMove(current.stops, oldIndex, newIndex).map((stop, index) => ({
          ...stop,
          position: index + 1,
        }));
        return { ...current, stops: reordered };
      });
      return;
    }

    setTemplateDraft((current) => {
      const oldIndex = current.stops.findIndex((stop) => stop.id === active.id);
      const newIndex = current.stops.findIndex((stop) => stop.id === over.id);
      const reordered = arrayMove(current.stops, oldIndex, newIndex).map((stop, index) => ({
        ...stop,
        position: index + 1,
      }));
      return { ...current, stops: reordered };
    });
  };

  const sidebarItems = tab === 'routes' ? routes : templates;
  const isLoading = tab === 'routes' ? loadingRoutes : loadingTemplates;
  const selectedId = tab === 'routes' ? routeDraft.id : templateDraft.id;
  const detailTitle =
    tab === 'routes'
      ? routeDraft.id
        ? 'Editar ruta'
        : 'Nueva ruta'
      : templateDraft.id
        ? 'Editar plantilla'
        : 'Nueva plantilla';
  const detailDescription =
    tab === 'routes'
      ? 'Edita la ruta con el mapa como herramienta principal y valida si es viable antes de guardarla.'
      : 'Define una plantilla reutilizable con la misma lógica visual de planificación.';
  const selectedFieldOperatorLabel = useMemo(
    () => fieldOperatorOptions.find((option) => option.value === currentDraft.fieldOperatorId)?.label ?? 'Sin repartidor',
    [currentDraft.fieldOperatorId, fieldOperatorOptions]
  );
  const detailEntityLabel = tab === 'routes' ? 'ruta' : 'plantilla';
  const headerTitle = detailMode
    ? loadingSelectedItem && (routeId || templateId)
      ? `Cargando ${detailEntityLabel}`
      : detailNotFound
        ? `${detailEntityLabel.charAt(0).toUpperCase()}${detailEntityLabel.slice(1)} no encontrada`
        : currentDraft.name?.trim() || detailTitle
    : 'Planificador de rutas';
  const headerDescription = detailMode
    ? loadingSelectedItem && (routeId || templateId)
      ? 'Estamos preparando el editor visual y reconstruyendo las paradas sobre el mapa.'
      : detailNotFound
        ? 'No hemos podido recuperar el elemento solicitado desde la URL actual.'
        : currentDraft.description?.trim() || detailDescription
    : 'Organiza plantillas y rutas programadas con un planner geográfico potente y visual.';

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {detailMode && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={returnToListing}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
                {detailMode && (
                  <Badge variant="outline">{tab === 'routes' ? 'Ruta programada' : 'Plantilla'}</Badge>
                )}
                {detailMode && tab === 'routes' && routeDraft.sourceMode === 'template' && routeDraft.routeTemplateId && (
                  <Badge variant="secondary">Basada en plantilla</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{headerDescription}</p>
              {detailMode && !loadingSelectedItem && !detailNotFound && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selectedFieldOperatorLabel}</Badge>
                  {tab === 'routes' && routeDraft.routeDate ? (
                    <Badge variant="secondary">{routeDraft.routeDate}</Badge>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {detailMode && !loadingSelectedItem && !detailNotFound && (
          <div className="flex shrink-0 items-center gap-2 self-start">
            <Button type="button" variant="outline" onClick={() => setMetadataDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button onClick={saveCurrent} disabled={isSavingRoute || isSavingTemplate || !currentDraft.name.trim()}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        )}
      </div>

      {!detailMode ? (
        <Card className="min-h-0 border-border/70">
          <CardHeader className="space-y-4">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(value);
                router.push(value === 'routes' ? '/comercial/rutas' : '/comercial/rutas/plantillas');
              }}
            >
              <TabsList>
                <TabsTrigger value="routes">Rutas</TabsTrigger>
                <TabsTrigger value="templates">Plantillas</TabsTrigger>
              </TabsList>
              <TabsContent value="routes" className="mt-4 space-y-4">
                <CardTitle>Rutas programadas</CardTitle>
                <CardDescription>Selecciona una ruta existente o crea una nueva para entrar en el editor visual.</CardDescription>
              </TabsContent>
              <TabsContent value="templates" className="mt-4 space-y-4">
                <CardTitle>Plantillas de ruta</CardTitle>
                <CardDescription>Selecciona una plantilla o crea una nueva para editarla con el mapa como protagonista.</CardDescription>
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={openNewDraft}>
                <Plus className="mr-2 h-4 w-4" />
                {tab === 'routes' ? 'Nueva ruta' : 'Nueva plantilla'}
              </Button>
              {currentDraftHasContent && (
                <Button type="button" variant="outline" onClick={() => setDetailMode(true)}>
                  <PanelLeftOpen className="mr-2 h-4 w-4" />
                  Continuar edición
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="min-h-0">
            {isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center"><Loader /></div>
            ) : sidebarItems.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <EmptyState
                  icon={<Route className="h-10 w-10 text-primary" />}
                  title={`Sin ${tab === 'routes' ? 'rutas' : 'plantillas'}`}
                  description="Empieza creando la primera."
                  className="min-h-[220px] bg-transparent"
                />
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-20rem)] pr-3">
                <div className="grid gap-3 xl:grid-cols-2">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => (tab === 'routes' ? handleSelectRoute(item) : handleSelectTemplate(item))}
                      className={cn(
                        'w-full rounded-2xl border p-4 text-left transition hover:border-primary/40 hover:bg-muted/40',
                        selectedId && String(selectedId) === String(item.id) && 'border-primary/40 bg-primary/5'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{item.name}</p>
                        <Badge variant="secondary">
                          {tab === 'routes' ? getRouteStatusLabel(item.status) : 'Plantilla'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tab === 'routes' ? item.routeDate || 'Sin fecha' : item.description || 'Sin descripción'}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4">
          <div className="relative min-h-[72vh] w-full min-w-0 flex-1 overflow-hidden rounded-[28px] border bg-muted/20 shadow-sm">
            {loadingSelectedItem ? (
              <div className="flex h-full min-h-[72vh] items-center justify-center p-6">
                <Loader />
              </div>
            ) : detailNotFound ? (
              <div className="flex h-full min-h-[72vh] items-center justify-center p-6">
                <EmptyState
                  icon={<Route className="h-10 w-10 text-primary" />}
                  title={detailNotFound === 'route' ? 'Ruta no encontrada' : 'Plantilla no encontrada'}
                  description="No hemos podido cargar el elemento seleccionado. Vuelve al listado y prueba de nuevo."
                  className="min-h-[260px] bg-transparent"
                />
              </div>
            ) : (
              <>
            {directionsError && (
              <div className="absolute top-4 left-4 right-4 z-20 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 md:right-auto md:max-w-md">
                {directionsError} Mostramos una línea estimada mientras tanto.
              </div>
            )}

            <div className="absolute top-4 right-4 z-20">
              <div className="rounded-2xl border bg-background/95 px-4 py-3 shadow-sm">
                {isCalculatingRoute && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recalculando ruta
                  </div>
                )}
                <div className="flex flex-wrap items-start gap-5">
                  <div className="min-w-[84px]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Paradas</p>
                    <p className="mt-1 text-lg font-semibold">{routeMetrics.stopCount}</p>
                    <p className="text-xs text-muted-foreground">
                      {routeMetrics.mappedStopCount >= 2 ? `${routeMetrics.mappedStopCount} ubicadas` : 'Aun faltan puntos'}
                    </p>
                  </div>
                  <div className="min-w-[110px]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Distancia</p>
                    <p className="mt-1 text-lg font-semibold">{routeMetrics.distanceLabel}</p>
                    <p className="text-xs text-muted-foreground">Por carretera</p>
                  </div>
                  <div className="min-w-[118px]">
                    <p className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Tiempo
                    </p>
                    <p className="mt-1 text-lg font-semibold">{routeMetrics.durationLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {routeMetrics.ready ? 'Estimación actual' : 'Necesitas dos paradas'}
                    </p>
                  </div>
                  <div className="min-w-[126px]">
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <Droplets className="h-3.5 w-3.5" />
                      Combustible
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex text-muted-foreground/80 hover:text-foreground">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs space-y-1">
                            <p>Estimación orientativa para una furgoneta mediana.</p>
                            <p>Consumo usado: {dieselCostEstimate?.consumptionLabel ?? '9,5 l/100 km'}.</p>
                            <p>Diésel medio: {dieselAverage.isUnavailable ? 'No disponible hoy' : dieselAverage.label}.</p>
                            <p>Distancia usada: {routeMetrics.distanceLabel}.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="mt-1 text-lg font-semibold">
                      {dieselAverage.isLoading
                        ? '-'
                        : dieselAverage.isUnavailable || !dieselCostEstimate
                          ? 'No disponible'
                          : dieselCostEstimate.formattedTotalCost}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dieselAverage.isUnavailable || !dieselCostEstimate
                        ? 'No disponible hoy'
                        : `${dieselAverage.label} de media`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!stopsPanelExpanded && (
              <div className="absolute left-4 top-4 z-20">
                <Button type="button" variant="secondary" onClick={() => setStopsPanelExpanded(true)}>
                  <PanelLeftOpen className="mr-2 h-4 w-4" />
                  Ver paradas
                </Button>
              </div>
            )}

            {stopsPanelExpanded && (
              <div className="absolute left-4 top-4 z-20 w-[360px] max-w-[calc(100%-2rem)] rounded-[24px] border bg-background/96 shadow-lg">
                <div className="border-b p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Paradas</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSearchDialogOpen(true)}>
                        <MapPinPlus className="mr-2 h-4 w-4" />
                        Buscar
                      </Button>
                      <Button type="button" size="sm" onClick={() => openCreateStopDialog()}>
                        <CopyPlus className="mr-2 h-4 w-4" />
                        Añadir
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setStopsPanelExpanded(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {currentDraft.stops.length === 0 ? (
                    <div className="flex h-[260px] items-center justify-center md:h-[calc(72vh-18rem)]">
                      <EmptyState
                        icon={<MapPinned className="h-10 w-10 text-primary" />}
                        title="Sin paradas todavía"
                        description="Añade una parada buscando una ubicación o pulsando directamente sobre el mapa."
                        className="h-full bg-transparent"
                      />
                    </div>
                  ) : (
                    <ScrollArea className="h-[260px] pr-3 md:h-[calc(72vh-18rem)]">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={currentDraft.stops.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-3">
                            {currentDraft.stops.map((stop) => (
                              <SortableStopItem key={stop.id} stop={stop} onEdit={setEditingStop} />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}

            <RouteMap
              mapKey={`${tab}-${currentDraft.id ?? 'draft'}`}
              stops={currentDraft.stops}
              routeGeometry={routeGeometry}
              className="h-full w-full"
              onClick={handleMapClick}
            />
              </>
            )}
          </div>
        </div>
      )}

      <StopEditorDialog
        open={Boolean(editingStop)}
        onOpenChange={(open) => !open && setEditingStop(null)}
        initialStop={editingStop}
        customerOptions={customerOptions}
        prospectOptions={prospectOptions}
        mode="edit"
        onSave={(stop) => {
          if (tab === 'routes') {
            markRouteStopsEdited((current) => ({
              ...current,
              stops: current.stops.map((item) => (item.id === stop.id ? stop : item)),
            }));
          } else {
            setTemplateDraft((current) => ({
              ...current,
              stops: current.stops.map((item) => (item.id === stop.id ? stop : item)),
            }));
          }
          setEditingStop(null);
        }}
      />

      <Dialog
        open={searchDialogOpen}
        onOpenChange={(open) => {
          setSearchDialogOpen(open);
          if (!open) {
            setGeocodeResults([]);
            setSearchState({ type: 'idle', message: '' });
          }
        }}
      >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Buscar punto o dirección</DialogTitle>
            <DialogDescription>
              Busca una ubicación y, al seleccionarla, se abrirá el diálogo para completar la nueva parada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar dirección, calle o ubicación" />
              <Button type="button" variant="secondary" onClick={handleSearch} disabled={loadingSearch}>
                <MapPinPlus className="mr-2 h-4 w-4" />
                {loadingSearch ? 'Buscando...' : 'Buscar punto'}
              </Button>
            </div>

            {searchState.type === 'error' && (
              <div
                className={cn('rounded-xl border px-3 py-2 text-sm', 'border-destructive/40 bg-destructive/5 text-destructive')}
              >
                {searchState.message}
              </div>
            )}

            {loadingSearch && (
              <div className="flex min-h-[180px] items-center justify-center">
                <Loader />
              </div>
            )}

            {!loadingSearch && searchState.type === 'empty' && geocodeResults.length === 0 && (
              <div className="flex min-h-[180px] items-center justify-center">
                <EmptyState
                  icon={<MapPinPlus className="h-10 w-10 text-primary" />}
                  title="Sin resultados"
                  description={searchState.message}
                  className="min-h-[180px] bg-transparent"
                />
              </div>
            )}

            {!loadingSearch && geocodeResults.length > 0 && (
              <ScrollArea className="max-h-[320px] pr-3">
                <div className="grid gap-2">
                  {geocodeResults.map((feature) => (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => {
                        setSearchDialogOpen(false);
                        setGeocodeResults([]);
                        setSearchState({ type: 'idle', message: '' });
                        openCreateStopDialog({
                          label: feature.text || feature.place_name,
                          address: feature.place_name,
                          lat: feature.center?.[1] ?? null,
                          lng: feature.center?.[0] ?? null,
                          stopType: 'oportunidad',
                          targetType: 'location',
                        });
                      }}
                      className="rounded-lg border bg-background px-3 py-2 text-left text-sm hover:border-primary/40"
                    >
                      {feature.place_name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreatePlannerItemDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setNewItemDraft(createEmptyNewItemDraft());
          }
        }}
        tab={tab}
        draft={newItemDraft}
        fieldOperatorOptions={fieldOperatorOptions}
        templateOptions={routeTemplateOptions}
        onChange={(field, value) =>
          setNewItemDraft((current) => {
            if (field === 'sourceMode') {
              return {
                ...current,
                sourceMode: value,
                routeTemplateId: value === 'template' ? current.routeTemplateId : '',
              };
            }

            return { ...current, [field]: value };
          })
        }
        onConfirm={confirmCreateDraft}
      />

      <MetadataEditorDialog
        open={metadataDialogOpen}
        onOpenChange={setMetadataDialogOpen}
        tab={tab}
        draft={currentDraft}
        fieldOperatorOptions={fieldOperatorOptions}
        onChange={(field, value) => {
          if (tab === 'routes') {
            setRouteDraft((current) => ({ ...current, [field]: value }));
          } else {
            setTemplateDraft((current) => ({ ...current, [field]: value }));
          }
        }}
      />

      <StopEditorDialog
        open={Boolean(creatingStop)}
        onOpenChange={(open) => !open && setCreatingStop(null)}
        initialStop={creatingStop}
        customerOptions={customerOptions}
        prospectOptions={prospectOptions}
        mode="create"
        onSave={(stop) => {
          addStopToCurrentDraft(stop);
          setCreatingStop(null);
        }}
      />
    </div>
  );
}
