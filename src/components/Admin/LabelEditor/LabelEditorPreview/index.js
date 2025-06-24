import toast from "react-hot-toast";
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


    return (
        <div
            ref={canvasRef}
            className="relative bg-white border-2 border-dashed border-border shadow-lg rounded-lg"
            style={{
                width: `${canvasWidth}mm`,
                height: `${canvasHeight}mm`,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
            }}
        >
            {elements.map((element) => {
                const rotated = (element.rotation || 0) % 180 !== 0;
                const width = rotated ? element.height : element.width;
                const height = rotated ? element.width : element.height;

                return (
                    <div
                        key={element.id}
                        className={`absolute flex cursor-move border transition-colors ${selectedElement === element.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:border-muted-foreground/30"
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
                                    className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-nwse-resize"
                                ></div>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, element.id, "ne")}
                                    className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-nesw-resize"
                                ></div>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, element.id, "sw")}
                                    className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full cursor-nesw-resize"
                                ></div>
                                <div
                                    onMouseDown={(e) => handleResizeMouseDown(e, element.id, "se")}
                                    className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full cursor-nwse-resize"
                                ></div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
