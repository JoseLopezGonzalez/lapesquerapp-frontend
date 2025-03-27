import { useStoreContext } from '@/context/StoreContext';
import React from 'react'

const Position = ({ posicion }) => {
    const { isPositionFilled,  filteredPositionsMap} = useStoreContext();
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
        'fill-green-500 group-hover:fill-green-800'
        : isFilled
            ? 'fill-neutral-300 group-hover:fill-neutral-500'
            : 'fill-neutral-600 group-hover:fill-neutral-300';

    return (
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
                className="fill-white dark:fill-neutral-800 stroke-neutral-200 dark:stroke-neutral-300"
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
                className="fill-neutral-500 dark:fill-white"
                fontFamily="Arial-BoldMT, Arial"
                fontSize="49px"
            >
                <tspan x={coordenates.x + textX} y={coordenates.y + 135}>
                    {name}
                </tspan>
            </text>
        </g>
    );
};

export default Position;
