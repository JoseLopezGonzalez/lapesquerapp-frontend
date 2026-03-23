import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = Object.assign(
  vi.fn(() => "toast-default-id"),
  {
    success: vi.fn(() => "toast-success-id"),
    error: vi.fn(() => "toast-error-id"),
    warning: vi.fn(() => "toast-warning-id"),
    info: vi.fn(() => "toast-info-id"),
    loading: vi.fn(() => "toast-loading-id"),
    promise: vi.fn(() => ({ unwrap: () => Promise.resolve(undefined) })),
    dismiss: vi.fn(),
  }
);

vi.mock("sonner", () => ({
  toast: toastMock,
}));

function getToastCallId(call: unknown[] | undefined) {
  const options = call?.[1] as { id?: string } | undefined;
  return options?.id;
}

describe("notify", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    toastMock.mockReturnValue("toast-default-id");
    toastMock.success.mockReturnValue("toast-success-id");
    toastMock.error.mockReturnValue("toast-error-id");
    toastMock.warning.mockReturnValue("toast-warning-id");
    toastMock.info.mockReturnValue("toast-info-id");
    toastMock.loading.mockReturnValue("toast-loading-id");
    toastMock.promise.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });
  });

  it("delegates promise to sonner using a stable id", async () => {
    const { notify } = await import("@/lib/notifications");

    const result = await notify.promise(Promise.resolve({ count: 2 }), {
      loading: { title: "Guardando" },
      success: (data) => ({
        title: "Guardado",
        description: `${data.count} elementos`,
      }),
    });

    expect(result).toEqual({ count: 2 });
    expect(toastMock.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        id: expect.any(String),
        loading: "Guardando",
        success: expect.any(Function),
      })
    );
    const config = toastMock.promise.mock.calls[0]?.[1] as { success?: (data: { count: number }) => string } | undefined;
    expect(config?.success?.({ count: 2 })).toBe("Guardado");
  });

  it("updates a manual loading toast when the caller passes the same id", async () => {
    const { notify } = await import("@/lib/notifications");

    const id = notify.loading({ title: "Exportando" });
    notify.success(
      { title: "Exportacion completada" },
      { id, description: "El archivo ya esta listo" }
    );

    expect(id).toBe("toast-loading-id");
    expect(toastMock.loading).toHaveBeenCalledWith(
      "Exportando",
      expect.any(Object)
    );
    expect(toastMock.success).toHaveBeenCalledWith(
      "Exportacion completada",
      expect.objectContaining({
        id: "toast-loading-id",
        description: "El archivo ya esta listo",
      })
    );
  });

  it("deduplicates only when dedupeKey is provided", async () => {
    const { notify } = await import("@/lib/notifications");

    const firstId = notify.error(
      { title: "Error al sincronizar" },
      { dedupeKey: "sync-error" }
    );
    const secondId = notify.error(
      { title: "Error al sincronizar" },
      { dedupeKey: "sync-error" }
    );
    const thirdId = notify.error({ title: "Otro error" });

    expect(firstId).toBe("toast-error-id");
    expect(secondId).toBe("toast-error-id");
    expect(thirdId).toBe("toast-error-id");
    expect(toastMock.error).toHaveBeenCalledTimes(2);
  });

  it("uses the base toast API for action toasts", async () => {
    const { notify } = await import("@/lib/notifications");
    const onClick = vi.fn();

    toastMock.mockImplementation(
      (...args: unknown[]) => {
        const options = args[1] as { action?: { onClick?: (event: never) => void } } | undefined;
        options?.action?.onClick?.({} as never);
        return "toast-action-id";
      }
    );

    const id = notify.action(
      { title: "Confirmar cambio" },
      { title: "Continuar", onClick }
    );

    expect(id).toBe("toast-action-id");
    expect(toastMock).toHaveBeenCalledWith(
      "Confirmar cambio",
      expect.objectContaining({
        id: expect.stringMatching(/^notify-action-/),
        action: expect.objectContaining({ label: "Continuar" }),
      })
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports a cancel action on action toasts", async () => {
    const { notify } = await import("@/lib/notifications");
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    toastMock.mockImplementation(
      (...args: unknown[]) => {
        const options = args[1] as {
          action?: { onClick?: (event: never) => void };
          cancel?: { onClick?: (event: never) => void };
        } | undefined;
        options?.cancel?.onClick?.({} as never);
        return "toast-action-id";
      }
    );

    const id = notify.action(
      { title: "Confirmar cambio" },
      { title: "Continuar", onClick: onConfirm },
      { cancel: { title: "Cancelar", onClick: onCancel } }
    );

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(id).toBe("toast-action-id");
  });

  it("rethrows promise errors after updating the same toast id", async () => {
    const { notify } = await import("@/lib/notifications");
    const error = new Error("boom");

    await expect(
      notify.promise(Promise.reject(error), {
        loading: { title: "Procesando" },
        error: (err) => ({
          title: "Error al procesar",
          description: (err as Error).message,
        }),
      })
    ).rejects.toThrow("boom");

    expect(toastMock.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        id: expect.any(String),
        error: expect.any(Function),
      })
    );
    const config = toastMock.promise.mock.calls.at(-1)?.[1] as { error?: (err: Error) => string } | undefined;
    expect(config?.error?.(error)).toBe("Error al procesar");
  });
});
