"use client";

import { Building2, ChevronsUpDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { organization, useActiveOrganization, useListOrganizations } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuItem } from "./ui/sidebar";

export function OrganizationSwitcher() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: organizations = [], isPending: isOrgsLoading } = useListOrganizations();
  const { data: activeOrganization } = useActiveOrganization();

  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelect = async (orgId: string) => {
    if (orgId === activeOrganization?.id) return;
    setIsSwitching(true);
    try {
      await organization.setActive({ organizationId: orgId });
      router.refresh();
    } catch (error) {
      console.error("Failed to switch organization", error);
      toast.error("Failed to switch organization");
    } finally {
      setIsSwitching(false);
    }
  };

  const isLoading = isOrgsLoading || isSwitching;
  const displayName = activeOrganization?.name || "Select organization";

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (!organizations) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <Button
              variant="ghost"
              size="sm"
              data-testid="app.organization-switcher"
              className={cn("w-full justify-between px-3", "hover:bg-accent hover:text-accent-foreground")}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{displayName}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}>
            {organizations &&
              organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm",
                    "focus:bg-accent focus:text-accent-foreground",
                    activeOrganization && activeOrganization.id === org.id && "bg-accent/50"
                  )}>
                  <div className="flex items-center gap-2">
                    {activeOrganization && activeOrganization.id === org.id && isSwitching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    <span className="truncate">{org.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
