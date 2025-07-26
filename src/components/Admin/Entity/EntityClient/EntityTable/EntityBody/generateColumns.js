import { getSafeValue } from "./utils/getSafeValue";
import { renderByType } from "./utils/renderByType";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";

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
  const hideActions = config?.hideActions || false;
  const hideViewButton = config?.hideViewButton || false;
  const hideEditButton = config?.hideEditButton || false;

  // Only add actions column if not hidden and at least one action is available
  if (hideActions || (!onView && !onEdit)) {
    return baseColumns;
  }

  // Automatically add actions column at the end
  const actionsColumn = {
    id: "actions",
    header: () => <span className="text-center">Acciones</span>,
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex items-center justify-center gap-2">
          {onView && !hideViewButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(id)}
              className="h-8 w-8 p-0"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && !hideEditButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(id)}
              className="h-8 w-8 p-0"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
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
