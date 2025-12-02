export function mapEntityRows(rawRows, headers, handleDelete, config) {
    // console.log('rawRows', rawRows);
    // console.log('headers', headers);
    return rawRows.map((row) => {
        const rowData = headers.reduce((acc, header) => {
            let value;
            if (header.path) {
                value = header.path.split('.').reduce((acc2, key) => acc2?.[key], row);
                // Para badges, si no hay valor, usar undefined en lugar de 'N/A'
                if (header.type === 'badge' && (value === undefined || value === null)) {
                    value = undefined;
                } else if (value === undefined || value === null) {
                    value = 'N/A';
                }
            } else {
                value = row[header.name];
                if (value === undefined || value === null) {
                    value = 'N/A';
                }
            }
            acc[header.name] = value;
            return acc;
        }, {});
        return {
            ...rowData,
            actions: {
                view: {
                    label: 'Ver',
                    onClick: () => {
                        if (config?.viewRoute) {
                            const viewUrl = config.viewRoute.replace(':id', row.id);
                            window.open(viewUrl, '_blank');
                        }
                    },
                },
                delete: {
                    label: 'Eliminar',
                    onClick: async () => handleDelete(row.id),
                },
            },
            id: row.id,
        };
    });
} 