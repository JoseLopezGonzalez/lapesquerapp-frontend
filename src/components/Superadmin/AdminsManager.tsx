'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { fetchSuperadmin, SuperadminApiError } from '@/lib/superadminApi';
import { useSuperadminAuth } from '@/context/SuperadminAuthContext';
import { notify } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import { formatDate } from '@/utils/superadminDateUtils';
import EmptyState from './EmptyState';

interface AdminUser {
  id: number | string;
  name: string;
  email: string;
  created_at?: string;
  [key: string]: unknown;
}

export default function AdminsManager() {
  const { user: currentUser } = useSuperadminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Record<string, string>>({ defaultValues: { name: '', email: '', password: '' } });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSuperadmin('/admins');
      const json = await res.json();
      setAdmins(json.data || []);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreate = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      await fetchSuperadmin('/admins', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      notify.success({ title: 'Administrador creado' });
      setAddOpen(false);
      reset();
      fetchAdmins();
    } catch (err) {
      if (err instanceof SuperadminApiError && err.status === 422) {
        const errData = err.data as { errors?: Record<string, string[]> };
        if (errData.errors) {
          Object.entries(errData.errors).forEach(([field, msgs]) => {
            setError(field, { message: msgs[0] });
          });
        }
      } else {
        notify.error({ title: (err as Error).message || 'Error al crear el administrador' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchSuperadmin(`/admins/${deleteTarget.id}`, { method: 'DELETE' });
      notify.success({ title: 'Administrador eliminado' });
      setDeleteTarget(null);
      fetchAdmins();
    } catch (err) {
      notify.error({ title: (err as Error).message || 'Error al eliminar el administrador' });
    } finally {
      setDeleting(false);
    }
  };

  const isSelf = (admin: AdminUser) => admin.id === currentUser?.id || admin.email === currentUser?.email;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Administradores</h1>
          <Button
            size="sm"
            onClick={() => {
              reset();
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo administrador
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cuentas de superadmin</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Creado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        icon={Users}
                        title="Sin administradores"
                        description="Crea el primer superadmin con el botón superior."
                        compact
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {admin.name}
                          {isSelf(admin) && (
                            <Badge variant="secondary" className="text-[10px]">
                              Tú
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                        {formatDate(admin.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf(admin)}
                          onClick={() => setDeleteTarget(admin)}
                          className="text-destructive hover:text-destructive disabled:opacity-30"
                          title={isSelf(admin) ? 'No puedes eliminarte a ti mismo' : 'Eliminar'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddOpen(false);
            reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo administrador</DialogTitle>
            <DialogDescription>
              Crea una cuenta de superadmin. Se le enviará un correo de bienvenida.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="adm-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adm-name"
                {...register('name', { required: 'El nombre es obligatorio' })}
                placeholder="María García"
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adm-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adm-email"
                type="email"
                {...register('email', { required: 'El email es obligatorio' })}
                placeholder="admin@lapesquerapp.es"
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adm-password">
                Contraseña <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adm-password"
                type="password"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  reset();
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar administrador</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar a <strong>{deleteTarget?.name}</strong> (
              {deleteTarget?.email})? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
