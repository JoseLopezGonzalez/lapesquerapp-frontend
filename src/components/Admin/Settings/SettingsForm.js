'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '@/services/settingsService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/context/SettingsContext';
import { Separator } from '@/components/ui/separator';
import Loader from '@/components/Utilities/Loader';
import { Eye, EyeOff } from 'lucide-react';
import { getCurrentTenant } from '@/lib/utils/getCurrentTenant';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailPassword, setEmailPassword] = useState(''); // Contraseña separada, no se muestra el valor actual
  const [hadPreviousConfig, setHadPreviousConfig] = useState(false); // Para validar password solo en primera configuración
  const { setSettings } = useSettings();

  useEffect(() => {
    // Obtener tenant actual DENTRO del useEffect para asegurar que siempre sea el valor actual
    const currentTenant = getCurrentTenant();
    
    // Si no hay tenant, no cargar (solo puede pasar en servidor)
    if (!currentTenant) {
      return;
    }

    setLoading(true);
    getSettings()
      .then((data) => {
        // Verificar que los datos correspondan al tenant actual
        // (esto es una validación adicional de seguridad)
        setValues(data);
        // Inicializar password vacío (no mostrar valor actual por seguridad)
        setEmailPassword('');
        // Detectar si había configuración previa al cargar
        if (data['company.mail.host'] && data['company.mail.username'] && data['company.mail.from_address']) {
          setHadPreviousConfig(true);
        }
      })
      .catch(() => toast.error('Error al cargar configuración'))
      .finally(() => setLoading(false));
  }, []); // Solo ejecutar una vez al montar, el tenant se obtiene dentro

  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };


  const handleEmailChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (value) => {
    setEmailPassword(value);
  };

  // Validaciones - TODOS los campos son obligatorios
  const validateEmailSettings = () => {

    const host = values['company.mail.host'] || '';
    const port = values['company.mail.port'] || '';
    const encryption = values['company.mail.encryption'] || '';
    const username = values['company.mail.username'] || '';
    const fromAddress = values['company.mail.from_address'] || '';

    // Validar que todos los campos obligatorios estén presentes
    const missingFields = [];
    
    if (!host) missingFields.push('Servidor SMTP (host)');
    if (!port) missingFields.push('Puerto');
    if (!encryption) missingFields.push('Encriptación');
    if (!username) missingFields.push('Usuario SMTP');
    if (!emailPassword && !hadPreviousConfig) missingFields.push('Contraseña SMTP');
    if (!fromAddress) missingFields.push('Email remitente');

    if (missingFields.length > 0) {
      toast.error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
      return false;
    }

    // Validar formato de host
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(host)) {
      toast.error('El servidor SMTP debe ser un hostname válido (ej: smtp.gmail.com)');
      return false;
    }

    // Validar puerto
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      toast.error('El puerto debe ser un número entre 1 y 65535');
      return false;
    }

    // Validar encriptación
    if (encryption !== 'tls' && encryption !== 'ssl') {
      toast.error('La encriptación debe ser TLS o SSL');
      return false;
    }

    // Validar email username
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      toast.error('El usuario debe ser un email válido');
      return false;
    }

    // Validar from_address
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
      toast.error('El email remitente debe ser un email válido');
      return false;
    }

    // Validar password
    // Si no había configuración previa, la contraseña es obligatoria
    // Si había configuración previa, puede estar vacía (mantiene la actual)
    if (!hadPreviousConfig && !emailPassword) {
      toast.error('La contraseña SMTP es obligatoria');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar configuración de email (siempre obligatoria)
    if (!validateEmailSettings()) {
      return;
    }

    setSaving(true);
    try {
      // Preparar payload
      const payload = { ...values };

      // Manejar password
      // Si se cambió la contraseña, usar la nueva
      // Si no se cambió pero había configuración previa, mantener la actual (no enviar campo)
      if (emailPassword) {
        // Si hay nueva contraseña, incluirla
        payload['company.mail.password'] = emailPassword;
      }
      // Si no hay password pero había configuración previa, no incluir el campo (mantiene la actual)

      await updateSettings(payload);
      setSettings(payload); // Notifica a todos los consumidores del Context
      setEmailPassword(''); // Limpiar campo de contraseña después de guardar
      setHadPreviousConfig(true); // Marcar que ahora hay configuración
      toast.success('Configuración guardada');
    } catch (error) {
      // Manejar errores específicos del backend
      let errorMessage = 'Error al guardar';
      
      if (error instanceof Error) {
        // Priorizar userMessage si está disponible
        if (error.userMessage) {
          errorMessage = error.userMessage;
        } else if (error.message && (
          error.message.includes('configuración de email') ||
          error.message.includes('Mail configuration incomplete') ||
          error.message.includes('incompleta')
        )) {
          errorMessage = 'La configuración de email no está completa. Por favor, configure todos los campos obligatorios.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader />
    </div>
  );

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

          {/* Sección de Configuración de Email */}
          <div className="p-0 space-y-4">
            <h2 className="text-lg font-semibold mb-2">Configuración de Emails Salientes</h2>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Importante:</strong> Todos los campos marcados con * son obligatorios. El sistema requiere configuración completa de email para poder enviar correos.
              </p>
            </div>
            
            <div className="space-y-6">
                
                {/* Servidor SMTP */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Servidor SMTP</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="company.mail.host">Servidor SMTP *</Label>
                      <Input
                        id="company.mail.host"
                        name="company.mail.host"
                        value={values['company.mail.host'] || ''}
                        onChange={handleChange}
                        placeholder="smtp.gmail.com"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company.mail.port">Puerto *</Label>
                      <Input
                        id="company.mail.port"
                        name="company.mail.port"
                        type="number"
                        value={values['company.mail.port'] || '587'}
                        onChange={handleChange}
                        min="1"
                        max="65535"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company.mail.encryption">Encriptación *</Label>
                      <Select
                        value={values['company.mail.encryption'] || 'tls'}
                        onValueChange={(value) => handleEmailChange('company.mail.encryption', value)}
                      >
                        <SelectTrigger id="company.mail.encryption">
                          <SelectValue placeholder="Selecciona encriptación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Credenciales */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Credenciales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company.mail.username">Usuario/Email *</Label>
                      <Input
                        id="company.mail.username"
                        name="company.mail.username"
                        type="email"
                        value={values['company.mail.username'] || ''}
                        onChange={handleChange}
                        placeholder="noreply@empresa.com"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company.mail.password">Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="company.mail.password"
                          name="company.mail.password"
                          type={showPassword ? 'text' : 'password'}
                          value={emailPassword}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          placeholder={hadPreviousConfig ? "•••••••• (deja vacío para mantener actual)" : "••••••••"}
                          autoComplete="new-password"
                          required={!hadPreviousConfig}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hadPreviousConfig 
                          ? 'Deja vacío para mantener la contraseña actual, o ingresa una nueva para cambiarla'
                          : 'La contraseña SMTP es obligatoria'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remitente */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Remitente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company.mail.from_address">Email Remitente *</Label>
                      <Input
                        id="company.mail.from_address"
                        name="company.mail.from_address"
                        type="email"
                        value={values['company.mail.from_address'] || ''}
                        onChange={handleChange}
                        placeholder="noreply@empresa.com"
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company.mail.from_name">Nombre Remitente</Label>
                      <Input
                        id="company.mail.from_name"
                        name="company.mail.from_name"
                        value={values['company.mail.from_name'] || ''}
                        onChange={handleChange}
                        placeholder={values['company.name'] || 'Nombre de la empresa'}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
            </div>
            <Separator className="" />
          </div>
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