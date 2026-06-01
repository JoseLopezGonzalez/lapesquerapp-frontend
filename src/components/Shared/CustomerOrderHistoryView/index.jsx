'use client';

import { useState } from 'react';
import { Accordion } from '@/components/ui/accordion';
import { AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { getChartDataByProduct } from '@/components/Admin/OrdersManager/Order/OrderCustomerHistory/utils/getChartDataByProduct';
import GeneralMetricsGrid from '@/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/GeneralMetricsGrid';
import DateFilterTabs from '@/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/DateFilterTabs';
import ProductHistoryMobileCard from '@/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/ProductHistoryMobileCard';
import ProductHistoryAccordionItem from '@/components/Admin/OrdersManager/Order/OrderCustomerHistory/components/ProductHistoryAccordionItem';

export default function CustomerOrderHistoryView({
  customerHistory = [],
  availableYears = [],
  initialLoading = false,
  loadingData = false,
  error = null,
  dateFilter,
  setDateFilter,
  selectedYear,
  setSelectedYear,
  currentYear,
  hasCurrentYear,
  hasYear1,
  yearsForSelector = [],
  filteredHistory = [],
  generalMetrics = null,
  calculateTrend,
  getTrendTooltipText,
}) {
  const isMobile = useIsMobile();
  const [expandedItems, setExpandedItems] = useState([]);
  const [maxProductsToShow, setMaxProductsToShow] = useState(10);

  const hasNoData = !loadingData && (!customerHistory || customerHistory.length === 0);
  const canChangeRange = availableYears && availableYears.length > 0;

  if (initialLoading) {
    return (
      <TooltipProvider>
        <div className="flex h-full flex-col">
          {isMobile ? (
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <Loader />
            </div>
          ) : (
            <Card className="flex min-h-0 flex-1 flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Histórico de Pedidos</CardTitle>
                <CardDescription>
                  Análisis completo del historial de compras del cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 items-center justify-center">
                <Loader />
              </CardContent>
            </Card>
          )}
        </div>
      </TooltipProvider>
    );
  }

  if (error) {
    return (
      <div className="h-full pb-2">
        {isMobile ? (
          <div className="flex h-full flex-col">
            <div className="flex flex-1 items-center justify-center overflow-y-auto py-2">
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader>
              <CardTitle>Histórico de Pedidos</CardTitle>
              <CardDescription>
                Análisis completo del historial de compras del cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center overflow-y-auto py-2">
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (hasNoData && !canChangeRange) {
    return (
      <div className="h-full pb-2">
        {isMobile ? (
          <div className="flex h-full flex-col">
            <div className="flex flex-1 items-center justify-center overflow-y-auto py-2">
              <EmptyState
                icon={<Calendar className="text-primary h-12 w-12" strokeWidth={1.5} />}
                title="No hay historial de pedidos"
                description="Este cliente aún no tiene pedidos registrados."
              />
            </div>
          </div>
        ) : (
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader>
              <CardTitle>Histórico de Pedidos</CardTitle>
              <CardDescription>
                Análisis completo del historial de compras del cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center overflow-y-auto py-2">
              <EmptyState
                icon={<Calendar className="text-primary" strokeWidth={1.5} />}
                title="No hay historial de pedidos"
                description="Este cliente aún no tiene pedidos registrados."
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const headerContent = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {!isMobile && (
          <>
            <CardTitle>Histórico de Pedidos</CardTitle>
            <CardDescription>
              Análisis completo del historial de compras del cliente.
            </CardDescription>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DateFilterTabs
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          currentYear={currentYear}
          hasCurrentYear={hasCurrentYear}
          hasYear1={hasYear1}
          yearsForSelector={yearsForSelector}
          isMobile={isMobile}
        />
      </div>
    </div>
  );

  const ShowMoreButton = () =>
    filteredHistory.length > maxProductsToShow && (
      <div className="bg-muted/50 mb-3 flex items-center justify-between rounded-lg p-2">
        <p className="text-muted-foreground text-xs">
          Mostrando {maxProductsToShow} de {filteredHistory.length} productos
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMaxProductsToShow((prev) => prev + 10)}
          className="h-7 text-xs"
        >
          Mostrar más (+10)
        </Button>
      </div>
    );

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {isMobile ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-4 flex-shrink-0">{headerContent}</div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {generalMetrics && (
                <div className="flex-shrink-0 pt-0 pb-3">
                  <GeneralMetricsGrid metrics={generalMetrics} variant="mobile" />
                </div>
              )}
              <ScrollArea className="min-h-0 flex-1">
                {loadingData ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader />
                  </div>
                ) : hasNoData ? (
                  <div className="flex flex-1 items-center justify-center py-2">
                    <EmptyState
                      icon={<Calendar className="text-primary" strokeWidth={1.5} />}
                      title="No hay historial de pedidos"
                      description="Este cliente no tiene pedidos en el período seleccionado. Prueba con otro rango de fechas."
                    />
                  </div>
                ) : (
                  <div className="py-2">
                    <ShowMoreButton />
                    <div className="space-y-4">
                      {filteredHistory.slice(0, maxProductsToShow).map((product) => {
                        const chartData = getChartDataByProduct(product);
                        const trend = product.trend || calculateTrend(product);
                        return (
                          <ProductHistoryMobileCard
                            key={product.product.id}
                            product={product}
                            chartData={chartData}
                            trend={trend}
                            getTrendTooltipText={getTrendTooltipText}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="flex-shrink-0">{headerContent}</CardHeader>
            {generalMetrics && !loadingData && (
              <CardContent className="flex-shrink-0 pt-0 pb-3">
                <GeneralMetricsGrid metrics={generalMetrics} variant="desktop" />
              </CardContent>
            )}
            <CardContent
              className={`min-h-0 flex-1 py-2 ${loadingData || hasNoData ? 'flex items-center justify-center' : 'overflow-y-auto'}`}
            >
              {loadingData ? (
                <Loader />
              ) : hasNoData ? (
                <EmptyState
                  icon={<Calendar className="text-primary" strokeWidth={1.5} />}
                  title="No hay historial de pedidos"
                  description="Este cliente no tiene pedidos en el período seleccionado. Prueba con otro rango de fechas."
                />
              ) : (
                <>
                  <ShowMoreButton />
                  <Accordion
                    type="multiple"
                    value={expandedItems}
                    onValueChange={setExpandedItems}
                    className="space-y-3"
                  >
                    {filteredHistory.slice(0, maxProductsToShow).map((product) => {
                      const chartData = getChartDataByProduct(product);
                      const trend = product.trend || calculateTrend(product);
                      return (
                        <ProductHistoryAccordionItem
                          key={product.product.id}
                          product={product}
                          chartData={chartData}
                          trend={trend}
                          getTrendTooltipText={getTrendTooltipText}
                          isMobile={isMobile}
                        />
                      );
                    })}
                  </Accordion>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
