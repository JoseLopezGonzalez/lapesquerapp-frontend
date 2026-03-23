/**
 * Wrapper unificado de notificaciones.
 * La UI del toaster vive aparte; esta capa mantiene una API estable (`notify`)
 * y traduce nuestras necesidades de dominio a la librería subyacente.
 */

import type { ReactNode } from "react";
import { toast, type ExternalToast } from "sonner";

export type NotifyMessage =
  | string
  | { title: string; description?: string };

/**
 * Titulo = descriptivo y contextual (ej. "Cambios guardados", "Error al crear pedido").
 * Descripcion = explicacion de por que fue bien o mal.
 * Si se pasa string, se usa como title (sin description).
 */
export interface NotifyOptions {
  id?: string | number;
  dedupeKey?: string;
  duration?: number | null;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  dismissible?: boolean;
  important?: boolean;
  description?: ReactNode;
}

export interface NotifyActionButton {
  title: string;
  onClick: () => void;
}

export interface NotifyActionOptions extends NotifyOptions {
  cancel?: NotifyActionButton;
}

type ToastId = string | number;

const dedupeRegistry = new Map<string, ToastId>();

function toContent(msg: NotifyMessage): { title: ReactNode; description?: ReactNode } {
  if (typeof msg === "string") return { title: msg };
  return { title: msg.title, description: msg.description };
}

function normalizeDuration(duration: NotifyOptions["duration"], important?: boolean): number | undefined {
  if (duration === null) return Infinity;
  if (duration !== undefined) return duration;
  if (important) return Infinity;
  return undefined;
}

function rememberDedupeKey(key: string | undefined, id: ToastId): void {
  if (!key) return;
  dedupeRegistry.set(key, id);
}

function forgetDedupeKey(key: string | undefined, id: ToastId): void {
  if (!key) return;
  if (dedupeRegistry.get(key) === id) dedupeRegistry.delete(key);
}

function getToastId(opts?: NotifyOptions): ToastId | undefined {
  if (opts?.id !== undefined) return opts.id;
  if (opts?.dedupeKey) return dedupeRegistry.get(opts.dedupeKey);
  return undefined;
}

function buildToastOptions(opts: NotifyOptions | undefined): ExternalToast {
  const id = getToastId(opts);
  const duration = normalizeDuration(opts?.duration, opts?.important);
  const out: ExternalToast = {
    id,
    dismissible: opts?.dismissible,
  };

  if (opts?.position !== undefined) out.position = opts.position;
  if (duration !== undefined) out.duration = duration;
  if (opts?.description !== undefined) out.description = opts.description;
  if (opts?.important) {
    out.closeButton = true;
  }
  if (opts?.dedupeKey && id !== undefined) {
    out.onDismiss = () => forgetDedupeKey(opts.dedupeKey, id);
    out.onAutoClose = () => forgetDedupeKey(opts.dedupeKey, id);
  }
  return out;
}

function createOrReuseToast(
  variant: "success" | "error" | "warning" | "info" | "loading" | "message",
  message: NotifyMessage,
  options: NotifyOptions | undefined
): ToastId {
  const existingId = getToastId(options);
  if (existingId !== undefined && options?.dedupeKey && options.id === undefined) {
    return existingId;
  }

  const resolvedOptions =
    options?.dedupeKey && options.id === undefined
      ? {
          ...options,
          id: `notify-${options.dedupeKey}`,
        }
      : options;

  const { title, description } = toContent(message);
  const toastOptions = buildToastOptions(
    description === undefined ? resolvedOptions : { ...resolvedOptions, description }
  );
  const method =
    variant === "message"
      ? toast
      : variant === "loading"
        ? toast.loading
        : toast[variant];
  const id = method(title, toastOptions);
  rememberDedupeKey(resolvedOptions?.dedupeKey, id);
  return id;
}

function toPromiseMessage<T>(
  value:
    | string
    | { title: string; description?: string }
    | ((input: T) => string | { title: string; description?: string })
    | undefined,
  input: T,
  fallback: { title: string; description?: string }
) {
  if (value == null) return fallback;
  if (typeof value === "function") {
    const out = value(input);
    return typeof out === "string" ? { title: out } : out;
  }
  return typeof value === "string" ? { title: value } : value;
}

