import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStoreContext } from '@/context/StoreContext';
import { CircleDot, Edit, Plus } from 'lucide-react';
import React from 'react'
import PositionPopover from './PositionPopover';

const Position = ({ posicion }) => {
    const { isPositionFilled, filteredPositionsMap } = useStoreContext();
    const { coordenates, name, id, type, onClick, position } = posicion;

    const isRelevant = filteredPositionsMap.has(id);
    const isFilled = isPositionFilled(id);


    const width = position.width || 180;
    const height = position.height || 230;

    const offsetByType = {
        left: { blurX: -16, mainX: -18, textX: 1 },
        center: { blurX: 42, mainX: 40, textX: 58 },
        right: { blurX: 100, mainX: 98, textX: 116 }
    };

    const { blurX, mainX, textX } = offsetByType[type] || offsetByType.center;
    const baseY = coordenates.y + 40;

    const fondoClasses = isRelevant ?
        'fill-green-500 group-hover:fill-green-600 dark:group-hover:fill-green-800'
        : isFilled
            ? 'fill-primary/75 group-hover:fill-primary'
            : 'fill-foreground-300 group-hover:fill-foreground-400';

    return (
        <>
            <Popover

            /* open={selectedPosition === position.id} */
            /*  onOpenChange={(open) => {
                 if (open) {
                     setSelectedPosition(position.id)
                 } else {
                     setSelectedPosition(null)
                 }
             }} */
            >
                <PopoverTrigger asChild>
                    <g id={id} className="group cursor-pointer" onClick={onClick}>
                        {/* Fondo principal */}
                        <rect
                            id="rect-fondo"
                            className={fondoClasses}
                            x={coordenates.x}
                            y={coordenates.y}
                            width={width}
                            height={height}
                            rx="14"
                            ry="14"
                        />

                        {/* rectángulo superior */}
                        <rect
                            className="fill-foreground-50 stroke-foreground-300 "
                            x={coordenates.x + mainX}
                            y={baseY}
                            width="100"
                            height="150"
                            rx="13.5"
                            ry="13.5"
                            strokeWidth="1"
                        />


                        {/* Texto */}
                        <text
                            className="fill-primary"
                            fontFamily="Arial-BoldMT, Arial"
                            fontSize="49px"
                        >
                            <tspan x={coordenates.x + textX} y={coordenates.y + 135}>
                                {name}
                            </tspan>
                        </text>
                    </g>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="center">
                    <PositionPopover position={posicion} />
                </PopoverContent>
            </Popover>

        </>

    );
};

export default Position;
