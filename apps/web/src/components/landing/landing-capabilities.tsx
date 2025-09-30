"use client";

import { useTranslations } from "next-intl";
import { BarChart3, FolderKanban, Users, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingCapabilities() {
  const t = useTranslations("pageLanding.capabilities");

  const capabilities = [
    {
      icon: BarChart3,
      title: t("dataAnalysis.title"),
      description: t("dataAnalysis.description"),
    },
    {
      icon: FolderKanban,
      title: t("projectManagement.title"),
      description: t("projectManagement.description"),
    },
    {
      icon: Users,
      title: t("teamCollaboration.title"),
      description: t("teamCollaboration.description"),
    },
    {
      icon: PieChart,
      title: t("visualization.title"),
      description: t("visualization.description"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <div key={capability.title} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{capability.title}</h3>
                  <p className="text-sm text-muted-foreground">{capability.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}