"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
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
    <Card>
      <CardContent className="pt-4 pb-4">
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
            {d.netWeight != null && <span>Peso neto: {formatDecimalWeight(d.netWeight)}</span>}
            {d.grossWeight != null && <span>Peso bruto: {formatDecimalWeight(d.grossWeight)}</span>}
            {d.gs1128 != null && d.gs1128 !== "" && <span className="font-mono text-xs">GS1: {d.gs1128}</span>}
          </div>
          {(d.newBoxesCount != null || d.newTotalNetWeight != null) && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              Total palet: {d.newBoxesCount ?? "—"} cajas / {d.newTotalNetWeight != null ? formatDecimalWeight(d.newTotalNetWeight) : "—"}
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
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Modificada</Badge>
            {(d.productName || d.productId != null) && (
              <span className="font-medium">{d.productName || `Producto #${d.productId}`}</span>
            )}
            {d.lot != null && <span className="text-muted-foreground">Lote: {d.lot}</span>}
          </div>
          {changeKeys.length > 0 && (
            <div className="rounded-md border bg-muted/50 p-3 space-y-1">
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

const STATE_LABELS_ES = {
  registered: "Registrado",
  stored: "Almacenado",
  shipped: "Enviado",
  processed: "Procesado",
};

function stateLabel(value) {
  if (value == null || value === "") return "—";
  const key = typeof value === "string" ? value.toLowerCase() : String(value);
  return STATE_LABELS_ES[key] ?? value;
}

function DetailState({ d, isAuto }) {
  const fromLabel = stateLabel(d.from);
  const toLabel = stateLabel(d.to);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          Estado
          {isAuto && (
            <Badge variant="secondary" className="font-normal">
              Automático
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{fromLabel}</Badge>
          <span className="flex shrink-0 text-muted-foreground" aria-hidden>
            <ArrowRight className="h-4 w-4" />
          </span>
          <Badge>{toLabel}</Badge>
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
  const actionLabel = isRemoved ? "Retirado" : "Asignado";
  const mainLabel = isRemoved ? "Retirado de" : "Almacén";
  const mainValue = isRemoved
    ? d.previousStoreName ?? (d.previousStoreId != null ? `#${d.previousStoreId}` : "—")
    : d.storeName ?? (d.storeId != null ? `#${d.storeId}` : "—");
  const hasPrevious = !isRemoved && (d.previousStoreId != null || d.previousStoreName != null);
  const previousValue =
    hasPrevious ? d.previousStoreName ?? (d.previousStoreId != null ? `#${d.previousStoreId}` : "—") : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          Almacén
          <Badge variant="secondary" className="font-normal">
            {actionLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm space-y-1">
        <p>
          <span className="text-muted-foreground">{mainLabel}:</span>{" "}
          <span className="font-medium">{mainValue}</span>
        </p>
        {previousValue && (
          <p className="text-xs text-muted-foreground">Anterior: {previousValue}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DetailPosition({ d, isUnassigned }) {
  const actionLabel = isUnassigned ? "Quitada" : "Asignada";

  if (isUnassigned) {
    const value = d.previousPositionName ?? d.previousPositionId ?? "—";
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
            Posición
            <Badge variant="secondary" className="font-normal">
              {actionLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Posición quitada:</span>{" "}
            <span className="font-medium">{value}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  const positionValue = d.positionName ?? d.positionId ?? "—";
  const storeValue =
    d.storeName != null ? d.storeName : d.storeId != null ? `#${d.storeId}` : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          Posición
          <Badge variant="secondary" className="font-normal">
            {actionLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm space-y-1">
        <p>
          <span className="text-muted-foreground">Posición:</span>{" "}
          <span className="font-medium">{positionValue}</span>
        </p>
        {storeValue && (
          <p className="text-xs text-muted-foreground">Almacén: {storeValue}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DetailOrder({ d, isUnlinked }) {
  const hasPrevious = d.previousOrderId != null;
  const actionLabel = isUnlinked
    ? "Desvinculado"
    : hasPrevious
      ? "Modificado"
      : "Vinculado";

  const formatId = (id) => (id != null ? `#${id}` : "—");

  let content;
  if (isUnlinked) {
    content = <span className="text-muted-foreground">{formatId(d.orderId)}</span>;
  } else if (!hasPrevious) {
    content = <span>{formatId(d.orderId)}</span>;
  } else {
    const fromRef = formatId(d.previousOrderId);
    const toRef = formatId(d.orderId);
    content = (
      <div className="flex items-stretch gap-3 text-sm">
        <div className="flex-1 min-w-0 rounded-md bg-muted/40 border border-border/60 px-2 py-1.5 flex flex-col">
          <p className="whitespace-pre-wrap line-clamp-6 text-muted-foreground break-words">
            {fromRef}
          </p>
        </div>
        <span className="flex shrink-0 items-center text-muted-foreground py-1" aria-hidden>
          <ArrowRight className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0 rounded-md bg-muted/40 border border-border/60 px-2 py-1.5 flex flex-col">
          <p className="whitespace-pre-wrap line-clamp-6 break-words">
            {toRef}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          Pedido
          <Badge variant="secondary" className="font-normal">
            {actionLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm space-y-1">
        {content}
      </CardContent>
    </Card>
  );
}

function DetailPalletCreated({ d, fromReception }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          Palet creado
          {fromReception && (
            <Badge variant="secondary" className="font-normal">
              Desde recepción
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm space-y-1">
        <p>
          <span className="font-medium">Cajas:</span> {d.boxesCount ?? "—"}
        </p>
        <p>
          <span className="font-medium">Peso neto:</span>{" "}
          {d.totalNetWeight != null ? formatDecimalWeight(d.totalNetWeight) : "—"}
        </p>
        {d.initialState != null && (
          <p>
            <span className="font-medium">Estado inicial:</span> {d.initialState}
          </p>
        )}
        {fromReception && d.receptionId != null && (
          <p>
            <span className="font-medium">Recepción:</span> #{d.receptionId}
          </p>
        )}
        {d.storeName != null && (
          <p>
            <span className="font-medium">Almacén:</span> {d.storeName}
          </p>
        )}
        {d.orderId != null && (
          <p>
            <span className="font-medium">Pedido:</span> #{d.orderId}
          </p>
        )}
        {d.fromAutoventa === true && (
          <Badge variant="secondary" className="mt-1">
            Autoventa
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Renders a table of boxes (added, removed, or updated) for pallet_updated details.
 * Totals (estado del palet después del evento) se muestran en el footer global del card, no aquí.
 */
function DetailBoxesTable({ boxes, variant, title }) {
  const isUpdated = variant === "updated";

  if (isUpdated) {
    const getVal = (box, key, side) => {
      const c = box.changes?.[key];
      if (c && (c.from !== undefined || c.to !== undefined)) return side === "from" ? (c.from ?? "—") : (c.to ?? "—");
      const v = box[key];
      return v !== undefined && v !== null ? v : "—";
    };
    const hasChange = (box, key) => {
      const c = box.changes?.[key];
      return c && (c.from !== undefined || c.to !== undefined);
    };
    const cellChanged = (box, key) => hasChange(box, key) ? "bg-muted/60" : "";
    const fmtWeight = (v) => (v != null && v !== "—" ? formatDecimalWeight(v) : String(v));
    return (
      <Card>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={title ? "pt-0" : ""}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Peso neto</TableHead>
                <TableHead className="w-8 p-0" aria-hidden />
                <TableHead>Producto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Peso neto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boxes.map((box, i) => (
                <TableRow key={box.boxId ?? i}>
                  <TableCell className="font-medium text-muted-foreground">
                    {getVal(box, "productName", "from") !== "—" ? getVal(box, "productName", "from") : (box.productName ?? (box.productId != null ? `Producto #${box.productId}` : "—"))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{getVal(box, "lot", "from") !== "—" ? getVal(box, "lot", "from") : (box.lot ?? "—")}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtWeight(getVal(box, "netWeight", "from"))}</TableCell>
                  <TableCell className="w-8 p-1 text-center text-muted-foreground" aria-hidden>
                    <ArrowRight className="h-4 w-4 inline" />
                  </TableCell>
                  <TableCell className={`font-medium ${cellChanged(box, "productName")}`}>
                    {getVal(box, "productName", "to") !== "—" ? getVal(box, "productName", "to") : (box.productName ?? (box.productId != null ? `Producto #${box.productId}` : "—"))}
                  </TableCell>
                  <TableCell className={cellChanged(box, "lot")}>{getVal(box, "lot", "to") !== "—" ? getVal(box, "lot", "to") : (box.lot ?? "—")}</TableCell>
                  <TableCell className={cellChanged(box, "netWeight")}>{fmtWeight(getVal(box, "netWeight", "to"))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : ""}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Peso neto</TableHead>
              <TableHead>Peso bruto</TableHead>
              <TableHead className="font-mono text-xs">GS1-128</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boxes.map((box, i) => (
              <TableRow key={box.boxId ?? i}>
                <TableCell className="font-medium">
                  {box.productName ?? (box.productId != null ? `Producto #${box.productId}` : "—")}
                </TableCell>
                <TableCell>{box.lot ?? "—"}</TableCell>
                <TableCell>
                  {box.netWeight != null ? formatDecimalWeight(box.netWeight) : "—"}
                </TableCell>
                <TableCell>
                  {box.grossWeight != null ? formatDecimalWeight(box.grossWeight) : "—"}
                </TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate" title={box.gs1128}>
                  {box.gs1128 ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * Detail for pallet_updated: one event per save with optional keys (observations, state, store, order, boxesAdded, boxesRemoved, boxesUpdated, fromReception, receptionId, afterEvent).
 * Totals (estado del palet después del evento) se muestran una sola vez en el footer global del card.
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
    sections.push(
      <DetailBoxesTable key="boxesAdded" boxes={d.boxesAdded} variant="added" title="Cajas añadidas" />
    );
  }
  if (Array.isArray(d.boxesRemoved) && d.boxesRemoved.length > 0) {
    sections.push(
      <DetailBoxesTable key="boxesRemoved" boxes={d.boxesRemoved} variant="removed" title="Cajas eliminadas" />
    );
  }
  if (Array.isArray(d.boxesUpdated) && d.boxesUpdated.length > 0) {
    sections.push(
      <DetailBoxesTable key="boxesUpdated" boxes={d.boxesUpdated} variant="updated" title="Cajas modificadas" />
    );
  }
  if (d.fromReception === true) {
    sections.push(
      <div key="reception" className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary">Desde recepción</Badge>
        {d.receptionId != null && <span className="text-sm text-muted-foreground">Recepción #{d.receptionId}</span>}
      </div>
    );
  }

  const globalTotals =
    d.afterEvent &&
    (d.afterEvent.boxesCount != null || d.afterEvent.totalNetWeight != null)
      ? { count: d.afterEvent.boxesCount, weight: d.afterEvent.totalNetWeight }
      : (() => {
          const firstRemoved = d.boxesRemoved?.[0];
          const firstAdded = d.boxesAdded?.[0];
          const legacy = firstRemoved ?? firstAdded;
          if (
            legacy &&
            (legacy.newBoxesCount != null || legacy.newTotalNetWeight != null)
          ) {
            return { count: legacy.newBoxesCount, weight: legacy.newTotalNetWeight };
          }
          return null;
        })();

  if (sections.length === 0 && !globalTotals) {
    return (
      <Card>
        <CardContent className="pt-4 pb-4 text-sm text-muted-foreground">Sin detalle</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sections}
      {globalTotals && (globalTotals.count != null || globalTotals.weight != null) && (
        <div className="pt-2 mt-2 border-t border-border">
          <Badge variant="secondary" className="font-normal">
            {globalTotals.count ?? "—"} cajas · {globalTotals.weight != null ? formatDecimalWeight(globalTotals.weight) : "—"}
          </Badge>
        </div>
      )}
    </div>
  );
}

function DetailObservations({ d }) {
  const from = d.from ?? "";
  const to = d.to ?? "";
  const fromEmpty = from === "";
  const toEmpty = to === "";

  const actionLabel =
    fromEmpty && !toEmpty ? "Añadida" : !fromEmpty && toEmpty ? "Eliminada" : !fromEmpty && !toEmpty ? "Modificada" : null;

  let content;
  if (fromEmpty && toEmpty) {
    content = <span className="text-muted-foreground">—</span>;
  } else if (fromEmpty) {
    content = <span className="whitespace-pre-wrap line-clamp-2">{to}</span>;
  } else if (toEmpty) {
    content = <span className="whitespace-pre-wrap line-clamp-2 text-muted-foreground">{from}</span>;
  } else {
    content = (
      <div className="flex items-stretch gap-3 text-sm">
        <div className="flex-1 min-w-0 rounded-md bg-muted/40 border border-border/60 px-2 py-1.5 flex flex-col">
          <p className="whitespace-pre-wrap line-clamp-6 text-muted-foreground break-words">
            {from}
          </p>
        </div>
        <span className="flex shrink-0 items-center text-muted-foreground py-1" aria-hidden>
          <ArrowRight className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0 rounded-md bg-muted/40 border border-border/60 px-2 py-1.5 flex flex-col">
          <p className="whitespace-pre-wrap line-clamp-6 break-words">
            {to}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          Observaciones
          {actionLabel != null && (
            <Badge variant="secondary" className="font-normal">
              {actionLabel}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm space-y-1">
        {content}
      </CardContent>
    </Card>
  );
}

function DetailGeneric({ d, action }) {
  const entries = Object.entries(d || {}).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return <Card><CardContent className="pt-4 pb-4 text-sm text-muted-foreground">{action}</CardContent></Card>;
  return (
    <Card>
      <CardContent className="pt-4 pb-4 text-sm">
        <ul className="space-y-2">
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
