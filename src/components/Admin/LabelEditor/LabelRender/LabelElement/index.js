// components/LabelElement.js
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { ImageIcon } from "lucide-react";
import { serializeBarcode } from "@/lib/barcodes";
import SanitaryRegister from "./SanitaryRegister";
import RichParagraph from "./RichParagraph";

const formatMap = {
    ean13: "EAN13",
    code128: "CODE128",
    // Agrega más si necesitas
};

export default function LabelElement({ element, values = {} }) {
    const commonStyle = {
        fontSize: `${element.fontSize}mm`,
        fontWeight: element.fontWeight,
        color: element.color,
        textTransform: element.textTransform,
        fontStyle: element.fontStyle,
        textDecoration: element.textDecoration,
    };

    const getValue = (key) => values?.[key] ?? `{{${key}}}`;
    const replacePlaceholders = (str) =>
        (str || "").replace(/{{([^}]+)}}/g, (_, f) => getValue(f));


    switch (element.type) {
        case "text":
            return <span style={commonStyle}>{element.text}</span>;

        case "field":
            return <span style={commonStyle}>{getValue(element.field)}</span>;

        case "manualField":
            return <span style={commonStyle}>{getValue(element.key) || element.sample}</span>;

        case "sanitaryRegister":
            return <SanitaryRegister element={element} />;

        case "richParagraph":
            return <RichParagraph element={{ ...element, html: replacePlaceholders(element.html) }} />;

        case "qr":
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <QRCode
                        value={replacePlaceholders(element.qrContent)}
                        size={Math.min(element.width, element.height)}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            );

        case "barcode": {
            const type = element.barcodeType || "ean13"
            console.log("Barcode type:", type)
            const format = formatMap[type]
            const rawValue = replacePlaceholders(element.barcodeContent)
            const serialized = serializeBarcode(rawValue, type)
            let isValidLength = true;

            if (format === "EAN13") {
                isValidLength = /^\d{12}$/.test(serialized); // Incluyendo checksum
            } else if (format === "EAN14") {
                isValidLength = /^\d{13}$/.test(serialized);
            } else if (format === "CODE128") {
                isValidLength = serialized.length > 0; // mínimo 1 carácter
            }

            return (
                <div className="w-full h-full flex items-center justify-center">
                    {isValidLength ? (
                        <Barcode
                            value={serialized}
                            format={format}
                            width={1}
                            /* height={element.height - 10} */
                            height={`${element.height*4}px`}
                            displayValue={element.showValue}
                            fontSize={element.fontSize * 6}
                        />
                    ) : (
                        <span className="text-xs text-red-500 text-center">
                            Código inválido ({serialized?.length} dígitos)
                        </span>
                    )}
                </div>
            )
        }


        case "image":
            return (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                </div>
            );

        default:
            return null;
    }
}
