import { z } from 'zod';

const optStr = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());
const optEmail = z.preprocess((v) => (v === '' ? undefined : v), z.string().email('Email inválido').optional());

const optSmtpHost = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z
    .string()
    .regex(
      /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'El servidor SMTP debe ser un hostname válido (ej: smtp.gmail.com)'
    )
    .optional()
);

const optSmtpPort = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .pipe(
      z
        .string()
        .refine(
          (v) => {
            const n = parseInt(v, 10);
            return !Number.isNaN(n) && n >= 1 && n <= 65535;
          },
          { message: 'El puerto debe ser un número entre 1 y 65535' }
        )
    )
    .optional()
);

/** Schema para configuración de empresa. Estructura anidada que coincide con react-hook-form. */
export const settingsSchema = z
  .object({
    company: z
      .object({
        name: optStr,
        cif: optStr,
        sanitary_number: optStr,
        address: z
          .object({
            street: optStr,
            postal_code: optStr,
            city: optStr,
            province: optStr,
            country: optStr,
          })
          .optional(),
        website_url: optStr,
        logo_url_small: optStr,
        loading_place: optStr,
        signature_location: optStr,
        bcc_email: optStr,
        contact: z
          .object({
            email_operations: optStr,
            email_orders: optStr,
            phone_orders: optStr,
            email_admin: optStr,
            phone_admin: optStr,
            emergency_email: optStr,
            incidents_email: optStr,
            loading_email: optStr,
            unloading_email: optStr,
          })
          .optional(),
        legal: z
          .object({
            terms_url: optStr,
            privacy_policy_url: optStr,
          })
          .optional(),
        mail: z
          .object({
            host: optSmtpHost,
            port: optSmtpPort,
            encryption: z.enum(['tls', 'ssl']).optional(),
            username: optEmail,
            from_address: optEmail,
            from_name: optStr,
          })
          .optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const mail = data?.company?.mail;
    if (!mail) return;
    const { host, username, from_address } = mail;
    const hasAny = Boolean(host || username || from_address);
    if (!hasAny) return;
    if (!host)
      ctx.addIssue({
        code: 'custom',
        path: ['company', 'mail', 'host'],
        message: 'Servidor SMTP requerido para configurar el correo',
      });
    if (!username)
      ctx.addIssue({
        code: 'custom',
        path: ['company', 'mail', 'username'],
        message: 'Usuario SMTP requerido para configurar el correo',
      });
    if (!from_address)
      ctx.addIssue({
        code: 'custom',
        path: ['company', 'mail', 'from_address'],
        message: 'Email remitente requerido para configurar el correo',
      });
  });
