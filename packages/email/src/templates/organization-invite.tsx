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
import type { OrganizationInviteProps } from "../types";
import { getEmailTranslations } from "../translations";

export default function OrganizationInvite({
  email,
  url,
  organizationName,
  inviterName,
  inviterEmail,
  heading,
  content,
  action,
  baseUrl,
  siteName,
  locale = "en",
}: OrganizationInviteProps) {
  const t = getEmailTranslations("organizationInvite", locale, { organizationName, inviterName });
  
  return (
    <Html>
      <Head />
      <Preview>Join {organizationName}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded border border-solid border-neutral-200 px-10 py-5">
            <Heading className="mx-0 my-7 p-0 text-xl font-medium text-black">
              {heading}
            </Heading>
            {inviterName && inviterEmail ? (
              <Text className="text-sm leading-6 text-black">
                <strong>{inviterName}</strong> (
                <Link
                  className="text-blue-600 no-underline"
                  href={`mailto:${inviterEmail}`}
                >
                  {inviterEmail}
                </Link>
                ) {t.invitedBy} <strong>{organizationName}</strong>!
              </Text>
            ) : (
              <Text className="text-sm leading-6 text-black">
                {t.joinPrompt}
              </Text>
            )}
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
              {url.replace(/^https?:\/\//, "")}
            </Text>
            <Footer email={email} baseUrl={baseUrl} siteName={siteName} locale={locale} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

OrganizationInvite.PreviewProps = {
  email: "user@example.com",
  url: "http://localhost:3000/auth/accept-invitation/inv_12345",
  organizationName: "Acme Corporation",
  inviterName: "John Doe",
  inviterEmail: "john@example.com",
  heading: "You Have Been Invited",
  content: "You have been invited to join an organization.",
  action: "Accept Invitation",
  baseUrl: "http://localhost:3000",
  siteName: "Next.js App",
  locale: "en",
} as OrganizationInviteProps;
