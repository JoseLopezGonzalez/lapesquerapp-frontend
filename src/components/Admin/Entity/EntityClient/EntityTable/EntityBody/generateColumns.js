import { getSafeValue } from "./utils/getSafeValue";
import { renderByType } from "./utils/renderByType";
import { Button } from "@/components/ui/button";
import { ArrowRight, Edit, Pencil, Send } from "lucide-react";

export function generateColumns2(headers, { onEdit, onView, onResendInvitation, config } = {}) {
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

  const hideViewButton = config?.hideViewButton || false;
  const hideEditButton = config?.hideEditButton || false;
  const hideActions = (config?.hideActions || false) || (hideEditButton && hideViewButton);
  const hasResendInvitation = config?.endpoint === "users" && typeof onResendInvitation === "function";

  const hasAnyAction = onView || onEdit || hasResendInvitation;
  if (!hasAnyAction || (hideActions && !hasResendInvitation)) {
    return baseColumns;
  }

  const actionsColumn = {
    id: "actions",
    header: () => <span className="text-center"></span>,
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {onEdit && !hideEditButton && (
            <Button size="icon" onClick={() => onEdit(id)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onView && !hideViewButton && (
            <Button variant="outline" size="icon" onClick={() => onView(id)} title="Ver detalles">
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {hasResendInvitation && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onResendInvitation(id)}
              title="Reenviar invitación"
            >
              <Send className="h-4 w-4" />
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
