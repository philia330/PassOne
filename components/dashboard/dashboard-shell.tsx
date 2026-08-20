"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Navbar from "@/components/dashboard/navbar";
import Footer from "@/components/dashboard/Footer";

type Settings = {
  app_name: string;
  app_subtitle: string;
  footer_text: string;
};

export default function DashboardShell({
  settings,
  children,
}: {
  settings: Settings;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Overlay gelap di belakang sidebar, cuma muncul di mobile pas sidebar terbuka */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar settings={settings} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar settings={settings} onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-slate-100 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
            {children}
          </main>

          <Footer settings={settings} />
        </div>
      </div>
    </div>
  );
}