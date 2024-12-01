'use client';

import { useState, useEffect } from "react";
import { GenericTable } from "@/components/Admin/Tables/GenericTable";
import { GenericFilters } from "@/components/Admin/Filters/GenericFilters";
/* import { Pagination } from "@/components/Admin/Tables/Pagination"; */

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
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                const result = await response.json();

                // Procesamos las filas para agregar botones de acciones
                const processedRows = result.data.map((row) => ({
                    id: row.id,
                    supplier: row.supplier?.name || "Desconocido",
                    date: row.date,
                    notes: row.notes || "Sin notas",
                    netWeight: `${row.netWeight} kg`,
                    actions: {
                        view: {
                            label: "Ver",
                            onClick: () => console.log("Ver:", row.id),
                        },
                        delete: {
                            label: "Eliminar",
                            onClick: () => console.log("Eliminar:", row.id),
                        },
                    },
                }));

                setData({
                    loading: false,
                    rows: processedRows,
                });

                setPaginationMeta({
                    currentPage: result.meta.current_page,
                    totalPages: result.meta.last_page,
                    totalItems: result.meta.total,
                    perPage: result.meta.per_page,
                });
                
            } catch (error) {
                console.error("Error al cargar los datos:", error);
                setData({ loading: false, rows: [] });
            }
        };

        fetchData();
    }, [config.endpoint, filters, paginationMeta.currentPage]);

    const handlePageChange = (newPage) => {
        setPaginationMeta((prev) => ({ ...prev, currentPage: parseInt(newPage) }));
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
           {/*  <Pagination meta={paginationMeta} onPageChange={(page) => handlePageChange(page)} /> */}

        </div>
    );
}
