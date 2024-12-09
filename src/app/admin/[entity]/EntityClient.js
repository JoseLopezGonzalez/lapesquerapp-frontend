'use client';

import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import { GenericTable } from "@/components/Admin/Tables/GenericTable";
import { GenericFilters } from "@/components/Admin/Filters/GenericFilters";
import { Pagination } from "@/components/Admin/Tables/Pagination";
import { Header } from "@/components/Admin/Tables/GenericTable/Header";
/* Cambiar rutas como en Modal, para de una acceder a todo */
import { Body } from "@/components/Admin/Tables/GenericTable/Body";
import { Footer } from "@/components/Admin/Tables/GenericTable/Footer";
import { API_URL_V1 } from "@/configs/config";

const initialPaginationMeta = {
    currentPage: 1,
    totalPages: 1,
};

const initialData = {
    loading: true,
    rows: [],
};

export default function EntityClient({ config }) {
    const [data, setData] = useState(initialData);
    const [filters, setFilters] = useState({});
    const [paginationMeta, setPaginationMeta] = useState(initialPaginationMeta);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!config.endpoint) return;

        const fetchData = async () => {
            setData(initialData);

            const queryParams = new URLSearchParams({
                page: paginationMeta.currentPage,
                ...filters, // Agregamos los filtros como parámetros
            });

            const url = `${API_URL_V1}${config.endpoint}?${queryParams.toString()}`

            return await fetch(url)
                .then(response => response.json())
                .then(result => {

                    const processedRows = result.data.map((row) => ({
                        id: row.id,
                        supplier: row.supplier?.name || "Desconocido",
                        date: row.date,
                        notes: row.notes || "Sin notas",
                        netWeight: `${row.netWeight} kg`,
                        actions: {
                            view: {
                                label: "Ver",
                                onClick: () => {
                                    const viewUrl = config.viewRoute.replace(":id", row.id);
                                    /* window.location.href = viewUrl; // Redirigir al usuario */
                                    router.push(viewUrl); // Redirigir con Next.js
                                },
                            },
                            delete: {
                                label: "Eliminar",
                                onClick: async () => {
                                    if (window.confirm("¿Estás seguro de que deseas eliminar este elemento?")) {
                                        const deleteUrl = config.deleteEndpoint.replace(":id", row.id);

                                        try {
                                            const response = await fetch(`${API_URL_V1}${deleteUrl}`, {
                                                method: "DELETE",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                },
                                            });

                                            if (response.ok) {
                                                alert("Elemento eliminado con éxito.");
                                                setData((prevData) => ({
                                                    ...prevData,
                                                    rows: prevData.rows.filter((item) => item.id !== row.id),
                                                }));
                                            } else {
                                                console.error("Error al eliminar:", response.statusText);
                                                alert("Hubo un error al intentar eliminar el elemento.");
                                            }
                                        } catch (error) {
                                            console.error("Error de red:", error);
                                            alert("No se pudo conectar al servidor.");
                                        }
                                    }
                                },
                            }
                        }
                    }));

                    setData(prevData => {
                        return {
                            ...prevData,
                            rows: processedRows,
                        }
                    });

                    setPaginationMeta({
                        currentPage: result.meta.current_page,
                        totalPages: result.meta.last_page,
                        totalItems: result.meta.total,
                        perPage: result.meta.per_page,
                    });

                })
                /* IMPLEMENTAR: Error con hot toast */
                .catch(error => console.log(error))
                .finally(() => {
                    setData(prevData => {
                        return {
                            ...prevData,
                            loading: false,
                        }
                    })
                });


        };

        fetchData();

    }, [config.endpoint, filters, paginationMeta.currentPage]);

    const handlePageChange = (newPage) => {
        setPaginationMeta((prev) => ({ ...prev, currentPage: parseInt(newPage) }));
    };

    const headerData = {
        title: config.title,
        description: config.description,
    }

    return (
        <div>
            <GenericFilters
                config={config.filters}
                open={isFilterModalOpen}
                onApply={(appliedFilters) => { setFilters(appliedFilters); setIsFilterModalOpen(false); }}
                onReset={() => setFilters({})}
                onClose={() => setIsFilterModalOpen(false)}
            />

            {/* <button
                onClick={() => setIsFilterModalOpen(true)}
                className="py-2 px-3 bg-blue-500 text-white rounded-md mb-4"
            >
                Filtros
            </button> */}

            <GenericTable>
                <Header data={headerData} />
                <Body table={config.table} data={data} />
                <Footer>
                    <Pagination meta={paginationMeta} onPageChange={(page) => handlePageChange(page)} />
                </Footer>
            </GenericTable>
        </div>
    );
}
