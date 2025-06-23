import React from "react";

export default function SanitaryRegister({ element, style = {} }) {
  const borderColor = element.borderColor || "black";
  const borderWidth = element.borderWidth || 1;
  const baseFontSize = element.fontSize || Math.min(element.width, element.height) / 3;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="flex items-center justify-center bg-white"
        style={{
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: "9999px",
          width: "100%",
          height: "100%",
        }}
      >
        <span
          style={{
            fontSize: baseFontSize,
            fontWeight: element.fontWeight,
            color: element.color || "#000",
            textTransform: element.textTransform,
            fontStyle: element.fontStyle,
            textDecoration: element.textDecoration,
            textAlign: "center",
            whiteSpace: "nowrap",
            ...style,
          }}
        >
          {element.text || "ES 12345678 H CE"}
        </span>
      </div>
    </div>
  );
}
