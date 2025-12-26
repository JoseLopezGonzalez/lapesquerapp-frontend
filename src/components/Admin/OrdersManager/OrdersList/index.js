import { fetchWithTenant } from "@lib/fetchWithTenant";
import { useState, memo } from 'react'
import { InboxIcon } from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';

import OrderCard from './OrderCard';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { API_URL_V2 } from '@/configs/config';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { useSession } from 'next-auth/react';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

/* convertir examples a objeto js */



const OrdersList = ({ orders, categories, onClickCategory, onChangeSearch, searchText, onClickOrderCard, onClickAddNewOrder, disabled, error, onRetry }) => {

    const [loading, setLoading] = useState(false);
    const { data: session } = useSession();

    const activeTab = categories.find((category) => category.current)?.name || 'all';

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
        <div className='flex flex-col h-full pt-4 sm:pt-5 px-4 sm:px-7'>
            <div className='w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pb-3'>
                <div className='flex flex-col gap-1'>
                    <h2 className='text-lg sm:text-xl dark:text-white font-semibold'>Pedidos Activos</h2>
                    {orders.length > 0 && (
                        <p className='text-xs sm:text-sm text-muted-foreground'>
                            {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                {/* Botones de acción */}
                <div className='flex items-center gap-2'>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" variant='outline' onClick={handleExportActivePlannedProducts} className="h-9 w-9 sm:h-10 sm:w-10">
                                <Download className='h-4 w-4 sm:h-5 sm:w-5' />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Descargar reporte excel</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button size="icon" variant='' onClick={onClickAddNewOrder} className="h-9 w-9 sm:h-10 sm:w-10">
                                <Plus className='h-4 w-4 sm:h-5 sm:w-5' />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Crear nuevo pedido</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
            {loading ? (
                <>

                </>
            ) : (
                <>
                    {/* Filtro */}
                    <div className='w-full mb-5'>
                        {/*  <OrderFilters categories={categories} /> */}

                        {/* input search  */}
                        <div className='relative w-full text-sm'>
                            <Input 
                                onChange={(e) => onChangeSearch(e.target.value)} 
                                value={searchText}
                                type="text" 
                                placeholder='Buscar por id o cliente' 
                                className='w-full py-2 px-4 sm:px-5 pr-10 sm:pr-12 text-sm sm:text-base' 
                            />
                            <button 
                                className='absolute right-0 top-0 h-full w-10 sm:w-12 flex items-center justify-center'
                                onClick={() => searchText.length > 0 && onChangeSearch('')}
                            >
                                {searchText.length > 0 ? (
                                    <XMarkIcon className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-foreground' />
                                ) : (
                                    <MagnifyingGlassIcon className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
                                )}
                            </button>
                        </div>

                        {/* <select className="mt-2 py-2 px-3 pe-9 block w-full border rounded-2xl text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-black/15 dark:border-neutral-600 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600">
                            <option>Esta Semana</option>
                            <option>Hoy</option>
                            <option>Mañana</option>
                        </select> */}

                        {/* Tab Shadcn categories */}
                        <Tabs value={activeTab} onValueChange={onClickCategory} className='mt-5'>
                            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
                                <TabsList className="w-max min-w-full sm:min-w-0">
                                    {categories.map((category) =>
                                        <TabsTrigger key={category.name} value={category.name} className="whitespace-nowrap text-xs sm:text-sm">
                                            {category.label}
                                        </TabsTrigger>
                                    )}
                                </TabsList>
                            </div>
                        </Tabs>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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

                    {/* Lista de orders */}
                    {orders?.length > 0 ? (
                        <ScrollArea className="h-full grow pr-2 pb-4 mb-4">
                            <div className="flex flex-col gap-3">
                                {orders.map((order) => (
                                    <div key={order.id} className='' >
                                        <OrderCard
                                            onClick={() => onClickOrderCard(order.id)}
                                            order={order}
                                            disabled={disabled}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className='flex flex-col items-center justify-center gap-4 h-full w-full py-8'>
                            {!error && (
                                <>
                                    <InboxIcon className="h-12 w-12 text-muted-foreground" />
                                    <div className='flex flex-col items-center gap-1'>
                                        <span className='text-neutral-300 dark:text-neutral-400 font-medium text-md'>
                                            {searchText ? 'No se encontraron pedidos' : 'No hay pedidos activos'}
                                        </span>
                                        {searchText && (
                                            <p className='text-neutral-300 dark:text-neutral-500 font-light text-sm'>
                                                Intenta con otros parámetros de búsqueda
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </>
            )
            }

        </div >
    )
}

// Memoizar el componente para evitar re-renders innecesarios
// selectedOrder ya no se pasa como prop, por lo que cambios en selectedOrder no causan re-renders
export default memo(OrdersList);