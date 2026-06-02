'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStoreContext } from '@/context/StoreContext';
import { useIsMobile } from '@/hooks/use-mobile';
import PositionPopover from './PositionPopover';

interface Posicion {
  coordenates: { x: number; y: number };
  name: string;
  id: string | number;
  type: 'left' | 'center' | 'right';
  onClick: () => void;
  position: {
    width?: number;
    height?: number;
  };
}

const Position = ({ posicion }: { posicion: Posicion }) => {
  const isMobile = useIsMobile();
  const { filteredPositionsMap, isPositionRelevant, isPositionFilled, openPositionSlideover } =
    useStoreContext();
  const { coordenates, name, id, type, onClick, position } = posicion;

  const isRelevant = isPositionRelevant(id);
  const isFilled = isPositionFilled(id);

  const width = position.width || 180;
  const height = position.height || 230;

  const offsetByType = {
    left: { blurX: -16, mainX: -18, textX: 1 },
    center: { blurX: 42, mainX: 40, textX: 58 },
    right: { blurX: 100, mainX: 98, textX: 116 },
  };

  const { mainX, textX } = offsetByType[type] || offsetByType.center;
  const baseY = coordenates.y + 40;

  const fondoClasses = isRelevant
    ? 'fill-green-500 group-hover:fill-green-600 dark:group-hover:fill-green-800'
    : isFilled
      ? 'fill-primary/75 group-hover:fill-primary'
      : 'fill-foreground-300 group-hover:fill-foreground-400';

  const svgContent = (
    <g
      id={String(id)}
      className="group cursor-pointer"
      onClick={isMobile ? () => openPositionSlideover(id) : onClick}
    >
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
      <rect
        className="fill-foreground-50 stroke-foreground-300"
        x={coordenates.x + mainX}
        y={baseY}
        width="100"
        height="150"
        rx="13.5"
        ry="13.5"
        strokeWidth="1"
      />
      <text className="fill-primary" fontFamily="Arial-BoldMT, Arial" fontSize="49px">
        <tspan x={coordenates.x + textX} y={coordenates.y + 135}>
          {name}
        </tspan>
      </text>
    </g>
  );

  if (isMobile) {
    return svgContent;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{svgContent}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="center">
        <PositionPopover position={posicion} />
      </PopoverContent>
    </Popover>
  );
};

export default Position;