function createPromiseId(options?: NotifyOptions): ToastId {
  return getToastId(options) ?? `notify-promise-${Math.random().toString(36).slice(2, 10)}`;
}

function buildActionConfig(button: NotifyActionButton) {
  return {
    label: button.title,
    onClick: () => button.onClick(),
  };
}

export const notify = {
  success(message: NotifyMessage, options?: NotifyOptions): string {
    return String(createOrReuseToast("success", message, options));
  },

  error(message: NotifyMessage, options?: NotifyOptions): string {
    return String(createOrReuseToast("error", message, options));
  },

  warning(message: NotifyMessage, options?: NotifyOptions): string {
    return String(createOrReuseToast("warning", message, options));
  },

  info(message: NotifyMessage, options?: NotifyOptions): string {
    return String(createOrReuseToast("info", message, options));
  },

  /**
   * Loading manual (solo para casos donde no hay promesa; preferir notify.promise para fetches).
   * Devuelve un id reutilizable en `success/error/info/warning`.
   */
  loading(message: string | { title: string; description?: string }, options?: NotifyOptions): string {
    return String(createOrReuseToast("loading", message, options));
  },

  /**
   * Flujo async: loading -> success/error reutilizando el mismo toast id.
   * Usar siempre que haya una promesa (fetch, mutación, etc.).
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string | { title: string; description?: string };
      success?: string | { title: string; description?: string } | ((data: T) => string | { title: string; description?: string });
      error?: string | { title: string; description?: string } | ((err: unknown) => string | { title: string; description?: string });
    },
    options?: NotifyOptions
  ): Promise<T> {
    const toastId = createPromiseId(options);
    const promiseFn = typeof promise === "function" ? promise : () => promise;
    const task = promiseFn();
    const baseOptions = buildToastOptions({ ...options, id: toastId });

    rememberDedupeKey(options?.dedupeKey, toastId);
    toast.promise(task, {
      ...baseOptions,
      loading:
        typeof messages.loading === "string"
          ? messages.loading
          : messages.loading.title,
      description:
        typeof messages.loading === "string"
          ? baseOptions.description
          : messages.loading.description ?? baseOptions.description,
      success: (data) => {
        const success = toPromiseMessage(
          messages.success,
          data,
          { title: "Operacion completada" }
        );
        return typeof success === "string" ? success : success.title;
      },
      error: (err) => {
        const errorMessage = toPromiseMessage(
          messages.error,
          err,
          { title: "Error", description: "Ha ocurrido un error. Intente de nuevo." }
        );
        return typeof errorMessage === "string" ? errorMessage : errorMessage.title;
      },
    });

    return task;
  },

  /**
   * Toast de advertencia con un botón de acción (ej. confirmación "Continuar").
   * No se cierra solo (duration: null). Al hacer clic en el botón se cierra el toast y se ejecuta onClick.
   */
  action(
    message: NotifyMessage,
    button: NotifyActionButton,
    options?: NotifyActionOptions
  ): string {
    const { title, description } = toContent(message);
    const toastId = String(
      getToastId(options)
        ?? (options?.dedupeKey ? `notify-${options.dedupeKey}` : `notify-action-${Math.random().toString(36).slice(2, 10)}`)
    );
    const id = toast(title, {
      ...buildToastOptions(
        description === undefined ? { ...options, id: toastId } : { ...options, id: toastId, description }
      ),
      action: buildActionConfig(button),
      cancel: options?.cancel ? buildActionConfig(options.cancel) : undefined,
    });
    rememberDedupeKey(options?.dedupeKey, id);
    return String(id);
  },

  dismiss(id: string): void {
    for (const [key, value] of dedupeRegistry.entries()) {
      if (String(value) === id) dedupeRegistry.delete(key);
    }
    toast.dismiss(id);
  },

  clear(_position?: NotifyOptions["position"]): void {
    dedupeRegistry.clear();
    toast.dismiss();
  },
};
