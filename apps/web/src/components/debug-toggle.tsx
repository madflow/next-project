"use client";

import { Bug, BugOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/app-context";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { cn } from "@/lib/utils";

type DebugToggleProps = {
  className?: string;
};

export function DebugToggle({ className }: DebugToggleProps) {
  const isAdmin = useIsAdmin();
  const { debugMode, setDebugMode } = useAppContext();

  if (!isAdmin) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDebugMode(!debugMode)}
      className={cn("h-8 w-8", className)}
      title={debugMode ? "Disable debug mode" : "Enable debug mode"}
    >
      {debugMode ? (
        <BugOff className="h-4 w-4" />
      ) : (
        <Bug className="h-4 w-4" />
      )}
      <span className="sr-only">
        {debugMode ? "Disable debug mode" : "Enable debug mode"}
      </span>
    </Button>
  );
}