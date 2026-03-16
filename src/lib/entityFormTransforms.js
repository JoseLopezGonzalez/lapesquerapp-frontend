"use client";

/**
 * Client-side payload transforms for entity forms.
 * Used when config.beforeSubmit cannot be a function (e.g. when config is passed from Server to Client).
 */

export function transformStoresPayload(data) {
  const nextData = { ...data, store_type: data.storeType };
  delete nextData.storeType;
  if (data.storeType === "interno") {
    nextData.external_user_id = null;
  }
  return nextData;
}
