'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { RouteMap } from '@/components/Maps/RouteMap';
import { useFieldOperatorOptions } from '@/hooks/useFieldOptions';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useProspectsList } from '@/hooks/useProspects';
import { formatProspectSelectLabel } from '@/components/Comercial/CRM/utils';
import { useRouteGeometry } from '@/hooks/useRouteGeometry';
import { useRoutePlannerHydration } from '@/hooks/useRoutePlannerHydration';
import { useRouteMutations, useRoutes } from '@/hooks/useRoutes';
import { useRouteTemplateMutations, useRouteTemplates } from '@/hooks/useRouteTemplates';
import { useSpainAverageDieselPrice } from '@/hooks/useSpainAverageDieselPrice';
import {
  createDraftStop,
  createEmptyNewItemDraft,
  createEmptyRouteDraft,
  createEmptyTemplateDraft,
  enrichStopsWithCoordinates,
  normalizeStops,
  reorderStops,
  serializeStopsForWrite,
} from '@/lib/routes/routeStops';
import { notify } from '@/lib/notifications';
import { formatCurrency, formatDistance, formatDuration } from '@/lib/routes/routesPlannerUtils';
import { Route } from 'lucide-react';
import { RouteDetailHeader } from './RouteDetailHeader';
import { RoutesListingView } from './RoutesListingView';
import { RouteMetricsOverlay } from './RouteMetricsOverlay';
import { RouteStopsPanel } from './RouteStopsPanel';
import { SearchLocationsDialog } from './SearchLocationsDialog';
import { StopEditorDialog } from './StopEditorDialog';
import { MetadataEditorDialog } from './MetadataEditorDialog';
import { CreatePlannerItemDialog } from './CreatePlannerItemDialog';

const MEDIUM_VAN_DIESEL_CONSUMPTION_L_PER_100KM = 9.5;

