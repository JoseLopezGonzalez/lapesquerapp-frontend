'use client';

import { EmptyState } from '@/components/Utilities/EmptyState';
import Loader from '@/components/Utilities/Loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ProspectContactsPanel({ contacts = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!contacts.length) {
    return (
      <EmptyState
        title="Sin contactos"
        description="Añade al menos un contacto para convertir o ofertar con contexto."
        className="h-full w-full border bg-muted/20 !min-h-[220px]"
      />
    );
  }

  const orderedContacts = [...contacts].sort((a, b) => {
    const primaryDiff = Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary));
    if (primaryDiff !== 0) return primaryDiff;
    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es');
  });

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-y-auto p-4">
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-24">Principal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.role || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.phone || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{contact.email || '—'}</TableCell>
                  <TableCell>
                    {contact.isPrimary ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Principal
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
