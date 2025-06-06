// PalletLabel.js
import React, { forwardRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";

const PalletLabel = ({ pallet }) => {
    return (
            <Card className=" p-0 overflow-hidden w-full h-full" >{/*  border-none shadow-none */}
                <CardHeader className="pb-2">
                    <CardTitle className="text-3xl font-bold">Palet #{pallet.id}</CardTitle>
                    {pallet.orderId && (
                        <p className="text-sm text-muted-foreground">Pedido vinculado: #{pallet.orderId}</p>
                    )}
                </CardHeader>

                <CardContent className="text-sm space-y-2 print:text-xs print:space-y-1">
                    <div>
                        <p className="font-semibold text-muted-foreground mb-1">Productos:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {[...new Set(pallet.boxes.map((b) => b.product.name))].map((name) => (
                                <li key={name} className="font-medium text-foreground">{name}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="font-semibold text-muted-foreground mb-1">Lotes:</p>
                        <div className="flex flex-wrap gap-1">
                            {[...new Set(pallet.boxes.map((b) => b.lot))].map((lot) => (
                                <Badge key={lot} variant="outline" className="text-xs">
                                    {lot}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {pallet.observations && (
                        <div>
                            <p className="font-semibold text-muted-foreground mb-1">Observaciones:</p>
                            <p className="bg-muted/50 p-2 rounded-md">{pallet.observations}</p>
                        </div>
                    )}

                    <Separator className="my-2" />

                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                            <p className="text-lg font-bold">{pallet.numberOfBoxes}</p>
                            <p className="text-sm font-medium text-muted-foreground">Cajas</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold">{formatDecimalWeight(pallet.netWeight)}</p>
                            <p className="text-sm font-medium text-muted-foreground">Peso</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
    );
}

export default PalletLabel;
