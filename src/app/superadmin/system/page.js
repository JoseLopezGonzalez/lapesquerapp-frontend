"use client";

import React, { useState } from "react";
import { fetchSuperadmin } from "@/lib/superadminApi";
import { notify } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Play } from "lucide-react";
import QueueHealthWidget from "@/components/Superadmin/QueueHealthWidget";

export default function SystemPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunAll = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetchSuperadmin("/migrations/run-all", { method: "POST" });
      const json = await res.json();
      setResult(json);
      notify.success({
        title: "Migraciones encoladas",
        description: json.message || `${json.tenants_queued} tenant(s) en cola.`,
      });
      setConfirmOpen(false);
    } catch (err) {
      notify.error({ title: err.message || "Error al encolar migraciones" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Sistema</h1>

      <QueueHealthWidget showRefresh />

      <Card className="border-orange-500/30">
        <CardHeader>
          <CardTitle className="text-sm text-orange-700 dark:text-orange-400">Acciones avanzadas</CardTitle>
          <CardDescription>
            Operaciones que afectan a todos los tenants. Úsalas con precaución.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Migraciones globales</CardTitle>
              <CardDescription>
                Ejecuta las migraciones pendientes en todos los tenants activos. Las migraciones se encolan y se ejecutan de forma asíncrona.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result && (
                <div className="rounded-md bg-muted px-4 py-3 text-sm">
                  <span className="font-medium">{result.message}</span>
                  {result.tenants_queued != null && (
                    <span className="ml-2 text-muted-foreground">
                      ({result.tenants_queued} tenant{result.tenants_queued !== 1 ? "s" : ""} en cola)
                    </span>
                  )}
                </div>
              )}
              <Button onClick={() => setConfirmOpen(true)}>
                <Play className="h-4 w-4" />
                Ejecutar migraciones en todos los tenants
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar migraciones globales</DialogTitle>
            <DialogDescription>
              Se encolarán las migraciones pendientes en TODOS los tenants activos.
              Esta operación puede tardar varios minutos dependiendo del número de tenants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={running}>
              Cancelar
            </Button>
            <Button onClick={handleRunAll} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar y encolar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
