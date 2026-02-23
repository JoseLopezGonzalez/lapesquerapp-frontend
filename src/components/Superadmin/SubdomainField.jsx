"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { fetchSuperadmin } from "@/lib/superadminApi";

const SUBDOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const DEBOUNCE_MS = 300;

export default function SubdomainField({ value, onChange, error: externalError }) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [formatError, setFormatError] = useState("");
  const debounceRef = useRef(null);

  const validate = (v) => {
    if (!v) {
      setFormatError("");
      setAvailable(null);
      return;
    }
    if (!SUBDOMAIN_RE.test(v)) {
      setFormatError("Solo letras minusculas, numeros y guiones. No puede empezar/terminar con guion.");
      setAvailable(null);
      return;
    }
    if (v.length > 63) {
      setFormatError("Maximo 63 caracteres.");
      setAvailable(null);
      return;
    }
    setFormatError("");
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    setAvailable(null);

    if (!value || !SUBDOMAIN_RE.test(value) || value.length > 63) return;

    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchSuperadmin(`/tenants?search=${encodeURIComponent(value)}&per_page=1`);
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

  const handleChange = (e) => {
    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
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
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!checking && available === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {!checking && available === false && <XCircle className="h-4 w-4 text-destructive" />}
        </div>
      </div>
      {value && !displayError && (
        <p className="text-xs text-muted-foreground">
          {value}.lapesquerapp.es
        </p>
      )}
      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}
      {!checking && available === false && !displayError && (
        <p className="text-xs text-destructive">Este subdominio ya esta en uso.</p>
      )}
    </div>
  );
}
