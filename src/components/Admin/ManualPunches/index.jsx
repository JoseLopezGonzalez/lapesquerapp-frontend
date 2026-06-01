'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IndividualPunchForm from './IndividualPunchForm';
import BulkPunchForm from './BulkPunchForm';
import BulkPunchExcelUpload from './BulkPunchExcelUpload';

export default function ManualPunchesManager() {
  const [activeTab, setActiveTab] = useState('individual');

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="container mx-auto flex h-full flex-col space-y-6 overflow-hidden p-4 md:p-6">
        <div className="flex-shrink-0 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Gestión Manual de Fichajes</h2>
          <p className="text-muted-foreground text-sm">
            Registra entradas y salidas de trabajadores de forma manual con fecha y hora
            personalizada
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
        >
          <div className="flex-shrink-0">
            <TabsList className="inline-flex w-fit">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="bulk-form">Masivo (Formulario)</TabsTrigger>
              <TabsTrigger value="bulk-excel">Masivo (Excel)</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="individual" className="mt-6 min-h-0 flex-1 overflow-y-auto">
            <IndividualPunchForm />
          </TabsContent>

          <TabsContent value="bulk-form" className="mt-6 min-h-0 flex-1 overflow-y-auto">
            <BulkPunchForm />
          </TabsContent>

          <TabsContent value="bulk-excel" className="mt-6 min-h-0 flex-1 overflow-y-auto">
            <BulkPunchExcelUpload />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
