import React from "react";

export const Pagination = ({ meta, onPageChange }) => {

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
        <div className="w-full flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between sm:items-center">
            <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 mr-1">
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
                            className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight border border-e-0 rounded-s-lg  border-neutral-700/25 text-neutral-400  
                                ${currentPage === 1
                                    ? "cursor-not-allowed text-neutral-400 bg-neutral-900"
                                    : "text-neutral-600 bg-neutral-950 hover:bg-neutral-700 hover:text-white "
                                } `}
                        >
                            <svg className="w-2.5 h-2.5 text-neutral-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 10 16">
                                <path d="M8.766.566A2 2 0 0 0 6.586 1L1 6.586a2 2 0 0 0 0 2.828L6.586 15A2 2 0 0 0 10 13.586V2.414A2 2 0 0 0 8.766.566Z" />
                            </svg>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleChangePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight border  border-neutral-700/25 text-neutral-400  
                                ${currentPage === 1
                                    ? "cursor-not-allowed text-neutral-400 bg-neutral-900"
                                    : "text-neutral-600 bg-neutral-950 hover:bg-neutral-700 hover:text-white "
                                } `}
                        >
                            <svg className="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
                            </svg>
                        </button>
                    </li>
                    {pages.map((page) => (
                        <li key={page}>
                            <button
                                onClick={() => handleChangePage(page)}
                                className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight border  border-neutral-700/25 text-neutral-400  
                                        ${page === currentPage
                                        ? "cursor-not-allowed text-neutral-400 bg-neutral-900"
                                        : "text-neutral-600 bg-neutral-950 hover:bg-neutral-700 hover:text-white "
                                    } `}
                            >
                                {page}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            onClick={() => handleChangePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight border  border-neutral-700/25 text-neutral-400  
                                ${currentPage === totalPages
                                    ? "cursor-not-allowed text-neutral-400 bg-neutral-900"
                                    : "text-neutral-600 bg-neutral-950 hover:bg-neutral-700 hover:text-white "
                                } `}
                        >
                            <svg className="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleChangePage(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`flex items-center justify-center px-3 h-8 ms-0 leading-tight border  rounded-e-lg  border-neutral-700/25 text-neutral-400  
                                ${currentPage === totalPages
                                    ? "cursor-not-allowed text-neutral-400 bg-neutral-900"
                                    : "text-neutral-600 bg-neutral-950 hover:bg-neutral-700 hover:text-white "
                                } `}
                        >
                            <svg className="w-2.5 h-2.5 text-neutral-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 10 16">
                                <path d="M3.414 1A2 2 0 0 0 0 2.414v11.172A2 2 0 0 0 3.414 15L9 9.414a2 2 0 0 0 0-2.828L3.414 1Z" />
                            </svg>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};
