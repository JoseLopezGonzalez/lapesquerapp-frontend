"use client";
import React from "react";
import Barcode from "react-barcode";
import QRCode from "react-qr-code";
import { ImageIcon } from "lucide-react";
import { serializeBarcode, formatMap } from "@/lib/barcodes";

export default function LabelRender({ label, getFieldValue = (f) => f, manualValues = {} }) {
  if (!label) return null;
  const { elements = [], canvas = {} } = label;
  const width = canvas.width || 100;
  const height = canvas.height || 100;

  return (
    <div className="relative text-black" style={{ width, height }}>
      {elements.map((el, idx) => {
        const w = (el.rotation || 0) % 180 === 0 ? el.width : el.height;
        const h = (el.rotation || 0) % 180 === 0 ? el.height : el.width;
        return (
          <div
            key={el.id || idx}
            className="absolute flex items-center justify-center p-1"
            style={{
              left: el.x,
              top: el.y,
              width: w,
              height: h,
              transform: `rotate(${el.rotation || 0}deg)`,
              transformOrigin: "center",
              textAlign: el.textAlign,
              alignItems: el.verticalAlign || "center",
              justifyContent: el.horizontalAlign || "flex-start",
            }}
          >
            {el.type === "text" && (
              <span
                style={{
                  fontSize: el.fontSize,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  textTransform: el.textTransform,
                  fontStyle: el.fontStyle,
                  textDecoration: el.textDecoration,
                }}
                className="truncate"
              >
                {el.text}
              </span>
            )}
            {el.type === "field" && (
              <span
                style={{
                  fontSize: el.fontSize,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  textTransform: el.textTransform,
                  fontStyle: el.fontStyle,
                  textDecoration: el.textDecoration,
                }}
                className="truncate"
              >
                {getFieldValue(el.field || "")}
              </span>
            )}
            {el.type === "manualField" && (
              <span
                style={{
                  fontSize: el.fontSize,
                  fontWeight: el.fontWeight,
                  color: el.color,
                  textTransform: el.textTransform,
                  fontStyle: el.fontStyle,
                  textDecoration: el.textDecoration,
                }}
                className="truncate"
              >
                {manualValues[el.key] || el.sample || `{{${el.key}}}`}
              </span>
            )}
            {el.type === "qr" && (
              <div className="w-full h-full flex items-center justify-center">
                <QRCode
                  value={(el.qrContent || "").replace(/{{([^}]+)}}/g, (_, f) => getFieldValue(f)) || " "}
                  size={Math.min(el.width, el.height)}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}
            {el.type === "barcode" && (
              <div className="w-full h-full flex items-center justify-center">
                <Barcode
                  value={serializeBarcode(
                    (el.barcodeContent || "").replace(/{{([^}]+)}}/g, (_, f) => getFieldValue(f)),
                    el.barcodeType || "ean13"
                  ) || "0"}
                  format={formatMap[el.barcodeType || "ean13"]}
                  width={1}
                  height={el.height - 10}
                  displayValue={el.showValue}
                />
              </div>
            )}
            {el.type === "image" && (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
