import React from 'react'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStoreContext } from '@/context/StoreContext';
import { CircleDot, Edit, Plus } from 'lucide-react';
import { formatDecimalWeight, formatInteger } from '@/helpers/formats/numbers/formatNumbers';

const PositionPopover = ({ position }) => {
    const { name, id } = position;

    const { getPositionPallets, openPositionSlideover } = useStoreContext();

    const pallets = getPositionPallets(id);

    const handleOnClickDetails = () => {
        openPositionSlideover(id);
    }

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <CircleDot className="h-5 w-5 " />
                    <CardTitle className="text-lg">Posición {name}</CardTitle>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                        /*  onClick={(e) => {
                             e.stopPropagation();
                             handleAddPallet(position.id);
                         }} */
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    {/*  <TooltipContent>
                <p>Agregar palet</p>
            </TooltipContent> */}
                </Tooltip>
            </CardHeader>
            <CardContent className="space-y-3">
                {pallets.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No existen elementos en esta posición</div>
                ) : pallets.map((pallet) =>
                    <div key={pallet.id} className="flex justify-between items-center p-2 rounded-lg border">
                        <div className="font-medium">#{pallet.id}</div>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                            <span>{formatInteger(pallet.boxes.length)} cajas</span>
                            <span>{formatDecimalWeight(pallet.netWeight)}</span>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                /* onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPallet(position.id, pallet.id);
                                }} */
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Editar palet</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </CardContent>
            {pallets.length > 0 && (
                <CardFooter className="pt-0">
                    <Button
                        className="w-full"
                        onClick={handleOnClickDetails}
                        disabled={pallets.length === 0}
                    >
                        Detalles
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

export default PositionPopover