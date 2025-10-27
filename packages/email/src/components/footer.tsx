import { Hr, Link, Tailwind, Text } from "@react-email/components";
import { getFooterTranslations } from "../translations";

export function Footer({
  email,
  baseUrl,
  siteName,
  locale,
}: {
  email: string;
  baseUrl?: string;
  siteName?: string;
  locale?: string;
}) {
  const t = getFooterTranslations(locale);

  return (
    <Tailwind>
      <Hr className="mx-0 my-6 w-full border border-neutral-200" />
      <Text className="text-[12px] leading-6 text-neutral-500">
        {t.intendedFor} <span className="text-black">{email}</span>. {t.disclaimer}
      </Text>
      {siteName && baseUrl && (
        <Text className="text-[12px] text-neutral-500">
          {siteName}
          <br />
          <Link className="text-neutral-500 underline" href={baseUrl}>
            {baseUrl.replace(/^https?:\/\//, "")}
          </Link>
        </Text>
      )}
    </Tailwind>
  );
}
