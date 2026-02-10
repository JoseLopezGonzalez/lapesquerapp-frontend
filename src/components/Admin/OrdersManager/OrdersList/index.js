import { fetchWithTenant } from "@lib/fetchWithTenant";
import React, { useState, memo } from 'react'
import { InboxIcon } from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PackageSearch, SearchX, ArrowLeft, CheckCircle2, Clock, AlertCircle, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

import OrderCard from './OrderCard';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Plus, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { API_URL_V2 } from '@/configs/config';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBackButton } from '@/hooks/use-back-button';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';

/* convertir examples a objeto js */



const OrdersList = ({ orders, categories, visibleCategories: visibleCategoriesProp, onClickCategory, onChangeSearch, searchText, onClickOrderCard, onClickAddNewOrder, disabled, error, onRetry, selectedOrderId, viewMode, onToggleViewMode }) => {
    const visibleCategories = visibleCategoriesProp ?? categories;

    const [loading, setLoading] = useState(false);
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
        const toastId = toast.loading(`Exportando `, getToastTheme());
        try {
            const response = await fetchWithTenant(`${API_URL_V2}orders/xlsx/active-planned-products`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.user.accessToken}`,
                    'User-Agent': navigator.userAgent,
                }
            });

            if (!response.ok) {
                throw new Error('Error al exportar');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_pedidos_activos.xlsx`; // Nombre del archivo de descarga
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Liberar memoria

            toast.success('Exportación exitosa', { id: toastId });

        } catch (error) {
            // console.log(error);
            toast.error('Error al exportar', { id: toastId });
        }
    };

    const handleExportActivePlannedProducts = () => {
        exportDocument('active-planned-products', 'xlsx', 'Productos Planificados Activos')
    };



    return (
        <div className={`flex flex-col h-full relative overflow-hidden`}>
            {/* Header */}
            <div className={`bg-background flex-shrink-0 ${isMobile ? 'px-0 pt-8 pb-3' : 'pt-4 sm:pt-5 px-4 sm:px-7 pb-3'}`}>
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
                    {orders.length > 0 && (
                        <p className='text-xs sm:text-sm text-muted-foreground'>
                            {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                        {/* Botones de acción en desktop */}
                        <div className="flex items-center gap-2">
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
                                        onClick={handleExportActivePlannedProducts}
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
            {loading ? (
                <>

                </>
            ) : (
                <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isMobile ? 'px-4' : 'px-4 sm:px-7'}`}>
                    {/* Barra de búsqueda (siempre visible) + tabs con efecto badge y scroll con fade */}
                    <div className={`w-full flex-shrink-0 ${isMobile ? 'mb-3 pt-3 space-y-4' : 'mb-5 pt-4'}`}>
                        <div className="relative w-full">
                            <Input
                                onChange={(e) => onChangeSearch(e.target.value)}
                                value={searchText}
                                type="text"
                                placeholder={isMobile ? 'Buscar por ID o cliente' : 'Buscar por id o cliente'}
                                className={cn(
                                    'w-full pr-10 text-base rounded-md',
                                    isMobile ? 'h-12 pl-4 pr-12 rounded-lg' : 'py-2 px-4 sm:px-5 pr-10 sm:pr-12 text-sm sm:text-base'
                                )}
                            />
                            <button
                                className={cn(
                                    'absolute right-0 top-0 h-full flex items-center justify-center touch-manipulation',
                                    isMobile ? 'w-12' : 'w-10 sm:w-12'
                                )}
                                onClick={() => searchText.length > 0 && onChangeSearch('')}
                                aria-label={searchText.length > 0 ? 'Limpiar búsqueda' : 'Buscar'}
                            >
                                {searchText.length > 0 ? (
                                    <XMarkIcon className={cn('text-muted-foreground hover:text-foreground', isMobile ? 'h-5 w-5' : 'h-4 w-4 sm:h-5 sm:w-5')} />
                                ) : (
                                    <MagnifyingGlassIcon className={cn('text-muted-foreground', isMobile ? 'h-5 w-5' : 'h-4 w-4 sm:h-5 sm:w-5')} />
                                )}
                            </button>
                        </div>

                        <Tabs value={activeTab} onValueChange={onClickCategory} className={isMobile ? 'mt-0' : 'mt-5 mb-5'}>
                            {isMobile ? (
                                <div className="relative -mx-4 px-4">
                                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
                                    <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
                                    <div className="overflow-x-auto scrollbar-hide">
                                        <TabsList className="w-max min-w-full inline-flex gap-2 bg-transparent p-0 h-auto pl-3 pr-3">
                                            {visibleCategories.map((category) => (
                                                <TabsTrigger
                                                    key={category.name}
                                                    value={category.name}
                                                    className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium min-h-[36px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/80 flex-shrink-0"
                                                >
                                                    {category.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>
                                </div>
                            ) : (
                                <TabsList className="w-fit inline-flex bg-muted p-1 h-9">
                                    {visibleCategories.map((category) => (
                                        <TabsTrigger
                                            key={category.name}
                                            value={category.name}
                                            className="whitespace-nowrap px-3 py-1 text-sm rounded-md"
                                        >
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
                                <div className={`flex flex-col ${isMobile ? 'gap-4 pt-4 pb-6' : 'gap-3 pt-4 pr-2 pb-4'}`}>
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
                        <div className={`flex flex-col items-center justify-center gap-4 h-full w-full ${isMobile ? 'py-6' : 'py-8'}`}>
                            {!error && (
                                <div className="flex flex-col items-center justify-center w-full h-full px-4">
                                    <div className="relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl opacity-70" />
                                        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-background border shadow-xs">
                                            {(() => {
                                                if (searchText) {
                                                    return <SearchX className="h-6 w-6 text-primary" strokeWidth={1.5} />;
                                                }
                                                switch (activeTab) {
                                                    case 'finished':
                                                        return <CheckCircle2 className="h-6 w-6 text-green-500" strokeWidth={1.5} />;
                                                    case 'pending':
                                                        return <Clock className="h-6 w-6 text-orange-500" strokeWidth={1.5} />;
                                                    case 'incident':
                                                        return <AlertCircle className="h-6 w-6 text-red-500" strokeWidth={1.5} />;
                                                    case 'today':
                                                        return <Clock className="h-6 w-6 text-primary" strokeWidth={1.5} />;
                                                    case 'tomorrow':
                                                        return <Package className="h-6 w-6 text-primary" strokeWidth={1.5} />;
                                                    default:
                                                        return <Package className="h-6 w-6 text-primary" strokeWidth={1.5} />;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                    <h2 className="mt-4 text-lg font-medium tracking-tight">
                                        {(() => {
                                            if (searchText) {
                                                return 'No se encontraron pedidos';
                                            }
                                            switch (activeTab) {
                                                case 'finished':
                                                    return 'No hay pedidos terminados';
                                                case 'pending':
                                                    return 'No hay pedidos en producción';
                                                case 'incident':
                                                    return 'No hay pedidos con incidentes';
                                                case 'today':
                                                    return 'No hay pedidos para hoy';
                                                case 'tomorrow':
                                                    return 'No hay pedidos para mañana';
                                                default:
                                                    return 'No hay pedidos activos';
                                            }
                                        })()}
                                    </h2>
                                    <p className="mt-2 text-center text-muted-foreground max-w-[300px] text-xs whitespace-normal">
                                        {(() => {
                                            if (searchText) {
                                                return 'Intenta con otros parámetros de búsqueda o ajusta los filtros.';
                                            }
                                            switch (activeTab) {
                                                case 'finished':
                                                    return 'Los pedidos terminados aparecerán aquí una vez que se completen.';
                                                case 'pending':
                                                    return 'Los pedidos en producción aparecerán aquí cuando estén en proceso.';
                                                case 'incident':
                                                    return 'Los pedidos con incidentes aparecerán aquí cuando se reporten problemas.';
                                                case 'today':
                                                    return 'No hay pedidos con fecha de carga hoy. Cambia el filtro o crea un pedido.';
                                                case 'tomorrow':
                                                    return 'No hay pedidos con fecha de carga mañana. Cambia el filtro o crea un pedido.';
                                                default:
                                                    return 'Crea un nuevo pedido para comenzar a gestionar tus pedidos activos.';
                                            }
                                        })()}
                                    </p>
                                    {!searchText && activeTab === 'all' && (
                                        <button
                                            onClick={onClickAddNewOrder}
                                            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            Crear nuevo pedido
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Memoizar el componente para evitar re-renders innecesarios
// Comparación personalizada para evitar re-renders cuando solo cambia selectedOrderId
export default memo(OrdersList, (prevProps, nextProps) => {
    return (
        prevProps.orders === nextProps.orders &&
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
        prevProps.viewMode === nextProps.viewMode &&
        prevProps.onToggleViewMode === nextProps.onToggleViewMode
    );
});