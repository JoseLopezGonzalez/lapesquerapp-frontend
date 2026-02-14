"use client";

import { useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { AlertCircle, Calendar } from "lucide-react";
import { useOrderContext } from "@/context/OrderContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Loader from "@/components/Utilities/Loader";
import { EmptyState } from "@/components/Utilities/EmptyState";
import { Button } from "@/components/ui/button";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCustomerHistory } from "@/hooks/useCustomerHistory";
import { getChartDataByProduct } from "./utils/getChartDataByProduct";
import GeneralMetricsGrid from "./components/GeneralMetricsGrid";
import DateFilterTabs from "./components/DateFilterTabs";
import ProductHistoryMobileCard from "./components/ProductHistoryMobileCard";
import ProductHistoryAccordionItem from "./components/ProductHistoryAccordionItem";

export default function OrderCustomerHistory() {
  const { order } = useOrderContext();
  const isMobile = useIsMobile();
  const [expandedItems, setExpandedItems] = useState([]);
  const [maxProductsToShow, setMaxProductsToShow] = useState(10);

  const {
    customerHistory,
    initialLoading,
    loadingData,
    error,
    dateFilter,
    setDateFilter,
    selectedYear,
    setSelectedYear,
    currentYear,
    hasCurrentYear,
    hasYear1,
    yearsForSelector,
    filteredHistory,
    generalMetrics,
    calculateTrend,
    getTrendTooltipText,
  } = useCustomerHistory(order);

  if (initialLoading) {
    return (
      <TooltipProvider>
        <div className="h-full flex flex-col">
          {isMobile ? (
            <div className="flex-1 flex items-center justify-center min-h-0">
              <Loader />
            </div>
          ) : (
            <Card className="h-full flex flex-col bg-transparent">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-base font-medium">Histórico de Pedidos</CardTitle>
                <CardDescription className="text-xs">Análisis completo del historial de compras del cliente</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center min-h-0">
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
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <Card className="h-full flex flex-col bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Históricos de productos</CardTitle>
              <CardDescription>Histórico de productos del cliente</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!loadingData && (!customerHistory || customerHistory.length === 0)) {
    return (
      <div className="h-full pb-2">
        {isMobile ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
              <EmptyState
                icon={<Calendar className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                title="No hay historial de pedidos"
                description="Este cliente aún no tiene pedidos registrados en el período seleccionado."
              />
            </div>
          </div>
        ) : (
          <Card className="h-full flex flex-col bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Históricos de productos</CardTitle>
              <CardDescription>Histórico de productos del cliente</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto py-2 flex items-center justify-center">
              <EmptyState
                icon={<Calendar className="h-12 w-12 text-primary" strokeWidth={1.5} />}
                title="No hay historial de pedidos"
                description="Este cliente aún no tiene pedidos registrados en el período seleccionado."
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const headerContent = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        {!isMobile && (
          <>
            <CardTitle className="text-base font-medium">Histórico de Pedidos</CardTitle>
            <CardDescription className="text-xs">Análisis completo del historial de compras del cliente</CardDescription>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
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
      <div className="mb-3 flex items-center justify-between p-2 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
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

  const mainContentMobile = (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {generalMetrics && (
        <div className="pb-3 pt-0 flex-shrink-0">
          <GeneralMetricsGrid metrics={generalMetrics} variant="mobile" />
        </div>
      )}
      <ScrollArea className="flex-1 min-h-0">
        {loadingData ? (
          <div className="h-full flex items-center justify-center">
            <Loader />
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
  );

  const mainContentDesktop = (
    <>
      {generalMetrics && (
        <div className="pb-3 pt-0">
          <GeneralMetricsGrid metrics={generalMetrics} variant="desktop" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-2">
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
                isMobile={false}
              />
            );
          })}
        </Accordion>
      </div>
    </>
  );

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {isMobile ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4 flex-shrink-0">{headerContent}</div>
            {mainContentMobile}
          </div>
        ) : (
          <Card className="h-full flex flex-col bg-transparent">
            <CardHeader className="pb-2 flex-shrink-0">{headerContent}</CardHeader>
            {generalMetrics && !loadingData && (
              <CardContent className="pb-3 pt-0 flex-shrink-0">
                <GeneralMetricsGrid metrics={generalMetrics} variant="desktop" />
              </CardContent>
            )}
            <CardContent
              className={`flex-1 py-2 min-h-0 ${loadingData ? "flex items-center justify-center" : "overflow-y-auto"}`}
            >
              {loadingData ? (
                <Loader />
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
