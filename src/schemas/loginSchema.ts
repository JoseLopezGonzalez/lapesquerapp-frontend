import { z } from "zod";

/** Schema para el paso de email (solicitar acceso) */
export const loginEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email requerido")
    .email("Introduce un email válido"),
});

/** Schema para el paso de código OTP (6 dígitos) */
export const loginOtpSchema = z.object({
  code: z
    .string()
    .length(6, "Introduce el código de 6 dígitos")
    .regex(/^\d{6}$/, "Solo números"),
});

/** Schema para validar token de magic link en verify (query param) */
export const magicLinkTokenSchema = z.string().min(1, "Enlace no válido");

export type LoginEmailForm = z.infer<typeof loginEmailSchema>;
export type LoginOtpForm = z.infer<typeof loginOtpSchema>;
