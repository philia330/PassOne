"use client";

import * as React from "react";
import { CommandPalette, useCommandPalette } from "./index";

export function CommandPaletteWrapper() {
  const [isOpen, setIsOpen] = React.useState(false);

  useCommandPalette({
    onOpen: () => setIsOpen(true),
  });

  return (
    <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
  );
}
