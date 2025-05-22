export function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleString();
}
