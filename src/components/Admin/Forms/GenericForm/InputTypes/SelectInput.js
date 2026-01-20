import React from 'react'

const SelectInput = ({name, required, onChange, options, loading = false}) => {

    const handleChange = (e) => {
        onChange(e.target.value)
    }

    return (
        <select
            name={name}
            required={required}
            onChange={handleChange}
            disabled={loading}
            className=" w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <option value="">{loading ? 'Cargando opciones...' : 'Selecciona una opción'}</option>
            {loading ? (
                <option value="" disabled>Cargando opciones...</option>
            ) : (
                options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))
            )}
        </select>
    )
}

export default SelectInput