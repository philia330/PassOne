"use client";

import { ReactNode } from "react";
import AppNavbar from "./AppNavbar";
import AppSidebar from "./AppSidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AppSidebar />

      <div className="flex flex-1 flex-col">
        <AppNavbar />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}