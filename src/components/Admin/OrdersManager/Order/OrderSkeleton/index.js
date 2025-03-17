import CustomSkeleton from '@/components/ui/CustomSkeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const OrderSkeleton = () => {
    return (
        <div
            className={`
        p-9 h-full w-full bg-gradient-to-b 
        bg-neutral-950 rounded-2xl border border-neutral-800/30
      `}
        >
            <div className="h-full flex flex-col">
                {/* Cabecera */}
                <div className="flex justify-between -mt-6 lg:-mt-2">
                    {/* Columna izquierda */}
                    <div className="space-y-3">
                        <CustomSkeleton className="h-6 w-24 rounded-full" /> {/* Status badge */}
                        <CustomSkeleton className="h-6 w-32" /> {/* Order ID */}
                        <div className="space-y-2">
                            <CustomSkeleton className="h-8 w-60" /> {/* Cliente */}
                            <CustomSkeleton className="h-5 w-40" /> {/* Cliente Nº */}
                        </div>
                        <div className="space-y-1">
                            <CustomSkeleton className="h-4 w-32" /> {/* Fecha carga label */}
                            <CustomSkeleton className="h-6 w-40" /> {/* Fecha carga */}
                        </div>
                        <div className="space-y-1">
                            <CustomSkeleton className="h-4 w-24" /> {/* Palets label */}
                            <CustomSkeleton className="h-6 w-16" /> {/* Palets */}
                        </div>
                    </div>

                    {/* Columna derecha */}
                    <div className="hidden lg:flex flex-row gap-2 h-fit pt-2">
                        <div className="flex flex-col max-w-sm justify-end items-end gap-3">
                            {/* Botones */}
                            <div className="flex gap-2">
                                <CustomSkeleton className="h-10 w-28" /> {/* Editar */}
                                <CustomSkeleton className="h-10 w-28" /> {/* Imprimir */}
                                <CustomSkeleton className="h-10 w-10" /> {/* Menú */}
                            </div>
                            {/* Imagen y transportista */}
                            <div className="flex flex-col items-end justify-center space-y-2">
                                <CustomSkeleton className="h-12 w-28 rounded-md" /> {/* Imagen transporte */}
                                <CustomSkeleton className="h-6 w-40" /> {/* Nombre transporte */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs y contenido */}
                <div className="flex-1 w-full overflow-y-hidden pt-6">
                    <div className="container mx-auto py-3 space-y-8 h-full">
                        <Tabs value="details" className="h-full flex flex-col">
                            <TabsList className="w-fit flex gap-2 bg-neutral-900">
                                <CustomSkeleton className="h-8 w-24" />
                                <CustomSkeleton className="h-8 w-24" />
                                <CustomSkeleton className="h-8 w-32" />
                                <CustomSkeleton className="h-8 w-32" />
                                <CustomSkeleton className="h-8 w-20" />
                                <CustomSkeleton className="h-8 w-40" />
                                <CustomSkeleton className="h-8 w-24" />
                                <CustomSkeleton className="h-8 w-20" />
                            </TabsList>
                            <div className="flex-1 overflow-y-hidden pt-4">
                                <TabsContent value="details" className="space-y-4 w-full h-full overflow-y-auto flex flex-col pb-4">
                                    <div className='grid grid-cols-3 gap-4'>
                                        <CustomSkeleton className="h-48 w-full rounded-md" />
                                        <CustomSkeleton className="h-48 w-full rounded-md" />
                                        <CustomSkeleton className="h-48 w-full rounded-md" />
                                    </div>
                                    <CustomSkeleton className="h-40 w-full rounded-md" />
                                    <CustomSkeleton className="h-40 w-full rounded-md grow" />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSkeleton;
