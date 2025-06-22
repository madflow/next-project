import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { env } from "@/env";
import { cn } from "@/lib/utils";

export interface EmailTemplateClassNames {
  body?: string;
  button?: string;
  container?: string;
  image?: string;
  content?: string;
  footer?: string;
  heading?: string;
  hr?: string;
  link?: string;
}

export interface EmailTemplateProps {
  classNames?: EmailTemplateClassNames;
  action?: string;
  /** @default env.BASE_URL || env.NEXT_PUBLIC_BASE_URL */
  baseUrl?: string;
  content: ReactNode;
  heading: ReactNode;
  /** @default `${baseUrl}/apple-touch-icon.png` */
  preview?: string;
  /** @default env.SITE_NAME || .env.NEXT_PUBLIC_SITE_NAME */
  siteName?: string;
  url?: string;
}

export const EmailTemplate = ({
  classNames,
  action,
  baseUrl,
  content,
  heading,
  preview,
  siteName,
  url,
}: EmailTemplateProps) => {
  baseUrl = baseUrl || env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  siteName = siteName || env.SITE_NAME || env.NEXT_PUBLIC_SITE_NAME;
  preview = preview || (typeof heading === "string" ? heading : undefined);

  return (
    <Html>
      <Head>
        <meta name="x-apple-disable-message-reformatting" />
        <meta content="light dark" name="color-scheme" />
        <meta content="light dark" name="supported-color-schemes" />

        <style type="text/css">
          {`
                        :root {
                            color-scheme: light dark;
                            supported-color-schemes: light dark;
                        }
                    `}
        </style>

        <style type="text/css">
          {`      
                        html, body {
                            background-color: #ffffff;
                            color: #000000;
                        }

                        a {
                            color: #000000;
                        }

                        .border-color {
                            border-color: #eaeaea;
                        }

                        .action-button {
                            background-color: #000000 !important;
                            color: #ffffff !important;
                        }

                        @media (prefers-color-scheme: dark) {
                            html, body {
                                background-color: #000000 !important;
                                color: #ffffff !important;
                            }

                            a {
                                color: #ffffff;
                            }

                            .border-color {
                                border-color: #333333 !important;
                            }

                            .action-button {
                                background-color: rgb(38, 38, 38) !important;
                                color: #ffffff !important;
                            }
                        }
                    `}
        </style>
      </Head>

      {preview && <Preview>{preview}</Preview>}

      <Tailwind>
        <Body className={cn("mx-auto my-auto px-2 font-sans", classNames?.body)}>
          <Container className="border-color mx-auto my-[40px] max-w-[465px] rounded border border-solid p-[20px]">
            <Heading className={cn("mx-0 my-[30px] p-0 text-center text-[24px] font-bold", classNames?.heading)}>
              {heading}
            </Heading>

            <Text className={cn("text-center text-[14px] leading-[24px]", classNames?.content)}>{content}</Text>

            {action && url && (
              <Section className="mt-[32px] mb-[32px] text-center">
                <Button
                  className={cn(
                    "action-button rounded px-5 py-3 text-center text-[12px] font-semibold no-underline",
                    classNames?.button
                  )}
                  href={url}>
                  {action}
                </Button>
              </Section>
            )}

            <Hr className={cn("border-color mx-0 my-[26px] w-full border border-solid", classNames?.hr)} />

            <Text className={cn("text-[12px] leading-[24px] text-[#666666]", classNames?.footer)}>
              {siteName && <>{siteName} </>}

              {baseUrl && (
                <Link className={cn("no-underline", classNames?.link)} href={baseUrl}>
                  {baseUrl?.replace("https://", "").replace("http://", "")}
                </Link>
              )}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
