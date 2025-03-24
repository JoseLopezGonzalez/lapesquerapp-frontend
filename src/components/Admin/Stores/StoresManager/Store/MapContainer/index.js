import React from 'react'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MapContainer = ({ children }) => {

    return (
        <>
            <div className="w-max-full h-max-full sm:p-2">
                <TransformWrapper
                    initialScale={1}
                /* initialPositionX={200}
                initialPositionY={100} */
                >
                    {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                        <React.Fragment >
                            {/* <div className="tools">
                                <button onClick={() => zoomIn()}>+</button>
                                <button onClick={() => zoomOut()}>-</button>
                                <button onClick={() => resetTransform()}>x</button>
                            </div> */}
                            <TransformComponent >
                                <div style={{ marginLeft: 0, width: "100%", height: "550px" }}>
                                    {children}
                                </div>
                            </TransformComponent>
                        </React.Fragment>
                    )}
                </TransformWrapper>
            </div>
        </>
    )
}

export default MapContainer