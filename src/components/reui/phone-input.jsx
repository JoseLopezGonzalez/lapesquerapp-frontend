import * as React from 'react';
import * as RPNInput from 'react-phone-number-input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import flags from 'country-flag-icons/react/3x2';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function normalizeToE164(value, defaultCountry) {
  if (typeof value !== 'string') return '';
  const rawValue = value.trim();
  if (!rawValue) return '';

  const parsed = parsePhoneNumberFromString(rawValue, defaultCountry);
  if (parsed) return parsed.number;

  const digitsOnly = rawValue.startsWith('+')
    ? `+${rawValue.slice(1).replace(/[^\d]/g, '')}`
    : rawValue.replace(/[^\d]/g, '');

  const parsedCompact = parsePhoneNumberFromString(digitsOnly, defaultCountry);
  if (parsedCompact) return parsedCompact.number;

  if (digitsOnly.startsWith('+') && digitsOnly.length > 1) return digitsOnly;
  return '';
}

const PhoneInputField = React.forwardRef(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn('rounded-s-none rounded-e-lg', className)}
    {...props}
  />
));

PhoneInputField.displayName = 'PhoneInputField';

function Flag({ country, countryName }) {
  const FlagComponent = country ? flags[country] : null;
  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-muted">
      {FlagComponent ? <FlagComponent title={countryName} /> : null}
    </span>
  );
}

function CountrySelect({ disabled, value, onChange, options }) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="rounded-e-none rounded-s-lg border-r-0 px-2.5"
          disabled={disabled}
        >
          <Flag country={value} countryName={selectedOption?.label} />
          <ChevronsUpDown className={cn('size-3.5 opacity-60', disabled ? 'hidden' : 'block')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandList>
            <CommandEmpty>No se encontraron países.</CommandEmpty>
            {options
              .filter((option) => Boolean(option.value))
              .map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Flag country={option.value} countryName={option.label} />
                  <span className="flex-1 truncate text-left">{option.label}</span>
                  <span className="text-muted-foreground">+{RPNInput.getCountryCallingCode(option.value)}</span>
                  <Check className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const PhoneInput = React.forwardRef(
  ({ className, defaultCountry = 'ES', value, onChange, ...props }, ref) => {
    const normalizedValue = React.useMemo(
      () => normalizeToE164(value, defaultCountry),
      [value, defaultCountry]
    );

    return (
      <RPNInput.default
        ref={ref}
        defaultCountry={defaultCountry}
        value={normalizedValue}
        className={cn('flex', className)}
        countrySelectComponent={CountrySelect}
        inputComponent={PhoneInputField}
        smartCaret={false}
        onChange={(nextValue) => onChange?.(nextValue ?? '')}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
