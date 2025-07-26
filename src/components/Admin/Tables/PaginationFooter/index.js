import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import React from "react";

export const PaginationFooter = ({ meta, onPageChange, currentPage }) => {
    const totalPages = meta.totalPages;
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
    );
};
