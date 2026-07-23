type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">
        {title}
      </h1>

      {description && (
        <p className="text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}