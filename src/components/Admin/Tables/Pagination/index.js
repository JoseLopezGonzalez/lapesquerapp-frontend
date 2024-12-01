import React from "react";

export const Pagination = ({ meta, onPageChange }) => {
    if (!meta || meta.totalPages <= 1) return null; // Si no hay múltiples páginas, no renderizar

    const currentPage = meta.currentPage;
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
        <div className="w-full flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between sm:items-center mt-4">
            <div>
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                    <span className="font-semibold text-gray-800 dark:text-neutral-200 mr-1">
                        {totalElements}
                    </span>
                    resultados
                </p>
            </div>
            <nav>
                <ul className="flex items-center -space-x-px h-8 text-sm">
                    <li>
                        <button
                            onClick={() => handleChangePage(1)}
                            disabled={currentPage === 1}
                            className={`flex items-center justify-center px-3 h-8 leading-tight ${
                                currentPage === 1
                                    ? "cursor-not-allowed text-gray-400 bg-gray-100"
                                    : "text-gray-600 bg-white hover:bg-gray-200"
                            } border border-gray-300 rounded-l-lg`}
                        >
                            {"<<"}
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleChangePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`flex items-center justify-center px-3 h-8 leading-tight ${
                                currentPage === 1
                                    ? "cursor-not-allowed text-gray-400 bg-gray-100"
                                    : "text-gray-600 bg-white hover:bg-gray-200"
                            } border border-gray-300`}
                        >
                            {"<"}
                        </button>
                    </li>
                    {pages.map((page) => (
                        <li key={page}>
                            <button
                                onClick={() => handleChangePage(page)}
                                className={`px-3 h-8 leading-tight border ${
                                    page === currentPage
                                        ? "text-white bg-blue-500 border-blue-500"
                                        : "text-gray-600 bg-white border-gray-300 hover:bg-gray-200"
                                }`}
                            >
                                {page}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            onClick={() => handleChangePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`flex items-center justify-center px-3 h-8 leading-tight ${
                                currentPage === totalPages
                                    ? "cursor-not-allowed text-gray-400 bg-gray-100"
                                    : "text-gray-600 bg-white hover:bg-gray-200"
                            } border border-gray-300`}
                        >
                            {">"}
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleChangePage(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`flex items-center justify-center px-3 h-8 leading-tight ${
                                currentPage === totalPages
                                    ? "cursor-not-allowed text-gray-400 bg-gray-100"
                                    : "text-gray-600 bg-white hover:bg-gray-200"
                            } border border-gray-300 rounded-r-lg`}
                        >
                            {">>"}
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
