'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '@/services/settingsService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/context/SettingsContext';
import { Separator } from '@/components/ui/separator';

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
  const { setSettings } = useSettings();

  useEffect(() => {
    setLoading(true);
    getSettings()
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
      await updateSettings(values);
      setSettings(values); // Notifica a todos los consumidores del Context
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Cargando configuración...</div>;

  return (
    <div className="h-full w-full flex flex-col">
      <ScrollArea className="flex-1 h-full w-full">
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-6 space-y-8 min-h-full">
          <h1 className="text-xl font-light mb-4">Configuración de la empresa</h1>
          {SECTIONS.map((section, idx) => (
            <div key={section.title} className="p-0 space-y-4">
              <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 ">
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
              {idx < SECTIONS.length - 1 && (
                <Separator className="" />
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
} 