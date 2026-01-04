"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function NewLabelingFeatureCard() {
    return (
        <Card className="flex justify-between relative p-4 rounded-2xl shadow-sm border border-lime-200 dark:border-neutral-700 h-full bg-gradient-to-t from-lime-300 to-lime-100 dark:from-neutral-800 dark:to-neutral-900 overflow-hidden">
            <div className="z-10">
                <CardHeader className="p-0 pb-2">
                    <CardDescription className="text-sm  flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        Nueva Funcionalidad
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                        Editor de Etiquetas
                    </CardTitle>
                </CardHeader>

                <CardFooter className="flex-col items-start gap-3 mt-1 p-0 text-sm max-w-[200px]">
                    <p className="text-muted-foreground ">
                        Crea, personaliza e imprime etiquetas. {/* para tus productos de forma rápida y visual. */}
                    </p>
                </CardFooter>
            </div>

            <div className="absolute right-0 bottom-0 h-full translate-x-1/3 overflow-hidden">
                <img
                    src="/images/mockup-label.png"
                    alt="Mockup Editor de Etiquetas"
                    className="h-full max-h-[190px] object-contain cursor-pointer"
                    onClick={() => window.location.href = "/admin/label-editor"}
                />
            </div>
        </Card>
    )
}
