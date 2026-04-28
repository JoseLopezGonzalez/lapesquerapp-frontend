'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, Search, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { closeProduction, getProductionClosureCheck, reopenProduction } from '@/services/productionService'

const MANAGER_ROLES = new Set(['administrador', 'direccion'])

const BLOCKING_GUIDANCE = {
  already_closed: 'El lote ya está cerrado.',
  not_open: 'Abre la producción primero.',
  no_processes: 'Añade procesos a la producción.',
  process_not_started: 'Completa la fecha de inicio del proceso.',
  process_not_finished: 'Completa la fecha de fin del proceso.',
  final_node_no_outputs: 'Registra outputs en el proceso final.',
  pending_order: 'Finaliza o resuelve el pedido indicado.',
  pallet_not_shipped: 'Marca el palet como expedido.',
  stock_remaining: 'Asigna el palet a un pedido o reprocesa el stock.',
  orphan_box: 'Ubica la caja en un palet o en reproceso.',
  reconciliation_not_ok: 'Revisa la conciliación del lote.',
}

const BLOCKING_LABELS = {
  already_closed: 'Lote ya cerrado',
  not_open: 'Producción no abierta',
  no_processes: 'Sin procesos',
  process_not_started: 'Proceso sin inicio',
  process_not_finished: 'Proceso sin finalizar',
  final_node_no_outputs: 'Proceso final sin salidas',
  pending_order: 'Pedido pendiente',
  pallet_not_shipped: 'Palet sin expedir',
  stock_remaining: 'Stock pendiente',
  orphan_box: 'Caja sin ubicar',
  reconciliation_not_ok: 'Conciliación pendiente',
}

function getBlockingLabel(code) {
  if (!code) return 'Bloqueo'
  return BLOCKING_LABELS[code] || code.replace(/_/g, ' ')
}

function getRoles(user) {
  const rawRole = user?.role
  return Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : []
}

function canManageClosure(user) {
  return getRoles(user).some((role) => MANAGER_ROLES.has(role))
}

function ClosureReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  onOpenChange,
  onConfirm,
}) {
  const [reason, setReason] = useState('')
  const trimmedReason = reason.trim()

  useEffect(() => {
    if (!open) {
      setReason('')
    }
  }, [open])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!trimmedReason || trimmedReason.length > 500) return
    onConfirm(trimmedReason)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="production-closure-reason">Motivo</Label>
            <Textarea
              id="production-closure-reason"
              rows={4}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe el motivo"
              disabled={pending}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Obligatorio</span>
              <span>{reason.length}/500</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!trimmedReason || trimmedReason.length > 500 || pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductionClosurePanel({
  productionId,
  isOpen,
  isClosed,
  onRefresh,
}) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken
  const canManage = canManageClosure(session?.user)
  const [closureCheck, setClosureCheck] = useState(null)
  const [checkError, setCheckError] = useState(null)
  const [checkDialogOpen, setCheckDialogOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)

  useEffect(() => {
    setClosureCheck(null)
    setCheckError(null)
    setCheckDialogOpen(false)
  }, [productionId, isClosed])

  const checkMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No se pudo autenticar la verificación')
      return getProductionClosureCheck(productionId, token)
    },
    onSuccess: (data) => {
      setClosureCheck(data)
      setCheckError(null)
      setCheckDialogOpen(true)
    },
    onError: (error) => {
      setCheckError(error?.message || 'No se pudo verificar el cierre')
      setClosureCheck(null)
      setCheckDialogOpen(true)
      toast.error(error?.message || 'No se pudo verificar el cierre')
    },
  })

  const closeMutation = useMutation({
    mutationFn: async (reason) => {
      if (!token) throw new Error('No se pudo autenticar el cierre')
      return closeProduction(productionId, { reason }, token)
    },
    onSuccess: async (response) => {
      toast.success(response?.message || 'Producción cerrada definitivamente')
      setCloseDialogOpen(false)
      setClosureCheck(null)
      await onRefresh?.()
    },
    onError: (error) => {
      toast.error(error?.message || 'No se pudo cerrar la producción')
    },
  })

  const reopenMutation = useMutation({
    mutationFn: async (reason) => {
      if (!token) throw new Error('No se pudo autenticar la reapertura')
      return reopenProduction(productionId, { reason }, token)
    },
    onSuccess: async (response) => {
      toast.success(response?.message || 'Producción reabierta correctamente')
      setReopenDialogOpen(false)
      setClosureCheck(null)
      await onRefresh?.()
    },
    onError: (error) => {
      toast.error(error?.message || 'No se pudo reabrir la producción')
    },
  })

  const canShowCloseButton = isOpen && !isClosed && canManage
  const canCloseAfterCheck = closureCheck?.canClose === true && canShowCloseButton

  return (
    <>
      {!isClosed && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => checkMutation.mutate()}
          disabled={!token || checkMutation.isPending}
        >
          {checkMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Verificar cierre
        </Button>
      )}

      <Dialog open={checkDialogOpen} onOpenChange={setCheckDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Verificación de cierre</DialogTitle>
            <DialogDescription>
              Resultado de la evaluación del lote antes del cierre definitivo.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto space-y-3 pr-1">
            {checkError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No se pudo verificar</AlertTitle>
                <AlertDescription>{checkError}</AlertDescription>
              </Alert>
            )}

            {closureCheck && (
              <>
                <Alert variant={closureCheck.canClose ? 'default' : 'destructive'}>
                  {closureCheck.canClose ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>
                    {closureCheck.canClose ? 'La producción se puede cerrar' : 'Hay bloqueos pendientes'}
                  </AlertTitle>
                  <AlertDescription>
                    {closureCheck.canClose
                      ? 'Revisa el resumen y confirma el cierre definitivo con un motivo.'
                      : 'Resuelve los elementos indicados antes de intentar cerrar el lote.'}
                  </AlertDescription>
                </Alert>

                {!closureCheck.canClose && Array.isArray(closureCheck.blockingReasons) && closureCheck.blockingReasons.length > 0 && (
                  <div className="rounded-md border">
                    <div className="border-b px-3 py-2 text-sm font-medium">Bloqueos</div>
                    <div className="divide-y">
                      {closureCheck.blockingReasons.map((reason, index) => (
                        <div key={`${reason.code}-${index}`} className="space-y-1 px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{getBlockingLabel(reason.code)}</Badge>
                            {reason.recordId ? <Badge variant="secondary">Proceso #{reason.recordId}</Badge> : null}
                            {reason.orderId ? <Badge variant="secondary">Pedido #{reason.orderId}</Badge> : null}
                            {reason.palletId ? <Badge variant="secondary">Palet #{reason.palletId}</Badge> : null}
                            {reason.boxId ? <Badge variant="secondary">Caja #{reason.boxId}</Badge> : null}
                            {reason.reconciliationStatus ? (
                              <Badge variant="secondary">{reason.reconciliationStatus}</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm">{reason.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {BLOCKING_GUIDANCE[reason.code] || 'Revisa este bloqueo antes de cerrar.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCheckDialogOpen(false)}>
              Cerrar
            </Button>
            {canCloseAfterCheck && (
              <Button
                type="button"
                onClick={() => {
                  setCheckDialogOpen(false)
                  setCloseDialogOpen(true)
                }}
              >
                <LockKeyhole className="mr-2 h-4 w-4" />
                Cerrar definitivamente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClosureReasonDialog
        open={closeDialogOpen}
        title="Cerrar producción definitivamente"
        description="El lote quedará bloqueado y no se podrán mutar sus palets, cajas, procesos, outputs, inputs, costes o pedidos asociados."
        confirmLabel="Cerrar definitivamente"
        pending={closeMutation.isPending}
        onOpenChange={setCloseDialogOpen}
        onConfirm={(reason) => closeMutation.mutate(reason)}
      />

      <ClosureReasonDialog
        open={reopenDialogOpen}
        title="Reabrir producción"
        description="La producción dejará de estar bloqueada para poder corregir datos asociados al lote."
        confirmLabel="Reabrir"
        pending={reopenMutation.isPending}
        onOpenChange={setReopenDialogOpen}
        onConfirm={(reason) => reopenMutation.mutate(reason)}
      />
    </>
  )
}
