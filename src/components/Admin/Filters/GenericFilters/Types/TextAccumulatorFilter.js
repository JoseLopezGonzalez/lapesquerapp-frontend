'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { CornerDownLeft } from 'lucide-react';
import React, { useState, memo } from 'react';

const TextAccumulatorFilter = ({ label, name, value, placeholder, onAdd, onDelete }) => {
  const [temporalValue, setTemporalValue] = useState('');

  const handleOnChangeInput = (event) => {
    setTemporalValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const newValue = temporalValue.trim();

      if (newValue && !value.includes(newValue)) {
        onAdd(newValue); // Añade el nuevo valor si no está vacío
        setTemporalValue(''); // Limpia el campo después de agregar
      }
    }
  };

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6">
      <div className="col-span-2">
        <div className="flex w-full flex-col">
          <label
            htmlFor={name}
            className="text-muted-foreground mb-2 w-full text-start text-xs font-medium"
          >
            {label}
          </label>

          {/* Contenedor visual unificado */}
          <div className="border-input bg-background focus-within:ring-ring rounded-md border px-3 py-2 focus-within:ring-1">
            <input
              type="text"
              id={name}
              value={temporalValue}
              onChange={handleOnChangeInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm outline-none"
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {value.map((item, index) => (
                <Badge key={index} className="flex items-center gap-1">
                  {item}
                  <button
                    onClick={() => onDelete(item)}
                    type="button"
                    className="group bg-foreground-700 text-md text-black-500 rounded-full p-0.5 font-bold shadow-sm hover:bg-white/95"
                  >
                    <XMarkIcon className="group-hover:text-primary h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-foreground-700 mt-2 flex gap-1 text-xs">
            • Introduce el valor y pulsa
            <Badge variant="outline" className="flex w-fit items-end gap-1 pt-0 text-xs">
              <CornerDownLeft className="h-3 w-3" />
              <span>Enter</span>
            </Badge>
            para añadirlo a la lista
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(TextAccumulatorFilter);
