'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IndividualMode from './IndividualMode';
import MassiveMode from './MassiveMode';

export default function MarketDataExtractor() {
  return (
    <Tabs defaultValue="individual" className="flex h-full w-full flex-col">
      <TabsList className="mb-4 w-fit flex-shrink-0">
        <TabsTrigger value="individual">Modo Individual</TabsTrigger>
        <TabsTrigger value="massive">Modo Masivo</TabsTrigger>
      </TabsList>
      <TabsContent value="individual" className="min-h-0 flex-1">
        <IndividualMode />
      </TabsContent>
      <TabsContent value="massive" className="min-h-0 flex-1">
        <MassiveMode />
      </TabsContent>
    </Tabs>
  );
}
