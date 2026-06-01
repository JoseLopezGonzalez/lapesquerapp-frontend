'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreVertical } from 'lucide-react';

const MOBILE_TAB_CLASS =
  'whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-foreground/70 data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground min-h-[32px] flex-shrink-0';

export default function DateFilterTabs({
  dateFilter,
  setDateFilter,
  selectedYear,
  setSelectedYear,
  currentYear,
  hasCurrentYear,
  hasYear1,
  yearsForSelector,
  isMobile,
}) {
  if (isMobile) {
    return (
      <Tabs
        value={dateFilter === 'year-select' && selectedYear ? `year-${selectedYear}` : dateFilter}
        onValueChange={(value) => {
          if (value === 'month' || value === 'quarter' || value === 'year' || value === 'year-1') {
            setDateFilter(value);
            setSelectedYear(null);
          } else if (value.startsWith('year-')) {
            const year = parseInt(value.replace('year-', ''), 10);
            setSelectedYear(year);
            setDateFilter('year-select');
          }
        }}
        className="w-full"
      >
        <ScrollArea orientation="horizontal" className="w-full">
          <div className="flex">
            <TabsList className="flex h-auto w-max min-w-full gap-1.5 bg-transparent p-0">
              <TabsTrigger value="month" className={MOBILE_TAB_CLASS}>
                Mes
              </TabsTrigger>
              <TabsTrigger value="quarter" className={MOBILE_TAB_CLASS}>
                Trimestre
              </TabsTrigger>
              {hasCurrentYear && (
                <TabsTrigger value="year" className={MOBILE_TAB_CLASS}>
                  {currentYear}
                </TabsTrigger>
              )}
              {hasYear1 && (
                <TabsTrigger value="year-1" className={MOBILE_TAB_CLASS}>
                  {currentYear - 1}
                </TabsTrigger>
              )}
              {yearsForSelector.map((year) => (
                <TabsTrigger key={year} value={`year-${year}`} className={MOBILE_TAB_CLASS}>
                  {year}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </ScrollArea>
      </Tabs>
    );
  }

  return (
    <>
      <Tabs
        value={dateFilter}
        onValueChange={(value) => {
          setDateFilter(value);
          if (value !== 'year-select') {
            setSelectedYear(null);
          }
        }}
        className="w-auto"
      >
        <TabsList
          className="grid h-8 w-full"
          style={{
            gridTemplateColumns: `repeat(${2 + (hasCurrentYear ? 1 : 0) + (hasYear1 ? 1 : 0)}, minmax(0, 1fr))`,
          }}
        >
          <TabsTrigger value="month">Mes</TabsTrigger>
          <TabsTrigger value="quarter">Trimestre</TabsTrigger>
          {hasCurrentYear && <TabsTrigger value="year">{currentYear}</TabsTrigger>}
          {hasYear1 && <TabsTrigger value="year-1">{currentYear - 1}</TabsTrigger>}
        </TabsList>
      </Tabs>
      {yearsForSelector.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Más años">
              <MoreVertical />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <Select
              value={dateFilter === 'year-select' && selectedYear ? String(selectedYear) : ''}
              onValueChange={(value) => {
                setSelectedYear(parseInt(value, 10));
                setDateFilter('year-select');
              }}
            >
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {yearsForSelector.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
