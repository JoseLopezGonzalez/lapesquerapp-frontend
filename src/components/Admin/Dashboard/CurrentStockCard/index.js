"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { formatDecimalWeight, formatInteger } from "@/helpers/formats/numbers/formatNumbers"
import { getTotalStockStats } from "@/services/storeService"
import { Skeleton } from "@/components/ui/skeleton"

export function CurrentStockCard() {
    const { data: session, status } = useSession()
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState(null)

    const accessToken = session?.user?.accessToken


    useEffect(() => {
        if (status !== "authenticated") return

        getTotalStockStats(accessToken)
            .then(setData)
            .catch((err) => {
                console.error("Error al obtener el stock:", err)
                setData(null)
            })
            .finally(() => setIsLoading(false))
    }, [status, accessToken])

    if (isLoading) return (
        <Card className="flex justify-between relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900">
            <div className="overflow-hidden w-full">
                <CardHeader className="p-0 pb-2">
                    <Skeleton className="w-44 h-4 " />
                    <CardTitle className="text-3xl font-medium tracking-tight">
                        <Skeleton className="h-8 w-36" />
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm mt-0 p-0">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-40" />
                </CardFooter>
            </div>
        </Card>
    )

    return (
        <Card className="flex justify-between relative p-4 rounded-2xl shadow-sm border h-full bg-gradient-to-t from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900">
            <div className="overflow-hidden w-full">
                <CardHeader className="p-0 pb-2">
                    <CardDescription className="text-sm text-muted-foreground">
                        Stock Total Actual
                    </CardDescription>
                    <CardTitle className="text-3xl font-medium tracking-tight">
                        {formatDecimalWeight(data?.totalNetWeight)}
                    </CardTitle>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5   text-sm mt-0 p-0">
                    <div className="flex items-center font-medium">
                        {formatInteger(data?.totalPallets)} palets, {formatInteger(data?.totalBoxes)} cajas
                    </div>
                    <div className="text-muted-foreground text-xs">
                        <span>Comprobado en {data?.totalStores} Almacenes</span>
                    </div>
                </CardFooter>
            </div>

            <div className="absolute right-0 bottom-0 h-full translate-x-1/3 overflow-hidden ">
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
