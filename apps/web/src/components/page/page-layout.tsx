type PageLayoutProps = {
  children: React.ReactNode;
  description?: string;
  title?: string;
};

export function PageLayout({ children, description, title, ...props }: PageLayoutProps) {
  return (
    <div className="w-null flex max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8" {...props}>
      <div className="flex flex-col gap-2">
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
