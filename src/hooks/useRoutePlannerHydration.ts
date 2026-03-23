'use client';

import { useEffect } from 'react';
import type { RouteStop } from '@/types/field';
import {
  createEmptyRouteDraft,
  createEmptyTemplateDraft,
  enrichStopsWithCoordinates,
  normalizeStops,
} from '@/lib/routes/routeStops';

type PlannerEntity = Record<string, unknown> & {
  id?: number | string;
  name?: string;
  description?: string;
  routeDate?: string;
  routeTemplateId?: number | string | null;
  routeTemplate?: { id?: number | string | null } | null;
  fieldOperator?: { id?: number | string | null } | null;
  stops?: Partial<RouteStop>[];
};

export function useRoutePlannerHydration({
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
}: {
  routeId?: number | string | null;
  templateId?: number | string | null;
  routes: PlannerEntity[];
  templates: PlannerEntity[];
  loadingRoutes: boolean;
  loadingTemplates: boolean;
  loadedRouteIdRef: { current: number | string | null };
  loadedTemplateIdRef: { current: number | string | null };
  setLoadingSelectedItem: (value: boolean) => void;
  setDetailNotFound: (value: string | null) => void;
  setRouteDraft: (updater: unknown) => void;
  setTemplateDraft: (updater: unknown) => void;
}) {
  useEffect(() => {
    if (!routeId) return;

    if (loadedRouteIdRef.current && String(loadedRouteIdRef.current) === String(routeId)) {
      setLoadingSelectedItem(false);
      setDetailNotFound(null);
      return;
    }

    const source = routes.find((item) => String(item.id) === String(routeId));
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
      loadedRouteIdRef.current = source.id ?? null;
      setLoadingSelectedItem(false);
    });

    return () => {
      cancelled = true;
    };
  }, [routeId, routes, loadingRoutes, loadedRouteIdRef, setDetailNotFound, setLoadingSelectedItem, setRouteDraft]);

  useEffect(() => {
    if (!templateId) return;

    if (loadedTemplateIdRef.current && String(loadedTemplateIdRef.current) === String(templateId)) {
      setLoadingSelectedItem(false);
      setDetailNotFound(null);
      return;
    }

    const source = templates.find((item) => String(item.id) === String(templateId));
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
      loadedTemplateIdRef.current = source.id ?? null;
      setLoadingSelectedItem(false);
    });

    return () => {
      cancelled = true;
    };
  }, [templateId, templates, loadingTemplates, loadedTemplateIdRef, setDetailNotFound, setLoadingSelectedItem, setTemplateDraft]);
}
