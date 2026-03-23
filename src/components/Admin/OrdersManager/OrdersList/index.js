import React, { memo } from 'react'
import { InboxIcon } from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PackageSearch, SearchX, ArrowLeft, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

import OrderCard from './OrderCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Plus, LayoutGrid, Search } from 'lucide-react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { downloadActivePlannedProductsXls } from '@/services/orderService';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBackButton } from '@/hooks/use-back-button';

import { notify } from '@/lib/notifications';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { EmptyState } from '@/components/Utilities/EmptyState';
import { cn } from '@/lib/utils';

/* convertir examples a objeto js */

const OrdersList = ({ orders, categories, visibleCategories: visibleCategoriesProp, totalActiveOrders, onClickCategory, onChangeSearch, searchText, onClickOrderCard, onClickAddNewOrder, disabled, error, onRetry, selectedOrderId, viewMode, onToggleViewMode, readOnly = false }) => {
    const visibleCategories = visibleCategoriesProp ?? categories;
    const activeCount = totalActiveOrders ?? orders?.length ?? 0;

    const { data: session } = useSession();
    const isMobile = useIsMobile();
    const router = useRouter();
    const scrollAreaRef = React.useRef(null);
    const scrollPositionRef = React.useRef(0);
    const prevSelectedOrderIdRef = React.useRef(selectedOrderId);
    const prevOrdersLengthRef = React.useRef(orders?.length || 0);

    // Interceptar botón back del navegador/dispositivo
    useBackButton(() => {
        router.back();
    }, isMobile);

    const activeTab = categories.find((category) => category.current)?.name || 'all';

    // Preservar posición del scroll cuando solo cambia la selección (no cuando cambian los orders)
    React.useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                const selectedOrderChanged = prevSelectedOrderIdRef.current !== selectedOrderId;
                const ordersChanged = prevOrdersLengthRef.current !== (orders?.length || 0);
                
                // Si solo cambió la selección (no los orders), guardar posición actual
                if (selectedOrderChanged && !ordersChanged) {
                    scrollPositionRef.current = viewport.scrollTop;
                    
                    // Restaurar después del render
                    requestAnimationFrame(() => {
                        if (scrollAreaRef.current) {
                            const restoredViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
                            if (restoredViewport && scrollPositionRef.current > 0) {
                                restoredViewport.scrollTop = scrollPositionRef.current;
                            }
                        }
                    });
                }
                
                // Actualizar referencias
                prevSelectedOrderIdRef.current = selectedOrderId;
                prevOrdersLengthRef.current = orders?.length || 0;
            }
        }
    }, [selectedOrderId, orders]);

    const exportDocument = async () => {
        const doExport = async () => {
            const blob = await downloadActivePlannedProductsXls(session.user.accessToken);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_pedidos_activos.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        };
        await notify.promise(doExport(), {
            loading: 'Exportando',
            success: 'Exportación completada',
            error: (error) => {
                const desc = error?.userMessage || error?.data?.userMessage || error?.response?.data?.userMessage || error?.message || 'No se pudo completar la exportación. Intente de nuevo.';
                return { title: 'Error al exportar', description: desc };
            },
        });
    };

    return (
        <div className={`flex flex-col h-full relative overflow-hidden`}>
            {/* Header */}
            <div className={`bg-background flex-shrink-0 ${isMobile ? 'px-0 pt-4 pb-3' : 'pt-2 sm:pt-3 px-4 sm:px-7 pb-3'}`}>
                {isMobile ? (
                    /* Layout mobile: Back + título + Crear (un solo punto de entrada a filtros = fila "Filtrar") */
                    <div className="relative flex items-center justify-between px-2 gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="w-12 h-12 min-w-12 min-h-12 rounded-full hover:bg-muted flex-shrink-0"
                            aria-label="Volver"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h2 className="text-xl font-normal dark:text-white text-center flex-1 truncate">
                            Pedidos Activos
                        </h2>
                        <Button
                            variant="default"
                            size="icon"
                            onClick={onClickAddNewOrder}
                            className="h-11 w-11 shrink-0 min-h-11 min-w-11"
                            aria-label="Crear nuevo pedido"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                ) : (
                    /* Layout desktop: título + botones */
                    <div className="w-full flex flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg sm:text-xl font-semibold dark:text-white">
                                Pedidos Activos
                            </h2>
                    {activeCount > 0 && (
                        <p className='text-xs sm:text-sm text-muted-foreground'>
                            {activeCount} pedido{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                        {/* Botones de acción en desktop */}
                        <div className="flex items-center gap-2">
                    {!readOnly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={onToggleViewMode}
                            >
                              <LayoutGrid className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Vista de Producción</p>
                          </TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                                    <Button
                                        variant="default"
                                        size="icon"
                                        onClick={onClickAddNewOrder}
                                    >
                                        <Plus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                                    <p>Crear nuevo pedido</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={exportDocument}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Exportar productos planificados activos</p>
                      </TooltipContent>
                    </Tooltip>
                </div>
                    </div>
                )}
            </div>
            <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isMobile ? 'px-4' : 'px-4 sm:px-7'}`}>
                    {/* Barra de búsqueda (siempre visible) + tabs con efecto badge y scroll con fade */}
                    <div className={`w-full flex-shrink-0 ${isMobile ? 'mb-3 pt-1 space-y-4' : 'mb-5 pt-2'}`}>
                        <InputGroup className="w-full">
                            <InputGroupInput
                                type="text"
                                value={searchText}
                                onChange={(e) => onChangeSearch(e.target.value)}
                                placeholder={isMobile ? 'Buscar por ID o cliente' : 'Buscar por id o cliente'}
                            />
                            <InputGroupAddon>
                                <Search className="size-4" />
                            </InputGroupAddon>
                        </InputGroup>

                        <Tabs value={activeTab} onValueChange={onClickCategory} className={isMobile ? 'mt-0' : 'mt-5 mb-5'}>
                            {isMobile ? (
                                <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
                                    <TabsList className="w-max">
                                        {visibleCategories.map((category) => (
                                            <TabsTrigger key={category.name} value={category.name}>
                                                {category.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>
                            ) : (
                                <TabsList>
                                    {visibleCategories.map((category) => (
                                        <TabsTrigger key={category.name} value={category.name}>
                                            {category.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            )}
                        </Tabs>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className={`flex-shrink-0 ${isMobile ? 'mb-3' : 'mb-4'} p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg`}>
                            <p className="text-red-800 dark:text-red-200 text-sm mb-2">{error}</p>
                            {onRetry && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={onRetry}
                                    className="text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40"
                                >
                                    Reintentar
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Lista de orders - Solo esta sección es scrollable */}
                    {orders?.length > 0 ? (
                        <div className="relative flex-1 min-h-0 overflow-hidden">
                            {/* Fade gradients para indicar scroll arriba/abajo */}
                            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                            <ScrollArea 
                                ref={scrollAreaRef}
                                className="h-full w-full"
                            >
                                <div className={`flex flex-col ${isMobile ? 'gap-4 pt-2 pb-6 pl-2 pr-2' : 'gap-3 pt-2 pl-2 pr-2 pb-4'}`}>
                                {orders.map((order) => (
                                        <div key={order.id}>
                                        <OrderCard
                                            onClick={() => onClickOrderCard(order.id)}
                                            order={order}
                                            disabled={disabled}
                                            isSelected={selectedOrderId === order.id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        </div>
                    ) : (
                        <div className="h-full w-full">
                            {!error && (
                                <EmptyState
                                    icon={
                                        searchText ? (
                                            <SearchX />
                                        ) : activeTab === 'finished' ? (
                                            <CheckCircle2 />
                                        ) : activeTab === 'pending' || activeTab === 'incident' ? (
                                            activeTab === 'incident' ? <AlertCircle /> : <Clock />
                                        ) : (
                                            <Package />
                                        )
                                    }
                                    title={
                                        searchText
                                            ? 'No se encontraron pedidos'
                                            : {
                                                  finished: 'No hay pedidos terminados',
                                                  pending: 'No hay pedidos en producción',
                                                  incident: 'No hay pedidos con incidentes',
                                                  today: 'No hay pedidos para hoy',
                                                  tomorrow: 'No hay pedidos para mañana',
                                              }[activeTab] ?? 'No hay pedidos activos'
                                    }
                                    description={
                                        searchText
                                            ? 'Intenta con otros parámetros de búsqueda o ajusta los filtros.'
                                            : {
                                                  finished: 'Los pedidos terminados aparecerán aquí una vez que se completen.',
                                                  pending: 'Los pedidos en producción aparecerán aquí cuando estén en proceso.',
                                                  incident: 'Los pedidos con incidentes aparecerán aquí cuando se reporten problemas.',
                                                  today: 'No hay pedidos con fecha de carga hoy. Cambia el filtro o crea un pedido.',
                                                  tomorrow: 'No hay pedidos con fecha de carga mañana. Cambia el filtro o crea un pedido.',
                                              }[activeTab] ?? 'Crea un nuevo pedido para comenzar a gestionar tus pedidos activos.'
                                    }
                                    button={
                                        !searchText && activeTab === 'all'
                                            ? { name: 'Crear nuevo pedido', onClick: onClickAddNewOrder }
                                            : undefined
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>
        </div>
    )
}

// Memoizar el componente para evitar re-renders innecesarios
// Comparación personalizada para evitar re-renders cuando solo cambia selectedOrderId
export default memo(OrdersList, (prevProps, nextProps) => {
    return (
        prevProps.orders === nextProps.orders &&
        prevProps.totalActiveOrders === nextProps.totalActiveOrders &&
        prevProps.categories === nextProps.categories &&
        prevProps.visibleCategories === nextProps.visibleCategories &&
        prevProps.searchText === nextProps.searchText &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.error === nextProps.error &&
        // selectedOrderId puede cambiar sin causar re-render (se maneja internamente)
        prevProps.onClickOrderCard === nextProps.onClickOrderCard &&
        prevProps.onClickCategory === nextProps.onClickCategory &&
        prevProps.onChangeSearch === nextProps.onChangeSearch &&
        prevProps.onClickAddNewOrder === nextProps.onClickAddNewOrder &&
        prevProps.onRetry === nextProps.onRetry &&
        prevProps.readOnly === nextProps.readOnly &&
        prevProps.viewMode === nextProps.viewMode &&
        prevProps.onToggleViewMode === nextProps.onToggleViewMode
    );
});