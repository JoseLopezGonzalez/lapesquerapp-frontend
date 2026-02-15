import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLabels,
  getLabel,
  createLabel,
  updateLabel,
  deleteLabel,
  duplicateLabel,
} from "./labelService";

const mockToken = "test-token";
const mockLabel = {
  id: "1",
  name: "Test Label",
  format: {
    elements: [],
    canvas: { width: 110, height: 90, rotation: 0 },
  },
};
const mockLabels = [mockLabel];

vi.mock("@lib/fetchWithTenant", () => ({
  fetchWithTenant: vi.fn(),
}));

vi.mock("./labelServiceHelpers", () => ({
  handleLabelServiceResponse: vi.fn((response: unknown) => {
    const r = response as { ok?: boolean; json?: () => Promise<unknown> };
    if (r?.ok && r.json) return r.json();
    return Promise.reject(new Error("Error"));
  }),
}));

import { fetchWithTenant } from "@lib/fetchWithTenant";

describe("labelService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getLabels calls fetchWithTenant and returns data.data", async () => {
    vi.mocked(fetchWithTenant).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockLabels }),
    } as never);
    const result = await getLabels(mockToken);
    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining("/labels"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockLabels);
  });

  it("getLabel calls fetchWithTenant with label id and returns data.data", async () => {
    vi.mocked(fetchWithTenant).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockLabel }),
    } as never);
    const result = await getLabel("1", mockToken);
    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining("/labels/1"),
      expect.any(Object)
    );
    expect(result).toEqual(mockLabel);
  });

  it("createLabel sends POST with name and format", async () => {
    vi.mocked(fetchWithTenant).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { ...mockLabel, id: "2" } }),
    } as never);
    const format = { elements: [], canvas: { width: 110, height: 90 } };
    await createLabel("New", format, mockToken);
    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining("/labels"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "New", format }),
      })
    );
  });

  it("updateLabel sends PUT with labelId, name and format", async () => {
    vi.mocked(fetchWithTenant).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockLabel }),
    } as never);
    const format = { elements: [], canvas: { width: 110, height: 90 } };
    await updateLabel("1", "Updated", format, mockToken);
    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining("/labels/1"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ name: "Updated", format }),
      })
    );
  });

  it("deleteLabel sends DELETE with labelId", async () => {
    vi.mocked(fetchWithTenant).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as never);
    await deleteLabel("1", mockToken);
    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining("/labels/1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("duplicateLabel sends POST to duplicate endpoint", async () => {
    vi.mocked(fetchWithTenant).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { ...mockLabel, id: "2" } }),
    } as never);
    await duplicateLabel("1", mockToken);
    expect(fetchWithTenant).toHaveBeenCalledWith(
      expect.stringContaining("/labels/1/duplicate"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
