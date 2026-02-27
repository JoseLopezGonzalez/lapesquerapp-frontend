"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDecimalWeight } from "@/helpers/formats/numbers/formatNumbers";

/**
 * Renders details card based on entry.type. Fallback: key-value list.
 *
 * Legacy types (box_added, box_removed, box_updated, observations_updated) are deprecated
 * and kept only for compatibility with old timeline data; new saves emit pallet_updated.
 */
export function TimelineEventDetail({ entry }) {
  const { type, details = {} } = entry;

  switch (type) {
    case "box_added":
      // Legacy: solo compatibilidad con historiales antiguos.
      return <DetailBox d={details} variant="added" />;
    case "box_removed":
      // Legacy: solo compatibilidad con historiales antiguos.
      return <DetailBox d={details} variant="removed" />;
    case "box_updated":
      // Legacy: solo compatibilidad con historiales antiguos.
      return <DetailBoxUpdated d={details} />;
    case "state_changed":
    case "state_changed_auto":
      return <DetailState d={details} isAuto={type === "state_changed_auto"} />;
    case "store_assigned":
    case "store_removed":
      return <DetailStore d={details} isRemoved={type === "store_removed"} />;
    case "position_assigned":
    case "position_unassigned":
      return <DetailPosition d={details} isUnassigned={type === "position_unassigned"} />;
    case "order_linked":
    case "order_unlinked":
      return <DetailOrder d={details} isUnlinked={type === "order_unlinked"} />;
    case "pallet_created":
    case "pallet_created_from_reception":
      return <DetailPalletCreated d={details} fromReception={type === "pallet_created_from_reception"} />;
    case "pallet_updated":
      return <DetailPalletUpdated d={details} />;
    case "observations_updated":
      // Legacy: solo compatibilidad con historiales antiguos.
      return <DetailObservations d={details} />;
    default:
      return <DetailGeneric d={details} action={entry.action} />;
  }
}

