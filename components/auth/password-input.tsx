"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps {
  placeholder?: string;
}

export default function PasswordInput({
  placeholder = "Masukkan Password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <LockKeyhole
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        size={20}
      />

      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className="
          h-14
          rounded-2xl
          pl-12
          pr-14
          border-slate-200
          transition-all
          duration-300
          focus:border-purple-500
          focus:ring-2
          focus:ring-purple-300
        "
      />

      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="
          absolute
          right-4
          top-1/2
          -translate-y-1/2
          text-slate-400
          hover:text-purple-600
          transition
        "
      >
        {showPassword ? (
          <EyeOff size={20} />
        ) : (
          <Eye size={20} />
        )}
      </button>
    </div>
  );
}