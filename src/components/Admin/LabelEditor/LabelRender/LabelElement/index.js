// components/LabelElement.js
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { ImageIcon } from "lucide-react";

const formatMap = {
    ean13: "EAN13",
    code128: "CODE128",
    // Agrega más si necesitas
};

export default function LabelElement({ element, getFieldValue = () => "", manualValues = {} }) {
    const commonStyle = {
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        color: element.color,
        textTransform: element.textTransform,
        fontStyle: element.fontStyle,
        textDecoration: element.textDecoration,
    };

    switch (element.type) {
        case "text":
            return <span style={commonStyle}>{element.text}</span>;

        case "field":
            return <span style={commonStyle}>{getFieldValue(element.field || "")}</span>;

        case "manualField":
            return <span style={commonStyle}>{manualValues[element.key] || element.sample || `{{${element.key}}}`}</span>;

        case "qr":
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <QRCode
                        value={(element.qrContent || "").replace(/{{([^}]+)}}/g, (_, f) => getFieldValue(f))}
                        size={Math.min(element.width, element.height)}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            );

        case "barcode":
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <Barcode
                        value={(element.barcodeContent || "").replace(/{{([^}]+)}}/g, (_, f) => getFieldValue(f))}
                        format={formatMap[element.barcodeType || "ean13"]}
                        width={1}
                        height={element.height - 10}
                        displayValue={element.showValue}
                    />
                </div>
            );

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
