'use client';

import { notify } from '@/lib/notifications';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';
import {
  ThermometerSnowflake,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Box,
  Weight,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from 'next-auth/react';
import { getProductionViewData } from '@/services/orderService';
import Loader from '@/components/Utilities/Loader';

const POLLING_INTERVAL_MS = 3 * 60 * 1000; // 3 minutos

const ProductionView = ({ onClickOrder, autoPlayInterval = 30000, onToggleViewMode }) => {
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productionData, setProductionData] = useState([]);

  const fetchProductionData = useCallback(
    (silent = false) => {
      if (!token) return;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      getProductionViewData(token)
        .then((data) => {
          setProductionData(Array.isArray(data) ? data : []);
          if (!silent) {
            setLoading(false);
            setError(null);
          }
        })
        .catch((err) => {
          const errorMessage = err?.message || 'Error al obtener los datos de producción';
          if (!silent) {
            console.error('ProductionView: Error al obtener datos:', err);
            setError(errorMessage);
            notify.error({ title: errorMessage });
            setLoading(false);
            setProductionData([]);
          }
        });
    },
    [token]
  );

  // Carga inicial de datos
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('No hay sesión autenticada');
      return;
    }
    fetchProductionData(false);
  }, [token, fetchProductionData]);

  // Polling: recarga silenciosa cada 3 minutos
  useEffect(() => {
    if (!token) return;
    const pollInterval = setInterval(() => {
      fetchProductionData(true);
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(pollInterval);
  }, [token, fetchProductionData]);

  // Los datos ya vienen agrupados por producto del backend
  const productsGrouped = useMemo(() => {
    if (!productionData || !Array.isArray(productionData)) {
      return [];
    }

    // Ordenar productos alfabéticamente por nombre
    return [...productionData].sort((a, b) => a.name.localeCompare(b.name));
  }, [productionData]);

  // Navegación
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % productsGrouped.length);
  }, [productsGrouped.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + productsGrouped.length) % productsGrouped.length);
  }, [productsGrouped.length]);

  const goToIndex = useCallback(
    (index) => {
      if (index >= 0 && index < productsGrouped.length) {
        setCurrentIndex(index);
      }
    },
    [productsGrouped.length]
  );

  // Auto-play
  useEffect(() => {
    if (!isAutoPlay || productsGrouped.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlay, autoPlayInterval, goToNext, productsGrouped.length]);

  // Resetear índice cuando cambian los productos
  useEffect(() => {
    setCurrentIndex(0);
  }, [productsGrouped.length]);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsAutoPlay((prev) => !prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Enter para pausar/reanudar auto-play
        setIsAutoPlay((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Escape para cambiar a vista normal
        if (onToggleViewMode) {
          onToggleViewMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, onToggleViewMode]);

  // Determinar el estado de la línea basado en status del backend
  const getLineStatusConfig = (orderItem) => {
    const status = orderItem.status || 'pending';

    // Rojo: se ha excedido la cantidad prevista
    if (status === 'exceeded') {
      return {
        color: 'red',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        bgColorHighlight: 'bg-red-200 dark:bg-red-950/60',
        borderColor: 'border-red-500',
        borderColorSubtle: 'border-red-200 dark:border-red-800/40',
        textColor: 'text-red-900 dark:text-red-100',
        icon: AlertCircle,
      };
    }

    // Verde: línea completada
    if (status === 'completed') {
      return {
        color: 'green',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        bgColorHighlight: 'bg-green-200 dark:bg-green-950/60',
        borderColor: 'border-green-500',
        borderColorSubtle: 'border-green-200 dark:border-green-800/40',
        textColor: 'text-green-900 dark:text-green-100',
        icon: CheckCircle2,
      };
    }

    // Naranja: falta por terminar (default)
    return {
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      bgColorHighlight: 'bg-orange-200 dark:bg-orange-950/60',
      borderColor: 'border-orange-500',
      borderColorSubtle: 'border-orange-200 dark:border-orange-800/40',
      textColor: 'text-orange-900 dark:text-orange-100',
      icon: Clock,
    };
  };

  const getTemperatureColor = (temp) => {
    if (temp <= -18) return 'text-blue-600 dark:text-blue-400';
    if (temp <= 0) return 'text-cyan-600 dark:text-cyan-400';
    if (temp <= 4) return 'text-green-600 dark:text-green-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  // Mostrar loader mientras se cargan los datos
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-destructive">{error}</p>
          <p className="text-muted-foreground text-sm">
            No se pudieron cargar los datos de producción
          </p>
        </div>
      </div>
    );
  }

  if (productsGrouped.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Package className="text-muted-foreground mb-4 h-16 w-16" />
        <p className="text-foreground mb-2 text-xl font-medium">No hay productos para mostrar</p>
        <p className="text-muted-foreground text-center text-sm">
          Los productos aparecerán aquí cuando haya pedidos con productos planificados
        </p>
      </div>
    );
  }

  const currentProduct = productsGrouped[currentIndex];

  // Calcular totales del producto
  const totalQuantity = currentProduct.orders.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBoxes = currentProduct.orders.reduce((sum, item) => sum + (item.boxes || 0), 0);

  // Ordenar pedidos por fecha de carga
  const sortedOrders = [...currentProduct.orders].sort((a, b) => {
    const dateA = a.loadDate ? new Date(a.loadDate) : new Date(0);
    const dateB = b.loadDate ? new Date(b.loadDate) : new Date(0);
    return dateA - dateB;
  });

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Card principal - usando componentes shadcn nativos asdasdasd*/}
      <div className="flex flex-1 items-center justify-center px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
        <Card className="flex h-full w-full flex-col shadow-lg">
          <CardHeader className="flex-shrink-0 pt-2 pb-3 sm:pt-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-4xl font-bold sm:text-5xl lg:text-6xl">
                {currentProduct.name}
              </CardTitle>

              {/* Indicador pause/play y totales usando Badges de shadcn - en fila horizontal */}
              <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                <div className="bg-muted border-border flex h-16 w-16 items-center justify-center rounded-full border-2">
                  {isAutoPlay ? (
                    <Pause className="text-foreground h-10 w-10" />
                  ) : (
                    <Play className="text-foreground ml-1 h-10 w-10" />
                  )}
                </div>
                <Badge variant="default" className="gap-2 px-6 py-4 text-3xl font-bold sm:text-4xl">
                  <Package className="h-8 w-8" />
                  <span>{formatInteger(totalBoxes)} cajas</span>
                </Badge>
                <Badge variant="default" className="px-6 py-4 text-3xl font-bold sm:text-4xl">
                  <span>{formatDecimalWeight(totalQuantity)}</span>
                </Badge>
                <Badge variant="secondary" className="px-6 py-4 text-3xl font-bold sm:text-4xl">
                  {currentProduct.orders.length} pedido
                  {currentProduct.orders.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex flex-1 flex-col overflow-hidden p-4 sm:p-5">
            {/* Lista de pedidos usando ScrollArea de shadcn con grid masonry */}
            {sortedOrders.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="pr-4">
                  <div className="grid auto-rows-max grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedOrders.map((orderItem, index) => {
                      const lineStatusConfig = getLineStatusConfig(orderItem);

                      return (
                        <Card
                          key={`${orderItem.orderId}-${index}`}
                          className={`h-fit ${lineStatusConfig.bgColor} border-2 ${lineStatusConfig.borderColor} ${onClickOrder ? 'cursor-pointer' : ''} relative overflow-hidden`}
                          onClick={() => onClickOrder && onClickOrder(orderItem.orderId)}
                        >
                          {/* Barra de color superior - identificación por estado de línea */}
                          <div
                            className={`h-2 w-full ${lineStatusConfig.borderColor.replace('border-', 'bg-')}`}
                          />

                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col gap-3">
                              {/* ID del pedido centrado */}
                              <div className="flex items-center justify-center py-2">
                                <div className="flex h-14 min-w-[100px] items-center justify-center rounded-lg">
                                  <span className="text-primary text-5xl font-black tracking-tight sm:text-6xl">
                                    #{orderItem.orderId.toString().padStart(5, '0')}
                                  </span>
                                </div>
                              </div>

                              {/* Separador */}
                              <Separator className="opacity-40" />

                              {/* Cuatro bloques de cantidades: grid 2x2 normal, 1+2 si está completado */}
                              <div
                                className={`grid gap-2 sm:gap-3 ${lineStatusConfig.color === 'green' ? 'grid-cols-2 grid-rows-[auto_auto]' : 'grid-cols-2 grid-rows-2'}`}
                              >
                                {/* Bloque 1: Pedido (Planificado) */}
                                <div
                                  className={`text-center ${lineStatusConfig.color === 'green' ? 'col-span-2' : ''}`}
                                >
                                  <p className="text-muted-foreground mb-1.5 text-lg font-medium tracking-wide uppercase">
                                    Pedido
                                  </p>
                                  <div
                                    className={`bg-background flex flex-col items-center gap-2 rounded-lg border px-2.5 py-2 ${lineStatusConfig.borderColorSubtle}`}
                                  >
                                    <div className="flex items-center justify-center">
                                      <p className="text-foreground text-2xl font-extrabold whitespace-nowrap sm:text-3xl">
                                        <span className="text-foreground">
                                          {formatInteger(orderItem.boxes)}
                                        </span>
                                        <span className="text-muted-foreground text-lg font-semibold">
                                          /c
                                        </span>
                                      </p>
                                    </div>
                                    <div className="bg-border h-[1px] w-full opacity-80" />
                                    <div className="flex items-center justify-center">
                                      <p className="text-foreground text-2xl font-extrabold whitespace-nowrap sm:text-3xl">
                                        {formatDecimalWeight(orderItem.quantity)}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Bloque 2: Completado - solo se muestra si NO está completado */}
                                {lineStatusConfig.color !== 'green' && (
                                  <div className="text-center">
                                    <p className="text-muted-foreground mb-1.5 text-lg font-medium tracking-wide uppercase">
                                      Completado
                                    </p>
                                    {/* Tema original comentado:
                                    <div className={`flex flex-col items-center gap-2 px-2.5 py-2 rounded-lg bg-background border ${lineStatusConfig.borderColorSubtle}`}>
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl sm:text-3xl font-extrabold text-muted-foreground whitespace-nowrap">
                                          <span className="text-muted-foreground">{formatInteger(orderItem.completedBoxes || 0)}</span>
                                          <span className="text-muted-foreground/70 text-lg font-semibold">/c</span>
                                        </p>
                                      </div>
                                      <Separator className="w-full opacity-60" />
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl sm:text-3xl font-extrabold text-muted-foreground whitespace-nowrap">
                                          {formatDecimalWeight(orderItem.completedQuantity || 0)}
                                        </p>
                                      </div>
                                    </div>
                                    */}
                                    {/* Tema temporal: fondo gris y letras negras */}
                                    <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-300 bg-gray-200 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-800">
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl font-extrabold whitespace-nowrap text-black sm:text-3xl dark:text-white">
                                          <span className="text-black dark:text-white">
                                            {formatInteger(orderItem.completedBoxes || 0)}
                                          </span>
                                          <span className="text-lg font-semibold text-black/70 dark:text-white/70">
                                            /c
                                          </span>
                                        </p>
                                      </div>
                                      <div className="h-[1px] w-full bg-gray-400/80 dark:bg-gray-600/80" />
                                      <div className="flex items-center justify-center">
                                        <p className="text-2xl font-extrabold whitespace-nowrap text-black sm:text-3xl dark:text-white">
                                          {formatDecimalWeight(orderItem.completedQuantity || 0)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Bloque 3 y 4: Diferencia y Palets - cuando está completado van juntos en una fila */}
                                {lineStatusConfig.color === 'green' ? (
                                  <>
                                    {/* Bloque 3: Diferencia */}
                                    <div className="text-center">
                                      {(() => {
                                        const completed = orderItem.completedQuantity || 0;
                                        const planned = orderItem.quantity || 0;
                                        let blockTitle = 'Restante';

                                        if (completed > planned) {
                                          blockTitle = 'Sobrante';
                                        } else if (
                                          Math.abs(completed - planned) < 0.01 ||
                                          (orderItem.remainingQuantity || 0) <= 0
                                        ) {
                                          blockTitle = 'Diferencia';
                                        }

                                        return (
                                          <>
                                            <p className="text-muted-foreground mb-1.5 text-lg font-medium tracking-wide uppercase">
                                              {blockTitle}
                                            </p>
                                            <div
                                              className={`flex flex-col items-center gap-2 rounded-lg px-2.5 py-2 ${lineStatusConfig.bgColorHighlight} border-2 ${lineStatusConfig.borderColor}`}
                                            >
                                              <div className="flex items-center justify-center">
                                                <p
                                                  className={`text-2xl font-extrabold whitespace-nowrap sm:text-3xl ${lineStatusConfig.textColor}`}
                                                >
                                                  <span>
                                                    {completed > planned
                                                      ? formatInteger(
                                                          Math.abs(orderItem.remainingBoxes || 0)
                                                        )
                                                      : formatInteger(
                                                          orderItem.remainingBoxes || 0
                                                        )}
                                                  </span>
                                                  <span className="text-lg font-semibold opacity-70">
                                                    /c
                                                  </span>
                                                </p>
                                              </div>
                                              <div
                                                className={`h-[1px] w-full ${lineStatusConfig.borderColor.replace('border-', 'bg-')} opacity-80`}
                                              />
                                              <div className="flex items-center justify-center">
                                                <p
                                                  className={`text-2xl font-extrabold whitespace-nowrap sm:text-3xl ${lineStatusConfig.textColor}`}
                                                >
                                                  {completed > planned
                                                    ? formatDecimalWeight(
                                                        Math.abs(orderItem.remainingQuantity || 0)
                                                      )
                                                    : formatDecimalWeight(
                                                        orderItem.remainingQuantity || 0
                                                      )}
                                                </p>
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {/* Bloque 4: Palets */}
                                    <div className="text-center">
                                      <p className="text-muted-foreground mb-1.5 text-lg font-medium tracking-wide uppercase">
                                        Palets
                                      </p>
                                      <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 dark:border-gray-800 dark:bg-gray-900">
                                        <div className="flex flex-col items-center gap-1">
                                          {orderItem.palets && orderItem.palets.length > 0 ? (
                                            orderItem.palets.slice(0, 3).map((paletNumber, idx) => (
                                              <p
                                                key={idx}
                                                className="text-xl font-extrabold whitespace-nowrap text-gray-700 sm:text-2xl dark:text-gray-200"
                                              >
                                                #{paletNumber.toString().padStart(4, '0')}
                                              </p>
                                            ))
                                          ) : (
                                            <p className="text-2xl font-extrabold whitespace-nowrap text-gray-700 sm:text-3xl dark:text-gray-200">
                                              0
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Bloque 3: Sobrante/Restante - cuando NO está completado */}
                                    <div className="text-center">
                                      {(() => {
                                        const completed = orderItem.completedQuantity || 0;
                                        const planned = orderItem.quantity || 0;
                                        let blockTitle = 'Restante';

                                        if (completed > planned) {
                                          blockTitle = 'Sobrante';
                                        } else if (
                                          Math.abs(completed - planned) < 0.01 ||
                                          (orderItem.remainingQuantity || 0) <= 0
                                        ) {
                                          blockTitle = 'Diferencia';
                                        }

                                        return (
                                          <>
                                            <p className="text-muted-foreground mb-1.5 text-lg font-medium tracking-wide uppercase">
                                              {blockTitle}
                                            </p>
                                            <div
                                              className={`flex flex-col items-center gap-2 rounded-lg px-2.5 py-2 ${lineStatusConfig.bgColorHighlight} border-2 ${lineStatusConfig.borderColor}`}
                                            >
                                              <div className="flex items-center justify-center">
                                                <p
                                                  className={`text-2xl font-extrabold whitespace-nowrap sm:text-3xl ${lineStatusConfig.textColor}`}
                                                >
                                                  <span>
                                                    {completed > planned
                                                      ? formatInteger(
                                                          Math.abs(orderItem.remainingBoxes || 0)
                                                        )
                                                      : formatInteger(
                                                          orderItem.remainingBoxes || 0
                                                        )}
                                                  </span>
                                                  <span className="text-lg font-semibold opacity-70">
                                                    /c
                                                  </span>
                                                </p>
                                              </div>
                                              <div
                                                className={`h-[1px] w-full ${lineStatusConfig.borderColor.replace('border-', 'bg-')} opacity-80`}
                                              />
                                              <div className="flex items-center justify-center">
                                                <p
                                                  className={`text-2xl font-extrabold whitespace-nowrap sm:text-3xl ${lineStatusConfig.textColor}`}
                                                >
                                                  {completed > planned
                                                    ? formatDecimalWeight(
                                                        Math.abs(orderItem.remainingQuantity || 0)
                                                      )
                                                    : formatDecimalWeight(
                                                        orderItem.remainingQuantity || 0
                                                      )}
                                                </p>
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {/* Bloque 4: Palets */}
                                    <div className="text-center">
                                      <p className="text-muted-foreground mb-1.5 text-lg font-medium tracking-wide uppercase">
                                        Palets
                                      </p>
                                      <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 dark:border-gray-800 dark:bg-gray-900">
                                        <div className="flex flex-col items-center gap-1">
                                          {orderItem.palets && orderItem.palets.length > 0 ? (
                                            orderItem.palets.slice(0, 3).map((paletNumber, idx) => (
                                              <p
                                                key={idx}
                                                className="text-xl font-extrabold whitespace-nowrap text-gray-700 sm:text-2xl dark:text-gray-200"
                                              >
                                                #{paletNumber.toString().padStart(4, '0')}
                                              </p>
                                            ))
                                          ) : (
                                            <p className="text-2xl font-extrabold whitespace-nowrap text-gray-700 sm:text-3xl dark:text-gray-200">
                                              0
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="space-y-2 text-center">
                  <Package className="text-muted-foreground/50 mx-auto h-12 w-12" />
                  <p className="text-muted-foreground text-sm italic">
                    Sin pedidos para este producto
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductionView;
