'use client';

import { use } from 'react';
import { MaquilaReturnDetailView } from '@/components/External/Maquila/Devoluciones/MaquilaReturnDetailView';

interface MaquilaReturnDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaquilaReturnDetailPage({ params }: MaquilaReturnDetailPageProps) {
  const { id } = use(params);
  return <MaquilaReturnDetailView returnId={id} />;
}
