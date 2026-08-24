"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { BaaPdfData } from "./BaaPdfDocument";
import { BaaPdfDownload } from "./BaaPdfDownload";

interface BaaDetailActionsProps {
  baa: BaaPdfData;
  appName?: string;
  backHref?: string;
}

export function BaaDetailActions({
  baa,
  appName = "PASSNET",
  backHref = "/workspace?view=baa",
}: BaaDetailActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={backHref}>
        <Button
          variant="outline"
          className="rounded-xl gap-2 text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </Link>

      <BaaPdfDownload baa={baa} appName={appName} />
    </div>
  );
}