export default function RoutesPlannerPage({ initialTab = 'routes', routeId = null, templateId = null }) {
  const router = useRouter();
  const loadedRouteIdRef = useRef(null);
  const loadedTemplateIdRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { options: fieldOperatorOptions } = useFieldOperatorOptions();
  const [tab, setTab] = useState(initialTab);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [creatingStop, setCreatingStop] = useState(null);
  const [loadingSelectedItem, setLoadingSelectedItem] = useState(Boolean(routeId || templateId));
  const [detailNotFound, setDetailNotFound] = useState(null);
  const [detailMode, setDetailMode] = useState(Boolean(routeId || templateId));
  const [stopsPanelExpanded, setStopsPanelExpanded] = useState(true);
  const [routeDraft, setRouteDraft] = useState(createEmptyRouteDraft());
  const [templateDraft, setTemplateDraft] = useState(createEmptyTemplateDraft());
  const [newItemDraft, setNewItemDraft] = useState(createEmptyNewItemDraft());
  const isRoutesTab = tab === 'routes';
  const stopEditorOpen = Boolean(editingStop || creatingStop);
  const { data: customersData } = useCustomersList({ perPage: 250, enabled: stopEditorOpen });
  const { data: prospectsData } = useProspectsList({ perPage: 250, enabled: stopEditorOpen });
  const { data: routesData, isLoading: loadingRoutes } = useRoutes({ perPage: 50 }, { enabled: isRoutesTab });
  const { data: templatesData, isLoading: loadingTemplates } = useRouteTemplates(
    { perPage: 50 },
    { enabled: !isRoutesTab }
  );
  const { createRoute, updateRoute, isSavingRoute } = useRouteMutations();
  const { createTemplate, updateTemplate, isSavingTemplate } = useRouteTemplateMutations();
  const dieselAverage = useSpainAverageDieselPrice();

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
    () =>
      (prospectsData ?? []).map((prospect) => ({
        value: String(prospect.id),
        label: formatProspectSelectLabel(prospect),
      })),
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
  const { routeGeometry, directionsError, isCalculatingRoute } = useRouteGeometry(currentDraft.stops, {
    enabled: detailMode,
  });
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

  useRoutePlannerHydration({
    routeId,
    templateId,
    routes,
    templates,
    loadingRoutes,
    loadingTemplates,
    loadedRouteIdRef,
    loadedTemplateIdRef,
    setLoadingSelectedItem,
    setDetailNotFound,
    setRouteDraft,
    setTemplateDraft,
  });

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

    const normalizedStops = serializeStopsForWrite(currentDraft.stops);

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

  const addStopToCurrentDraft = async (stop) => {
    const [enrichedStop] = await enrichStopsWithCoordinates([stop]);

    if (tab === 'routes') {
      setRouteDraft((current) => ({
        ...current,
        stopsEdited: true,
        stops: normalizeStops([...current.stops, enrichedStop]),
      }));
      return;
    }

    setTemplateDraft((current) => ({
      ...current,
      stops: normalizeStops([...current.stops, enrichedStop]),
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

  const handleMapClick = useCallback((event) => {
    openCreateStopDialog({
      label: `Parada ${currentDraft.stops.length + 1}`,
      address: `${event.lngLat.lat.toFixed(5)}, ${event.lngLat.lng.toFixed(5)}`,
      lat: event.lngLat.lat,
      lng: event.lngLat.lng,
      targetType: 'location',
      stopType: 'oportunidad',
    });
  }, [currentDraft.stops.length]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (tab === 'routes') {
      markRouteStopsEdited((current) => {
        return { ...current, stops: reorderStops(current.stops, active.id, over.id) };
      });
      return;
    }

    setTemplateDraft((current) => {
      return { ...current, stops: reorderStops(current.stops, active.id, over.id) };
    });
  };

  const sidebarItems = tab === 'routes' ? routes : templates;
  const isLoading = tab === 'routes' ? loadingRoutes : loadingTemplates;
  const selectedId = tab === 'routes' ? routeDraft.id : templateDraft.id;
  const detailTitle =
    tab === 'routes'
      ? routeDraft.id ? 'Editar ruta' : 'Nueva ruta'
      : templateDraft.id ? 'Editar plantilla' : 'Nueva plantilla';
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
      <RouteDetailHeader
        detailMode={detailMode}
        returnToListing={returnToListing}
        headerTitle={headerTitle}
        headerDescription={headerDescription}
        tab={tab}
        routeDraft={routeDraft}
        loadingSelectedItem={loadingSelectedItem}
        detailNotFound={detailNotFound}
        selectedFieldOperatorLabel={selectedFieldOperatorLabel}
        setMetadataDialogOpen={setMetadataDialogOpen}
        saveCurrent={saveCurrent}
        isSavingRoute={isSavingRoute}
        isSavingTemplate={isSavingTemplate}
        currentDraftName={currentDraft.name}
      />

      {!detailMode ? (
        <RoutesListingView
          tab={tab}
          onTabChange={(value) => {
            setTab(value);
            router.push(value === 'routes' ? '/comercial/rutas' : '/comercial/rutas/plantillas');
          }}
          openNewDraft={openNewDraft}
          currentDraftHasContent={currentDraftHasContent}
          onContinueEditing={() => setDetailMode(true)}
          isLoading={isLoading}
          items={sidebarItems}
          selectedId={selectedId}
          onSelectItem={(item) => (tab === 'routes' ? handleSelectRoute(item) : handleSelectTemplate(item))}
        />
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

                <RouteMetricsOverlay
                  isCalculatingRoute={isCalculatingRoute}
                  routeMetrics={routeMetrics}
                  dieselCostEstimate={dieselCostEstimate}
                  dieselAverage={dieselAverage}
                />

                <RouteStopsPanel
                  stopsPanelExpanded={stopsPanelExpanded}
                  setStopsPanelExpanded={setStopsPanelExpanded}
                  currentDraft={currentDraft}
                  sensors={sensors}
                  handleDragEnd={handleDragEnd}
                  onSearch={() => setSearchDialogOpen(true)}
                  onAddStop={() => openCreateStopDialog()}
                  onEditStop={setEditingStop}
                />

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
        onSave={async (stop) => {
          const [enrichedStop] = await enrichStopsWithCoordinates([stop]);
          if (tab === 'routes') {
            markRouteStopsEdited((current) => ({
              ...current,
              stops: current.stops.map((item) => (item.id === enrichedStop.id ? enrichedStop : item)),
            }));
          } else {
            setTemplateDraft((current) => ({
              ...current,
              stops: current.stops.map((item) => (item.id === enrichedStop.id ? enrichedStop : item)),
            }));
          }
          setEditingStop(null);
        }}
      />

      <SearchLocationsDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelectLocation={(location) => openCreateStopDialog(location)}
      />

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
        onSave={async (stop) => {
          await addStopToCurrentDraft(stop);
          setCreatingStop(null);
        }}
      />
    </div>
  );
}
