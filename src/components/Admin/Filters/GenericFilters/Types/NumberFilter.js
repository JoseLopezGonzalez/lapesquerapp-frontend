'use client';

import { Input } from '@/components/ui/input';
import React, { memo } from 'react';

const NumberFilter = ({ label, name, value, placeholder, onChange }) => {
  const handleOnChange = (e) => {
    const value = e.target.value;
    // Permitir solo números y punto decimal
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      onChange(value);
    }
  };

  return (
    <div key={name} className="col-span-2">
      <div className="flex w-full flex-col text-start">
        <label
          htmlFor={`number-filter-${name}`}
          className="text-muted-foreground mb-2 w-full text-start text-xs font-medium"
        >
          {label}
        </label>
        <Input
          id={`number-filter-${name}`}
          value={value}
          onChange={handleOnChange}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default memo(NumberFilter);
