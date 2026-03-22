'use client';

import { useSession } from 'next-auth/react';
import Loader from '@/components/Utilities/Loader';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { useFieldOperatorDetail } from '@/hooks/useFieldOperators';
import FieldOperatorForm from './FieldOperatorForm';
import { MapPinned } from 'lucide-react';

export default function FieldOperatorDetailPageClient({ id }) {
  const { data: session, status } = useSession();
  const { data, isLoading, error } = useFieldOperatorDetail(id);
  const role = Array.isArray(session?.user?.role) ? session.user.role[0] : session?.user?.role;

  if (status === 'loading') {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader /></div>;
  }

  if (role !== 'administrador' && role !== 'direccion') {
    return (
      <div className="p-6">
        <EmptyState
          icon={<MapPinned className="h-10 w-10 text-primary" />}
          title="Acceso restringido"
          description="Solo administración y dirección pueden gestionar operadores de campo."
          className="border bg-muted/20"
        />
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader /></div>;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<MapPinned className="h-10 w-10 text-primary" />}
          title="No se pudo cargar el operador"
          description={error?.message ?? 'El operador no está disponible.'}
          className="border bg-muted/20"
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
