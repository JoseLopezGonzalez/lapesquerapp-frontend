'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { fetchSuperadmin } from '@/lib/superadminApi';

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const DEBOUNCE_MS = 300;

interface SubdomainFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function SubdomainField({ value, onChange, error: externalError }: SubdomainFieldProps) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [formatError, setFormatError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validate = (v: string) => {
    if (!v) {
      setFormatError('');
      setAvailable(null);
      return;
    }
    if (!SUBDOMAIN_RE.test(v)) {
      setFormatError(
        'Solo letras minúsculas, números y guiones. No puede empezar/terminar con guion.'
      );
      setAvailable(null);
      return;
    }
    if (v.length > 63) {
      setFormatError('Máximo 63 caracteres.');
      setAvailable(null);
      return;
    }
    setFormatError('');
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    setAvailable(null);

    if (!value || !SUBDOMAIN_RE.test(value) || value.length > 63) return;

    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchSuperadmin(
          `/tenants?search=${encodeURIComponent(value)}&per_page=1`
        );
        const json = await res.json();
        const taken = (json.data || []).some(
          (t) => t.subdomain.toLowerCase() === value.toLowerCase()
        );
        setAvailable(!taken);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    validate(v);
    onChange(v);
  };

  const displayError = externalError || formatError;

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label>Subdominio</Label>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="mi-empresa"
          maxLength={63}
          className="pr-10"
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          {checking && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
          {!checking && available === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {!checking && available === false && <XCircle className="text-destructive h-4 w-4" />}
        </div>
      </div>
      {value && !displayError && (
        <p className="text-muted-foreground text-xs">{value}.lapesquerapp.es</p>
      )}
      {displayError && <p className="text-destructive text-xs">{displayError}</p>}
      {!checking && available === false && !displayError && (
        <p className="text-destructive text-xs">Este subdominio ya está en uso.</p>
      )}
    </div>
  );
}
