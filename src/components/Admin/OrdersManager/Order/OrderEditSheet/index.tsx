'use client';
import { useEffect, useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOrderFormConfig, type FormField } from '@/hooks/useOrderFormConfig';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { cn } from '@/lib/utils';
import { Edit, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { FieldSet, FieldLegend, FieldDescription, FieldGroup } from '@/components/ui/field';
import { useOrderContext } from '@/context/OrderContext';
import EmailListInput from '@/components/ui/emailListInput';
import { DatePicker } from '@/components/ui/datePicker';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';
import { zodResolver } from '@hookform/resolvers/zod';
import { notify } from '@/lib/notifications';
import { orderEditSchema, type OrderEditFormData } from './schemas/orderEditSchema';
import { buildOrderEditPayload } from './utils/buildOrderEditPayload';

function getErrorDescription(error: unknown, fallback: string): string {
  const e = error as Record<string, unknown> | undefined;
  const data = e?.data as Record<string, unknown> | undefined;
  const response = e?.response as { data?: Record<string, unknown> } | undefined;
  return (
    (e?.userMessage as string) ||
    (data?.userMessage as string) ||
    (response?.data?.userMessage as string) ||
    (e?.message as string) ||
    (response?.data?.message as string) ||
    fallback
  );
}

interface OrderEditSheetProps {
  /** Estado controlado (opcional; si se omite, gestiona su propio estado interno) */
  open?: boolean;
  /** Callback controlado (opcional) */
  onOpenChange?: (open: boolean) => void;
}

const OrderEditSheet = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: OrderEditSheetProps) => {
  const { order, updateOrderData } = useOrderContext();
  const { formGroups, defaultValues, loading } = useOrderFormConfig({
    orderData: order,
  });
  const { isMobile, mounted } = useIsMobileSafe();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && typeof controlledOnOpenChange === 'function';
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange as (open: boolean) => void)
    : setInternalOpen;
  const [saving, setSaving] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isDirty, dirtyFields },
  } = useForm({
    resolver: zodResolver(orderEditSchema),
    defaultValues: defaultValues as unknown as OrderEditFormData,
    mode: 'onChange',
  });

  // Resetear el formulario a los valores del pedido cuando se abre el Sheet
  useEffect(() => {
    if (open && defaultValues && !loading) {
      reset(defaultValues as unknown as OrderEditFormData);
    }
  }, [open, defaultValues, loading, reset]);

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setSaving(true);
      const payload = buildOrderEditPayload(data, dirtyFields);

      if (Object.keys(payload).length === 0) {
        notify.info({
          title: 'Sin cambios',
          description: 'No hay cambios para guardar en este pedido.',
        });
        setSaving(false);
        return;
      }

      try {
        await notify.promise(updateOrderData(payload), {
          loading: 'Actualizando pedido...',
          success: {
            title: 'Pedido actualizado',
            description: 'Los cambios del pedido se han guardado correctamente.',
          },
          error: (error: unknown) => ({
            title: 'Error al actualizar pedido',
            description: getErrorDescription(
              error,
              'No se pudieron guardar los cambios. Intente de nuevo.'
            ),
          }),
        });
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSaving(false);
        setOpen(false);
        reset(defaultValues as unknown as OrderEditFormData);
      } catch (error) {
        const e = error as Record<string, unknown> | undefined;
        if (e?.status === 422 && (e?.data as Record<string, unknown> | undefined)?.errors) {
          setErrorsFrom422(setError, (e.data as { errors: Record<string, string[]> }).errors);
        }
        setSaving(false);
      }
    },
    [dirtyFields, updateOrderData, setOpen, reset, defaultValues, setError]
  );

  const handleFormSubmit = handleSubmit(
    (data) => {
      onSubmit(data as Record<string, unknown>);
    },
    (formErrors) => {
      const errorCount = Object.keys(formErrors).length;
      notify.error({
        title: 'Errores en el formulario',
        description:
          errorCount > 0
            ? `Por favor, corrige los ${errorCount} error${errorCount > 1 ? 's' : ''} indicados.`
            : 'Por favor, revisa y corrige los campos marcados.',
      });
    }
  );

  const handleConfirmClose = useCallback(() => {
    reset(defaultValues as unknown as OrderEditFormData);
    setOpen(false);
    setShowCancelDialog(false);
  }, [reset, defaultValues, setOpen]);

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true);
      return;
    }
    if (isDirty) {
      setShowCancelDialog(true);
      return;
    }
    handleConfirmClose();
  };

  const handleCancelDialog = () => {
    setShowCancelDialog(false);
  };

  // Memoizar renderField para evitar re-renders innecesarios
  const renderField = useCallback(
    (field: FormField, hasError: boolean) => {
      const commonProps = {
        id: field.name,
        placeholder: field.props?.placeholder || '',
        ...register(field.name as never),
        className: isMobile ? 'h-12 text-base' : '',
        'aria-invalid': hasError,
      };

      switch (field.component) {
        case 'DatePicker':
          return (
            <Controller
              name={field.name as never}
              control={control}
              render={({ field: { onChange, value } }) => {
                return (
                  <DatePicker
                    id={field.name}
                    date={value as Date | null}
                    onChange={(newValue: Date | null) => {
                      onChange(newValue);
                    }}
                    formatStyle="short"
                    {...field.props}
                  />
                );
              }}
            />
          );
        case 'Select':
          return (
            <Controller
              name={field.name as never}
              control={control}
              render={({ field: { onChange, value, onBlur } }) => {
                return (
                  <Select value={value as string} onValueChange={onChange} onBlur={onBlur}>
                    <SelectTrigger className="w-full" loading={loading} aria-invalid={hasError}>
                      <SelectValue
                        placeholder={field.props?.placeholder}
                        loading={loading}
                        value={value}
                        options={field.options}
                      />
                    </SelectTrigger>
                    <SelectContent loading={loading}>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
          );
        case 'Combobox':
          return (
            <Controller
              name={field.name as never}
              control={control}
              render={({ field: { onChange, value, onBlur } }) => {
                return (
                  <Combobox
                    options={field.options ?? []}
                    placeholder={field.props?.placeholder}
                    searchPlaceholder={field.props?.searchPlaceholder}
                    notFoundMessage={field.props?.notFoundMessage}
                    value={value as string}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={cn(field.props?.className, hasError && 'border-destructive')}
                    loading={loading}
                  />
                );
              }}
            />
          );
        case 'Textarea':
          return (
            <Textarea
              {...commonProps}
              className={field.props?.className}
              rows={field.props?.rows}
            />
          );
        case 'emailList':
          return (
            <Controller
              name={field.name as never}
              control={control}
              defaultValue={[] as never}
              render={({ field: { value, onChange } }) => (
                <EmailListInput
                  value={Array.isArray(value) ? value : []}
                  onChange={onChange}
                  placeholder={field.props?.placeholder}
                />
              )}
            />
          );

        case 'Input':
        default:
          return <Input {...commonProps} />;
      }
    },
    [register, control, loading, isMobile]
  );

  if (!mounted) return null;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button
            variant={isMobile ? 'default' : 'outline'}
            className={isMobile ? 'min-h-[44px] flex-1' : ''}
          >
            <Edit />
            Editar
          </Button>
        </SheetTrigger>
      )}
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'flex h-[90vh] max-h-[90vh] flex-col overflow-hidden rounded-t-3xl pb-[env(safe-area-inset-bottom)]'
            : 'flex w-[400px] flex-col overflow-hidden rounded-lg sm:w-[900px] sm:min-w-[600px]'
        }
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>
            Editar Pedido #{order?.id || 'N/A'}
            {(order?.orderType ?? order?.order_type) === 'autoventa' ? ' · Autoventa' : ''}
          </SheetTitle>
          <SheetDescription>
            Modifica los datos del pedido y guarda los cambios.
            {(order?.orderType ?? order?.order_type) === 'autoventa' &&
              ' Pedido tipo autoventa; algunos campos pueden estar vacíos.'}
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleFormSubmit}
          className="flex min-h-0 w-full flex-1 flex-col"
          noValidate
        >
          {loading ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <OrderEditFormSkeleton isMobile={isMobile} />
            </div>
          ) : isMobile ? (
            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid gap-6 py-2 pb-4">
                {formGroups.map((group) => (
                  <FieldSet key={group.group} className="w-full">
                    <FieldLegend>{group.group}</FieldLegend>
                    {group.description && <FieldDescription>{group.description}</FieldDescription>}
                    <FieldGroup
                      className={`grid w-full py-4 ${isMobile ? 'grid-cols-1 gap-4' : group.grid || 'grid-cols-1 gap-4'}`}
                    >
                      {group.fields.map((field) => {
                        const hasError = errors[field.name as keyof typeof errors];
                        return (
                          <div
                            key={field.name}
                            className={`grid w-full min-w-0 gap-2 ${isMobile ? '' : field.colSpan}`}
                          >
                            <Label htmlFor={field.name} className={isMobile ? 'text-sm' : ''}>
                              {field.label}
                            </Label>
                            <div
                              className={cn(
                                field.component === 'DatePicker' &&
                                  hasError &&
                                  'border-destructive rounded-md border'
                              )}
                            >
                              {renderField(field, !!hasError)}
                            </div>
                            {hasError && (
                              <p className="pt-1 text-xs text-red-400">
                                * {hasError.message as string}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </FieldGroup>
                  </FieldSet>
                ))}
              </div>
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid gap-6 px-5 py-4">
                {formGroups.map((group) => (
                  <FieldSet key={group.group} className="w-full">
                    <FieldLegend>{group.group}</FieldLegend>
                    {group.description && <FieldDescription>{group.description}</FieldDescription>}
                    <FieldGroup className={`grid w-full py-4 ${group.grid || 'grid-cols-1 gap-4'}`}>
                      {group.fields.map((field) => {
                        const hasError = errors[field.name as keyof typeof errors];
                        return (
                          <div
                            key={field.name}
                            className={`grid w-full min-w-0 gap-2 ${field.colSpan || ''}`}
                          >
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <div
                              className={cn(
                                field.component === 'DatePicker' &&
                                  hasError &&
                                  'border-destructive rounded-md border'
                              )}
                            >
                              {renderField(field, !!hasError)}
                            </div>
                            {hasError && (
                              <p className="pt-1 text-xs text-red-400">
                                * {hasError.message as string}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </FieldGroup>
                  </FieldSet>
                ))}
              </div>
            </ScrollArea>
          )}
          <SheetFooter
            className={
              isMobile
                ? 'flex-shrink-0 flex-col border-t'
                : 'flex-shrink-0 flex-row justify-end border-t'
            }
          >
            <Button
              type="submit"
              disabled={saving || !isDirty || loading}
              className={isMobile ? 'min-h-[44px] w-full' : ''}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save />
                  Guardar
                </>
              )}
            </Button>
          </SheetFooter>
        </form>

        {/* Diálogo de confirmación al cancelar con cambios */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Descartar cambios
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar el formulario? Se
                perderán todos los cambios no guardados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDialog}>Continuar editando</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleConfirmClose}>
                Descartar cambios
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};

export default OrderEditSheet;

function OrderEditFormSkeleton({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <div className="grid gap-6">
      {[
        { cols: 1, rows: 1 },
        { cols: 2, rows: 2 },
        { cols: 2, rows: 6 },
        { cols: 2, rows: 4 },
        { cols: 2, rows: 4 },
        { cols: 1, rows: 2 },
        { cols: 1, rows: 2 },
      ].map((group, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-36 rounded" />
          <div
            className={`grid gap-4 pt-2 ${isMobile ? 'grid-cols-1' : group.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
          >
            {Array.from({ length: group.rows }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
