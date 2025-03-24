import React from 'react'

const Position = ({ posicion }) => {

    const { coordenates, empty, name, id, type, onClick , position } = posicion;

    //console.log('position', position)

    const width = position.width || 180;
    const height = position.height || 230;

    return (
        <>
            {type === 'left'
                ? (
                    <g id={id} className='group cursor-pointer' onClick={onClick}>
                        {false
                            ? <rect id="rect-fondo" className=" fill-green-500" x={coordenates.x} y={coordenates.y} width={width} height={height} rx="14" ry="14" />
                            : !empty
                                ? <rect id="rect-fondo" className=" fill-white group-hover:fill-sky-700" x={coordenates.x} y={coordenates.y} width={width} height={height} rx="14" ry="14" />
                                : <rect id="rect-fondo" className="fill-neutral-200 dark:fill-neutral-400  group-hover:fill-neutral-300" x={coordenates.x} y={coordenates.y} width={width} height={height} rx="14" ry="14" />
                        }

                        <rect id="rect-desenfoque" className="fill-neutral-300 group-hover:fill-neutral-400" filter="url(#f1)" x={coordenates.x - 16} y={coordenates.y + 40} width="100" height="150" rx="13.5" ry="13.5" />
                        <rect className="fill-white dark:fill-neutral-800" x={coordenates.x - 18} y={coordenates.y + 40} width="100" height="150" rx="13.5" ry="13.5" />
                        <text className="fill-neutral-500 dark:fill-white group-hover:fill-sky-600" fill="#575756" fontFamily="Arial-BoldMT, Arial" fontSize="49px" >
                            <tspan x={coordenates.x + 1} y={coordenates.y + 135}>{name}</tspan>
                        </text>
                    </g>
                )
                : type === 'center'
                    ? (
                        <g id={id} className='group cursor-pointer' onClick={onClick}>
                            {!empty
                                ? <rect id="rect-fondo" className=" fill-white group-hover:fill-sky-700" x={coordenates.x} y={coordenates.y} width={width} height={height} rx="14" ry="14" />
                                : <rect id="rect-fondo" className="fill-neutral-200 dark:fill-neutral-400 group-hover:fill-neutral-300" x={coordenates.x} y={coordenates.y} width={width} height={height} rx="14" ry="14" />
                            }                            <rect id="rect-desenfoque" className="fill-neutral-300 group-hover:fill-neutral-400" filter="url(#f1)" x={coordenates.x + 42} y={coordenates.y + 40} width="100" height="150" rx="13.5" ry="13.5" />
                            <rect className="fill-white dark:fill-neutral-800" x={coordenates.x + 40} y={coordenates.y + 40} width="100" height="150" rx="13.5" ry="13.5" />
                            <text className="fill-neutral-500 dark:fill-white group-hover:fill-sky-600" fill="#575756" fontFamily="Arial-BoldMT, Arial" fontSize="49px" >
                                <tspan x={coordenates.x + 58} y={coordenates.y + 135}>{name}</tspan>
                            </text>
                        </g>
                    )
                    : (
                        <g id={id} className='group cursor-pointer' onClick={onClick}>
                            {!empty
                                ? <rect id="rect-fondo" className=" fill-white group-hover:fill-sky-700" x={coordenates.x} y={coordenates.y} width={width} height={height} rx="14" ry="14" />
                                : <rect id="rect-fondo" className="fill-neutral-200 dark:fill-neutral-400 group-hover:fill-neutral-300" x={coordenates.x} y={coordenates.y} width={width} height={height} rx="14" ry="14" />
                            }                            <rect id="rect-desenfoque" className="fill-neutral-300 group-hover:fill-neutral-400" filter="url(#f1)" x={coordenates.x + 100} y={coordenates.y + 40} width="100" height="150" rx="13.5" ry="13.5" />
                            <rect className="fill-white dark:fill-neutral-800" x={coordenates.x + 98} y={coordenates.y + 40} width="100" height="150" rx="13.5" ry="13.5" />
                            <text className="fill-neutral-500 dark:fill-white group-hover:fill-sky-600" fill="#575756" fontFamily="Arial-BoldMT, Arial" fontSize="49px" >
                                <tspan x={coordenates.x + 116} y={coordenates.y + 135}>{name}</tspan>
                            </text>
                        </g>
                    )}
        </>
    )
}

export default Position