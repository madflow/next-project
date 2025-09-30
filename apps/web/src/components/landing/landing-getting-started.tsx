"use client";

import { useTranslations } from "next-intl";
import { Plus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/context/app-context";
import { useProjectsByOrg } from "@/hooks/use-projects-by-org";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LandingGettingStarted() {
  const t = useTranslations("pageLanding.gettingStarted");
  const router = useRouter();
  const { activeOrganization } = useAppContext();
  const isAdmin = useIsAdmin();
  
  const { data: projects = [] } = useProjectsByOrg(activeOrganization?.id || "");

  const { data: membersData } = useQuery({
    queryKey: ["organization", "members", activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return { count: 0 };
      const response = await fetch(`/api/organizations/${activeOrganization.id}/members`);
      if (!response.ok) return { count: 0 };
      const data = await response.json();
      return { count: data.rows?.length || 0 };
    },
    enabled: !!activeOrganization,
  });

  if (!activeOrganization || !isAdmin) {
    return null;
  }

  const hasProjects = projects.length > 0;
  const hasMembers = (membersData?.count || 0) > 1; // More than just the current user

  const suggestions = [];

  if (!hasProjects) {
    suggestions.push({
      icon: Plus,
      title: t("noProjects.title"),
      description: t("noProjects.description"),
      action: t("noProjects.action"),
      onClick: () => router.push("/admin/projects/new" as any), // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  }

  if (!hasMembers) {
    suggestions.push({
      icon: UserPlus,
      title: t("noMembers.title"),
      description: t("noMembers.description"),
      action: t("noMembers.action"),
      onClick: () => {
        // This would open the invite modal - for now just navigate to org members
        router.push(`/admin/organizations/${activeOrganization.id}/members` as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    });
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <div key={suggestion.title} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{suggestion.title}</h3>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={suggestion.onClick}
                  className="w-full"
                >
                  {suggestion.action}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}