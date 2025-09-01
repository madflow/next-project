import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

interface SidebarLayoutProps {
  children: React.ReactNode;
  SidebarComponent: React.ElementType;
  SiteHeaderComponent: React.ElementType;
  siteHeaderTitle?: string;
}

export function SidebarLayout({
  children,
  SidebarComponent,
  SiteHeaderComponent,
  siteHeaderTitle,
}: SidebarLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }>
      <SidebarComponent variant="inset" />
      <SidebarInset>
        <SiteHeaderComponent title={siteHeaderTitle} />
        <div className="flex flex-1 flex-col">
          <div className="container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
          </div>
        </div>
        <Toaster position="top-center" richColors />
      </SidebarInset>
    </SidebarProvider>
  );
}
