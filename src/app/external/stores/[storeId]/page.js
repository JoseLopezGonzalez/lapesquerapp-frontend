"use client";

import { use } from "react";
import { ExternalPageShell } from "@/components/External/ExternalPageShell";
import { Store } from "@/components/Admin/Stores/StoresManager/Store";

export default function ExternalStorePage({ params }) {
  const { storeId } = use(params);

  return (
    <ExternalPageShell>
      <Store
        storeId={Number(storeId)}
        onUpdateCurrentStoreTotalNetWeight={() => {}}
        onAddNetWeightToStore={() => {}}
        setIsStoreLoading={() => {}}
        mode="external"
      />
    </ExternalPageShell>
  );
}
