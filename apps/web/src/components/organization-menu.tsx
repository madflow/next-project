"use client";

import { useQuery } from "@tanstack/react-query";
import { Organization } from "better-auth/plugins";
import { Building2, ChevronsUpDown, CirclePlusIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/context/app-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { organization, useListOrganizations } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { InviteUserModal } from "./invite-user-modal";
import { SidebarMenu, SidebarMenuItem } from "./ui/sidebar";

type OrganizationMenuProps = {
  activeOrganization: Organization | null;
};

export function OrganizationMenu({ activeOrganization }: OrganizationMenuProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: organizations = [], isPending: isOrgsLoading } = useListOrganizations();

  const [isSwitching, setIsSwitching] = useState(false);
  const [openInvitationModal, setOpenInvitationModal] = useState(false);
  const { setActiveOrganization } = useAppContext();
  const t = useTranslations("appSidebar");

  const { data: canCreateInvitations } = useQuery({
    enabled: !!activeOrganization,
    queryKey: ["organization", activeOrganization?.id ?? ""],
    queryFn: async () => {
      const hasPermission = await organization.hasPermission({
        organizationId: activeOrganization?.id ?? "",
        permissions: {
          invitation: ["create"],
        },
      });
      return hasPermission.data?.success;
    },
  });

  const handleSelect = async (orgId: string) => {
    if (orgId === activeOrganization?.id) return;
    setIsSwitching(true);
    try {
      const res = await organization.setActive({ organizationId: orgId });
      setActiveOrganization(res.data);
      router.refresh();
    } catch (error) {
      console.error("Failed to switch organization", error);
      toast.error("Failed to switch organization");
    } finally {
      setIsSwitching(false);
    }
  };

  const isLoading = isOrgsLoading || isSwitching;
  const displayName = activeOrganization?.name || t("organizationSwitcher.label");

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
    <>
      {activeOrganization && canCreateInvitations && (
        <InviteUserModal
          open={openInvitationModal}
          organization={activeOrganization}
          onOpenChange={setOpenInvitationModal}
        />
      )}
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
              data-testid="app.organization-switcher.menu"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}>
              <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">
                {t("organizationSwitcher.switch")}
              </div>
              {organizations?.length > 0 ? (
                organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSelect(org.id)}
                    className={cn(
                      "cursor-pointer text-sm",
                      "focus:bg-accent focus:text-accent-foreground",
                      activeOrganization?.id === org.id && "bg-accent/50"
                    )}>
                    <div className="flex items-center gap-2">
                      {activeOrganization?.id === org.id && isSwitching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      <span className="truncate">{org.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="text-muted-foreground px-3 py-2 text-sm">
                  {t("organizationSwitcher.noOrganizations")}
                </div>
              )}

              {canCreateInvitations && activeOrganization && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    data-testid="app.organization-switcher.invite"
                    onSelect={() => setOpenInvitationModal(true)}
                    className={cn("cursor-pointer text-sm", "focus:bg-accent focus:text-accent-foreground")}>
                    <CirclePlusIcon className="h-4 w-4" />
                    {t("organizationSwitcher.invite")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
