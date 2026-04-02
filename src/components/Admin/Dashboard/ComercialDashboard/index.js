"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import * as React from "react";
import { Calendar, Check, Clock3, ExternalLink, MoreVertical, XCircle } from "lucide-react";
import { OrderRankingChart } from "../OrderRanking";
import { TotalQuantitySoldCard } from "../TotalQuantitySoldCard";
import { TotalAmountSoldCard } from "../TotalAmountSoldCard";
import { TransportRadarChart } from "../TransportRadarChart";
import { ScrollArea } from "@/components/ui/scroll-area";
import Masonry from "react-masonry-css";
import CommercialSalesSummaryCard from "@/components/Comercial/CRM/CommercialSalesSummaryCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/datePicker";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCrmDashboard } from "@/hooks/useCrmDashboard";
import { useAgendaMutations } from "@/hooks/useAgenda";
import { cn } from "@/lib/utils";
import { formatDateValue, isOverdueDate } from "@/components/Comercial/CRM/utils";
import { notify } from "@/lib/notifications";
import QuickInteractionModal from "@/components/Comercial/CRM/QuickInteractionModal";
import { format } from "date-fns";

const breakpointColumnsObj = {
    default: 3,
    1920: 3,
    1536: 3,
    1280: 2,
    768: 1,
    640: 1,
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Buenos días,";
    if (hour >= 12 && hour < 20) return "Buenas tardes,";
    return "Buenas noches,";
};

