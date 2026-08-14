'use client';

import { use } from 'react';
import { MaquilaOrderDetailView } from '@/components/External/Maquila/Pedidos/MaquilaOrderDetailView';

interface MaquilaOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MaquilaOrderDetailPage({ params }: MaquilaOrderDetailPageProps) {
  const { id } = use(params);
  return <MaquilaOrderDetailView orderId={id} />;
}
