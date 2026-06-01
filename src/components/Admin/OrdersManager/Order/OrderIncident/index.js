'use client';

import { notify } from '@/lib/notifications';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Ban, CheckCircle } from 'lucide-react';
import { useOrderContext } from '@/context/OrderContext';
import { formatDate } from '@/helpers/formats/dates/formatDates';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function OrderIncidentPanel() {
  const { order, openOrderIncident, resolveOrderIncident, deleteOrderIncident } = useOrderContext();
  const isMobile = useIsMobile();

  const [newDescription, setNewDescription] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newDescription) return notify.error({ title: 'La descripción es obligatoria' });
    setLoading(true);
    try {
      await notify.promise(openOrderIncident(newDescription), {
        loading: 'Creando incidencia...',
        success: 'Incidencia creada',
        error: (error) => {
          const desc =
            error?.userMessage ||
            error?.data?.userMessage ||
            error?.response?.data?.userMessage ||
            error?.message ||
            'No se pudo crear la incidencia. Intente de nuevo.';
          return { title: 'Error al crear incidencia', description: desc };
        },
      });
      setNewDescription('');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionType) return notify.error({ title: 'Selecciona un tipo de resolución' });
    setLoading(true);
    try {
      await notify.promise(resolveOrderIncident(resolutionType, resolutionNotes), {
        loading: 'Resolviendo incidencia...',
        success: 'Incidencia resuelta',
        error: (error) => {
          const desc =
            error?.userMessage ||
            error?.data?.userMessage ||
            error?.response?.data?.userMessage ||
            error?.message ||
            'No se pudo resolver la incidencia. Intente de nuevo.';
          return { title: 'Error al resolver incidencia', description: desc };
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await notify.promise(deleteOrderIncident(), {
        loading: 'Eliminando incidencia...',
        success: 'Incidencia eliminada',
        error: (error) => {
          const desc =
            error?.userMessage ||
            error?.data?.userMessage ||
            error?.response?.data?.userMessage ||
            error?.message ||
            'No se pudo eliminar la incidencia. Intente de nuevo.';
          return { title: 'Error al eliminar incidencia', description: desc };
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const incident = order.incident;
  const isResolved = incident?.status === 'resolved';
  const isOpen = incident?.status === 'open';

  const content = (
    <div className="w-full">
      {incident ? (
        <div className="space-y-6">
          {/* Badge de estado */}
          <div className="flex justify-center">
            {isOpen ? (
              <Badge
                variant="outline"
                className="flex items-center gap-2 border-amber-500/50 bg-amber-50 px-4 py-2 text-amber-700 hover:bg-amber-50"
              >
                <AlertCircle />
                <span className="font-medium">Incidencia Abierta</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="flex items-center gap-2 border-emerald-500/50 bg-emerald-50 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCircle />
                <span className="font-medium">Incidencia Resuelta</span>
              </Badge>
            )}
          </div>

          {/* Información de la incidencia */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Fecha de creación</Label>
              <p className="whitespace-pre-line">{formatDate(incident.createdAt)}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <p className="whitespace-pre-line">{incident.description}</p>
            </div>
          </div>

          {isResolved && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Fecha de resolución</Label>
                  <p className="whitespace-pre-line">{formatDate(incident.resolvedAt)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de resolución</Label>
                  <p>
                    {incident.resolutionType === 'returned' && 'Devuelto'}
                    {incident.resolutionType === 'partially_returned' && 'Parcialmente devuelto'}
                    {incident.resolutionType === 'compensated' && 'Compensado'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Notas de resolución</Label>
                  <p className="whitespace-pre-line">{incident.resolutionNotes}</p>
                </div>
              </div>
            </>
          )}

          {!isResolved && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resolution-type">Tipo de resolución</Label>
                  <Select value={resolutionType} onValueChange={setResolutionType}>
                    <SelectTrigger id="resolution-type">
                      <SelectValue placeholder="Selecciona el tipo de resolución" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="returned">Devuelto</SelectItem>
                      <SelectItem value="partially_returned">Parcialmente devuelto</SelectItem>
                      <SelectItem value="compensated">Compensado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution-notes">Notas de resolución</Label>
                  <Textarea
                    id="resolution-notes"
                    placeholder="Añade notas sobre la resolución de la incidencia"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incident-description">Descripción de la incidencia</Label>
            <Textarea
              id="incident-description"
              placeholder="Describe la incidencia reportada por el cliente"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={isMobile ? 'flex min-h-0 flex-1 flex-col' : 'flex min-h-0 flex-1 flex-col pb-2'}
    >
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-4 py-6">{content}</div>
          </ScrollArea>

          {/* Footer con botones */}
          <div
            className="bg-background fixed right-0 bottom-0 left-0 z-50 flex items-center gap-2 border-t p-3"
            style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
          >
            {incident ? (
              <>
                {isOpen && (
                  <>
                    <Button
                      onClick={handleDelete}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] flex-1"
                    >
                      <Ban />
                      Cancelar Incidencia
                    </Button>
                    <Button
                      onClick={handleResolve}
                      disabled={loading || !resolutionType}
                      size="sm"
                      className="min-h-[44px] flex-1"
                    >
                      <CheckCircle />
                      Incidencia Resuelta
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={loading || !newDescription}
                size="sm"
                className="min-h-[44px] flex-1"
              >
                <AlertCircle />
                Crear Incidencia
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Incidencia</CardTitle>
                <CardDescription>Crea o resuelve la incidencia asociada al pedido</CardDescription>
              </div>
              <div className="flex gap-2">
                {incident && (
                  <Button onClick={handleDelete} disabled={loading} variant="destructive">
                    <Ban />
                    Cancelar Incidencia
                  </Button>
                )}
              </div>
              {incident && (
                <div className="sm:hidden">
                  {isOpen ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 border-amber-500/50 bg-amber-50 px-3 py-1.5 text-amber-700 hover:bg-amber-50"
                    >
                      <AlertCircle />
                      <span className="font-medium">Incidencia Abierta</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-2 border-emerald-500/50 bg-emerald-50 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle />
                      <span className="font-medium">Incidencia Resuelta</span>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">{content}</CardContent>
          <CardFooter className="justify-end">
            {incident ? (
              isOpen && (
                <Button onClick={handleResolve} disabled={loading || !resolutionType}>
                  Marcar como resuelta
                </Button>
              )
            ) : (
              <Button onClick={handleCreate} disabled={loading || !newDescription}>
                Crear incidencia
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
