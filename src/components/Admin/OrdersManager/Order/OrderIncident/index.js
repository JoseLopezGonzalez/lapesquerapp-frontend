'use client'

import { useState } from "react"
import {
    Card, CardContent, CardDescription, CardFooter,
    CardHeader, CardTitle
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AlertCircle, Ban, CheckCircle, Delete, Trash } from "lucide-react"
import { useOrderContext } from "@/context/OrderContext"
import { toast } from "react-hot-toast"
import { getToastTheme } from "@/customs/reactHotToast"
import { formatDate } from "@/helpers/formats/dates/formatDates"
import { useIsMobile } from "@/hooks/use-mobile"

export default function OrderIncidentPanel() {
    const { order, openOrderIncident, resolveOrderIncident, deleteOrderIncident } = useOrderContext()
    const isMobile = useIsMobile()

    const [newDescription, setNewDescription] = useState("")
    const [resolutionType, setResolutionType] = useState("")
    const [resolutionNotes, setResolutionNotes] = useState("")
    const [loading, setLoading] = useState(false)

    const handleCreate = async () => {
        if (!newDescription) return toast.error("La descripción es obligatoria")
        const toastId = toast.loading("Creando incidencia...", getToastTheme())
        setLoading(true)
        try {
            await openOrderIncident(newDescription)
            toast.success("Incidencia creada", { id: toastId })
        } catch (err) {
            toast.error("Error al crear incidencia", { id: toastId })
        } finally {
            setLoading(false)
            setNewDescription("")
        }
    }

    const handleResolve = async () => {
        if (!resolutionType) return toast.error("Selecciona un tipo de resolución")
        const toastId = toast.loading("Resolviendo incidencia...", getToastTheme())
        setLoading(true)
        try {
            await resolveOrderIncident(resolutionType, resolutionNotes)
            toast.success("Incidencia resuelta", { id: toastId })
        } catch (err) {
            toast.error("Error al resolver incidencia", { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        const toastId = toast.loading("Eliminando incidencia...", getToastTheme())
        setLoading(true)
        try {
            await deleteOrderIncident()
            toast.success("Incidencia eliminada", { id: toastId })
        } catch (err) {
            toast.error("Error al eliminar incidencia", { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    const incident = order.incident
    const isResolved = incident?.status === "resolved"
    const isOpen = incident?.status === "open"

    const content = isMobile ? (
        <div className="w-full">
            {incident ? (
                <div className="space-y-4 py-5">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between">
                        <div>
                                <Label className="text-sm font-medium text-muted-foreground">Fecha de creación</Label>
                                <p className="text-sm">{formatDate(incident.createdAt)}</p>
                        </div>
                            <div className="hidden sm:block">
                                <div className="mt-1">
                                {isOpen ? (
                                        <div className="flex items-center gap-1.5  border border-amber-500 rounded-lg p-1.5  w-fit">
                                            <div className=" text-amber-500  rounded-md">
                                            <AlertCircle className="h-4 w-4" />
                                        </div>
                                            <span className=" text-amber-500 text-sm">Incidencia Abierta</span>
                                    </div>
                                ) : (
                                        <div className="flex items-center gap-1.5 justify-center  border border-green-500 rounded-lg p-1.5 w-fit">
                                            <div className=" text-green-500  rounded-md">
                                            <CheckCircle className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-green-500 text-sm">Incidencia Resuelta</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="pt-2">
                            <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                            <p className="text-sm mt-1 whitespace-pre-line">{incident.description}</p>
                        </div>
                    </div>
                    <Separator className="my-4" />
                    {isResolved ? (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Fecha de resolución</Label>
                                <p className="text-sm">{formatDate(incident.resolvedAt)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Tipo de resolución</Label>
                                <p className="text-sm capitalize">
                                    {incident.resolutionType === "returned" && "Devuelto"}
                                    {incident.resolutionType === "partially_returned" && "Parcialmente devuelto"}
                                    {incident.resolutionType === "compensated" && "Compensado"}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Notas de resolución</Label>
                                <p className="text-sm whitespace-pre-line">{incident.resolutionNotes}</p>
                            </div>
                        </div>
                    ) : (
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
                                    className="min-h-[100px]"
                                />
                            </div>
                            </div>
                        )}
                </div>
            ) : (
                <div className="space-y-4 py-5">
                    <div className="space-y-2">
                        <Label htmlFor="incident-description">Descripción de la incidencia</Label>
                        <Textarea
                            id="incident-description"
                            placeholder="Describe la incidencia reportada por el cliente"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
            )}
            <div className="flex justify-end pt-4">
                {incident ? isOpen && <Button onClick={handleResolve} disabled={loading}>Marcar como resuelta</Button>
                    : (
                        <Button onClick={handleCreate} disabled={loading}>Crear incidencia</Button>
                    )}
            </div>
        </div>
    ) : (
                    <Card className="w-full shadow-sm bg-transparent">
                        {incident ? (
                            <CardContent className="space-y-4 py-5">
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Fecha de creación</Label>
                                            <p className="text-sm">{formatDate(incident.createdAt)}</p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="mt-1">
                                                {isOpen ? (
                                                    <div className="flex items-center gap-1.5  border border-amber-500 rounded-lg p-1.5  w-fit">
                                                        <div className=" text-amber-500  rounded-md">
                                                            <AlertCircle className="h-4 w-4" />
                                                        </div>
                                                        <span className=" text-amber-500 text-sm">Incidencia Abierta</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 justify-center  border border-green-500 rounded-lg p-1.5 w-fit">
                                                        <div className=" text-green-500  rounded-md">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium text-green-500 text-sm">Incidencia Resuelta</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                                        <p className="text-sm mt-1 whitespace-pre-line">{incident.description}</p>
                                    </div>
                                </div>
                                <Separator className="my-4" />
                                {isResolved ? (
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Fecha de resolución</Label>
                                            <p className="text-sm">{formatDate(incident.resolvedAt)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Tipo de resolución</Label>
                                            <p className="text-sm capitalize">
                                                {incident.resolutionType === "returned" && "Devuelto"}
                                                {incident.resolutionType === "partially_returned" && "Parcialmente devuelto"}
                                                {incident.resolutionType === "compensated" && "Compensado"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Notas de resolución</Label>
                                            <p className="text-sm whitespace-pre-line">{incident.resolutionNotes}</p>
                                        </div>
                                    </div>
                                ) : (
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
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        ) : (
                            <CardContent className="space-y-4 py-5">
                                <div className="space-y-2">
                                    <Label htmlFor="incident-description">Descripción de la incidencia</Label>
                                    <Textarea
                                        id="incident-description"
                                        placeholder="Describe la incidencia reportada por el cliente"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                        )}
                        <CardFooter className="flex justify-end">
                            {incident ? isOpen && <Button onClick={handleResolve} disabled={loading}>Marcar como resuelta</Button>
                                : (
                                    <Button onClick={handleCreate} disabled={loading}>Crear incidencia</Button>
                                )}
                        </CardFooter>
                    </Card>
    );

    return (
        <div className='h-full pb-2'>
            {isMobile ? (
                <div className='h-full flex flex-col'>
                    <div className="mb-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                {incident && (
                                    <Button onClick={handleDelete} disabled={loading} variant="">
                                        <Ban className="h-5 w-5" />
                                        Cancelar Incidencia
                                    </Button>
                                )}
                            </div>
                            {incident && (
                                <div>
                                    {isOpen ? (
                                        <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-lg p-2 pr-4 w-fit">
                                            <div className="bg-amber-400 text-white p-1.5 rounded-md">
                                                <AlertCircle className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-amber-700">Incidencia Abierta</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-lg p-2 pr-4 w-fit">
                                            <div className="bg-emerald-500 text-white p-1.5 rounded-md">
                                                <CheckCircle className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-emerald-700">Incidencia Resuelta</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {content}
                    </div>
                </div>
            ) : (
                <Card className='h-full flex flex-col bg-transparent'>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-semibold">Incidencia</CardTitle>
                                <CardDescription>Crea o resuelve la incidencia asociada al pedido</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {incident && (
                                    <Button onClick={handleDelete} disabled={loading} variant="">
                                        <Ban className="h-5 w-5" />
                                        Cancelar Incidencia
                                    </Button>
                                )}
                            </div>
                            {incident && (
                                <div className="sm:hidden">
                                    {isOpen ? (
                                        <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-lg p-2 pr-4 w-fit">
                                            <div className="bg-amber-400 text-white p-1.5 rounded-md">
                                                <AlertCircle className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-amber-700">Incidencia Abierta</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-lg p-2 pr-4 w-fit">
                                            <div className="bg-emerald-500 text-white p-1.5 rounded-md">
                                                <CheckCircle className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-emerald-700">Incidencia Resuelta</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto  ">
                        {content}
                </CardContent>
            </Card>
            )}
        </div>
    )
}
