'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GenericTable } from '@/components/Admin/Tables/GenericTable';
import { GenericFilters } from '@/components/Admin/Filters/GenericFilters/GenericFilters';
import { PaginationFooter } from '@/components/Admin/Tables/PaginationFooter';
import { Header } from '@/components/Admin/Tables/GenericTable/Header';
import { Body } from '@/components/Admin/Tables/GenericTable/Body';
import { Footer } from '@/components/Admin/Tables/GenericTable/Footer';
import { API_URL_V2 } from '@/configs/config';
import { ArrowDownTrayIcon, ChartPieIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaRegFilePdf } from "react-icons/fa";
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { EllipsisVertical } from 'lucide-react';




const initialData = {
    loading: true,
    rows: [],
};

const initialPaginationMeta = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 12,
};

// Helper function to handle nested paths
function getValueByPath(object, path) {
    return path?.split('.').reduce((acc, key) => acc?.[key] ?? 'N/A', object);
}

// Reusable filter formatting function
const formatFilters = (filters) => {
    const formattedFilters = filters.reduce((acc, filter) => {
        if (filter.type === 'dateRange' && filter.value) {
            if (filter.value.from) acc[`${filter.name}[start]`] = filter.value.from;
            if (filter.value.to) acc[`${filter.name}[end]`] = filter.value.to;
        } else if (filter.type === 'autocomplete' && filter.value) {
            acc[filter.name] = filter.value.map((item) => item.id);
        } else if (filter.value) {
            acc[filter.name] = filter.value;
        }
        return acc;
    }, {});

    const searchFilter = filters.find((filter) => filter.type === 'search');
    if (searchFilter?.value) {
        formattedFilters['search'] = searchFilter.value;
    }

    const queryParams = new URLSearchParams();

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

    return queryParams.toString();
};

const formatFiltersObject = (filters) => {
    const result = {};

    filters.forEach((filter) => {
        if (filter.type === 'autocomplete') {
            result[filter.name] = (filter.value || []).map((item) => item.id);
        } else if (filter.type === 'dateRange') {
            result[filter.name] = {
                start: filter.value?.from || null,
                end: filter.value?.to || null,
            };
        } else {
            result[filter.name] = filter.value;
        }
    });

    return result;
};



/* Fetch Export */
const getEntityExport = async (url, fileName) => {
    /* Current date formatted DD-MM-AAAA*/
    const currentDate = new Date().toLocaleDateString().split('/').join('-');

    const session = await getSession(); // Obtener sesión actual

    return await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.user?.accessToken}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente

        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `${fileName} (${currentDate})`; // Nombre del archivo para guardar
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        })
        /* .then(response => response.data) */
        .catch(error => console.log(error))
        .finally(() => console.log('Finalizado'));
};

