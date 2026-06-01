'use client';

export default function AutoventaTicketPrint({
  order,
  state,
  printId = 'autoventa-ticket-print',
  title = 'Autoventa',
}) {
  const data = order ?? state;
  const entryDate = data?.entryDate ?? state?.entryDate ?? '';
  const customerName = data?.customer?.name ?? data?.customerName ?? state?.customerName ?? '';
  const invoiceRequired = data?.invoiceRequired ?? state?.invoiceRequired ?? false;
  const observations = data?.observations ?? state?.observations ?? '';
  const items = data?.items ?? state?.items ?? [];
  const total = (data?.items ?? state?.items ?? []).reduce(
    (sum, item) => sum + (Number(item.subtotal) || 0),
    0
  );

  return (
    <div
      id={printId}
      className="hidden p-4 text-sm print:block"
      style={{ fontFamily: 'sans-serif', maxWidth: '80mm' }}
    >
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      <p>
        <strong>Fecha:</strong> {entryDate}
      </p>
      <p>
        <strong>Cliente:</strong> {customerName}
      </p>
      {invoiceRequired && (
        <p>
          <strong>Factura:</strong> Sí
        </p>
      )}
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left">Producto</th>
            <th className="py-1 text-right"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b align-top">
              {/* Intentionally matches Step6Summary so screen + ticket keep the same structure. */}
              <td className="py-1 pr-2 break-words whitespace-normal">
                {item.productName ?? item.productId}
              </td>
              <td className="py-1 text-right text-xs whitespace-pre-line">
                {`${item.boxesCount ?? 0} /c\n${Number(item.totalWeight).toFixed(2)} kg\n${Number(item.unitPrice).toFixed(2)} €/kg\n${Number(item.subtotal ?? 0).toFixed(2)} €`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-right font-semibold">Total: {Number(total).toFixed(2)} €</p>
      {observations && (
        <p className="text-muted-foreground mt-2">
          <strong>Obs.:</strong> {observations}
        </p>
      )}
    </div>
  );
}
