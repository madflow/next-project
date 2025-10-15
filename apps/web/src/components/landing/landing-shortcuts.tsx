"use client";

import { useTranslations } from "next-intl";
import { Plus, Settings, Upload, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LandingShortcuts() {
  const t = useTranslations("pageLanding.shortcuts");
  const router = useRouter();
  const { activeOrganization } = useAppContext();
  const isAdmin = useIsAdmin();

  const shortcuts = [
    {
      icon: Plus,
      title: t("createProject"),
      description: t("createProjectDescription"),
      href: "/admin/projects/new",
      enabled: !!activeOrganization && isAdmin,
    },
    {
      icon: Settings,
      title: t("adminPanel"),
      description: t("adminPanelDescription"),
      href: "/admin",
      enabled: isAdmin,
    },
    {
      icon: Upload,
      title: t("uploadDataset"),
      description: t("uploadDatasetDescription"),
      href: "/admin/datasets/upload",
      enabled: !!activeOrganization && isAdmin,
    },
    {
      icon: FolderOpen,
      title: t("viewProjects"),
      description: t("viewProjectsDescription"),
      href: "/admin/projects",
      enabled: !!activeOrganization && isAdmin,
    },
  ];

  const enabledShortcuts = shortcuts.filter((shortcut) => shortcut.enabled);

  if (enabledShortcuts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enabledShortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Button 
                key={shortcut.href}
                variant="ghost" 
                className="h-auto p-4 justify-start hover:bg-accent hover:text-accent-foreground group w-full"
                onClick={() => router.push(shortcut.href as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 group-hover:text-primary" />
                  <div className="text-left">
                    <div className="font-medium">{shortcut.title}</div>
                    <div className="text-sm text-muted-foreground">{shortcut.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}