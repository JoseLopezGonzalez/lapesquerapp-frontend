import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMock = Object.assign(
  vi.fn(() => "toast-default-id"),
  {
    success: vi.fn(() => "toast-success-id"),
    error: vi.fn(() => "toast-error-id"),
    warning: vi.fn(() => "toast-warning-id"),
    info: vi.fn(() => "toast-info-id"),
    loading: vi.fn(() => "toast-loading-id"),
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
  });

  it("keeps loading toast alive until promise resolves and reuses the same id", async () => {
    const { notify } = await import("@/lib/notifications");

    const result = await notify.promise(Promise.resolve({ count: 2 }), {
      loading: { title: "Guardando" },
      success: (data) => ({
        title: "Guardado",
        description: `${data.count} elementos`,
      }),
    });

    expect(result).toEqual({ count: 2 });
    expect(toastMock.loading).toHaveBeenCalledWith(
      "Guardando",
      expect.objectContaining({
        id: expect.any(String),
        duration: Infinity,
      })
    );
    expect(toastMock.success).toHaveBeenCalledWith(
      "Guardado",
      expect.objectContaining({
        id: expect.any(String),
        description: "2 elementos",
      })
    );
    expect(getToastCallId(toastMock.success.mock.calls[0])).toBe(
      getToastCallId(toastMock.loading.mock.calls[0])
    );
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
      expect.objectContaining({ duration: Infinity })
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

  it("dismisses the action toast before invoking the callback", async () => {
    const { notify } = await import("@/lib/notifications");
    const onClick = vi.fn();

    (toastMock.warning as unknown as { mockImplementation: (fn: (...args: unknown[]) => string) => void }).mockImplementation(
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

    expect(id).toMatch(/^notify-action-/);
    expect(toastMock.warning).toHaveBeenCalledWith(
      "Confirmar cambio",
      expect.objectContaining({ id })
    );
    expect(toastMock.dismiss).toHaveBeenCalledWith(id);
    expect(onClick).toHaveBeenCalledTimes(1);
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

    expect(toastMock.error).toHaveBeenCalledWith(
      "Error al procesar",
      expect.objectContaining({
        id: expect.any(String),
        description: "boom",
      })
    );
    expect(getToastCallId(toastMock.error.mock.calls[0])).toBe(
      getToastCallId(toastMock.loading.mock.calls[0])
    );
  });
});
