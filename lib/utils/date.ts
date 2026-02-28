export function formatTimestamp(value: string): string {
  const date = new Date(value);
  return date.toLocaleString();
}
