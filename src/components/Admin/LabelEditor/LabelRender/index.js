// components/LabelRender.js

import LabelElement from "./LabelElement";

export default function LabelRender({
  label,
  values = {},
  zoom = 1, // Puedes pasarle zoom también si quieres
}) {
  if (!label) return null;

  const { elements = [], canvas = {} } = label;
  const width = canvas.width || 400;
  const height = canvas.height || 300;

  return (
    <div
      className="relative text-black bg-white " /* shadow rounded border-2 border-dashed border-border */
      style={{
        width: `${width}mm`,
        height: `${height}mm`,
        /* transform: `scale(${zoom})`,
        transformOrigin: "top left", */
      }}
    >
      {elements.map((el) => {
        const rotated = (el.rotation || 0) % 180 !== 0;
        const w = rotated ? el.height : el.width;
        const h = rotated ? el.width : el.height;

        return (
          <div
            key={el.id}
            className="absolute flex border border-transparent hover:border-muted-foreground/30"
            style={{
              left: `${el.x}mm`,
              top: `${el.y}mm`,
              width: `${w}mm`,
              height: `${h}mm`,
              transform: `rotate(${el.rotation || 0}deg)`,
              transformOrigin: "center",
              textAlign: el.textAlign,
              alignItems:
                el.verticalAlign === "start"
                  ? "flex-start"
                  : el.verticalAlign === "end"
                    ? "flex-end"
                    : el.verticalAlign === "center"
                      ? "center"
                      : el.verticalAlign || "center",
              justifyContent:
                el.horizontalAlign === "left"
                  ? "flex-start"
                  : el.horizontalAlign === "right"
                    ? "flex-end"
                    : el.horizontalAlign === "center"
                      ? "center"
                      : el.horizontalAlign === "justify"
                        ? "space-between"
                        : el.horizontalAlign || "flex-start",
            }}
          >
            <LabelElement
              element={el}
              values={values}
            /* getFieldValue={getFieldValue}
            manualValues={manualValues} */
            />
          </div>
        );
      })}
    </div>
  );
}
