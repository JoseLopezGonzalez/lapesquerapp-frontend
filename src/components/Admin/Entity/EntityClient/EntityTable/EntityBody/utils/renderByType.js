import { formatDate, formatDateHour } from "@/helpers/formats/dates/formatDates";
import { formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { getSafeValue } from "./getSafeValue";
import { renderBadge } from "./renderBadge";
import { renderButtons } from "./renderButtons";
import React from "react";

export function renderByType(header, value, safeValue, cellCtx, onEdit, cellClass) {
    switch (header.type) {
        case "badge":
            return renderBadge(header, value);
        case "button":
            return renderButtons(safeValue, cellCtx, onEdit, cellClass);
        case "date":
            return safeValue === "-" ? "-" : formatDate(safeValue);
        case "dateHour":
            return safeValue === "-" ? "-" : formatDateHour(safeValue);
        case "currency":
            return safeValue === "-" ? "-" : formatDecimalCurrency(safeValue);
        case "weight":
            return safeValue === "-" ? "-" : formatDecimalWeight(safeValue);
        case "list":
            return Array.isArray(safeValue) && safeValue.length > 0 ? (
                <ul>{safeValue.map((item, i) => <li key={i}>{item}</li>)}</ul>
            ) : "-";
        case "id":
            return <span className="font-bold">{safeValue}</span>;
        case "boolean":
            return safeValue === true ? "Sí" : safeValue === false ? "No" : "-";
        case "text":
            return safeValue === "N/A" ? "-" : safeValue;
        default:
            return safeValue;
    }
}
