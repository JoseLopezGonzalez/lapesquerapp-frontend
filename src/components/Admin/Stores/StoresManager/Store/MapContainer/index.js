import React, { useEffect, useRef } from 'react'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Expand } from "lucide-react";

const MapContainer = ({ children }) => {
    const resetTransformRef = useRef(null);

    useEffect(() => {
        // Ejecutar resetTransform automáticamente al cargar el componente
        if (resetTransformRef.current) {
            // Pequeño delay para asegurar que el componente esté completamente renderizado
            setTimeout(() => {
                resetTransformRef.current();
            }, 100);
        }
    }, []);

    return (
        <>
            <div className="w-full h-full sm:p-2 relative">
                <TransformWrapper
                    initialScale={1.2}
                    minScale={0.3}
                    maxScale={3}
                    centerOnInit={true}
                    wheel={{ step: 0.1 }}
                    doubleClick={{ disabled: true }}
                    panning={{ disabled: false }}
                    pinch={{ disabled: false }}
                    limitToBounds={false}
                >
                    {({ zoomIn, zoomOut, resetTransform, ...rest }) => {
                        // Guardar la referencia a resetTransform
                        resetTransformRef.current = resetTransform;
                        
                        return (
                            <React.Fragment >
                                {/* Controles de zoom */}
                                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                    <button 
                                        onClick={() => zoomIn()}
                                        className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center text-lg font-semibold text-gray-700 transition-colors"
                                        title="Zoom In"
                                    >
                                        +
                                    </button>
                                    <button 
                                        onClick={() => zoomOut()}
                                        className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center text-lg font-semibold text-gray-700 transition-colors"
                                        title="Zoom Out"
                                    >
                                        −
                                    </button>
                                    <button 
                                        onClick={() => resetTransform()}
                                        className="w-10 h-10 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors"
                                        title="Ajustar Vista"
                                    >
                                        <Expand size={16} />
                                    </button>
                                </div>
                                <TransformComponent 
                                    wrapperStyle={{ width: "100%", height: "100%", position: "relative" }}
                                    contentStyle={{ width: "100%", height: "100%" }}
                                >
                                    <div style={{ marginLeft: 0, width: "100%", minHeight: "600px", height: "auto" }}>
                                        {children}
                                    </div>
                                </TransformComponent>
                            </React.Fragment>
                        );
                    }}
                </TransformWrapper>
            </div>
        </>
    )
}

export default MapContainer