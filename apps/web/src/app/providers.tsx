'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { NextIntlClientProvider } from 'next-intl'
import { getQueryClient } from '@/lib/get-query-client'
import type * as React from 'react'

interface ProvidersProps {
  children: React.ReactNode
  locale: string
  messages: IntlMessages
}

export default function Providers({ children, locale, messages }: ProvidersProps) {
  const queryClient = getQueryClient()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </NextIntlClientProvider>
  )
}

// Define a type for the messages object that can be used with NextIntlClientProvider
type IntlMessages = Record<string, string | Record<string, unknown>> | undefined
