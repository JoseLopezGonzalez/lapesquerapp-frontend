import type { ComponentPropsWithoutRef } from 'react';
import type { Tabs as TabsPrimitive } from 'radix-ui';

declare const Tabs: React.FC<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & { className?: string }
>;
declare const TabsList: React.FC<
  ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    className?: string;
    variant?: 'default' | 'line';
  }
>;
declare const TabsTrigger: React.FC<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { className?: string }
>;
declare const TabsContent: React.FC<
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { className?: string }
>;

export { Tabs, TabsList, TabsTrigger, TabsContent };
