// components/LabelElement.js
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { ImageIcon } from "lucide-react";
import { serializeBarcode } from "@/lib/barcodes";
import { formatDecimal, formatDecimalWeight, parseEuropeanNumber } from "@/helpers/formats/numbers/formatNumbers";
import SanitaryRegister from "./SanitaryRegister";
import RichParagraph from "./RichParagraph";

// Valor por defecto de netWeight para usar cuando no hay valor disponible
const NET_WEIGHT_DEFAULT = "20,000 kg";

const formatMap = {
    ean13: "EAN13",
    code128: "CODE128",
    // Agrega más si necesitas
};

// Función para parsear un valor numérico que puede venir en diferentes formatos
const parseWeightValue = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    
    // Si ya es un número, devolverlo directamente
    if (typeof value === 'number') return value;
    
    // Si es string, limpiar y parsear
    const cleaned = String(value).replace(/kg/gi, '').trim();
    
    // Si está vacío después de limpiar, retornar 0
    if (!cleaned) return 0;
    
    // Detectar formato: si tiene coma y no tiene punto, o tiene coma y punto (formato europeo: 1.234,56)
    // Si solo tiene punto y no tiene coma, es formato inglés (1.1)
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    
    if (hasComma && !hasDot) {
        // Solo coma: formato europeo simple (1,5)
        return parseFloat(cleaned.replace(',', '.')) || 0;
    } else if (hasComma && hasDot) {
        // Tiene ambos: formato europeo con separadores de miles (1.234,56)
        return parseEuropeanNumber(cleaned);
    } else if (hasDot && !hasComma) {
        // Solo punto: formato inglés (1.1 o 1234.56)
        return parseFloat(cleaned) || 0;
    } else {
        // No tiene ni coma ni punto: número entero
        return parseFloat(cleaned) || 0;
    }
};

// Función para formatear netWeight según el tipo de campo
const formatNetWeightField = (value, fieldName) => {
    if (!value) return value;
    
    // Parsear el valor (puede venir como "20,000 kg", "1.1", 1.1, etc.)
    let numValue = parseWeightValue(value);
    
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
        // Si es el campo netWeight directamente, formatearlo con formato español + kg
        if (key === 'netWeight') {
            const baseValue = values?.['netWeight'] ?? NET_WEIGHT_DEFAULT;
            // Parsear el valor (puede venir como "20,000 kg", "1.1", 1.1, etc.)
            let numValue = parseWeightValue(baseValue);
            return formatDecimalWeight(numValue);
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

        case "selectField":
            return <span style={commonStyle}>{getValue(element.key) || element.sample}</span>;

        case "sanitaryRegister":
            return <SanitaryRegister element={element} />;

        case "richParagraph":
            return <RichParagraph key={`richParagraph-${element.id}-${element.fontSize}`} element={{ ...element, html: replacePlaceholders(element.html) }} />;

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

        case "line": {
            const direction = element.direction || "horizontal";
            const strokeWidth = element.strokeWidth || 0.1;
            const color = element.color || "#000000";
            
            if (direction === "horizontal") {
                // Línea horizontal: va de izquierda a derecha
                return (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "stretch",
                            position: "relative"
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: `${Math.max(strokeWidth, 0.1)}mm`,
                                backgroundColor: color,
                                minHeight: "1px",
                                flexShrink: 0
                            }}
                        />
                    </div>
                );
            } else {
                // Línea vertical: va de arriba a abajo
                return (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "stretch",
                            justifyContent: "center",
                            position: "relative"
                        }}
                    >
                        <div
                            style={{
                                width: `${Math.max(strokeWidth, 0.1)}mm`,
                                height: "100%",
                                backgroundColor: color,
                                minWidth: "1px",
                                flexShrink: 0
                            }}
                        />
                    </div>
                );
            }
        }

        default:
            return null;
    }
}
