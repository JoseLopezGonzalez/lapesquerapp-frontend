'use client';

import { useState, memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { XMarkIcon } from '@heroicons/react/20/solid';

function isValidEmail(email) {
    return /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim());
}

const EmailListInput = ({ value = [], onChange, placeholder = "Introduce correos y pulsa Enter" }) => {
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState(null);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const trimmed = inputValue.trim();

            if (!trimmed) return;

            if (!isValidEmail(trimmed)) {
                setError("Correo no válido");
                return;
            }

            if (value.includes(trimmed)) {
                setError("Correo duplicado");
                return;
            }

            onChange([...value, trimmed]);
            setInputValue("");
            setError(null);
        }
    };

    const handleDelete = (email) => {
        onChange(value.filter((e) => e !== email));
    };

    return (
        <div className="w-full">
            {/* Contenedor visual unificado */}
            <div className="border border-input bg-background rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full bg-transparent outline-none text-sm"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                    {value.map((email, idx) => (
                        <Badge
                            key={idx}
                            className="flex items-center gap-1 text-sm"
                        >
                            {email}
                            <button
                                type="button"
                                onClick={() => handleDelete(email)}
                                className="hover:bg-white/90 bg-black/10 rounded-full p-0.5"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <p className="text-sm text-red-500 mt-1">* {error}</p>
            )}
        </div>
    );
};

export default memo(EmailListInput);
