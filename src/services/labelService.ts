import { fetchWithTenant } from "@lib/fetchWithTenant";
import { API_URL_V2 } from "@/configs/config";
import { getUserAgent } from "@/lib/utils/getUserAgent";
import { handleLabelServiceResponse } from "./labelServiceHelpers";
import type { Label, LabelFormat, LabelApiResponse } from "@/types/labelEditor";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "User-Agent": getUserAgent(),
  };
}

export function getLabel(labelId: string, token: string): Promise<Label> {
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": getUserAgent(),
    },
  })
    .then((response) => handleLabelServiceResponse(response, "Error al obtener la etiqueta"))
    .then((data: { data?: Label }) => data.data as Label)
    .catch((error) => {
      throw error;
    });
}

export function createLabel(
  labelName: string,
  labelFormat: LabelFormat,
  token: string
): Promise<LabelApiResponse> {
  return fetchWithTenant(`${API_URL_V2}labels`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name: labelName, format: labelFormat }),
  })
    .then((response) => handleLabelServiceResponse(response, "Error al crear la etiqueta"))
    .then((data) => data as LabelApiResponse)
    .catch((error) => {
      throw error;
    });
}

export function updateLabel(
  labelId: string,
  labelName: string,
  labelFormat: LabelFormat,
  token: string
): Promise<LabelApiResponse> {
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ name: labelName, format: labelFormat }),
  })
    .then((response) => handleLabelServiceResponse(response, "Error al actualizar la etiqueta"))
    .then((data) => data as LabelApiResponse)
    .catch((error) => {
      throw error;
    });
}

export function getLabels(token: string): Promise<Label[]> {
  return fetchWithTenant(`${API_URL_V2}labels`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": getUserAgent(),
    },
  })
    .then((response) => handleLabelServiceResponse(response, "Error al obtener las etiquetas"))
    .then((data: { data?: Label[] }) => (data.data ?? data) as Label[])
    .catch((error) => {
      throw error;
    });
}

export function deleteLabel(labelId: string, token: string): Promise<void> {
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": getUserAgent(),
    },
  })
    .then((response) => handleLabelServiceResponse(response, "Error al eliminar la etiqueta"))
    .then(() => undefined)
    .catch((error) => {
      throw error;
    });
}

export function getLabelsOptions(token: string): Promise<unknown> {
  return fetchWithTenant(`${API_URL_V2}labels/options`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": getUserAgent(),
    },
  })
    .then((response) => handleLabelServiceResponse(response, "Error al obtener las opciones de etiquetas"))
    .then((data) => data)
    .catch((error) => {
      throw error;
    });
}

export function duplicateLabel(
  labelId: string,
  token: string,
  customName: string | null = null
): Promise<LabelApiResponse> {
  return fetchWithTenant(`${API_URL_V2}labels/${labelId}/duplicate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(customName ? { name: customName } : {}),
  })
    .then((response) => handleLabelServiceResponse(response, "Error al duplicar la etiqueta"))
    .then((data) => data as LabelApiResponse)
    .catch((error) => {
      throw error;
    });
}
