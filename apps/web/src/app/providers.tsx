"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/app-context";
import { OrganizationThemeProvider } from "@/context/organization-theme-context";
import { Locale } from "@/i18n/config";
import { getQueryClient } from "@/lib/get-query-client";

interface ProvidersProps {
  children: React.ReactNode;
  locale: Locale;
  messages: IntlMessages;
}

export default function Providers({ children, locale, messages }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <OrganizationThemeProvider>
            <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
              {children}
            </ThemeProvider>
          </OrganizationThemeProvider>
        </AppProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

// Define a type for the messages object that can be used with NextIntlClientProvider
type IntlMessages = Record<string, string | Record<string, unknown>> | undefined;
