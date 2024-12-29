'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GenericTable } from '@/components/Admin/Tables/GenericTable';
import { GenericFilters } from '@/components/Admin/Filters/GenericFilters/GenericFilters';
import { Pagination } from '@/components/Admin/Tables/Pagination';
import { Header } from '@/components/Admin/Tables/GenericTable/Header';
import { Body } from '@/components/Admin/Tables/GenericTable/Body';
import { Footer } from '@/components/Admin/Tables/GenericTable/Footer';
import { API_URL_V1 } from '@/configs/config';
import { PlusIcon } from '@heroicons/react/20/solid';

const initialPaginationMeta = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10,
};

const initialData = {
    loading: true,
    rows: [],
};

// Helper function to handle nested paths
function getValueByPath(object, path) {
    return path?.split('.').reduce((acc, key) => acc?.[key] ?? 'N/A', object);
}

export default function EntityClient({ config }) {
    const [data, setData] = useState(initialData);
    const [filters, setFilters] = useState({});
    const [paginationMeta, setPaginationMeta] = useState(initialPaginationMeta);
    const router = useRouter();

    // Fetch Data
    useEffect(() => {
        if (!config?.endpoint) return;

        const fetchData = async () => {
            setData((prevData) => ({ ...prevData, loading: true }));

            /* formatear filtros a partir de 
                [
                    {
                        "name": "search",
                        "value": "12"
                    },
                    {
                        "name": "supplier",
                        "value": ""
                    },
                    {
                        "name": "notes",
                        "value": ""
                    },
                    {
                        "name": "date",
                        "value": {
                            "start": "",
                            "end": ""
                        }
                    }
                ] 
            */

            const formattedFilters = filters.length > 0 ? filters.reduce((acc, filter) => {
                if (filter.type === 'dateRange') {
                    if (filter.value.start) acc[filter.name + '_start'] = filter.value.start;
                    if (filter.value.end) acc[filter.name + '_end'] = filter.value.end;
                }
                else if (filter.type === 'autocomplete' && filter.value)
                    acc[filter.name] = filter.value.map((item) => item.id);
                else if (filter.value) acc[filter.name] = filter.value;
                return acc;
            }, {}) : {};

            const queryParams = new URLSearchParams({
                page: paginationMeta.currentPage,
            });

            // Si hay arrays, agrégales manualmente al query string
            Object.keys(formattedFilters).forEach((key) => {
                const value = formattedFilters[key];
                if (Array.isArray(value)) {
                    value.forEach((item) => {
                        queryParams.append(`${key}[]`, item);
                    });
                } else {
                    queryParams.append(key, value);
                }
            });

            const url = `${API_URL_V1}${config.endpoint}?${queryParams.toString()}`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const result = await response.json();

                const processedRows = result.data.map((row) => {
                    const rowData = config.table.headers.reduce((acc, header) => {
                        if (header.path) {
                            acc[header.name] = getValueByPath(row, header.path);
                        } else {
                            acc[header.name] = row[header.name] || 'N/A';
                        }
                        return acc;
                    }, {});

                    return {
                        ...rowData,
                        actions: {
                            view: {
                                label: 'Ver',
                                onClick: () => {
                                    const viewUrl = config.viewRoute.replace(':id', row.id);
                                    router.push(viewUrl);
                                },
                            },
                            delete: {
                                label: 'Eliminar',
                                onClick: async () => handleDelete(row.id),
                            },
                        },
                    };
                });

                setData({ loading: false, rows: processedRows });
                setPaginationMeta({
                    currentPage: result.meta.current_page,
                    totalPages: result.meta.last_page,
                    totalItems: result.meta.total,
                    perPage: result.meta.per_page,
                });
            } catch (error) {
                console.error('Error fetching data:', error);
                setData((prevData) => ({ ...prevData, loading: false }));
            }
        };

        fetchData();
    }, [config.endpoint, filters, paginationMeta.currentPage]);

    const handlePageChange = (newPage) => {
        setPaginationMeta((prev) => ({ ...prev, currentPage: parseInt(newPage, 10) }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;

        const deleteUrl = config.deleteEndpoint.replace(':id', id);

        try {
            const response = await fetch(`${API_URL_V1}${deleteUrl}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                alert('Elemento eliminado con éxito.');
                setData((prevData) => ({
                    ...prevData,
                    rows: prevData.rows.filter((item) => item.id !== id),
                }));
            } else {
                alert('Hubo un error al intentar eliminar el elemento.');
            }
        } catch (error) {
            alert('No se pudo conectar al servidor.');
        }
    };

    const headerData = {
        title: config.title,
        description: config.description,
    };

    return (
        <div>
            <GenericTable>
                <Header data={headerData} >
                    <GenericFilters
                        data={{
                            configFilters: config.filters,
                            updateFilters: (filters) => setFilters(filters),
                        }}
                    />
                    <div>
                        <button
                            /* Redirect to config.createPath */
                            onClick={() => router.push(config.createPath)}
                            type="button" className="py-1.5 px-3 inline-flex items-center gap-1 text-sm  rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none border-2 border-neutral-800">
                            <PlusIcon className="h-5 w-5" aria-hidden="true" />
                            Nuevo
                        </button>
                    </div>
                </Header>
                <Body table={config.table} data={data} />
                <Footer>
                    <Pagination
                        meta={paginationMeta}
                        onPageChange={handlePageChange}
                    />
                </Footer>
            </GenericTable>
        </div>
    );
}
