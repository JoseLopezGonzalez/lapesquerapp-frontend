'use client';

import { useSession } from 'next-auth/react';
import Loader from '@/components/Utilities/Loader';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useFieldOperatorDetail } from '@/hooks/useFieldOperators';
import FieldOperatorForm from './FieldOperatorForm';
import { MapPinned } from 'lucide-react';

export default function FieldOperatorDetailPageClient({ id }) {
  const { data: session, status } = useSession();
  const { data, isLoading, error } = useFieldOperatorDetail(id);
  const role = Array.isArray(session?.user?.role) ? session.user.role[0] : session?.user?.role;

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (role !== 'administrador' && role !== 'direccion') {
    return (
      <div className="p-6">
        <EmptyState
          icon={<MapPinned className="text-primary h-10 w-10" />}
          title="Acceso restringido"
          description="Solo administración y dirección pueden gestionar operadores de campo."
          className="bg-muted/20 border"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col gap-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<MapPinned className="text-primary h-10 w-10" />}
          title="No se pudo cargar el operador"
          description={error?.message ?? 'El operador no está disponible.'}
          className="bg-muted/20 border"
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <FieldOperatorForm mode="edit" initialData={data} />
    </div>
  );
}
