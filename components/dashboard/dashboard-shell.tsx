"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Navbar from "@/components/dashboard/navbar";
import Footer from "@/components/dashboard/Footer";
import { CommandPaletteWrapper } from "@/components/command-palette";

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
      {/* Command Palette - available globally */}
      <CommandPaletteWrapper />

      {/* Overlay gelap di belakang sidebar, cuma muncul di mobile pas sidebar terbuka */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* min-h-0 penting: tanpa ini, flex item defaultnya min-height:auto,
          jadi dia akan tumbuh mengikuti tinggi konten di dalamnya (bukan
          dibatasi tinggi parent) dan overflow-hidden jadi gak ngefek. */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar settings={settings} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <Navbar settings={settings} onMenuClick={() => setSidebarOpen(true)} />

          {/* min-h-0 di sini yang paling krusial: ini yang bikin konten
              notifikasi panjang tadi bisa scroll DI DALAM main, bukan
              mendorong seluruh halaman (body) untuk scroll. */}
          <main className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
            {children}
          </main>

          <Footer settings={settings} />
        </div>
      </div>
    </div>
  );
}