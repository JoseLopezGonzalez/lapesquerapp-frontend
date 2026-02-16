/**
 * Wrapper unificado de notificaciones usando Sileo.
 * Usa title + description como en la documentación: https://sileo.aaryan.design/docs
 * El tema (dark/light) lo gestiona Sileo automáticamente.
 */

import type { ReactNode } from "react";
import { sileo } from "sileo";

const DEFAULT_POSITION = "top-center" as const;
const DEFAULT_DURATION_SUCCESS = 4000;
const DEFAULT_DURATION_ERROR = 6000;
const DEFAULT_DURATION_WARNING = 6000;
const DEFAULT_DURATION_INFO = 5000;

export type NotifyMessage =
  | string
  | { title: string; description?: string };

function toSileoContent(msg: NotifyMessage): { title: string; description?: string } {
  if (typeof msg === "string") return { title: msg };
  return { title: msg.title, description: msg.description };
}

export interface NotifyOptions {
  duration?: number | null;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

function applyOptions(opts?: NotifyOptions): { position?: NotifyOptions["position"]; duration?: number | null } {
  const out: { position?: NotifyOptions["position"]; duration?: number | null } = {};
  if (opts?.position) out.position = opts.position;
  if (opts?.duration !== undefined) out.duration = opts.duration;
  return out;
}

export const notify = {
  success(message: NotifyMessage, options?: NotifyOptions): string {
    return sileo.success({
      ...toSileoContent(message),
      position: DEFAULT_POSITION,
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_SUCCESS,
    });
  },

  error(message: NotifyMessage, options?: NotifyOptions): string {
    return sileo.error({
      ...toSileoContent(message),
      position: DEFAULT_POSITION,
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_ERROR,
    });
  },

  warning(message: NotifyMessage, options?: NotifyOptions): string {
    return sileo.warning({
      ...toSileoContent(message),
      position: DEFAULT_POSITION,
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_WARNING,
    });
  },

  info(message: NotifyMessage, options?: NotifyOptions): string {
    return sileo.info({
      ...toSileoContent(message),
      position: DEFAULT_POSITION,
      ...applyOptions(options),
      duration: options?.duration ?? DEFAULT_DURATION_INFO,
    });
  },

  /**
   * Loading manual (solo para casos donde no hay promesa; preferir notify.promise para fetches).
   */
  loading(message: string | { title: string; description?: string }, options?: NotifyOptions): string {
    const content = typeof message === "string" ? { title: message } : message;
    return sileo.show({
      ...content,
      position: DEFAULT_POSITION,
      ...applyOptions(options),
      duration: null,
    });
  },

  /**
   * Toast nativo de Sileo para flujos async: loading → success/error con animaciones.
   * Usar siempre que haya una promesa (fetch, mutación, etc.).
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string | { title: string; description?: string };
      success?: string | { title: string; description?: string } | ((data: T) => string | { title: string; description?: string });
      error?: string | { title: string; description?: string } | ((err: unknown) => string | { title: string; description?: string });
    }
  ): Promise<T> {
    const promiseFn = typeof promise === "function" ? promise : () => promise;
    const loadingContent = typeof messages.loading === "string"
      ? { title: messages.loading }
      : { title: messages.loading.title, description: messages.loading.description };
    const successFn = messages.success;
    const errorFn = messages.error;
    return sileo.promise(promiseFn(), {
      position: DEFAULT_POSITION,
      loading: loadingContent,
      success: successFn == null
        ? { title: "Listo" }
        : typeof successFn === "function"
          ? (data) => {
              const out = successFn(data);
              return typeof out === "string" ? { title: out } : out;
            }
          : typeof successFn === "string"
            ? { title: successFn }
            : successFn,
      error: errorFn == null
        ? { title: "Error" }
        : typeof errorFn === "function"
          ? (err) => {
              const out = errorFn(err);
              return typeof out === "string" ? { title: out } : out;
            }
          : typeof errorFn === "string"
            ? { title: errorFn }
            : errorFn,
    });
  },

  dismiss(id: string): void {
    sileo.dismiss(id);
  },

  clear(position?: Parameters<typeof sileo.clear>[0]): void {
    sileo.clear(position);
  },
};
