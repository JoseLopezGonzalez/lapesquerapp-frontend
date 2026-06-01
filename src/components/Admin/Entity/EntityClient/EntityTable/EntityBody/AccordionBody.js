'use client';

import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState/index';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pencil, Eye } from 'lucide-react';
import { getMobilePrimaryFields } from './utils/getMobilePrimaryFields';
import { renderPrimaryField, renderAccordionField } from './utils/renderAccordionField';

export const AccordionBody = ({
  data,
  headers,
  loading = false,
  emptyState,
  isSelectable = false,
  selectedRows = [],
  onSelectionChange,
  onEdit,
  onView,
  onCustomAction,
  isBlocked = false,
  config,
}) => {
  // Identificar campos principales y secundarios usando configuración mobile
  const primaryFields = React.useMemo(() => {
    const endpoint = config?.endpoint || '';
    return getMobilePrimaryFields(headers || [], endpoint);
  }, [headers, config?.endpoint]);

  const secondaryFields = React.useMemo(() => {
    return (headers || []).filter((h) => !primaryFields.includes(h) && h.name !== 'actions');
  }, [headers, primaryFields]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="border-b">
            <div className="flex items-start gap-3 px-4 py-4">
              {isSelectable && <Skeleton className="mt-1 h-5 w-5 rounded" />}
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!data.rows.length) {
    return (
      <div className="mb-4 flex h-full flex-col items-center justify-center py-24">
        <EmptyState title={emptyState.title} description={emptyState.description} />
      </div>
    );
  }

  // Check if actions should be hidden
  const hideViewButton = config?.hideViewButton || false;
  const hideEditButton = config?.hideEditButton || false;
  const hideActions = config?.hideActions || false || (hideEditButton && hideViewButton);
  const showActions = !hideActions && (onView || onEdit);
  const customRowActions = config?.rowActions || [];

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = data.rows.map((row) => row.id);
      onSelectionChange?.(allIds);
    } else {
      onSelectionChange?.([]);
    }
  };

  const allSelected = selectedRows.length > 0 && selectedRows.length === data.rows.length;

  return (
    <div className="relative w-full">
      {isBlocked && (
        <div className="bg-background/50 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
            <p className="text-muted-foreground text-sm">Procesando...</p>
          </div>
        </div>
      )}

      {/* Select all checkbox (si es selectable) */}
      {isSelectable && data.rows.length > 0 && (
        <div className="bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Seleccionar todas"
            disabled={isBlocked}
          />
          <label
            className="text-muted-foreground cursor-pointer text-sm"
            onClick={() => !isBlocked && handleSelectAll(!allSelected)}
          >
            Seleccionar todas ({data.rows.length})
          </label>
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        className={isBlocked ? 'pointer-events-none opacity-50' : ''}
      >
        {data.rows.map((row) => {
          const isSelected = selectedRows.includes(row.id);

          return (
            <AccordionItem key={row.id} value={`row-${row.id}`} className="border-b">
              <div className="flex items-center">
                {/* Checkbox fuera del trigger para evitar anidación de botones */}
                {isSelectable && (
                  <div
                    className="flex flex-shrink-0 items-center px-4 py-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        const id = row.id;
                        if (checked) {
                          onSelectionChange?.([...selectedRows, id]);
                        } else {
                          onSelectionChange?.(selectedRows.filter((rid) => rid !== id));
                        }
                      }}
                      disabled={isBlocked}
                      aria-label="Seleccionar fila"
                    />
                  </div>
                )}

                <AccordionTrigger className="flex-1 px-4 py-4 hover:no-underline">
                  {/* Campos principales en formato vertical */}
                  <div className="flex w-full flex-1 flex-col gap-3 text-left">
                    {primaryFields.map((header) => {
                      const value = row[header.name];
                      return (
                        <div key={header.name} className="w-full">
                          {renderPrimaryField(header, value, row)}
                        </div>
                      );
                    })}
                  </div>
                </AccordionTrigger>
              </div>

              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                  {/* Campos secundarios */}
                  {secondaryFields.length > 0 &&
                    secondaryFields.map((header) => {
                      const value = row[header.name];
                      return (
                        <div key={header.name}>{renderAccordionField(header, value, row)}</div>
                      );
                    })}

                  {/* Acciones */}
                  {(showActions || customRowActions.length > 0) && (
                    <div
                      className={`col-span-full flex justify-end gap-2 pt-2 ${secondaryFields.length > 0 ? 'border-t' : ''}`}
                    >
                      {onEdit && !hideEditButton && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row.id);
                          }}
                          disabled={isBlocked}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      )}
                      {onView && !hideViewButton && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(row.id);
                          }}
                          disabled={isBlocked}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      )}
                      {customRowActions.map((action) => {
                        const hidden = action.hiddenWhen
                          ? row[action.hiddenWhen.path] === action.hiddenWhen.value
                          : typeof action.hidden === 'function'
                            ? action.hidden(row)
                            : false;
                        if (hidden) return null;

                        return (
                          <Button
                            key={action.key}
                            variant={action.variant || 'outline'}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCustomAction?.(action, row.id, row);
                            }}
                            disabled={isBlocked}
                          >
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* Si no hay campos secundarios ni acciones, mostrar mensaje */}
                  {secondaryFields.length === 0 && !showActions && (
                    <div className="text-muted-foreground col-span-full py-2 text-center text-sm">
                      No hay información adicional
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
