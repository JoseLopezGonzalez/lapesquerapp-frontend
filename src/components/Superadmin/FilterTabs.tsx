'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FilterTab {
  key: string;
  label: string;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function FilterTabs({ tabs, activeKey, onChange }: FilterTabsProps) {
  return (
    <Tabs value={activeKey} onValueChange={onChange}>
      <TabsList className="h-auto flex-wrap gap-0.5">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
