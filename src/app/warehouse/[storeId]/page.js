"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { Store } from "@/components/Admin/Stores/StoresManager/Store";
import WarehouseOperatorLayout from "@/components/WarehouseOperatorLayout";
import Loader from "@/components/Utilities/Loader";
import { getStore } from "@/services/storeService";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
    const handleRedirectToCorrectStore = () => {
      router.push(`/warehouse/${session.user.assignedStoreId}`);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Acceso no autorizado
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              No tienes permisos para acceder a este almacén.
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Acceso restringido
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Tu cuenta no tiene permisos para gestionar este almacén específico.</p>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={handleRedirectToCorrectStore}
              size="lg"
              className="w-full gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Ir a mi almacén asignado
            </Button>
          </div>
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
