export function getCurrentWeekStart(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);

  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(result.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}
