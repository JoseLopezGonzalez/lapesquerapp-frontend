/**
 * Descarga un objeto serializable como archivo .json en el cliente (Blob + anchor sintético).
 * Mismo patrón que downloadPdfResponse en src/services/palletService.ts, sin fetch de por medio
 * porque el JSON se construye enteramente con datos que ya están en memoria.
 */
export function downloadJsonFile(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}
