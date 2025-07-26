import { getSafeValue } from "./utils/getSafeValue";
import { renderByType } from "./utils/renderByType";

export function generateColumns2(headers, { onEdit } = {}) {
  return headers.map((header) => {
    const cellClass = header.hideOnMobile ? "hidden md:table-cell" : "";
    return {
      id: header.name,
      accessorFn: (row) => row?.[header.name],
      header: () => <span className={cellClass}>{header.label}</span>,
      cell: (cellCtx) => {
        if (typeof header.render === "function") {
          return header.render(cellCtx.row.original, { onEdit });
        }

        const value = cellCtx.getValue();
        const safeValue = getSafeValue(value);

        return renderByType(header, value, safeValue, cellCtx, onEdit, cellClass);
      },
      meta: { cellClass },
      ...header.columnProps,
    };
  });
}
