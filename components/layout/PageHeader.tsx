type PageHeaderProps = {
  title: string;
  description?: string;
};

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="space-y-1">
      <h1 className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 bg-clip-text text-2xl font-bold text-transparent">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
};