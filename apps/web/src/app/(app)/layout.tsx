import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Toaster position="top-center" richColors />
    </>
  );
}
