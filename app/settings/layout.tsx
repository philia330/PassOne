import DashboardShell from "@/components/dashboard/dashboard-shell";
import { AnimatedPage } from "@/components/layout/animated-page";
import { getSettings } from "@/lib/settings";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <DashboardShell settings={settings}>
      <AnimatedPage>{children}</AnimatedPage>
    </DashboardShell>
  );
}
