'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PackageOpen } from 'lucide-react';

export function WizardEmptyStep({ title, description }) {
  return (
    <div className="w-full max-w-[420px]">
      <Card>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="bg-muted/30 rounded-full border p-4">
            <PackageOpen className="text-primary h-12 w-12" strokeWidth={1.6} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
