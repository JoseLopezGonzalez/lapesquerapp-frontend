'use client';

import { useState, useEffect } from "react";
import { GenericTable } from "@/components/Admin/Tables/GenericTable";
import { GenericFilters } from "@/components/Admin/Filters/GenericFilters";
import { Pagination } from "@/components/Admin/Tables/Pagination";

export default function EntityClient({ config }) {
    const [data, setData] = useState({ loading: true, rows: [] });
    const [filters, setFilters] = useState({});
    const [paginationMeta, setPaginationMeta] = useState({
        currentPage: 1,
        totalPages: 1,
    });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    useEffect(() => {
        if (!config.endpoint) return;

        const fetchData = async () => {
            setData({ loading: true, rows: [] });

            try {
                // Construimos los parámetros de consulta (query parameters)
                const queryParams = new URLSearchParams({
                    page: paginationMeta.currentPage,
                    ...filters, // Agregamos los filtros como parámetros
                });

                const response = await fetch(`${config.endpoint}?${queryParams.toString()}`, {
                    method: "GET", // Cambiamos a GET
                    headers: { "Content-Type": "application/json" },
                });

                let result = await response.json();

                result= result.data;

                setData({
                    loading: false,
                    rows: result.data || [],
                });

                setPaginationMeta((prev) => ({
                    ...prev,
                    totalPages: result.meta?.totalPages || 1,
                }));
            } catch (error) {
                console.error("Error al cargar los datos:", error);
                setData({ loading: false, rows: [] });
            }
        };


        fetchData();
    }, [config.endpoint, filters, paginationMeta.currentPage]);

    const handlePageChange = (newPage) => {
        setPaginationMeta((prev) => ({ ...prev, currentPage: newPage }));
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white">{config.title}</h1>
            <p className="text-neutral-400">{config.description}</p>

            {/* Botón y Modal de Filtros */}
            <button
                onClick={() => setIsFilterModalOpen(true)}
                className="py-2 px-3 bg-blue-500 text-white rounded-md mb-4"
            >
                Filtros
            </button>
            <GenericFilters
                config={config.filters}
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
                config={config}
                onAction={(action, payload) => console.log(action, payload)}
            />

            {/* Paginación */}
            <Pagination meta={paginationMeta} onPageChange={handlePageChange} />
        </div>
    );
}
