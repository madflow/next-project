import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import type { EmailChangeProps } from "../types";
import { getEmailTranslations } from "../translations";

export default function EmailChange({
  email,
  newEmail,
  url,
  heading,
  content,
  action,
  baseUrl,
  siteName,
  locale = "en",
}: EmailChangeProps) {
  const t = getEmailTranslations("emailChange", locale, { newEmail });
  
  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              {heading}
            </Heading>
            <Text className="text-sm leading-6 text-black">
              {content}
            </Text>
            <Text className="text-sm leading-6 text-black">
              {t.newEmailLabel} <strong>{newEmail}</strong>
            </Text>
            <Text className="text-sm leading-6 text-black">
              {t.confirmInstructions}
            </Text>
            <Section className="my-8">
              <Link
                className="rounded-lg bg-black px-6 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={url}
              >
                {action}
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">
              {t.urlInstructions}
            </Text>
            <Text className="max-w-sm flex-wrap break-words font-medium text-purple-600 no-underline">
              {url}
            </Text>
            <Footer email={email} baseUrl={baseUrl} siteName={siteName} locale={locale} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

EmailChange.PreviewProps = {
  email: "user@example.com",
  newEmail: "newemail@example.com",
  url: "http://localhost:3000/auth/verify-email-change?token=change123",
  heading: getEmailTranslations("emailChange", "en", { newEmail: "newemail@example.com" }).heading,
  content: getEmailTranslations("emailChange", "en", { newEmail: "newemail@example.com" }).content,
  action: getEmailTranslations("emailChange", "en", { newEmail: "newemail@example.com" }).action,
  baseUrl: "http://localhost:3000",
  siteName: "Next.js App",
  locale: "en",
} as EmailChangeProps;
