export default function LoginBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50 to-sky-50" />

      {/* Purple */}
      <div className="absolute -top-52 -left-52 h-[560px] w-[560px] rounded-full bg-purple-500/20 blur-[180px]" />

      {/* Pink */}
      <div className="absolute top-1/2 -right-44 h-[520px] w-[520px] rounded-full bg-pink-500/15 blur-[180px]" />

      {/* Blue */}
      <div className="absolute bottom-[-120px] left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-sky-500/15 blur-[180px]" />

      {/* Fuchsia */}
      <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-[150px]" />

      {/* Grid */}
      <div
        className="
          absolute inset-0
          opacity-[0.025]
          [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)]
          [background-size:40px_40px]
        "
      />

    </div>
  );
}