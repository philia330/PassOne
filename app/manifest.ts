import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  const icon = settings.favicon || "/icon.png";

  return {
    name: `${settings.app_name} - ${settings.app_subtitle}`,
    short_name: settings.app_name,
    description: settings.app_subtitle,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#9333ea",
    icons: [
      {
        src: icon,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: icon,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}