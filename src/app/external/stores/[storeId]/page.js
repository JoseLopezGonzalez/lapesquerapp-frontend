"use client";

import { use } from "react";
import { Store } from "@/components/Admin/Stores/StoresManager/Store";

export default function ExternalStorePage({ params }) {
  const { storeId } = use(params);

  return (
    <Store
      storeId={Number(storeId)}
      onUpdateCurrentStoreTotalNetWeight={() => {}}
      onAddNetWeightToStore={() => {}}
      setIsStoreLoading={() => {}}
      mode="external"
    />
  );
}
