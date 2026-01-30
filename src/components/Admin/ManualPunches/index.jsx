'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IndividualPunchForm from './IndividualPunchForm';
import BulkPunchForm from './BulkPunchForm';
import BulkPunchExcelUpload from './BulkPunchExcelUpload';

export default function ManualPunchesManager() {
  const [activeTab, setActiveTab] = useState('individual');

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Gestión Manual de Fichajes</h2>
        <p className="text-sm text-muted-foreground">
          Registra entradas y salidas de trabajadores de forma manual con fecha y hora personalizada
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex">
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="bulk-form">Masivo (Formulario)</TabsTrigger>
          <TabsTrigger value="bulk-excel">Masivo (Excel)</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-6">
          <IndividualPunchForm />
        </TabsContent>

        <TabsContent value="bulk-form" className="mt-6">
          <BulkPunchForm />
        </TabsContent>

        <TabsContent value="bulk-excel" className="mt-6">
          <BulkPunchExcelUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}

