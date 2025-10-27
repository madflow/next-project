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
import type { EmailTemplateProps } from "../types";
import { getEmailTranslations } from "../translations";

export default function EmailVerification({
  email,
  url,
  heading,
  content,
  action,
  baseUrl,
  siteName,
  locale = "en",
}: EmailTemplateProps) {
  const t = getEmailTranslations("emailVerification", locale);
  
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
            <Text className="text-sm leading-6 text-black">{content}</Text>
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

EmailVerification.PreviewProps = {
  email: "user@example.com",
  url: "http://localhost:3000/auth/verify?token=abc123xyz",
  heading: getEmailTranslations("emailVerification", "en").heading,
  content: getEmailTranslations("emailVerification", "en").content,
  action: getEmailTranslations("emailVerification", "en").action,
  baseUrl: "http://localhost:3000",
  siteName: "Next.js App",
  locale: "en",
} as EmailTemplateProps;
