'use client';

import { useState, useEffect } from "react";


import { rawMaterialReceptionsConfig } from "@/configs/rawMaterialReceptionsConfig";
import { GenericTable } from "@/components/Admin/Tables/GenericTable";
import { GenericFilters } from "@/components/Admin/Filters/GenericFilters";
import { Pagination } from "@/components/Admin/Tables/Pagination";

const RawMaterialReceptionsPage = () => {
  const [data, setData] = useState({ loading: true, rows: [] });
  const [filters, setFilters] = useState({}); // Filtros aplicados
  const [paginationMeta, setPaginationMeta] = useState({
    currentPage: 1,
    totalPages: 3,
  }); // Metadatos de la paginación
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    // Simula una llamada a la API con paginación y filtros
    setTimeout(() => {
      const allRows = [
        {
          id: 1,
          supplier: "Proveedor A",
          notes: "Nota 1",
          netWeight: "10kg",
          date: "2024-12-01",
          actions: {
            view: { label: "Ver", onClick: () => console.log("Ver elemento 1") },
            delete: { label: "Eliminar", onClick: () => console.log("Eliminar elemento 1") },
          },
        },
        {
          id: 2,
          supplier: "Proveedor B",
          notes: "Nota 2",
          netWeight: "15kg",
          date: "2024-12-01",
          actions: {
            view: { label: "Ver", onClick: () => console.log("Ver elemento 2") },
            delete: { label: "Eliminar", onClick: () => console.log("Eliminar elemento 2") },
          },
        },
        // Agrega más filas para simular varias páginas
      ];

      const rowsPerPage = 1; // Número de filas por página
      const offset = (paginationMeta.currentPage - 1) * rowsPerPage;

      // Simula paginación en el frontend
      const paginatedRows = allRows.slice(offset, offset + rowsPerPage);

      setData({
        loading: false,
        rows: paginatedRows,
      });

      setPaginationMeta((prev) => ({
        ...prev,
        totalPages: Math.ceil(allRows.length / rowsPerPage),
      }));
    }, 500);
  }, [filters, paginationMeta.currentPage]);

  const handlePageChange = (newPage) => {
    setPaginationMeta((prev) => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">
        {rawMaterialReceptionsConfig.title}
      </h1>
      <p className="text-neutral-400">
        {rawMaterialReceptionsConfig.description}
      </p>

      {/* Botón y Modal de Filtros */}
      <button
        onClick={() => setIsFilterModalOpen(true)}
        className="py-2 px-3 bg-blue-500 text-white rounded-md mb-4"
      >
        Filtros
      </button>
      <GenericFilters
        config={rawMaterialReceptionsConfig.filters}
        open={isFilterModalOpen}
        onApply={(appliedFilters) => {
          setFilters(appliedFilters);
          setIsFilterModalOpen(false);
        }}
        onReset={() => setFilters({})}
        onClose={() => setIsFilterModalOpen(false)}
      />

      {/* Tabla genérica */}
      <GenericTable
        data={data}
        config={rawMaterialReceptionsConfig}
        onAction={(action, payload) => console.log(action, payload)}
      />

      {/* Paginación */}
      <Pagination meta={paginationMeta} onPageChange={handlePageChange} />
    </div>
  );
};

export default RawMaterialReceptionsPage;
