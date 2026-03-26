'use client';

import { Globe, MapPin, UserPlus, UserRound } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import StatusPill from '../StatusPill';
import ProspectLocationMap from '../ProspectLocationMap';
import {
  prospectOriginOptions,
  prospectStatusLabels,
  prospectWebsiteToHref,
} from '../utils';

export default function ProspectDataPanel({ prospect, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!prospect) {
    return (
      <EmptyState
        title="Sin ficha de prospecto"
        description="No se pudo cargar la información del prospecto."
        className="h-full w-full border bg-muted/20 !min-h-[220px]"
      />
    );
  }

  const originLabel =
    prospectOriginOptions.find((option) => option.value === prospect.origin)?.label ??
    (prospect.origin ? String(prospect.origin) : 'Sin origen');

  const websiteTrim = prospect.website?.trim() ?? '';
  const websiteHref = websiteTrim ? prospectWebsiteToHref(websiteTrim) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Bloque principal: datos + mapa */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={prospectStatusLabels[prospect.status] ?? prospect.status} status={prospect.status} />
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Ficha comercial</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lectura rápida del prospecto para decidir el siguiente movimiento comercial.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UserRound className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Origen</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{originLabel}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">País</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{prospect.country?.name ?? 'Sin país'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <UserPlus className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {prospect.primaryContact?.role?.trim() ? prospect.primaryContact.role : 'Contacto principal'}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{prospect.primaryContact?.name ?? '-'}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y border-t">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Globe className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Sitio web</p>
                    <div className="mt-1 text-sm">
                      {websiteTrim ? (
                        websiteHref ? (
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline-offset-4 hover:underline break-all"
                          >
                            {websiteTrim}
                          </a>
                        ) : (
                          <span className="break-all whitespace-pre-wrap text-foreground">{websiteTrim}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Sin sitio web</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Dirección</p>
                    <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-foreground">
                      {prospect.address?.trim() ? prospect.address : <span className="text-muted-foreground">Sin dirección</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="overflow-hidden border-t bg-muted/15 lg:border-t-0 lg:border-l">
            <ProspectLocationMap
              address={prospect.address}
              companyName={prospect.companyName}
            />
          </section>
        </div>
      </div>

      {/* Resumen comercial — ancho completo */}
      <section className="rounded-2xl border bg-card p-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Resumen comercial</p>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Interés y encaje del prospecto</h3>
          </div>
          <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
            {prospect.commercialInterestNotes || (
              <span className="text-muted-foreground">Todavía no hay contexto comercial registrado para este prospecto.</span>
            )}
          </p>
        </div>
      </section>

      {/* Especies + Notas — dos columnas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4">
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Especies de interés</p>
            {prospect.speciesInterest?.length ? (
              <div className="flex flex-wrap gap-2">
                {prospect.speciesInterest.map((species) => (
                  <span
                    key={species}
                    className="inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {species}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin especies definidas</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-muted/25 p-4">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Notas internas</p>
            <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
              {prospect.notes || 'Sin notas internas'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
