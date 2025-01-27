export const formatDate = (date) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Los meses son base 0
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

/* formatDateHour DD/MM/YYYY - HH:MM */
export const formatDateHour = (date) => {
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Los meses son base 0
    const year = dateObj.getFullYear();
    const hour = String(dateObj.getHours()).padStart(2, '0');
    const minute = String(dateObj.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hour}:${minute}`;
}