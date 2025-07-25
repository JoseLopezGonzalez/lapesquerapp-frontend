import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatInteger } from "@/helpers/formats/numbers/formatNumbers";
import React from "react";

export const PaginationFooter = ({ meta, onPageChange, currentPage, selectedRows }) => {

    /* const currentPage = meta.currentPage; */
    const totalPages = meta.totalPages;
    const totalElements = meta.totalItems;
    const maxPagesToShow = 5;



    const handleChangePage = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            onPageChange(newPage);
        }
    };

    const generatePageNumbers = () => {
        let pages = [];
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
            const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;

            if (currentPage <= maxPagesBeforeCurrentPage) {
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - maxPagesBeforeCurrentPage;
                endPage = currentPage + maxPagesAfterCurrentPage;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const pages = generatePageNumbers();

    return (
        <div className="w-full flex justify-end items-center p-2 ">
            <div className=" w-fit">
                {selectedRows.length > 0 && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 text-nowrap">
                        <span className="font-semibold">{formatInteger(selectedRows.length)}</span> de <span className="font-semibold ">{formatInteger(totalElements)}</span> resultados seleccionados
                    </p>
                )}
                {selectedRows.length === 0 && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 mr-1">
                            {formatInteger(totalElements)}
                        </span>
                        resultados
                    </p>
                )}
            </div>
            <Pagination className='w-full flex justify-end items-center'>
                <PaginationContent>
                    {/* Botón de página anterior */}
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleChangePage(currentPage - 1);
                            }}
                            disabled={currentPage === 1}
                        />
                    </PaginationItem>

                    {/* Primera página si está lejos de la actual */}
                    {currentPage > maxPagesToShow && (
                        <>
                            <PaginationItem>
                                <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleChangePage(1);
                                    }}
                                >
                                    1
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        </>
                    )}

                    {/* Páginas visibles */}
                    {pages.map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleChangePage(page);
                                }}
                                isActive={page === currentPage}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    {/* Última página si está lejos de la actual */}
                    {currentPage < totalPages - maxPagesToShow && (
                        <>
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleChangePage(totalPages);
                                    }}
                                >
                                    {totalPages}
                                </PaginationLink>
                            </PaginationItem>
                        </>
                    )}

                    {/* Botón de página siguiente */}
                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleChangePage(currentPage + 1);
                            }}
                            disabled={currentPage === totalPages}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};
