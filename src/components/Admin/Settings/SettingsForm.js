'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

const SECTIONS = [
  {
    title: 'Datos generales',
    fields: [
      { name: 'company.name', label: 'Nombre de la empresa' },
      { name: 'company.cif', label: 'CIF' },
      { name: 'company.sanitary_number', label: 'Registro sanitario' },
    ],
  },
  {
    title: 'Dirección',
    fields: [
      { name: 'company.address.street', label: 'Calle' },
      { name: 'company.address.postal_code', label: 'Código postal' },
      { name: 'company.address.city', label: 'Ciudad' },
      { name: 'company.address.province', label: 'Provincia' },
      { name: 'company.address.country', label: 'País' },
    ],
  },
  {
    title: 'Web y Logo',
    fields: [
      { name: 'company.website_url', label: 'Web' },
      { name: 'company.logo_url_small', label: 'Logo (URL)' },
    ],
  },
  {
    title: 'Otros datos',
    fields: [
      { name: 'company.loading_place', label: 'Lugar de carga' },
      { name: 'company.signature_location', label: 'Lugar de firma' },
      { name: 'company.bcc_email', label: 'Email BCC' },
    ],
  },
  {
    title: 'Contactos',
    fields: [
      { name: 'company.contact.email_operations', label: 'Email operaciones' },
      { name: 'company.contact.email_orders', label: 'Email pedidos' },
      { name: 'company.contact.phone_orders', label: 'Teléfono pedidos' },
      { name: 'company.contact.email_admin', label: 'Email administración' },
      { name: 'company.contact.phone_admin', label: 'Teléfono administración' },
      { name: 'company.contact.emergency_email', label: 'Email emergencias' },
      { name: 'company.contact.incidents_email', label: 'Email incidencias' },
      { name: 'company.contact.loading_email', label: 'Email carga' },
      { name: 'company.contact.unloading_email', label: 'Email descarga' },
    ],
  },
  {
    title: 'Legales',
    fields: [
      { name: 'company.legal.terms_url', label: 'URL condiciones legales' },
      { name: 'company.legal.privacy_policy_url', label: 'URL política privacidad' },
    ],
  },
];

export default function SettingsForm() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setValues(data))
      .catch(() => toast.error('Error al cargar configuración'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Cargando configuración...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Configuración de la empresa</h1>
      {SECTIONS.map((section) => (
        <div key={section.title} className="bg-white dark:bg-neutral-900 rounded-xl shadow p-4 space-y-4">
          <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
} 