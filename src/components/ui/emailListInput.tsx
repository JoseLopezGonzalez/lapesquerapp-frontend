'use client';

import { useState, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface EmailListInputProps {
  value?: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
}

function isValidEmail(email: string): boolean {
  return /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim());
}

const EmailListInput = ({
  value = [],
  onChange,
  placeholder = 'Introduce correos y pulsa Enter',
}: EmailListInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();

      if (!trimmed) return;

      if (!isValidEmail(trimmed)) {
        setError('Correo no válido');
        return;
      }

      if (value.includes(trimmed)) {
        setError('Correo duplicado');
        return;
      }

      onChange([...value, trimmed]);
      setInputValue('');
      setError(null);
    }
  };

  const handleDelete = (email: string) => {
    onChange(value.filter((e) => e !== email));
  };

  return (
    <div className="w-full">
      <div className="border-input bg-background focus-within:ring-ring rounded-md border px-3 py-2 focus-within:ring-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none"
        />

        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((email, idx) => (
            <Badge key={idx} className="flex items-center gap-1 text-sm">
              {email}
              <button
                type="button"
                onClick={() => handleDelete(email)}
                className="rounded-full bg-black/10 p-0.5 hover:bg-white/90"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-500">* {error}</p>}
    </div>
  );
};

export default memo(EmailListInput);
