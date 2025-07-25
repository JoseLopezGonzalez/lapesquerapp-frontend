import { Button } from "@/components/ui/button";
import { formatDate, formatDateHour } from "@/helpers/formats/dates/formatDates";
import { formatDecimalCurrency, formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";
import { Pencil, ArrowRight } from "lucide-react";
import React from "react";

const badgeStyles = {
  primary: {
    base: " text-blue-800",
    outline:
      "text-blue-100 border-blue-400 bg-blue-500 dark:text-blue-400 border dark:border-blue-300 dark:bg-blue-800/25",
  },
  success: {
    base: " text-green-800",
    outline:
      " text-green-200 border-green-400 bg-green-600 dark:text-green-400 border  dark:border-green-300  dark:bg-green-800/25",
  },
  warning: {
    base: " text-orange-500",
    outline:
      "text-orange-100 border-orange-400 bg-orange-400 dark:text-orange-400 border dark:border-orange-300 dark:bg-orange-800/25",
  },
  danger: {
    base: " text-red-800",
    outline:
      "text-red-100 border-red-400 bg-red-500 dark:text-red-400 border dark:border-red-300 dark:bg-red-800/25 ",
  },
  neutral: {
    base: " text-neutral-800",
    outline:
      "text-neutral-100 border-neutral-400 bg-neutral-500 dark:text-neutral-400 border dark:border-neutral-300 dark:bg-neutral-800/25",
  },
};

function renderBadge(header, value) {
  const option = header.options?.[value] || header.options?.default;
  if (!option) return value;
  const style = badgeStyles[option.color] || badgeStyles.neutral;
  const className = option.outline ? style.outline : style.base;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {option.label}
    </span>
  );
}

export function generateColumns(headers, { onEdit } = {}) {
  return headers.map((header) => {
    const cellClass = header.hideOnMobile ? "hidden md:table-cell" : "";
    return {
      accessorKey: header.name,
      header: () => (
        <span className={header.hideOnMobile ? "hidden md:table-cell" : ""}>{header.label}</span>
      ),
      cell: (cellCtx) => {
        if (typeof header.render === "function") {
          return header.render(cellCtx.row.original, { onEdit });
        }
        const value = cellCtx.getValue();
        const safeValue = value === undefined || value === null ? "-" : value;
        switch (header.type) {
          case "badge":
            return renderBadge(header, safeValue);
          case "button":
            return (
              <div className={`flex min-w-14 items-center justify-center gap-2 ${cellClass}`}>

                {onEdit && (
                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(cellCtx.row.original.id);
                    }}
                    className="rounded-l-md"
                  >
                    <span className="sr-only">Editar</span>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {safeValue?.view && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      safeValue.view.onClick();
                    }}
                    className="rounded-r-md"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
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
            ) : (
              "-"
            );
          case "id":
            return <span className="font-bold">{safeValue}</span>;
          case "boolean":
            return safeValue === true ? "Sí" : safeValue === false ? "No" : "-";
          case "text":
            /* Prevent N/A */
            return safeValue === "N/A" ? "-" : safeValue;
          default:
            return safeValue;
        }
      },
      meta: {
        cellClass,
      },
      ...header.columnProps,
    };
  });
} 