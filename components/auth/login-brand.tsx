import Image from "next/image";

type Settings = {
  app_name: string;
  app_subtitle: string;
  login_logo: string | null;
};

export default function LoginBrand({ settings }: { settings: Settings }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center px-16 text-center">

      {/* Badge */}
      <div className="mb-8 rounded-full border border-purple-200 bg-white/70 px-5 py-2 shadow-lg backdrop-blur-md">
        <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-sky-500 bg-clip-text text-sm font-semibold tracking-[0.25em] text-transparent uppercase">
          ISP Management Platform
        </span>
      </div>

      {/* Logo */}
      <div className="relative group">
        <div
          className="
            absolute -inset-10 rounded-full
            bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-sky-500/30
            blur-3xl transition-all duration-700
            group-hover:scale-110 group-hover:opacity-100
          "
        />

        <Image
          src={settings.login_logo || "/images/logo-passnet.png"}
          alt={settings.app_name}
          width={230}
          height={230}
          priority
          unoptimized={!!settings.login_logo}
          className="relative transition-all duration-500 group-hover:scale-105 group-hover:rotate-1"
        />
      </div>

      {/* Title */}
      <h1
        className="
          mt-10 font-[family:var(--font-jakarta)] text-7xl font-extrabold tracking-tight
          bg-gradient-to-r from-purple-600 via-pink-500 to-sky-500
          bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(168,85,247,.35)]
        "
      >
        {settings.app_name}
      </h1>

      {/* Subtitle */}
      <p className="mt-3 text-3xl font-bold text-slate-800">
        {settings.app_subtitle}
      </p>

      <p className="mt-2 uppercase tracking-[0.35em] text-sm font-semibold text-slate-400">
        PT PASSNET INDONESIA
      </p>

      {/* ...bagian divider, description, feature cards tetap sama seperti sebelumnya... */}

    </div>
  );
}