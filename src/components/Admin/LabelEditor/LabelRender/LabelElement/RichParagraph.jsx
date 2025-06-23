import React from "react";

export default function RichParagraph({ element, style = {} }) {
  if (element.html) {
    return (
      <div
        className="w-full h-full"
        style={{
          textAlign: element.textAlign,
          fontSize: element.fontSize,
          fontWeight: element.fontWeight,
          color: element.color,
          textTransform: element.textTransform,
          fontStyle: element.fontStyle,
          textDecoration: element.textDecoration,
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: element.html }}
      />
    )
  }

  const segments = Array.isArray(element.segments)
    ? element.segments
    : [{ text: element.text || "Texto de ejemplo", style: {} }];

  return (
    <div
      className="w-full h-full"
      style={{
        textAlign: element.textAlign,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        color: element.color,
        textTransform: element.textTransform,
        fontStyle: element.fontStyle,
        textDecoration: element.textDecoration,
      }}
    >
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            fontWeight: seg.style?.fontWeight,
            fontStyle: seg.style?.fontStyle,
            textDecoration: seg.style?.textDecoration,
            color: seg.style?.color,
            ...style,
          }}
        >
          {seg.text}
        </span>
      ))}
    </div>
  );
}
