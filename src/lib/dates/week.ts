export function getCurrentWeekStart(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);

  return result.toISOString().slice(0, 10);
}
