import LabelElement from "../LabelRender/LabelElement";


export default function LabelEditorPreview({
    canvasRef,
    zoom = 1,
    canvasWidth = 400,
    canvasHeight = 300,
    elements = [],
    selectedElement,
    handleMouseDown,
    handleResizeMouseDown,
    /* getFieldValue = () => "",
    manualValues = {}, */
    values = {},

}) {
    const isZoomed = zoom !== 1;

    return (
        <div
            ref={canvasRef}
            className={`relative bg-white ${isZoomed ? 'border-2 border-border/70 shadow-md rounded-sm' : 'border-2 border-border shadow-lg rounded-lg'}`}
            style={{
                width: `${canvasWidth}mm`,
                height: `${canvasHeight}mm`,
                transform: `scale(${zoom})`,
                transformOrigin: isZoomed ? "center center" : "top left",
            }}
        >
            {elements.filter((element) => {
                if (["manualField", "selectField", "checkboxField", "dateField"].includes(element.type)) {
                    return element.visibleOnLabel !== false;
                }
                return true;
            }).map((element) => {
                const rotated = (element.rotation || 0) % 180 !== 0;
                const width = rotated ? element.height : element.width;
                const height = rotated ? element.width : element.height;

                return (
                    <div
                        key={element.id}
                        className={`absolute flex cursor-move transition-colors ${selectedElement === element.id
                            ? "border border-blue-500/60 bg-blue-50/30 ring-1 ring-blue-500/30"
                            : "border border-transparent hover:border-gray-200/50"
                            }`}
                        style={{
                            left: `${element.x}mm`,
                            top: `${element.y}mm`,
                            width: `${width}mm`,
                            height: `${height}mm`,
                            transform: `rotate(${element.rotation || 0}deg)`,
                            transformOrigin: "center",
                            alignItems:
                                element.verticalAlign === "start"
                                    ? "flex-start"
                                    : element.verticalAlign === "end"
                                        ? "flex-end"
                                        : element.verticalAlign === "center"
                                            ? "center"
                                            : element.verticalAlign || "center",
                            justifyContent:
                                element.horizontalAlign === "left"
                                    ? "flex-start"
                                    : element.horizontalAlign === "right"
                                        ? "flex-end"
                                        : element.horizontalAlign === "center"
                                            ? "center"
                                            : element.horizontalAlign === "justify"
                                                ? "space-between"
                                                : element.horizontalAlign || "flex-start",
                            textAlign: element.textAlign,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element.id)}

                    >
                        <LabelElement element={element} /* getFieldValue={getFieldValue} manualValues={manualValues} */ values={values} />

                        {selectedElement === element.id && (
                            <>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, element.id, "nw")}
                                    className="absolute -top-1 -left-1 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize w-2 h-2 shadow-sm"
                                    style={{ zIndex: 10, transform: `scale(${1 / zoom})` }}
                                ></div>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, element.id, "ne")}
                                    className="absolute -top-1 -right-1 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize w-2 h-2 shadow-sm"
                                    style={{ zIndex: 10, transform: `scale(${1 / zoom})` }}
                                ></div>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, element.id, "sw")}
                                    className="absolute -bottom-1 -left-1 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize w-2 h-2 shadow-sm"
                                    style={{ zIndex: 10, transform: `scale(${1 / zoom})` }}
                                ></div>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, element.id, "se")}
                                    className="absolute -bottom-1 -right-1 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize w-2 h-2 shadow-sm"
                                    style={{ zIndex: 10, transform: `scale(${1 / zoom})` }}
                                ></div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
