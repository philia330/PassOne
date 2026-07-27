"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export const PasswordInput = ({
  name,
  defaultValue,
  placeholder,
  required,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        name={name}
        type={visible ? "text" : "password"}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete="new-password"
        className={`pr-10 ${className ?? ""}`}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};