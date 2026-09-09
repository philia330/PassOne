import DashboardShell from "@/components/dashboard/dashboard-shell";
import { AnimatedPage } from "@/components/layout/animated-page";
import { NavigationProgress } from "@/components/shared/NavigationProgress";
import SessionExpiryWarning from "@/components/shared/SessionExpiryWarning";
import { getSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ambil settings & session bareng-bareng (paralel) -- session dipakai
  // buat tahu role user yang login, supaya DashboardShell bisa nentuin
  // menu/tombol mana yang boleh kelihatan (mis. tombol Settings di Navbar
  // yang cuma muncul buat ADMIN).
  const [settings, session] = await Promise.all([getSettings(), auth()]);

  const currentUser = {
    role: session?.user?.role ?? "",
  };

  return (
    <>
      <SessionExpiryWarning />
      <NavigationProgress />
      <DashboardShell settings={settings} currentUser={currentUser}>
        <AnimatedPage>{children}</AnimatedPage>
      </DashboardShell>
    </>
  );
}