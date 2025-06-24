// components/LabelRender.js

import LabelElement from "./LabelElement";

export default function LabelRender({ label, getFieldValue = () => "", manualValues = {} }) {
  if (!label) return null;

  const { elements = [], canvas = {} } = label;
  const width = canvas.width || 300;
  const height = canvas.height || 200;

  return (
    <div className="relative text-black bg-white shadow rounded" style={{ width, height }}>
      {elements.map((el) => {
        const w = (el.rotation || 0) % 180 === 0 ? el.width : el.height;
        const h = (el.rotation || 0) % 180 === 0 ? el.height : el.width;

        return (
          <div
            key={el.id}
            className="absolute flex items-center justify-center p-1"
            style={{
              left: el.x,
              top: el.y,
              width: w,
              height: h,
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
            <LabelElement element={el} getFieldValue={getFieldValue} manualValues={manualValues} />
          </div>
        );
      })}
    </div>
  );
}
