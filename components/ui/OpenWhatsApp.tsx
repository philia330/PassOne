"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type OpenWhatsAppProps = {
  phoneNumber: string;
  name?: string;
};

export function OpenWhatsApp({ phoneNumber, name }: OpenWhatsAppProps) {
  const openWhatsApp = () => {
    // Bersihkan nomor HP - hapus karakter non-digit
    let cleanNumber = phoneNumber.replace(/\D/g, "");

    // Jika nomor dimulai dengan 0, ganti dengan 62 (kode Indonesia)
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.substring(1);
    }

    // Format URL untuk WhatsApp
    const url = `https://wa.me/${cleanNumber}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={openWhatsApp}
      title={name ? `Hubungi ${name} via WhatsApp` : "Hubungi via WhatsApp"}
      className="cursor-pointer rounded-xl hover:bg-green-50 dark:hover:bg-green-500/20"
    >
      <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
    </Button>
  );
}
