'use client';

export default function Step7Confirmation({
  state,
  totalAmount,
  onCancel,
  error,
  isSubmitting,
}) {
  return (
    <div className="space-y-6 w-full rounded-lg border p-4">
      <p>
        Has completado todos los datos para generar una autoventa.
      </p>
      <p className="text-lg font-semibold">
        Total: {Number(totalAmount ?? 0).toFixed(2)} €
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
