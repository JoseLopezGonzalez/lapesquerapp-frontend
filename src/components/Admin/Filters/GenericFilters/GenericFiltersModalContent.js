'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import TextAreaFilter from './Types/TextAreaFilter';
import TextAccumulatorFilter from './Types/TextAccumulatorFilter';
import NumberFilter from './Types/NumberFilter';
import PairSelectBoxesFilter from './Types/PairSelectBoxesFilter';
import DateFilter from './Types/DateFilter';
import { AutocompleteFilter } from './Types/AutocompleteFilter';
import SearchFilter from './Types/SearchFilter';
import TextFilter from './Types/TextFilter';
import { DateRangeFilter } from './Types/DateRangeFilter';

export const GenericFiltersModalContent = ({ filtersGroup, onFilterChange }) => {
  if (!filtersGroup || (!filtersGroup.search && !filtersGroup.groups)) {
    return <p className="text-muted-foreground">No hay filtros disponibles.</p>;
  }

  const { search, groups } = filtersGroup;

  return (
    <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto px-2 sm:px-4 lg:px-6">
      {search?.filters && search.filters.length > 0 && (
        <div className="mb-4 pt-1">
          {search.filters.map((filter) => (
            <SearchFilter
              key={filter.name}
              label={filter.label}
              name={filter.name}
              value={filter.value}
              placeholder={filter.placeholder}
              onChange={(value) => onFilterChange('search', filter.name, value)}
              onKeyDown={() => {}} /* IMPLEMENTAR */
            />
          ))}
        </div>
      )}

      <div className="px-2">
        <Accordion type="single" collapsible className="w-full">
          {groups.map((group, i) => (
            <AccordionItem
              key={group.name || group.label || i}
              value={group.name || group.label || `group-${i}`}
            >
              <AccordionTrigger className="text-primary py-3 text-left text-base font-medium hover:no-underline">
                {group.label || 'Grupo sin nombre'}
              </AccordionTrigger>
              <AccordionContent className="px-1 pb-3">
                <div className="space-y-4">
                  {group.filters.map((filter) => (
                    <div key={filter.name || filter.label} className="mb-4">
                      {filter.type === 'text' && (
                        <TextFilter
                          label={filter.label}
                          name={filter.name}
                          value={filter.value}
                          placeholder={filter.placeholder}
                          onChange={(value) => onFilterChange(group.name, filter.name, value)}
                        />
                      )}
                      {filter.type === 'textarea' && (
                        <TextAreaFilter
                          label={filter.label}
                          name={filter.name}
                          value={filter.value}
                          placeholder={filter.placeholder}
                          onChange={(value) => onFilterChange(group.name, filter.name, value)}
                        />
                      )}
                      {filter.type === 'textAccumulator' && (
                        <TextAccumulatorFilter
                          label={filter.label}
                          name={filter.name}
                          value={filter.value || []}
                          placeholder={filter.placeholder}
                          onAdd={(item) =>
                            onFilterChange(group.name, filter.name, [...(filter.value || []), item])
                          }
                          onDelete={(item) =>
                            onFilterChange(
                              group.name,
                              filter.name,
                              (filter.value || []).filter((i) => i !== item)
                            )
                          }
                        />
                      )}
                      {filter.type === 'number' && (
                        <NumberFilter
                          label={filter.label}
                          name={filter.name}
                          value={filter.value}
                          placeholder={filter.placeholder}
                          onChange={(value) => onFilterChange(group.name, filter.name, value)}
                        />
                      )}
                      {filter.type === 'pairSelectBoxes' && (
                        <PairSelectBoxesFilter
                          label={filter.label}
                          name={filter.name}
                          value={filter.value}
                          options={filter.options}
                          onChange={(value) => onFilterChange(group.name, filter.name, value)}
                        />
                      )}
                      {filter.type === 'date' && (
                        <>
                          {/* <DateFilter
                                                                label={filter.label}
                                                                name={filter.name}
                                                                value={filter.value}
                                                                placeholder={filter.placeholder}
                                                                onChange={(value) =>
                                                                    onFilterChange(group.name, filter.name, value)
                                                                }
                                                            />  */}
                        </>
                      )}
                      {filter.type === 'dateRange' && (
                        <>
                          <DateRangeFilter
                            label={filter.label}
                            name={filter.name}
                            value={filter.value}
                            onChange={(value) => {
                              onFilterChange(group.name, filter.name, value);
                            }}
                            /* visibleMonths={filter.visibleMonths} */
                          />
                        </>
                      )}
                      {filter.type === 'autocomplete' && (
                        <AutocompleteFilter
                          label={filter.label}
                          placeholder={filter.placeholder}
                          endpoint={filter.endpoint}
                          onAdd={(item) => {
                            onFilterChange(group.name, filter.name, [
                              ...(filter.value || []),
                              item,
                            ]);
                          }}
                          onDelete={(item) =>
                            onFilterChange(
                              group.name,
                              filter.name,
                              (filter.value || []).filter((i) => i.id !== item.id)
                            )
                          }
                          value={filter.value || []}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
