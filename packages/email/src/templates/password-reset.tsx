import { Body, Container, Head, Heading, Html, Link, Preview, Section, Tailwind, Text } from "@react-email/components";
import { Footer } from "../components/footer";
import { getEmailTranslations } from "../translations";
import type { EmailTemplateProps } from "../types";

export default function PasswordReset({
  email,
  url,
  heading,
  content,
  action,
  baseUrl,
  siteName,
  locale = "en",
}: EmailTemplateProps) {
  const t = getEmailTranslations("passwordReset", locale);

  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">{heading}</Heading>
            <Text className="text-sm leading-6 text-black">{content}</Text>
            <Text className="text-sm leading-6 text-black">{t.instructions}</Text>
            <Section className="my-8">
              <Link
                className="rounded-lg bg-black px-6 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={url}>
                {action}
              </Link>
            </Section>
            <Text className="text-sm leading-6 text-black">{t.urlInstructions}</Text>
            <Text className="max-w-sm flex-wrap font-medium break-words text-purple-600 no-underline">{url}</Text>
            <Footer email={email} baseUrl={baseUrl} siteName={siteName} locale={locale} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

PasswordReset.PreviewProps = {
  email: "user@example.com",
  url: "http://localhost:3000/auth/reset-password?token=xyz789abc",
  heading: getEmailTranslations("passwordReset", "en").heading,
  content: getEmailTranslations("passwordReset", "en").content,
  action: getEmailTranslations("passwordReset", "en").action,
  baseUrl: "http://localhost:3000",
  siteName: "Next.js App",
  locale: "en",
} as EmailTemplateProps;
