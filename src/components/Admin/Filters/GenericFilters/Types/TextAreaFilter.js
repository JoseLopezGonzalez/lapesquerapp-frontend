'use client';

import { Textarea } from '@/components/ui/textarea';
import React, { memo } from 'react';

const TextAreaFilter = ({ label, name, value, placeholder, onChange }) => {
  const handleOnChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="grid h-full grid-cols-2 gap-x-3 gap-y-6">
      <div className="col-span-2">
        <div className="flex w-full flex-col">
          <label
            htmlFor={name}
            className="text-muted-foreground mb-2 w-full text-start text-xs font-medium"
          >
            {label}
          </label>
          <Textarea
            id={name}
            rows="4"
            value={value}
            onChange={handleOnChange}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(TextAreaFilter);
