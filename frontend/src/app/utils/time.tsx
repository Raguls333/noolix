import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatWhen(iso?: string) {
  if (!iso) return "";
  const d = dayjs(iso);
  // example: "2 hours ago • Jan 7, 2026 2:02 AM"
  return `${d.fromNow()} • ${d.format("MMM D, YYYY h:mm A")}`;
}

export function toMillis(iso?: string) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}
