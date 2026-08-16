export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function formatDayMonthShort(value: string): { day: string; month: string } {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString("pl-PL", { day: "2-digit", timeZone: "UTC" }),
    month: date.toLocaleDateString("pl-PL", { month: "short", timeZone: "UTC" }).replace(".", "").toUpperCase(),
  };
}

export function formatWeekday(value: string): string {
  const weekday = new Date(value).toLocaleDateString("pl-PL", { weekday: "long", timeZone: "UTC" });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}
