"use client";

import { LogOut, MoreVertical, User, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { useIsImpersonating } from "@/hooks/use-is-impersonating";
import { useStopImpersonating } from "@/hooks/use-stop-impersonating";

export function NavUser() {
  const isMobile = useSidebar();
  const session = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const t = useTranslations("navUser");
  const tUser = useTranslations("user.impersonation");
  const user = session.data?.user;
  const { isImpersonating } = useIsImpersonating();
  const { stopImpersonating, isLoading: isStoppingImpersonation } = useStopImpersonating();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/auth/login");
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleStopImpersonating = async () => {
    await stopImpersonating();
  };

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              data-testid="app.sidebar.user-menu-trigger"
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer">
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {user.image ? (
                  <AvatarImage
                    src={`/api/users/${user.id}/avatars/${encodeURIComponent(user.image)}`}
                    alt={user.name}
                  />
                ) : null}
                <AvatarFallback className="rounded-lg">{user.name?.charAt(0) ?? ""}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              </div>
              <MoreVertical className="ml-auto size-4" />
              <span className="sr-only">{t("menuButton.srText")}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                  <AvatarFallback className="rounded-lg">{user.name?.charAt(0) ?? ""}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              <SidebarMenuButton asChild>
                <Link href="/user/account">{t("account")}</Link>
              </SidebarMenuButton>
            </DropdownMenuItem>
            {isImpersonating && (
              <DropdownMenuItem
                onClick={handleStopImpersonating}
                disabled={isStoppingImpersonation}
                className="cursor-pointer text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
              >
                <UserX className="mr-2 size-4" />
                {isStoppingImpersonation ? tUser("button.stopping") : tUser("button.stopImpersonating")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isSigningOut}
              data-testid="app.sign-out"
              className="cursor-pointer">
              <LogOut className="mr-2 size-4" />
              {isSigningOut ? t("signingOut") : t("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
