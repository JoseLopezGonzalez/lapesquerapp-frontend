'use client';

export default function AutoventaTicketPrint({ order, state }) {
  const data = order ?? state;
  const entryDate = data?.entryDate ?? state?.entryDate ?? '';
  const loadDate = data?.loadDate ?? state?.loadDate ?? '';
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
      id="autoventa-ticket-print"
      className="hidden print:block p-4 text-sm"
      style={{ fontFamily: 'sans-serif', maxWidth: '80mm' }}
    >
      <h2 className="font-bold text-lg mb-2">Autoventa</h2>
      <p><strong>Fecha:</strong> {entryDate} {entryDate !== loadDate ? ` / Carga: ${loadDate}` : ''}</p>
      <p><strong>Cliente:</strong> {customerName}</p>
      <p><strong>Factura:</strong> {invoiceRequired ? 'Sí' : 'No'}</p>
      <table className="w-full border-collapse mt-2">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">Producto</th>
            <th className="text-right py-1">Cajas</th>
            <th className="text-right py-1">Peso</th>
            <th className="text-right py-1">P. unit.</th>
            <th className="text-right py-1">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b">
              <td className="py-1">{item.productName ?? item.productId}</td>
              <td className="text-right py-1">{item.boxesCount ?? 0}</td>
              <td className="text-right py-1">{Number(item.totalWeight).toFixed(2)}</td>
              <td className="text-right py-1">{Number(item.unitPrice).toFixed(2)}</td>
              <td className="text-right py-1">{Number(item.subtotal ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-semibold mt-2 text-right">Total: {Number(total).toFixed(2)} €</p>
      {observations && (
        <p className="mt-2 text-muted-foreground"><strong>Obs.:</strong> {observations}</p>
      )}
    </div>
  );
}
