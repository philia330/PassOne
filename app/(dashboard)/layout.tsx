import DashboardShell from "@/components/dashboard/dashboard-shell";
import { getSettings } from "@/lib/settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return <DashboardShell settings={settings}>{children}</DashboardShell>;
}