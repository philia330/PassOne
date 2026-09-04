import type { Metadata } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  Poppins,
  Nunito,
  Manrope,
  Outfit,
} from "next/font/google";

import "./globals.css";
import AuthProvider from "@/components/providers/session-provider";
import { Toaster } from "sonner";
import { getSettings } from "@/lib/settings";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: {
      default: settings.app_name,
      template: `%s | ${settings.app_name}`,
    },
    description: settings.app_subtitle,
    icons: settings.favicon ? { icon: settings.favicon } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, session] = await Promise.all([
    getSettings(),
    auth(),
  ]);

  const initialTheme = session?.user?.theme_preference ?? "SYSTEM";

  return (
    <html
      lang="id"
      className={`${inter.variable} ${jakarta.variable} ${poppins.variable} ${nunito.variable} ${manrope.variable} ${outfit.variable}`}
      style={{ fontSize: `${settings.app_font_size}px` }}
      suppressHydrationWarning
    >
    <body className="antialiased" style={{ fontFamily: `var(--font-${settings.app_font})` }}>
      <ThemeProvider initialTheme={initialTheme}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </ThemeProvider>
    </body>
    </html>
  );
}
