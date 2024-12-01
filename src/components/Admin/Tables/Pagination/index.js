import React from "react";

export const Pagination = ({ meta, onPageChange }) => {
  const { currentPage, totalPages } = meta;

  if (!totalPages || totalPages === 1) return null; // No mostrar si no hay más de una página

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  // Generar botones de paginación
  const renderPageButtons = () => {
    const buttons = [];
    const maxButtons = 5; // Máximo número de botones visibles
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    for (let page = startPage; page <= endPage; page++) {
      buttons.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-1 rounded-md ${
            page === currentPage
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          {page}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
        disabled={currentPage === 1}
      >
        Anterior
      </button>
      <div className="flex space-x-2">{renderPageButtons()}</div>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
        disabled={currentPage === totalPages}
      >
        Siguiente
      </button>
    </div>
  );
};
