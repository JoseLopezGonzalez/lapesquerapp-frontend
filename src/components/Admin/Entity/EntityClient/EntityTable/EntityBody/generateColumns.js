import { getSafeValue } from "./utils/getSafeValue";
import { renderByType } from "./utils/renderByType";
import { Button } from "@/components/ui/button";
import { ArrowBigRight, ArrowLeft, ArrowRight, Edit, Eye, Pencil } from "lucide-react";

export function generateColumns2(headers, { onEdit, onView, config } = {}) {
  // Generate columns from headers
  const baseColumns = headers.map((header) => {
    const cellClass = header.hideOnMobile ? "hidden md:table-cell" : "";
    return {
      id: header.name,
      accessorFn: (row) => row?.[header.name],
      header: () => <span className={cellClass}>{header.label}</span>,
      cell: (cellCtx) => {
        const value = cellCtx.getValue();
        const safeValue = getSafeValue(value);

        return renderByType(header, value, safeValue, cellCtx, onEdit, cellClass);
      },
      meta: { cellClass },
      ...header.columnProps,
    };
  });

  // Check if actions should be hidden
  const hideViewButton = config?.hideViewButton || false;
  const hideEditButton = config?.hideEditButton || false;
  const hideActions = (config?.hideActions || false) || (hideEditButton && hideViewButton);

  // Only add actions column if not hidden and at least one action is available
  if (hideActions || (!onView && !onEdit)) {
    return baseColumns;
  }

  // Automatically add actions column at the end
  const actionsColumn = {
    id: "actions",
    header: () => <span className="text-center"></span>, // Header vacío
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex items-center justify-center gap-2">
          {onEdit && !hideEditButton && (
            <Button
              size="icon"
              onClick={() => onEdit(id)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onView && !hideViewButton && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onView(id)}
              title="Ver detalles"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 100,
    meta: { cellClass: "text-center" },
  };

  return [...baseColumns, actionsColumn];
}
