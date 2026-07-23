import { LucideIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
        <Icon className="text-indigo-400" size={28} />
      </div>

      <p className="font-medium text-slate-600">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}