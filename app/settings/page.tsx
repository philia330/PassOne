import { redirect } from "next/navigation";

import { getSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import SettingsForm from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getSettings();

  return <SettingsForm initialSettings={settings} />;
}