const getEntityReport = async (url, fileName) => {
    /* Current date formatted DD-MM-AAAA*/
    const currentDate = new Date().toLocaleDateString().split('/').join('-');

    const session = await getSession(); // Obtener sesión actual


    return await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.user?.accessToken}`, // Enviar el token
            'User-Agent': navigator.userAgent, // Incluye el User-Agent del cliente

        },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `${fileName} (${currentDate})`; // Nombre del archivo para guardar
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        })
        /* .then(response => response.data) */
        .catch(error => console.log(error))
        .finally(() => console.log('Finalizado'));
};

/* POR IMPLEMENTAR_____________
- Ojo con Eliminar mas de un id 
- Modal Eliminar 
- Skeleton
- Poner pagina uno cuando se aplica un filtro.
- cuando click en navegacion navbar se cierre le navbar en mobile
*/


export default function EntityClient({ config }) {

    const [data, setData] = useState(initialData);
    const [filters, setFilters] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState(initialPaginationMeta);

    const [selectedRows, setSelectedRows] = useState([]);

    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(1);



    // Fetch Data


    useEffect(() => {
        const fetchDataWithFilters = async () => {
            // Restablece la página a 1 cuando los filtros cambian

            setData((prevData) => ({ ...prevData, loading: true }));
            setCurrentPage(1); // Resetea la página a 1 cuando cambian los filtros
            const queryString = formatFilters(filters);

            // Añadir al queryString el perPage
            const perPage = config?.perPage || 12;
            const url = `${API_URL_V2}${config.endpoint}?${queryString}&page=1&perPage=${perPage}`;

            try {
                const session = await getSession(); // Obtener sesión actual

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session?.user?.accessToken}`,
                        'User-Agent': navigator.userAgent,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('No estás autenticado. Por favor, inicia sesión.');
                    }
                    if (response.status === 403) {
                        throw new Error('No tienes permiso para acceder a esta ruta.');
                    }
                    throw new Error(`Error: ${response.statusText}`);
                }

                const result = await response.json();

                const processedRows = result.data.map((row) => {
                    const rowData = config.table.headers.reduce((acc, header) => {
                        acc[header.name] = header.path
                            ? getValueByPath(row, header.path)
                            : row[header.name] || 'N/A';
                        return acc;
                    }, {});

                    return {
                        ...rowData,
                        actions: {
                            view: {
                                label: 'Ver',
                                onClick: () => {
                                    const viewUrl = config.viewRoute.replace(':id', row.id);
                                    window.open(viewUrl, '_blank');
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
                toast.error(error.message, getToastTheme());
                setData((prevData) => ({ ...prevData, loading: false }));
            }
        };

        fetchDataWithFilters();
    }, [config.endpoint, filters]); // Este useEffect depende solo de los filtros


    // useEffect para manejar cambios en la página
    useEffect(() => {
        if (currentPage === 1) return;
        const fetchDataWithPageChange = async () => {
            setData((prevData) => ({ ...prevData, loading: true }));

            const queryString = formatFilters(filters);
            // Añadir al queryString el perPage
            const perPage = config?.perPage || 12;
            const url = `${API_URL_V2}${config.endpoint}?${queryString}&page=${currentPage}&perPage=${perPage}`;

            try {
                const session = await getSession(); // Obtener sesión actual

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session?.user?.accessToken}`,
                        'User-Agent': navigator.userAgent,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('No estás autenticado. Por favor, inicia sesión.');
                    }
                    if (response.status === 403) {
                        throw new Error('No tienes permiso para acceder a esta ruta.');
                    }
                    throw new Error(`Error: ${response.statusText}`);
                }

                const result = await response.json();

                const processedRows = result.data.map((row) => {
                    const rowData = config.table.headers.reduce((acc, header) => {
                        acc[header.name] = header.path
                            ? getValueByPath(row, header.path)
                            : row[header.name] || 'N/A';
                        return acc;
                    }, {});

                    return {
                        ...rowData,
                        actions: {
                            view: {
                                label: 'Ver',
                                onClick: () => {
                                    const viewUrl = config.viewRoute.replace(':id', row.id);
                                    window.open(viewUrl, '_blank');
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
                toast.error(error.message, getToastTheme());
                setData((prevData) => ({ ...prevData, loading: false }));
            }
        };


        fetchDataWithPageChange();
    }, [currentPage]); // Este useEffect depende solo de la página

    const handlePageChange = (newPage) => {
        setCurrentPage(parseInt(newPage, 10));
        /* setPaginationMeta((prev) => ({ ...prev, currentPage: parseInt(newPage, 10) })); */
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;

        const deleteUrl = config.deleteEndpoint.replace(':id', id);

        try {
            const session = await getSession();

            const response = await fetch(`${API_URL_V2}${deleteUrl}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                    'User-Agent': navigator.userAgent,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                toast.success('Elemento eliminado con éxito.');
                setData((prevData) => ({
                    ...prevData,
                    rows: prevData.rows.filter((item) => item.id !== id),
                }));
                setSelectedRows((prevSelected) => prevSelected.filter((rowId) => rowId !== id));
            } else {
                toast.error('Hubo un error al intentar eliminar el elemento.');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSelectedRowsDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar estos elementos?')) return;

        const deleteUrl = config.deleteEndpoint.includes(':id')
            ? config.deleteEndpoint.replace('/:id', '')
            : config.deleteEndpoint;

        try {
            const session = await getSession();

            const response = await fetch(`${API_URL_V2}${deleteUrl}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                    'User-Agent': navigator.userAgent,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: selectedRows }),
            });

            if (response.ok) {
                toast.success('Elementos eliminados con éxito.');
                setData((prevData) => ({
                    ...prevData,
                    rows: prevData.rows.filter((item) => !selectedRows.includes(item.id)),
                }));
                setSelectedRows([]); // no funciona
                console.log('Selected rows after deletion:', selectedRows);
                /* Selected rows after deletion: [11] */
                setTimeout(() => {
                    setSelectedRows([]);
                }, 0);
            } else {
                toast.error('Hubo un error al intentar eliminar los elementos.');
            }
        } catch (error) {
            toast.error(error.message || 'No se pudo conectar al servidor.');
        }
    };


    const handleGlobalAction = async (action) => {
        const applyTo =
            selectedRows.length > 0 ? 'selected' :
                filters.length > 0 ? 'filtered' : 'all';

        if (action.confirmation && !window.confirm(action.confirmation)) return;

        let body = { ...(action.body || {}) };

        if (applyTo === 'selected') {
            body.ids = selectedRows;
        } else if (applyTo === 'filtered') {
            body.filters = formatFiltersObject(filters);
        } else {
            body.applyToAll = true;
        }

        try {
            const session = await getSession();

            const response = await fetch(`${API_URL_V2}${action.endpoint}`, {
                method: action.method || 'POST',
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                    'User-Agent': navigator.userAgent,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                toast.success(action.successMessage || 'Acción completada con éxito');
                setSelectedRows([]);
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error(action.errorMessage || 'Hubo un error al ejecutar la acción.');
        }
    };




    const handleExport = async (exportOption) => {
        const { endpoint, fileName, type, waitingMessage } = exportOption;
        const queryString = formatFilters(filters, paginationMeta);
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {type === 'pdf' ? (<FaRegFilePdf className="h-6 w-6 text-red-500" aria-hidden="true" />)
                    : type === 'excel' ? (<PiMicrosoftExcelLogoFill className="h-6 w-6 text-green-500" aria-hidden="true" />)
                        : null}
                {waitingMessage || 'Generando exportación...'}
            </span>
        ), getToastTheme());

        return await getEntityExport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    {/* <PiMicrosoftExcelLogoFill className="h-6 w-6 text-white" aria-hidden="true" /> */}
                    Exportación generada correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
    };

    const handleReport = async (reportOption) => {
        const { endpoint, fileName, waitingMessage } = reportOption;
        const queryString = formatFilters(filters, paginationMeta);
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {waitingMessage || 'Generando reporte...'}
            </span>
        ), getToastTheme());

        return await getEntityReport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Reporte generado correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
    };

    const handleSelectedRowsExport = async (exportOption) => {
        const { endpoint, fileName, type, waitingMessage } = exportOption;
        const queryString = `ids[]=${selectedRows.join('&ids[]=')}`;
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {type === 'pdf' ? (<FaRegFilePdf className="h-6 w-6 text-red-500" aria-hidden="true" />)
                    : type === 'excel' ? (<PiMicrosoftExcelLogoFill className="h-6 w-6 text-green-500" aria-hidden="true" />)
                        : null}
                {waitingMessage || 'Generando exportación...'}
            </span>
        ), getToastTheme());

        return await getEntityExport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    {/* <PiMicrosoftExcelLogoFill className="h-6 w-6 text-white" aria-hidden="true" /> */}
                    Exportación generada correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
    };

    const handleSelectedRowsReport = async (reportOption) => {
        const { endpoint, fileName, waitingMessage } = reportOption;
        const queryString = `ids[]=${selectedRows.join('&ids[]=')}`;
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {waitingMessage || 'Generando reporte...'}
            </span>
        ), getToastTheme());

        return await getEntityReport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Reporte generado correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
    };

    const handleOnSelectionChange = (selectedRows) => {
        setSelectedRows(selectedRows);
    }

    const headerData = {
        title: config.title,
        description: config.description,
    };

    return (
        <div className='h-full w-full '>
            <GenericTable>
                <Header data={headerData}>
                    {selectedRows.length > 0 && (
                        <>
                            <Button
                                onClick={handleSelectedRowsDelete}
                                variant='destructive'
                            >
                                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                <span className='hidden xl:flex'>Eliminar</span>
                            </Button>

                            {/* Reports */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Reportes</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.reports?.map((reportOption) => (
                                        <DropdownItem
                                            key={reportOption.title}
                                            onClick={() => handleSelectedRowsReport(reportOption)}
                                        >
                                            {reportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>

                            {/* Export */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Exportar</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.exports?.map((exportOption) => (
                                        <DropdownItem
                                            key={exportOption.title}
                                            onClick={() => handleSelectedRowsExport(exportOption)}
                                            startContent={
                                                exportOption.type === 'excel'
                                                    ? <PiMicrosoftExcelLogoFill className="text-green-700 w-6 h-6" />
                                                    : <FaRegFilePdf className="text-red-800 w-5 h-5" />
                                            }
                                        >
                                            {exportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>



                        </>
                    )}

                    {selectedRows.length === 0 && (
                        <>
                            {/* Reports */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Reportes</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.reports?.map((reportOption) => (
                                        <DropdownItem
                                            key={reportOption.title}
                                            onClick={() => handleReport(reportOption)}
                                        >
                                            {reportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                            {/* Export */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Exportar</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.exports?.map((exportOption) => (
                                        <DropdownItem
                                            key={exportOption.title}
                                            onClick={() => handleExport(exportOption)}
                                            startContent={
                                                exportOption.type === 'excel'
                                                    ? <PiMicrosoftExcelLogoFill className="text-green-700 w-6 h-6" />
                                                    : <FaRegFilePdf className="text-red-800 w-5 h-5" />
                                            }
                                        >
                                            {exportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </>
                    )}
                    {config.actions?.length > 0 && (
                        <Dropdown backdrop="opaque">
                            <DropdownTrigger>
                                <Button variant="outline"
                                    size="icon"
                                >
                                    <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu variant="faded" aria-label="Dropdown de acciones globales">
                                {config.actions.map((action) => (
                                    <DropdownItem
                                        key={action.title}
                                        onClick={() => handleGlobalAction(action)}
                                    >
                                        {action.title}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    )}
                    <GenericFilters
                        data={{
                            configFiltersGroup: config.filtersGroup, // Pasa tanto `search` como `groups`
                            updateFilters: (updatedFilters) => setFilters(updatedFilters),
                        }}
                    />
                    {!config.hideCreateButton && (
                        <Button
                            onClick={() => router.push(config.createPath)}
                        >
                            <PlusIcon className="h-5 w-5" aria-hidden="true" />
                            Nuevo
                        </Button>
                    )}
                </Header>
                <Body table={config.table} data={data} emptyState={config.emptyState} isSelectable={true} selectedRows={selectedRows} onSelectionChange={handleOnSelectionChange} />
                <Footer>
                    <div className='w-full pr-24 '>

                        <PaginationFooter meta={paginationMeta} currentPage={currentPage} onPageChange={handlePageChange} />
                    </div>
                </Footer>
            </GenericTable>
        </div>
    );
}
