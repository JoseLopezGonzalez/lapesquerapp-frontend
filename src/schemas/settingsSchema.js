import { z } from 'zod';

/** Schema para configuración de empresa (tenant settings). */
export const settingsSchema = z
  .object({
    // Datos generales (opcionales)
    'company.name': z.string().optional(),
    'company.cif': z.string().optional(),
    'company.sanitary_number': z.string().optional(),
    // Dirección (opcionales)
    'company.address.street': z.string().optional(),
    'company.address.postal_code': z.string().optional(),
    'company.address.city': z.string().optional(),
    'company.address.province': z.string().optional(),
    'company.address.country': z.string().optional(),
    // Web y logo (opcionales)
    'company.website_url': z.string().optional(),
    'company.logo_url_small': z.string().optional(),
    // Otros (opcionales)
    'company.loading_place': z.string().optional(),
    'company.signature_location': z.string().optional(),
    'company.bcc_email': z.string().optional(),
    // Contactos (opcionales)
    'company.contact.email_operations': z.string().optional(),
    'company.contact.email_orders': z.string().optional(),
    'company.contact.phone_orders': z.string().optional(),
    'company.contact.email_admin': z.string().optional(),
    'company.contact.phone_admin': z.string().optional(),
    'company.contact.emergency_email': z.string().optional(),
    'company.contact.incidents_email': z.string().optional(),
    'company.contact.loading_email': z.string().optional(),
    'company.contact.unloading_email': z.string().optional(),
    // Legales (opcionales)
    'company.legal.terms_url': z.string().optional(),
    'company.legal.privacy_policy_url': z.string().optional(),
    // Email SMTP (obligatorios para envío)
    'company.mail.host': z
      .string()
      .min(1, 'Servidor SMTP requerido')
      .regex(
        /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'El servidor SMTP debe ser un hostname válido (ej: smtp.gmail.com)'
      ),
    'company.mail.port': z
      .union([z.string(), z.number()])
      .transform((v) => String(v))
      .pipe(
        z
          .string()
          .min(1, 'Puerto requerido')
          .refine(
            (v) => {
              const n = parseInt(v, 10);
              return !Number.isNaN(n) && n >= 1 && n <= 65535;
            },
            { message: 'El puerto debe ser un número entre 1 y 65535' }
          )
      ),
    'company.mail.encryption': z.enum(['tls', 'ssl'], {
      errorMap: () => ({ message: 'La encriptación debe ser TLS o SSL' }),
    }),
    'company.mail.username': z
      .string()
      .min(1, 'Usuario SMTP requerido')
      .email('El usuario debe ser un email válido'),
    'company.mail.from_address': z
      .string()
      .min(1, 'Email remitente requerido')
      .email('El email remitente debe ser un email válido'),
    'company.mail.from_name': z.string().optional(),
    // company.mail.password: validado manualmente (no se almacena en form)
  })
  .passthrough();
