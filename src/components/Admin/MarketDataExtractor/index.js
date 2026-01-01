"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IndividualMode from "./IndividualMode";
import MassiveMode from "./MassiveMode";

export default function MarketDataExtractor() {
    return (
        <Tabs defaultValue="individual" className="w-full h-full flex flex-col">
            <TabsList className="mb-4 flex-shrink-0 w-fit">
                <TabsTrigger value="individual">Modo Individual</TabsTrigger>
                <TabsTrigger value="massive">Modo Masivo</TabsTrigger>
            </TabsList>
            <TabsContent value="individual" className="flex-1 min-h-0">
                <IndividualMode />
            </TabsContent>
            <TabsContent value="massive" className="flex-1 min-h-0">
                <MassiveMode />
            </TabsContent>
        </Tabs>
    );
}
