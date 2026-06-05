'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SupplierLiquidationList } from './SupplierLiquidationList';
import { SupplierLiquidationsCrudList } from './SupplierLiquidationsCrudList';

export function SupplierLiquidationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = searchParams.get('tab') === 'historial' ? 'historial' : 'nueva';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'nueva') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-full w-full flex-col">
      <div className="flex-shrink-0 border-b px-6 pt-4">
        <TabsList className="mb-0">
          <TabsTrigger value="nueva">Nueva liquidación</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="nueva" className="m-0 flex-1 overflow-hidden">
        <SupplierLiquidationList />
      </TabsContent>

      <TabsContent value="historial" className="m-0 flex-1 overflow-hidden">
        <SupplierLiquidationsCrudList />
      </TabsContent>
    </Tabs>
  );
}
