import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight } from "lucide-react";

export function renderButtons(safeValue, cellCtx, onEdit, cellClass) {
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
}
