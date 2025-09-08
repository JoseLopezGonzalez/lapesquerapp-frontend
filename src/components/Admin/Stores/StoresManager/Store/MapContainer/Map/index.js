import { useStoreContext } from '@/context/StoreContext';
import Position from './Position';

const Map = ({ onClickPosition , isPositionEmpty  }) => {

    const { store } = useStoreContext();

    const map = store?.map;

    // Usar un viewBox más amplio que garantice ver todos los módulos
    const calculateViewBox = () => {
        if (!map) return "-100 -100 10000 3000";
        
        // Para almacenes grandes, usar un viewBox más amplio
        // Esto asegura que se vean todos los módulos sin importar su posición
        return "-100 -100 10000 3000";
    };

    const viewBox = calculateViewBox();
    
    // Debug temporal para ver las dimensiones
    console.log('Map dimensions:', {
        map: map,
        viewBox: viewBox,
        fondos: map?.elementos?.fondos?.length || 0,
        posiciones: map?.posiciones?.length || 0,
        textos: map?.elementos?.textos?.length || 0
    });

    return (
        <>
            <svg id="a" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox={viewBox}>
                <defs>
                    <filter id="f1">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                </defs>

                {/* Fondos */}
                {map.elementos.fondos.map((fondo, index) => {
                    return (
                        <rect key={index} id="rect-contenedor" className="fill-neutral-100 dark:fill-neutral-800" x={fondo.x} y={fondo.y} width={fondo.width} height={fondo.height} rx="14" ry="14" />
                    )
                })}

                {/* Textos */}
                {map.elementos.textos.map((texto, index) => {
                    return (
                        <text key={index} className="fill-neutral-500 dark:fill-white group-hover:fill-sky-600" fill="#575756"
                            fontFamily="Arial-BoldMT, Arial" fontSize="60px">
                            <tspan x={texto.x} y={texto.y}>{texto.contenido}</tspan>
                        </text>
                    )
                })}

                {/* Posiciones */}
                {map.posiciones.map((posicion, index) => {
                    const formatedPosition = {
                        position: posicion,
                        id: posicion.id,
                        type: posicion.tipo,
                        name: posicion.nombre,
                        coordenates: { x: posicion.x, y: posicion.y },
                        onClick: () => onClickPosition(posicion),
                    };
                    return <Position key={index} posicion={formatedPosition} />
                })}

            </svg>
        </>
    )
}

export default Map