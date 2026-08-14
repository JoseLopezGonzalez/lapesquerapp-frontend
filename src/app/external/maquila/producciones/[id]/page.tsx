'use client';

import { use } from 'react';
import { MaquilaProductionDetailView } from '@/components/External/Maquila/Producciones/MaquilaProductionDetailView';

interface MaquilaProductionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaquilaProductionDetailPage({ params }: MaquilaProductionDetailPageProps) {
  const { id } = use(params);
  return <MaquilaProductionDetailView productionId={id} />;
}
