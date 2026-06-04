export function parseQrPayload(raw: string): Record<string, string> {
  return Object.fromEntries(
    String(raw ?? '')
      .trim()
      .split(';')
      .map((part) => {
        const [key, value] = part.split('=');
        return [key?.trim()?.toUpperCase(), value?.trim()];
      })
      .filter(([key, value]) => key && value)
  );
}