function DetailBox({ d, variant }) {
  const isAdded = variant === "added";
  return (
    <Card className="border-l-4 border-muted bg-muted/30">
      <CardContent className="pt-3 pb-3">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={isAdded ? "default" : "destructive"} className="shrink-0">
              {isAdded ? "Añadida" : "Eliminada"}
            </Badge>
            {d.productName != null && d.productName !== "" && (
              <span className="font-medium">{d.productName}</span>
            )}
            {d.productId != null && (d.productName == null || d.productName === "") && (
              <span className="text-muted-foreground">Producto #{d.productId}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            {d.lot != null && <span>Lote: {d.lot}</span>}
            {d.netWeight != null && <span>Peso neto: {formatDecimalWeight(d.netWeight)} kg</span>}
            {d.grossWeight != null && <span>Peso bruto: {formatDecimalWeight(d.grossWeight)} kg</span>}
            {d.gs1128 != null && d.gs1128 !== "" && <span className="font-mono text-xs">GS1: {d.gs1128}</span>}
          </div>
          {(d.newBoxesCount != null || d.newTotalNetWeight != null) && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              Total palet: {d.newBoxesCount ?? "—"} cajas / {d.newTotalNetWeight != null ? formatDecimalWeight(d.newTotalNetWeight) : "—"} kg
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailBoxUpdated({ d }) {
  const changes = d.changes || {};
  const changeKeys = Object.keys(changes);
  return (
    <Card className="border-l-4 border-blue-500/50 bg-blue-500/5">
      <CardContent className="pt-3 pb-3">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Modificada</Badge>
            {(d.productName || d.productId != null) && (
              <span className="font-medium">{d.productName || `Producto #${d.productId}`}</span>
            )}
            {d.lot != null && <span className="text-muted-foreground">Lote: {d.lot}</span>}
          </div>
          {changeKeys.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Cambios</p>
              {changeKeys.map((key) => {
                const c = changes[key];
                if (!c || (c.from === undefined && c.to === undefined)) return null;
                return (
                  <p key={key} className="text-xs">
                    <span className="capitalize">{key}</span>: {String(c.from ?? "—")} → {String(c.to ?? "—")}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailState({ d, isAuto }) {
  return (
    <Card className="border-l-4 border-amber-500/50 bg-amber-500/5">
      <CardContent className="pt-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{d.from ?? "—"}</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge>{d.to ?? "—"}</Badge>
        </div>
        {isAuto && (d.reason != null || d.usedBoxesCount != null) && (
          <p className="text-xs text-muted-foreground mt-2">
            {d.reason != null && <span>{d.reason}</span>}
            {d.usedBoxesCount != null && d.totalBoxesCount != null && (
              <span> · Cajas: {d.usedBoxesCount}/{d.totalBoxesCount}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DetailStore({ d, isRemoved }) {
  if (isRemoved) {
    return (
      <Card className="border-l-4 border-red-500/50 bg-red-500/5">
        <CardContent className="pt-3 pb-3 text-sm">
          <p><span className="text-muted-foreground">Retirado de:</span> {d.previousStoreName ?? `#${d.previousStoreId}`}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-l-4 border-emerald-500/50 bg-emerald-500/5">
      <CardContent className="pt-3 pb-3 text-sm">
        <p><span className="font-medium">Almacén:</span> {d.storeName ?? `#${d.storeId}`}</p>
        {(d.previousStoreId != null || d.previousStoreName != null) && (
          <p className="text-muted-foreground text-xs mt-1">Anterior: {d.previousStoreName ?? `#${d.previousStoreId}`}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DetailPosition({ d, isUnassigned }) {
  if (isUnassigned) {
    return (
      <Card className="border-l-4 border-muted bg-muted/30">
        <CardContent className="pt-3 pb-3 text-sm">
          <p>Posición quitada: {d.previousPositionName ?? d.previousPositionId}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-l-4 border-violet-500/50 bg-violet-500/5">
      <CardContent className="pt-3 pb-3 text-sm">
        <p><span className="font-medium">Posición:</span> {d.positionName ?? d.positionId}</p>
        {(d.storeName != null || d.storeId != null) && (
          <p className="text-muted-foreground text-xs mt-1">Almacén: {d.storeName ?? `#${d.storeId}`}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DetailOrder({ d, isUnlinked }) {
  return (
    <Card className={`border-l-4 ${isUnlinked ? "border-orange-500/50 bg-orange-500/5" : "border-sky-500/50 bg-sky-500/5"}`}>
      <CardContent className="pt-3 pb-3 text-sm">
        <p><span className="font-medium">{isUnlinked ? "Desvinculado de" : "Vinculado a"}:</span> {d.orderReference ?? `#${d.orderId}`}</p>
        {d.orderId != null && <p className="text-muted-foreground text-xs">ID: {d.orderId}</p>}
      </CardContent>
    </Card>
  );
}

function DetailPalletCreated({ d, fromReception }) {
  return (
    <Card className="border-l-4 border-green-500/50 bg-green-500/5">
      <CardContent className="pt-3 pb-3 text-sm space-y-1">
        <p><span className="font-medium">Cajas:</span> {d.boxesCount ?? "—"}</p>
        <p><span className="font-medium">Peso neto:</span> {d.totalNetWeight != null ? formatDecimalWeight(d.totalNetWeight) : "—"} kg</p>
        {d.initialState != null && <p><span className="font-medium">Estado inicial:</span> {d.initialState}</p>}
        {fromReception && d.receptionId != null && <p><span className="font-medium">Recepción:</span> #{d.receptionId}</p>}
        {d.storeName != null && <p><span className="font-medium">Almacén:</span> {d.storeName}</p>}
        {d.orderId != null && <p><span className="font-medium">Pedido:</span> #{d.orderId}</p>}
        {d.fromAutoventa === true && <Badge variant="secondary" className="mt-1">Autoventa</Badge>}
      </CardContent>
    </Card>
  );
}

/**
 * Detail for pallet_updated: one event per save with optional keys (observations, state, store, order, boxesAdded, boxesRemoved, boxesUpdated, fromReception, receptionId).
 */
function DetailPalletUpdated({ d }) {
  const sections = [];

  if (d.observations != null && (d.observations.from !== undefined || d.observations.to !== undefined)) {
    sections.push(<DetailObservations key="obs" d={d.observations} />);
  }
  if (d.state != null && (d.state.from != null || d.state.to != null)) {
    sections.push(<DetailState key="state" d={d.state} isAuto={false} />);
  }
  if (d.store != null) {
    if (d.store.assigned != null) {
      sections.push(<DetailStore key="store" d={d.store.assigned} isRemoved={false} />);
    } else if (d.store.removed != null) {
      sections.push(<DetailStore key="store" d={d.store.removed} isRemoved={true} />);
    }
  }
  if (d.order != null) {
    if (d.order.linked != null) {
      sections.push(<DetailOrder key="order" d={d.order.linked} isUnlinked={false} />);
    } else if (d.order.unlinked != null) {
      sections.push(<DetailOrder key="order" d={d.order.unlinked} isUnlinked={true} />);
    }
  }
  if (Array.isArray(d.boxesAdded) && d.boxesAdded.length > 0) {
    d.boxesAdded.forEach((box, i) => {
      sections.push(<DetailBox key={`added-${i}`} d={box} variant="added" />);
    });
  }
  if (Array.isArray(d.boxesRemoved) && d.boxesRemoved.length > 0) {
    d.boxesRemoved.forEach((box, i) => {
      sections.push(<DetailBox key={`removed-${i}`} d={box} variant="removed" />);
    });
  }
  if (Array.isArray(d.boxesUpdated) && d.boxesUpdated.length > 0) {
    d.boxesUpdated.forEach((box, i) => {
      sections.push(<DetailBoxUpdated key={`updated-${i}`} d={box} />);
    });
  }
  if (d.fromReception === true) {
    sections.push(
      <div key="reception" className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">Desde recepción</Badge>
        {d.receptionId != null && <span className="text-sm text-muted-foreground">Recepción #{d.receptionId}</span>}
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <Card className="border-muted bg-muted/20">
        <CardContent className="pt-3 pb-3 text-sm text-muted-foreground">Sin detalle</CardContent>
      </Card>
    );
  }

  return <div className="space-y-3">{sections}</div>;
}

function DetailObservations({ d }) {
  const from = d.from ?? "";
  const to = d.to ?? "";
  return (
    <Card className="border-l-4 border-slate-500/50 bg-slate-500/5">
      <CardContent className="pt-3 pb-3 text-sm space-y-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Antes</p>
          <p className="rounded bg-muted/50 p-2 text-xs whitespace-pre-wrap">{from === "" ? "—" : from}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Después</p>
          <p className="rounded bg-muted/50 p-2 text-xs whitespace-pre-wrap">{to === "" ? "—" : to}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailGeneric({ d, action }) {
  const entries = Object.entries(d || {}).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return <Card className="border-muted"><CardContent className="pt-3 pb-3 text-sm text-muted-foreground">{action}</CardContent></Card>;
  return (
    <Card className="border-muted bg-muted/20">
      <CardContent className="pt-3 pb-3 text-sm">
        <ul className="space-y-1">
          {entries.map(([key, value]) => (
            <li key={key} className="flex gap-2">
              <span className="text-muted-foreground capitalize shrink-0">{key}:</span>
              <span>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
