type Settings = {
  app_name: string;
  app_subtitle: string;
  footer_text: string;
};

export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:px-6 lg:px-8">
      <p>{settings.footer_text}</p>
    </footer>
  );
}
