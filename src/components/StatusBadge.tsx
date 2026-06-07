import { STATUS_BADGE_CLASS } from "@/lib/masters";

export default function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_BADGE_CLASS[status] ??
    "bg-gray-100 text-gray-700 border border-gray-300";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}
