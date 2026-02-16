/**
 * Wrapper unificado de notificaciones usando Sileo.
 * API estable para la app: notify.success(), notify.error(), etc.
 * @see https://sileo.aaryan.design/docs
 */

import type { ReactNode } from "react";
import { sileo } from "sileo";

const DEFAULT_POSITION = "top-right" as const;
const DEFAULT_DURATION_SUCCESS = 4000;
const DEFAULT_DURATION_ERROR = 6000;
const DEFAULT_DURATION_WARNING = 6000;
const DEFAULT_DURATION_INFO = 5000;

function toTitle(message: string | ReactNode): string {
  if (typeof message === "string") return message;
  if (message == null) return "";
  // React nodes: use a simple string representation for Sileo title
  if (typeof message === "object" && "props" in message && typeof (message as { props?: { children?: unknown } }).props?.children === "string")
    return (message as { props: { children: string } }).props.children;
  return String(message);
}

export interface NotifyOptions {
  /** Duración en ms; null = no auto-dismiss */
  duration?: number | null;
  /** Posición (override global) */
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  /** Id del toast a reemplazar (para flujos loading → success/error). Al usarlo se hace dismiss del id y se muestra el nuevo toast. */
  id?: string;
}

function applyOptions(opts?: NotifyOptions): { position?: NotifyOptions["position"]; duration?: number | null } {
  const out: { position?: NotifyOptions["position"]; duration?: number | null } = {};
  if (opts?.position) out.position = opts.position;
  if (opts?.duration !== undefined) out.duration = opts.duration;
  return out;
}

export const notify = {
  success(message: string | ReactNode, options?: NotifyOptions): string {
    if (options?.id) sileo.dismiss(options.id);
    return sileo.success({
      title: toTitle(message),
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_SUCCESS,
    });
  },

  error(message: string | ReactNode, options?: NotifyOptions): string {
    if (options?.id) sileo.dismiss(options.id);
    return sileo.error({
      title: toTitle(message),
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_ERROR,
    });
  },

  warning(message: string | ReactNode, options?: NotifyOptions): string {
    if (options?.id) sileo.dismiss(options.id);
    return sileo.warning({
      title: toTitle(message),
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_WARNING,
    });
  },

  info(message: string | ReactNode, options?: NotifyOptions): string {
    if (options?.id) sileo.dismiss(options.id);
    return sileo.info({
      title: toTitle(message),
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_INFO,
    });
  },

  /**
   * Muestra un toast de "carga" (genérico). Para reemplazarlo por success/error, usa notify.success(msg, { id }) o notify.error(msg, { id }).
   */
  loading(message: string | ReactNode, options?: NotifyOptions): string {
    return sileo.show({
      title: toTitle(message),
      ...applyOptions(options),
      duration: null, // loading se mantiene hasta que se haga success/error con mismo id
    });
  },

  /**
   * Encadena loading → success/error desde una promesa. Devuelve la misma promesa para encadenar.
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string;
      success?: string | ((data: T) => string);
      error?: string | ((err: unknown) => string);
    }
  ): Promise<T> {
    const promiseFn = typeof promise === "function" ? promise : () => promise;
    const successFn = messages.success;
    const errorFn = messages.error;
    return sileo.promise(promiseFn(), {
      loading: { title: messages.loading },
      success: typeof successFn === "function"
        ? (data) => ({ title: successFn(data) ?? "Listo" })
        : { title: successFn ?? "Listo" },
      error: typeof errorFn === "function"
        ? (err) => ({ title: errorFn(err) ?? "Error" })
        : { title: errorFn ?? "Error" },
    });
  },

  dismiss(id: string): void {
    sileo.dismiss(id);
  },

  clear(position?: Parameters<typeof sileo.clear>[0]): void {
    sileo.clear(position);
  },
};
