// app/masterdata/user/loading.tsx (contoh, sama persis buat modul lain, ganti nama file doang)
import TableSkeleton from "@/components/shared/table-skeleton";

export default function Loading() {
  return <TableSkeleton rows={8} />;
}