import DashboardShell from "@/components/dashboard/dashboard-shell";
import { AnimatedPage } from "@/components/layout/animated-page";
import { NavigationProgress } from "@/components/shared/NavigationProgress";
import { getSettings } from "@/lib/settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <>
      <NavigationProgress />
      <DashboardShell settings={settings}>
        <AnimatedPage>{children}</AnimatedPage>
      </DashboardShell>
    </>
  );
}