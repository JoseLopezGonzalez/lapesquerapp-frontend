"use client";

import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import WarehouseOperatorLayout from "@/components/WarehouseOperatorLayout";
import Loader from "@/components/Utilities/Loader";
import { getStore } from "@/services/storeService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

export default function WarehouseDispatchCreatePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const storeId = params?.storeId;
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && session?.user && storeId) {
      const role = Array.isArray(session.user.role) ? session.user.role[0] : session.user.role;
      if (role === "operario") {
        const assignedId = session.user.assignedStoreId != null ? Number(session.user.assignedStoreId) : null;
        if (!assignedId || assignedId !== Number(storeId)) {
          router.replace(assignedId ? `/warehouse/${assignedId}` : "/unauthorized");
          return;
        }
      }
      loadStore();
    }
  }, [status, session, storeId, router]);

  const loadStore = async () => {
    try {
      const data = await getStore(storeId, session?.user?.accessToken);
      setStoreData({ id: data.id, name: data.name });
    } catch (e) {
      router.push("/unauthorized");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading || !storeId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!storeData) {
    return null;
  }

  return (
    <WarehouseOperatorLayout storeName={storeData.name}>
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/warehouse/${storeId}`} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </Link>
        </Button>
        <Card className="w-full p-8">
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
            <Construction className="h-12 w-12" />
            <p className="font-medium">Nueva Salida de cebo</p>
            <p className="text-sm">Esta pantalla estará disponible próximamente.</p>
            <Button asChild variant="outline">
              <Link href={`/warehouse/${storeId}`}>Volver al panel</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </WarehouseOperatorLayout>
  );
}
