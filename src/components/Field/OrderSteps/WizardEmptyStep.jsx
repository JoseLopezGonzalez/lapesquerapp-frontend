'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PackageOpen } from 'lucide-react';

export function WizardEmptyStep({ title, description }) {
  return (
    <div className="w-full max-w-[420px]">
      <Card>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="rounded-full border bg-muted/30 p-4">
            <PackageOpen className="h-12 w-12 text-primary" strokeWidth={1.6} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
