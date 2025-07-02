"use client"

import { useEffect, useState } from "react"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card"
import { Loader } from "lucide-react"
import { useSession } from "next-auth/react"
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers"
import { getTotalStock } from "@/services/storeService"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function CurrentStockCard() {
    const { data: session, status } = useSession()
    const [totalStock, setTotalStock] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (status !== "authenticated") return

        const token = session.user.accessToken

        getTotalStock(token)
            .then(setTotalStock)
            .catch((err) => {
                console.error("Error al obtener el stock:", err)
                setTotalStock(null)
            })
            .finally(() => setIsLoading(false))
    }, [status])

    /* fecha y hora actual */
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
        <Card className="flex justify-between relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-foreground-100 to-background dark:from-gray-800 dark:to-gray-900">
            <div className="overflow-hidden w-full">
                <CardHeader className="p-0 pb-2">
                    <CardDescription className="text-sm text-muted-foreground">
                        Stock actual total
                    </CardDescription>
                    <CardTitle className="text-3xl font-medium tracking-tight">
                        {isLoading ? (
                            <div className="h-8 flex items-center">
                                <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : totalStock !== null ? (
                            formatDecimalWeight(totalStock)
                        ) : (
                            <span className="text-muted-foreground text-base">Sin datos</span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5   text-sm mt-4 p-0">
                    <div className="flex items-center font-medium">
                        Cantidad total en stock
                    </div>
                    <div className="text-muted-foreground text-xs">
                        <span>Actualizado a {formattedDate} </span>
                    </div>
                </CardFooter>
            </div>



            <div className="absolute right-0 bottom-0 h-full translate-x-1/3 overflow-hidden">
                <img
                    src="/images/mockup-stores.png"
                    alt="Ilustración almacenes"
                    className="h-full max-h-[190px] object-contain cursor-pointer"
                    onClick={() => window.location.href = "/admin/stores-manager"}
                />
            </div>


        </Card>
    )
}
