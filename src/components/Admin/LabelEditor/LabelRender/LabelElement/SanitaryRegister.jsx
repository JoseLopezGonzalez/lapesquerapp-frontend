import React from "react";

export default function SanitaryRegister({
  element = {},
  style = {},
  countryCode,
  approvalNumber,
  suffix,
  width,
  height,
  fontSize,
  fontWeight,
}) {
  const w = width || element.width || 160;
  const h = height || element.height || 110;

  const strokeColor = element.borderColor || "black";
  const strokeWidth = element.borderWidth || 2;

  const fs = fontSize || element.fontSize || 16;
  const fw = fontWeight || element.fontWeight || "bold";

  const color = element.color || "#000";

  const cc = countryCode || element.countryCode || (element.text ? element.text.split(/\n/)[0] : "ES");
  const an =
    approvalNumber ||
    element.approvalNumber ||
    (element.text ? element.text.split(/\n/)[1] || "" : "10.08823/B");
  const suff = suffix || element.suffix || (element.text ? element.text.split(/\n/)[2] || "" : "C.E.");

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - strokeWidth / 2}
          ry={h / 2 - strokeWidth / 2}
          fill="white"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fs}
          fontWeight={fw}
          fill={color}
          style={style}
        >
          <tspan x="50%" dy="-1.2em">
            {cc}
          </tspan>
          <tspan x="50%" dy="1.2em">
            {an}
          </tspan>
          <tspan x="50%" dy="1.2em">
            {suff}
          </tspan>
        </text>
      </svg>
    </div>
  );
}
