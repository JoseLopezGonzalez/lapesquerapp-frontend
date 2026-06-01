'use client';

import { Input } from '@/components/ui/input';
import React, { memo } from 'react';

const TextFilter = ({ label, name, value, placeholder, onChange }) => {
  const handleOnChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="col-span-2">
      <div className="flex w-full flex-col">
        <label
          htmlFor={name}
          className="text-muted-foreground mb-2 w-full text-start text-xs font-medium"
        >
          {label}
        </label>
        <Input
          id={name}
          type="text"
          value={value}
          onChange={handleOnChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default memo(TextFilter);
