// components/LabelElement.js
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { ImageIcon } from "lucide-react";
import { serializeBarcode } from "@/lib/barcodes";
import { formatDecimal, parseEuropeanNumber } from "@/helpers/formats/numbers/formatNumbers";
import SanitaryRegister from "./SanitaryRegister";
import RichParagraph from "./RichParagraph";

// Valor por defecto de netWeight para usar cuando no hay valor disponible
const NET_WEIGHT_DEFAULT = "20,000 kg";

const formatMap = {
    ean13: "EAN13",
    code128: "CODE128",
    // Agrega más si necesitas
};

// Función para formatear netWeight según el tipo de campo
const formatNetWeightField = (value, fieldName) => {
    if (!value) return value;
    
    // Parsear el valor (puede venir como "20,000 kg" o como número)
    let numValue = typeof value === 'string' 
        ? parseEuropeanNumber(value.replace(/kg/gi, '').trim()) 
        : Number(value) || 0;
    
    if (fieldName === 'netWeightFormatted') {
        // Formato decimal con separadores (ej: 1.234,56)
        return formatDecimal(numValue);
    } else if (fieldName === 'netWeight6digits') {
        // Redondear a 2 decimales y multiplicar por 100 para obtener un entero de 6 dígitos
        // Ejemplo: 20,00 kg → 2000 → 002000
        const roundedValue = Math.round(numValue * 100) / 100; // Redondear a 2 decimales
        const integerValue = Math.round(roundedValue * 100); // Multiplicar por 100 para obtener entero
        return String(integerValue).padStart(6, '0');
    }
    
    // Para netWeight sin formato, devolver valor original
    return value;
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

    const getValue = (key) => {
        // Si es un campo de netWeight con formato específico, aplicar el formato
        if (key === 'netWeightFormatted' || key === 'netWeight6digits') {
            // Usar el valor de netWeight si existe, si no usar el valor por defecto
            const baseValue = values?.['netWeight'] ?? NET_WEIGHT_DEFAULT;
            return formatNetWeightField(baseValue, key);
        }
        return values?.[key] ?? `{{${key}}}`;
    };
    
    const replacePlaceholders = (str) => {
        if (!str) return '';
        return str.replace(/{{([^}]+)}}/g, (_, field) => getValue(field));
    };


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
            // console.log("Barcode type:", type)
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
