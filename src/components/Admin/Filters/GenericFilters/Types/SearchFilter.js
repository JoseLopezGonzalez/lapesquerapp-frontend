import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { memo } from 'react';

const SearchFilter = (({
    label,
    name,
    value,
    placeholder = 'Buscar...',
    onChange,
    maxLength = 100,
    onKeyDown,
}) => {

    const handleOnKeyDown = (e) => {
        if (e.key === 'Enter') onKeyDown();
    }

    return (
        <div >
            <Input
                id={`search-${name}`}
                type="search"
                name={name}
                aria-label={label}
                onChange={(e) => onChange(e.target.value)}
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                onKeyDown={handleOnKeyDown}
            />
        </div>
    );
});

export default memo(SearchFilter);
