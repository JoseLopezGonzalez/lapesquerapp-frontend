"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Store } from "@/components/Admin/Stores/StoresManager/Store";
import WarehouseOperatorLayout from "@/components/WarehouseOperatorLayout";
import Loader from "@/components/Utilities/Loader";

export default function WarehouseOperatorPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { storeId } = params;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      // Validar que el usuario tenga el rol correcto
      if (!session.user.role?.includes("store_operator") && !session.user.role?.includes("superuser")) {
        router.push("/unauthorized");
        return;
      }

      // Validar que el usuario tenga acceso a este almacén específico (superuser puede acceder a cualquier almacén)
      if (session.user.role === "store_operator" && session.user.assignedStoreId !== parseInt(storeId)) {
        router.push("/unauthorized");
        return;
      }

      // Cargar datos del almacén
      loadStoreData();
    }
  }, [status, session, storeId, router]);

  const loadStoreData = async () => {
    try {
      // Validar que el usuario tenga acceso a este almacén (superuser puede acceder a cualquier almacén)
      if (session.user.role === "store_operator" && session.user.assignedStoreId !== parseInt(storeId)) {
        router.push("/unauthorized");
        return;
      }

      // Aquí cargarías los datos del almacén desde la API
      // Por ejemplo, usando el servicio existente
      // const storeResponse = await fetch(`/api/v2/stores/${storeId}`);
      // const storeData = await storeResponse.json();

      // Por ahora, datos de ejemplo
      setStoreData({
        id: storeId,
        name: "Almacén Principal",
        companyName: session.user.companyName
      });
    } catch (error) {
      console.error("Error loading store data:", error);
      router.push("/unauthorized");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Almacén no encontrado
          </h2>
          <p className="text-gray-600">
            No tienes acceso a este almacén o no existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <WarehouseOperatorLayout storeName={storeData.name}>
      {/* Reutilizar TODO el componente Store existente */}
      <Store
        storeId={parseInt(storeId)}
        onUpdateCurrentStoreTotalNetWeight={() => { }}
        onAddNetWeightToStore={() => { }}
        setIsStoreLoading={() => { }}
      />
    </WarehouseOperatorLayout>
  );
}
