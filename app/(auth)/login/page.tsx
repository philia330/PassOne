import LoginBackground from "@/components/auth/login-background";
import LoginBrand from "@/components/auth/login-brand";
import LoginForm from "@/components/auth/login-form";

import { getSettings } from "@/lib/settings";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionExpired?: string }>;
}) {
  const settings = await getSettings();
  const params = await searchParams;

  return (
    <main className="relative min-h-screen">
      <LoginBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center overflow-y-auto px-6 py-8">
        <div className="grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">

          <LoginBrand settings={settings} />

          <div className="flex justify-center lg:justify-end">
            <LoginForm settings={settings} sessionExpired={params.sessionExpired === "1"} />
          </div>

        </div>
      </div>
    </main>
  );
}