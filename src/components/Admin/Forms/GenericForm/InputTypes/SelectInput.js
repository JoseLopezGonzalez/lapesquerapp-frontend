import React from 'react';

const SelectInput = ({ name, required, onChange, options, loading = false }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <select
      name={name}
      required={required}
      onChange={handleChange}
      disabled={loading}
      className="block w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 placeholder:italic focus:border-sky-500 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700/50 dark:text-white dark:placeholder-neutral-500 dark:focus:border-sky-500 dark:focus:ring-sky-500"
    >
      <option value="">{loading ? 'Cargando opciones...' : 'Selecciona una opción'}</option>
      {loading ? (
        <option value="" disabled>
          Cargando opciones...
        </option>
      ) : (
        options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))
      )}
    </select>
  );
};

export default SelectInput;
