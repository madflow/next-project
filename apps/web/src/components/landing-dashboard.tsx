"use client";

import { useTranslations } from "next-intl";
import { LandingContextSelection } from "./landing/landing-context-selection";
import { LandingShortcuts } from "./landing/landing-shortcuts";
import { LandingCapabilities } from "./landing/landing-capabilities";
import { LandingGettingStarted } from "./landing/landing-getting-started";
import { LandingOverview } from "./landing/landing-overview";

export function LandingDashboard() {
  const t = useTranslations("pageLanding");

  return (
    <div className="space-y-8">
      <div className="text-lg text-muted-foreground">
        {t("welcome")}
      </div>

      <LandingContextSelection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LandingShortcuts />
          <LandingCapabilities />
        </div>
        
        <div className="space-y-6">
          <LandingOverview />
          <LandingGettingStarted />
        </div>
      </div>
    </div>
  );
}