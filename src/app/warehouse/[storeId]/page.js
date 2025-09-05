"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { Store } from "@/components/Admin/Stores/StoresManager/Store";
import WarehouseOperatorLayout from "@/components/WarehouseOperatorLayout";
import Loader from "@/components/Utilities/Loader";
import { getStore } from "@/services/storeService";

export default function WarehouseOperatorPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unwrap params using React.use() for Next.js 15 compatibility
  const { storeId } = use(params);

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

      // Cargar datos del almacén
      loadStoreData();
    }
  }, [status, session, storeId, router]);

  const loadStoreData = async () => {
    try {
      // Cargar datos del almacén desde la API
      const storeData = await getStore(storeId, session.user.accessToken);
      
      setStoreData({
        id: storeData.id,
        name: storeData.name,
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

  // Filtro simple: si es store_operator y no es su almacén asignado, mostrar no autorizado
  if (status === "authenticated" && session?.user?.role?.includes("store_operator") && session.user.assignedStoreId !== parseInt(storeId)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No autorizado
          </h2>
          <p className="text-gray-600">
            No tienes acceso a este almacén.
          </p>
        </div>
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
