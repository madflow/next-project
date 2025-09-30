"use client";

import { useTranslations } from "next-intl";
import { Building2, Folder } from "lucide-react";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";

export function LandingContextSelection() {
  const t = useTranslations("pageLanding.contextSelection");
  const { activeOrganization, activeProject } = useAppContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {activeOrganization?.name || t("noOrganization")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {activeOrganization && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {activeProject?.name || t("noProject")}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </CardContent>
    </Card>
  );
}