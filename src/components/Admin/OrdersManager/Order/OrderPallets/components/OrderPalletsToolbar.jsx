import React from 'react'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Unlink, Link2, Loader2, MoreVertical, PackagePlus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const OrderPalletsToolbar = ({
    isMobile,
    pallets,
    isUnlinkingAll,
    onCreate,
    onLink,
    onCreateFromForecast,
    onUnlinkAll,
    readOnly = false,
}) => {
    const canUnlinkAll = pallets && pallets.length > 0

    if (isMobile) {
    if (readOnly) return null;
        return (
            <div
                className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center gap-2 z-50"
                style={{ paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))` }}
            >
                <Button variant="outline" onClick={onLink} size="sm" className="flex-1 min-h-[44px]">
                    <Link2 />
                    Vincular
                </Button>
                <Button variant="outline" onClick={onCreateFromForecast} size="sm" className="flex-1 min-h-[44px]">
                    <PackagePlus />
                    Desde previsión
                </Button>
                <Button onClick={onCreate} size="sm" className="flex-1 min-h-[44px]">
                    <Plus />
                    Crear
                </Button>
                {canUnlinkAll && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="Menú acciones palets">
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onUnlinkAll} disabled={isUnlinkingAll}>
                                {isUnlinkingAll ? (
                                    <>
                                        <Loader2 className="animate-spin" />
                                        Desvinculando...
                                    </>
                                ) : (
                                    <>
                                        <Unlink />
                                        Desvincular todos
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        )
    }

    return (
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-lg font-medium">Gestión de Palets</CardTitle>
                <CardDescription>Modifica los palets de la orden</CardDescription>
            </div>
        {!readOnly && (
            <div className="flex gap-2">
                {canUnlinkAll && (
                    <Button variant="outline" onClick={onUnlinkAll} disabled={isUnlinkingAll}>
                        {isUnlinkingAll ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Desvinculando...
                            </>
                        ) : (
                            <>
                                <Unlink />
                                Desvincular todos
                            </>
                        )}
                    </Button>
                )}
                <Button variant="outline" onClick={onLink}>
                    <Link2 />
                    Vincular palets existentes
                </Button>
                <Button variant="outline" onClick={onCreateFromForecast}>
                    <PackagePlus />
                    Crear desde previsión
                </Button>
                <Button onClick={onCreate}>
                    <Plus />
                    Crear palet
                </Button>
            </div>
        )}
        </CardHeader>
    )
}

export default OrderPalletsToolbar
