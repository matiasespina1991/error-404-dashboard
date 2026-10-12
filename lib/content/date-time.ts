export function dateTimeInput(iso: string, timeZone: string): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}
export function dateTimeISO(local: string, timeZone: string): string {
  if (!local) return "";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
    throw new Error("Revisá la fecha y la hora.");
  const desired = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(desired)) throw new Error("Fecha inválida.");
  let instant = desired;
  for (let i = 0; i < 3; i++) {
    const displayed = dateTimeInput(new Date(instant).toISOString(), timeZone);
    const difference = desired - Date.parse(`${displayed}:00Z`);
    if (!difference) break;
    instant += difference;
  }
  const result = new Date(instant).toISOString();
  if (dateTimeInput(result, timeZone) !== local)
    throw new Error(
      "Esa hora no existe en la zona seleccionada. Elegí otra hora.",
    );
  return result;
}
