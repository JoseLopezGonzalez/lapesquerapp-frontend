'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EmailListInput from '@/components/ui/emailListInput';
import { notify } from '@/lib/notifications';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { useUsersList } from '@/hooks/useUsersList';
import { useFieldOperatorMutations } from '@/hooks/useFieldOperators';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function FieldOperatorForm({
  initialData = null,
  mode = 'create',
  onSaved,
  onDeleted,
}) {
  const router = useRouter();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { data: users, isLoading: loadingUsers } = useUsersList({
    filters: { role: 'repartidor_autoventa' },
    page: 1,
    perPage: 100,
  });
  const { createFieldOperator, updateFieldOperator, deleteFieldOperator, isSaving, isDeleting } =
    useFieldOperatorMutations();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      userId: '',
      emails: [],
      ccEmails: [],
    },
  });

  useEffect(() => {
    if (!initialData) return;
    reset({
      name: initialData.name ?? '',
      userId:
        initialData.userId != null
          ? String(initialData.userId)
          : initialData.user?.id != null
            ? String(initialData.user.id)
            : '',
      emails: Array.isArray(initialData.emails) ? initialData.emails : [],
      ccEmails: Array.isArray(initialData.ccEmails) ? initialData.ccEmails : [],
    });
  }, [initialData, reset]);

  const userOptions = useMemo(() => {
    const base = Array.isArray(users) ? users : [];
    const eligible = base.filter((user) => {
      if (String(user.role) !== 'repartidor_autoventa') return false;
      if (user.salesperson || user.salespersonId) return false;
      return true;
    });

    if (
      initialData?.user?.id &&
      !eligible.some((user) => String(user.id) === String(initialData.user.id))
    ) {
      eligible.unshift(initialData.user);
    }

    return eligible.map((user) => ({
      value: String(user.id),
      label: `${user.name} · ${user.email}`,
    }));
  }, [users, initialData]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name.trim(),
      userId: values.userId ? Number(values.userId) : undefined,
      emails: values.emails ?? [],
      ccEmails: values.ccEmails ?? [],
    };

    try {
      const action =
        mode === 'edit' && initialData?.id
          ? updateFieldOperator({ id: initialData.id, payload })
          : createFieldOperator(payload);

      const saved = await notify.promise(action, {
        loading: {
          title: 'Guardando operador',
          description: 'Persistiendo la configuración operativa.',
        },
        success: {
          title: `Operador ${mode === 'edit' ? 'actualizado' : 'creado'}`,
          description: 'Los datos se han guardado correctamente.',
        },
        error: (err) => ({
          title: 'No se pudo guardar el operador',
          description: err?.message ?? 'Inténtalo de nuevo.',
        }),
      });

      if (onSaved) {
        onSaved(saved?.id ?? initialData?.id ?? null);
        return;
      }

      if (saved?.id) router.push(`/admin/field-operators/${saved.id}`);
    } catch (err) {
      if (err?.status === 422 && err?.data?.errors) {
        setErrorsFrom422(setError, err.data.errors);
      }
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;

    await notify.promise(deleteFieldOperator(initialData.id), {
      loading: { title: 'Eliminando operador', description: 'Quitando el operador de campo.' },
      success: { title: 'Operador eliminado', description: 'El operador ya no está disponible.' },
      error: (err) => ({
        title: 'No se pudo eliminar',
        description: err?.message ?? 'Inténtalo de nuevo.',
      }),
    });

    if (onDeleted) {
      onDeleted();
      return;
    }

    router.push('/admin/field-operators');
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle>
          {mode === 'edit' ? 'Editar operador de campo' : 'Nuevo operador de campo'}
        </CardTitle>
        <CardDescription>
          Vincula el actor operativo a un usuario de reparto y configura los correos operativos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="field-operator-name">Nombre</Label>
            <Input
              id="field-operator-name"
              placeholder="Ej. Ruta Norte - Juan"
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Usuario vinculado</Label>
            <Controller
              name="userId"
              control={control}
              rules={{ required: 'Selecciona un usuario de reparto' }}
              render={({ field }) => (
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={loadingUsers ? 'Cargando usuarios...' : 'Selecciona un usuario'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {userOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.userId && <p className="text-destructive text-sm">{errors.userId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Emails</Label>
            <Controller
              name="emails"
              control={control}
              render={({ field }) => (
                <EmailListInput
                  value={Array.isArray(field.value) ? field.value : []}
                  onChange={field.onChange}
                  placeholder="Introduce un correo y pulsa Enter"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Emails en copia (CC)</Label>
            <Controller
              name="ccEmails"
              control={control}
              render={({ field }) => (
                <EmailListInput
                  value={Array.isArray(field.value) ? field.value : []}
                  onChange={field.onChange}
                  placeholder="Introduce un correo y pulsa Enter"
                />
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/field-operators')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button type="submit" disabled={isSaving} className="justify-between">
              Guardar
              <Save className="h-4 w-4" />
            </Button>
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar operador de campo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres eliminar este operador de campo? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
