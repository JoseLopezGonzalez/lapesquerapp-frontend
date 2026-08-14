'use client';

import { use } from 'react';
import { MaquilaReceptionDetailView } from '@/components/External/Maquila/Recepciones/MaquilaReceptionDetailView';

interface MaquilaReceptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaquilaReceptionDetailPage({ params }: MaquilaReceptionDetailPageProps) {
  const { id } = use(params);
  return <MaquilaReceptionDetailView receptionId={id} />;
}
