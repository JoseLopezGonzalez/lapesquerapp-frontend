import CustomSkeleton from '@/components/ui/CustomSkeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const OrderSkeleton = () => {
  return (
    <div
      className={`h-full w-full rounded-2xl border border-neutral-800/30 bg-neutral-950 bg-gradient-to-b p-9`}
    >
      <div className="flex h-full flex-col">
        {/* Cabecera */}
        <div className="-mt-6 flex justify-between lg:-mt-2">
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
          <div className="hidden h-fit flex-row gap-2 pt-2 lg:flex">
            <div className="flex max-w-sm flex-col items-end justify-end gap-3">
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
        <div className="w-full flex-1 overflow-y-hidden pt-6">
          <div className="container mx-auto h-full space-y-8 py-3">
            <Tabs value="details" className="flex h-full flex-col">
              <TabsList className="flex w-fit gap-2 bg-neutral-900">
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
                <TabsContent
                  value="details"
                  className="flex h-full w-full flex-col space-y-4 overflow-y-auto pb-4"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <CustomSkeleton className="h-48 w-full rounded-md" />
                    <CustomSkeleton className="h-48 w-full rounded-md" />
                    <CustomSkeleton className="h-48 w-full rounded-md" />
                  </div>
                  <CustomSkeleton className="h-40 w-full rounded-md" />
                  <CustomSkeleton className="h-40 w-full grow rounded-md" />
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
