'use client';

import { Globe, MapPin, Tag, UserPlus, UserRound } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import StatusPill from '../StatusPill';
import ProspectLocationMap from '../ProspectLocationMap';
import { prospectOriginOptions, prospectStatusLabels, prospectWebsiteToHref } from '../utils';

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
        className="bg-muted/20 h-full !min-h-[220px] w-full border"
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
      <div className="bg-card overflow-hidden rounded-2xl border">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div className="space-y-5 p-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={prospectStatusLabels[prospect.status] ?? prospect.status}
                  status={prospect.status}
                />
                <span className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                  Ficha comercial
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Lectura rápida del prospecto para decidir el siguiente movimiento comercial.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <UserRound className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">Origen</p>
                    <p className="text-foreground mt-1 text-sm font-medium">{originLabel}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">País</p>
                    <p className="text-foreground mt-1 text-sm font-medium">
                      {prospect.country?.name ?? 'Sin país'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Tag className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">Categoría</p>
                    <p className="text-foreground mt-1 text-sm font-medium">
                      {prospect.category?.name ?? '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <UserPlus className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                      {prospect.primaryContact?.role?.trim()
                        ? prospect.primaryContact.role
                        : 'Contacto principal'}
                    </p>
                    <p className="text-foreground mt-1 text-sm font-medium">
                      {prospect.primaryContact?.name ?? '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y border-t">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Globe className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">Sitio web</p>
                    <div className="mt-1 text-sm">
                      {websiteTrim ? (
                        websiteHref ? (
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-medium break-all underline-offset-4 hover:underline"
                          >
                            {websiteTrim}
                          </a>
                        ) : (
                          <span className="text-foreground break-all whitespace-pre-wrap">
                            {websiteTrim}
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Sin sitio web</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">Dirección</p>
                    <p className="text-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
                      {prospect.address?.trim() ? (
                        prospect.address
                      ) : (
                        <span className="text-muted-foreground">Sin dirección</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-muted/15 overflow-hidden border-t lg:border-t-0 lg:border-l">
            <ProspectLocationMap address={prospect.address} companyName={prospect.companyName} />
          </section>
        </div>
      </div>

      {/* Resumen comercial — ancho completo */}
      <section className="bg-card rounded-2xl border p-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
              Resumen comercial
            </p>
            <h3 className="text-foreground text-lg font-semibold tracking-tight">
              Interés y encaje del prospecto
            </h3>
          </div>
          <p className="text-foreground text-sm leading-7 whitespace-pre-wrap">
            {prospect.commercialInterestNotes || (
              <span className="text-muted-foreground">
                Todavía no hay contexto comercial registrado para este prospecto.
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Especies + Notas — dos columnas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="bg-card rounded-2xl border p-4">
          <div className="space-y-3">
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
              Especies de interés
            </p>
            {prospect.speciesInterest?.length ? (
              <div className="flex flex-wrap gap-2">
                {prospect.speciesInterest.map((species) => (
                  <span
                    key={species}
                    className="border-primary/15 bg-primary/8 text-primary inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                  >
                    {species}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Sin especies definidas</p>
            )}
          </div>
        </section>

        <section className="bg-muted/25 rounded-2xl border p-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
              Notas internas
            </p>
            <p className="text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
              {prospect.notes || 'Sin notas internas'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
