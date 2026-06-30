'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { Skeleton } from '@/components/ui/skeleton';
import { useFieldOperators } from '@/hooks/useFieldOperators';
import FieldOperatorForm from './FieldOperatorForm';
import { ArrowRight, MapPinned, Plus } from 'lucide-react';

export default function FieldOperatorsPageClient() {
  const { data: session, status } = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, error, refetch } = useFieldOperators({ page: 1, perPage: 50 });
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
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<MapPinned className="text-primary h-10 w-10" />}
          title="No se pudieron cargar los operadores"
          description={error}
          className="bg-muted/20 border"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operadores de campo</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona la identidad operativa de reparto y autoventa.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo operador
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={<MapPinned className="text-primary h-10 w-10" />}
          title="Sin operadores de campo"
          description="Crea el primero para poder asignar clientes y usar el espacio operativo."
          className="bg-muted/20 min-h-[300px] border"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((operator) => (
            <Card key={operator.id} className="border-border/70 shadow-sm">
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{operator.name}</CardTitle>
                    <CardDescription>
                      {operator.user?.name || 'Sin usuario'} · {operator.user?.email || 'Sin email'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-muted-foreground space-y-2 text-sm">
                  <p>
                    Emails:{' '}
                    {Array.isArray(operator.emails) && operator.emails.length > 0
                      ? operator.emails.join(', ')
                      : 'Sin emails'}
                  </p>
                  <p>
                    CC:{' '}
                    {Array.isArray(operator.ccEmails) && operator.ccEmails.length > 0
                      ? operator.ccEmails.join(', ')
                      : 'Sin copia'}
                  </p>
                </div>
                <Button asChild className="w-full justify-between">
                  <Link href={`/admin/field-operators/${operator.id}`}>
                    Abrir detalle
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nuevo operador de campo</DialogTitle>
          </DialogHeader>
          <FieldOperatorForm
            mode="create"
            onSaved={() => {
              setCreateOpen(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