function EmptyWidget({ icon: Icon, title, description }) {
    return (
        <Empty className="border bg-muted/20 min-h-[180px]">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Icon className="size-4" />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

function LoadingWidget() {
    return (
        <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </CardContent>
        </Card>
    );
}

function ReminderRow({ item, onReschedule, onCancel, onComplete }) {
    const targetHref = item.prospectId
        ? `/comercial/prospectos/${item.prospectId}`
        : item.customerId
          ? `/comercial/clientes/${item.customerId}`
          : "/comercial";

    const overdue = isOverdueDate(item.nextActionAt) || item.daysOverdue > 0;
    const targetLabel = item.type === "customer" ? "Cliente" : "Prospecto";

    return (
        <Card
            size="sm"
            className={cn(
                "transition-colors",
                overdue && "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30"
            )}
        >
            <CardContent className="py-3">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                                {formatDateValue(item.nextActionAt)}
                            </span>
                            {overdue && (
                                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                                    Vencida
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                Pendiente
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Acciones">
                                        <MoreVertical />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-48">
                                    <DropdownMenuItem onSelect={() => onReschedule(item)}>
                                        <Calendar />
                                        Reprogramar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onComplete(item)}>
                                        <Check />
                                        Marcar hecha
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" onSelect={() => onCancel(item)}>
                                        <XCircle />
                                        Cancelar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={targetHref} className="flex items-center gap-1.5">
                                            <ExternalLink />
                                            Abrir {targetLabel.toLowerCase()}
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div>
                        <Link
                            href={targetHref}
                            className="font-medium text-base truncate block hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                        >
                            {item.label}
                        </Link>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium whitespace-pre-wrap wrap-break-word">{item.nextActionNote || "Sin nota"}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RescheduleAgendaDialog({ open, onOpenChange, item, onConfirm, loading }) {
    const [nextActionAt, setNextActionAt] = React.useState(null);

    React.useEffect(() => {
        if (!open) return;
        setNextActionAt(item?.nextActionAt ? new Date(item.nextActionAt) : null);
    }, [open, item]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md">
                <DialogHeader>
                    <DialogTitle>Reprogramar acción</DialogTitle>
                    <DialogDescription>
                        Cambia solo la fecha. Si no se envía nota, la nueva acción pendiente conservará automáticamente el detalle actual.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label>Fecha nueva</Label>
                        <DatePicker date={nextActionAt} onChange={setNextActionAt} formatStyle="short" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() =>
                            onConfirm({
                                nextActionAt: nextActionAt ? format(nextActionAt, "yyyy-MM-dd") : null,
                            })
                        }
                        disabled={loading || !nextActionAt}
                    >
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ComercialDashboard() {
    const [greeting] = useState(() => getGreeting());
    const { data: session } = useSession();
    const userName = session?.user?.name || "Usuario";
    const { data: crmData, isLoading: crmLoading, refetch: refetchCrm } = useCrmDashboard();
    const { rescheduleAgendaAction, cancelAgendaAction } = useAgendaMutations();
    const [interactionModal, setInteractionModal] = React.useState({
        open: false,
        prospectId: null,
        customerId: null,
        agendaActionId: null,
        nextActionAt: null,
        nextActionNote: null,
        mode: "create",
    });
    const [rescheduleDialog, setRescheduleDialog] = React.useState({
        open: false,
        item: null,
    });
    const [cancelDialog, setCancelDialog] = React.useState({
        open: false,
        item: null,
    });

    const handleReschedule = async (payload) => {
        if (!rescheduleDialog.item?.agendaActionId || !payload.nextActionAt) return;
        try {
            await notify.promise(
                rescheduleAgendaAction.mutateAsync({
                    id: rescheduleDialog.item.agendaActionId,
                    payload: {
                        nextActionAt: payload.nextActionAt,
                    },
                }),
                {
                    loading: "Reprogramando acción...",
                    success: "Acción reprogramada",
                    error: (error) => error?.message || "No se pudo reprogramar la acción",
                }
            );
            setRescheduleDialog({ open: false, item: null });
            refetchCrm();
        } catch {}
    };

    const handleCancel = async () => {
        if (!cancelDialog.item?.agendaActionId) return;
        try {
            await notify.promise(cancelAgendaAction.mutateAsync(cancelDialog.item.agendaActionId), {
                loading: "Cancelando acción...",
                success: "Acción cancelada",
                error: (error) => error?.message || "No se pudo cancelar la acción",
            });
            setCancelDialog({ open: false, item: null });
            refetchCrm();
        } catch {}
    };

    const handleComplete = (item) => {
        setInteractionModal({
            open: true,
            prospectId: item.prospectId ?? null,
            customerId: item.customerId ?? null,
            agendaActionId: item.agendaActionId ?? null,
            nextActionAt: item.nextActionAt ?? null,
            nextActionNote: item.nextActionNote ?? null,
            mode: "complete",
        });
    };

    const masonryItems = React.useMemo(() => {
        const items = [
            {
                key: "order-ranking",
                node: (
                    <div>
                        <OrderRankingChart />
                    </div>
                ),
            },
            {
                key: "transport-radar",
                node: (
                    <div>
                        <TransportRadarChart />
                    </div>
                ),
            },
        ];

        if (crmLoading) {
            items.push(
                { key: "crm-loading-1", node: <div><LoadingWidget /></div> },
                { key: "crm-loading-2", node: <div><LoadingWidget /></div> },
                { key: "crm-loading-3", node: <div><LoadingWidget /></div> }
            );
            return items.map((item) => React.cloneElement(item.node, { key: item.key }));
        }

        const reminders = [...(crmData?.overdue_actions ?? []), ...(crmData?.reminders_today ?? [])];

        items.push(
            {
                key: "crm-agenda",
                node: (
                    <div>
                        <Card className="w-full max-w-full overflow-hidden">
                            <CardHeader>
                                <CardTitle>Agenda del día</CardTitle>
                                <CardDescription>Acciones pendientes y vencidas del CRM comercial.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reminders.length === 0 ? (
                                    <EmptyWidget
                                        icon={Clock3}
                                        title="Todo al día"
                                        description="No tienes acciones pendientes para hoy."
                                    />
                                ) : (
                                    <div className="max-w-full **:data-[slot=table-container]:max-h-[360px] **:data-[slot=table-container]:overflow-y-auto">
                                        <Table className="table-fixed">
                                            <TableBody>
                                                {reminders.map((item) => {
                                                    const targetHref = item.prospectId
                                                        ? `/comercial/prospectos/${item.prospectId}`
                                                        : item.customerId
                                                          ? `/comercial/clientes/${item.customerId}`
                                                          : "/comercial";
                                                    const overdue = isOverdueDate(item.nextActionAt) || item.daysOverdue > 0;

                                                    return (
                                                        <TableRow
                                                            key={String(item.agendaActionId)}
                                                            className={overdue ? "bg-red-50/40 dark:bg-red-950/20" : ""}
                                                        >
                                                            <TableCell className="w-[72%] whitespace-normal">
                                                                <Link href={targetHref} className="block font-medium hover:underline">
                                                                    {item.label}
                                                                </Link>
                                                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                                                    <p className="text-xs text-muted-foreground">{formatDateValue(item.nextActionAt)}</p>
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                                                                            item.type === "interaction"
                                                                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                                                                : "bg-slate-500/10 text-slate-700 dark:text-slate-300"
                                                                        }`}
                                                                    >
                                                                        {overdue ? "Vencida" : "Pendiente"}
                                                                    </span>
                                                                </div>
                                                                <span className="mt-1 block text-xs text-muted-foreground wrap-break-word">
                                                                    {item.nextActionNote || "Sin nota"}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" aria-label="Acciones">
                                                                            <MoreVertical className="size-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="min-w-48">
                                                                        <DropdownMenuItem
                                                                            onSelect={() => setRescheduleDialog({ open: true, item })}
                                                                        >
                                                                            Reprogramar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onSelect={() => handleComplete(item)}>
                                                                            Cerrar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            variant="destructive"
                                                                            onSelect={() => setCancelDialog({ open: true, item })}
                                                                        >
                                                                            Cancelar
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ),
            },
            {
                key: "crm-inactive-customers",
                node: (
                    <div>
                        <Card className="w-full max-w-full overflow-hidden">
                            <CardHeader>
                                <CardTitle>Clientes inactivos</CardTitle>
                                <CardDescription>Clientes sin pedido en más de 30 días.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(crmData?.inactive_customers ?? []).length === 0 ? (
                                    <EmptyWidget
                                        icon={Clock3}
                                        title="Sin alertas de clientes"
                                        description="Todos tus clientes tienen actividad reciente."
                                    />
                                ) : (
                                    <div className="max-w-full **:data-[slot=table-container]:max-h-[360px] **:data-[slot=table-container]:overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="sticky top-0 z-10 bg-card">Cliente</TableHead>
                                                    <TableHead className="sticky top-0 z-10 bg-card">Estado</TableHead>
                                                    <TableHead className="sticky top-0 z-10 bg-card text-right">Inactividad</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {crmData.inactive_customers.map((customer) => (
                                                    <TableRow
                                                        key={customer.id}
                                                        className={customer.lastOrderAt == null ? "bg-amber-50/40 dark:bg-amber-950/20" : ""}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <Link href={`/comercial/clientes/${customer.id}`} className="hover:underline">
                                                                {customer.name}
                                                            </Link>
                                                            <p className="text-xs font-normal text-muted-foreground">
                                                                {customer.country?.name ?? "Sin país"}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                                    customer.lastOrderAt == null
                                                                        ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                                                                        : "bg-red-500/15 text-red-700 dark:text-red-300"
                                                                }`}
                                                            >
                                                                {customer.lastOrderAt == null ? "Nunca pidió" : "Con historial"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {customer.lastOrderAt == null ? "—" : `${customer.daysSinceLastOrder ?? "—"} días`}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ),
            },
            {
                key: "crm-prospects-without-activity",
                node: (
                    <div>
                        <Card className="w-full max-w-full overflow-hidden">
                            <CardHeader>
                                <CardTitle>Prospectos sin actividad</CardTitle>
                                <CardDescription>Prospectos sin interacción en más de 7 días.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(crmData?.prospects_without_activity ?? []).length === 0 ? (
                                    <EmptyWidget
                                        icon={Clock3}
                                        title="Sin prospectos parados"
                                        description="No hay prospectos pendientes de seguimiento."
                                    />
                                ) : (
                                    <div className="max-w-full **:data-[slot=table-container]:max-h-[360px] **:data-[slot=table-container]:overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="sticky top-0 z-10 bg-card">Prospecto</TableHead>
                                                    <TableHead className="sticky top-0 z-10 bg-card">Estado</TableHead>
                                                    <TableHead className="sticky top-0 z-10 bg-card text-right">Sin actividad</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {crmData.prospects_without_activity.map((prospect) => (
                                                    <TableRow
                                                        key={prospect.id}
                                                        className={prospect.lastContactAt == null ? "bg-blue-50/40 dark:bg-blue-950/20" : ""}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <Link href={`/comercial/prospectos/${prospect.id}`} className="hover:underline">
                                                                {prospect.companyName}
                                                            </Link>
                                                            <p className="text-xs font-normal text-muted-foreground">
                                                                {prospect.country?.name ?? "Sin país"}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                                    prospect.lastContactAt == null
                                                                        ? "bg-blue-500/20 text-blue-800 dark:text-blue-300"
                                                                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                                                }`}
                                                            >
                                                                {prospect.lastContactAt == null ? "Sin contacto" : "Con historial"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {prospect.lastContactAt == null ? "—" : `${prospect.daysWithoutActivity ?? "—"} días`}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ),
            }
        );

        return items.map((item) => React.cloneElement(item.node, { key: item.key }));
    }, [crmData, crmLoading]);

    return (
        <div className="h-full w-full flex flex-col gap-4 px-4 md:px-6 py-3">
            <ScrollArea className="w-full h-full pr-4">
                <div className="w-full h-full flex flex-col gap-4 pb-4">
                    <div className="w-full">
                        <div className="flex flex-col items-start justify-center mb-2 md:mb-4">
                            <p className="text-lg md:text-md text-neutral-500 dark:text-neutral-400">{greeting}</p>
                            <h1 className="text-3xl md:text-4xl font-light">{userName}</h1>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="w-full h-full overflow-hidden">
                            <TotalQuantitySoldCard />
                        </div>
                        <div className="w-full h-full overflow-hidden">
                            <TotalAmountSoldCard />
                        </div>
                        <div className="w-full h-full overflow-hidden">
                            <CommercialSalesSummaryCard />
                        </div>
                    </div>

                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="masonry-grid"
                        columnClassName="masonry-grid_column"
                    >
                        {masonryItems}
                    </Masonry>

                    <QuickInteractionModal
                        open={interactionModal.open}
                        onOpenChange={(open) => setInteractionModal((current) => ({ ...current, open }))}
                        prospectId={interactionModal.prospectId}
                        customerId={interactionModal.customerId}
                        agendaActionId={interactionModal.agendaActionId}
                        defaultNextActionDate={interactionModal.nextActionAt}
                        defaultNextActionNote={interactionModal.nextActionNote ?? ''}
                        title={interactionModal.mode === "complete" ? "Cerrar tarea" : "Registrar seguimiento"}
                        mode={interactionModal.mode}
                    />

                    <RescheduleAgendaDialog
                        open={rescheduleDialog.open}
                        onOpenChange={(open) => setRescheduleDialog((current) => ({ ...current, open, item: open ? current.item : null }))}
                        item={rescheduleDialog.item}
                        onConfirm={handleReschedule}
                        loading={rescheduleAgendaAction.isPending}
                    />

                    <AlertDialog
                        open={cancelDialog.open}
                        onOpenChange={(open) => setCancelDialog((current) => ({ ...current, open, item: open ? current.item : null }))}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar acción pendiente</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción dejará de estar activa en la agenda comercial.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Volver</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancel}>
                                    Confirmar cancelación
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </ScrollArea>
        </div>
    );
}
