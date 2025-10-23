import { Hr, Link, Tailwind, Text } from "@react-email/components";

export function Footer({
  email,
  baseUrl,
  siteName,
}: {
  email: string;
  baseUrl?: string;
  siteName?: string;
}) {
  return (
    <Tailwind>
      <Hr className="mx-0 my-6 w-full border border-neutral-200" />
      <Text className="text-[12px] leading-6 text-neutral-500">
        This email was intended for <span className="text-black">{email}</span>.
        If you were not expecting this email, you can ignore this email. If you
        are concerned about your account's safety, please reply to this email to
        get in touch with us.
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
