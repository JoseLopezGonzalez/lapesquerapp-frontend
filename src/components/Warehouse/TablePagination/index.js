"use client";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function TablePagination({
  page,
  lastPage,
  total,
  perPage = 10,
  onPageChange,
}) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = total === 0 ? 0 : Math.min(page * perPage, total);

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
      <p className="flex-1 whitespace-nowrap text-sm text-muted-foreground order-2 sm:order-1">
        {total > 0 ? (
          <>
            {total} resultado{total !== 1 ? "s" : ""}
            <span className="text-muted-foreground/80"> ({from}-{to})</span>
          </>
        ) : (
          "0 resultados"
        )}
      </p>

      <Pagination className="justify-end order-1 sm:order-2">
        <PaginationContent className="gap-0 divide-x overflow-hidden rounded-lg border">
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-none border-0"
              onClick={() => onPageChange(1)}
              disabled={page <= 1 || lastPage <= 1}
              aria-label="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-none border-0"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="flex h-8 min-w-[4.5rem] items-center justify-center px-3 text-sm font-medium tabular-nums">
              {page} / {lastPage}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-none border-0"
              onClick={() => onPageChange(Math.min(lastPage, page + 1))}
              disabled={page >= lastPage}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 rounded-none border-0"
              onClick={() => onPageChange(lastPage)}
              disabled={page >= lastPage || lastPage <= 1}
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
