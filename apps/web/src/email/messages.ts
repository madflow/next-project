/**
 * @deprecated This file is deprecated. Use getEmailTranslations from @repo/email instead.
 * This file is kept for backwards compatibility but should not be used in new code.
 */

// Simple message templates for different languages
const emailTemplates = {
  en: {
    emailVerification: {
      subject: "Email Verification",
      heading: "Email verification",
      content: "In order to be able to log in, you need to verify your email address.",
      action: "Verify email",
    },
    passwordReset: {
      subject: "Reset your password",
      heading: "Reset your password",
      content: "Click the link to reset your password.",
      action: "Reset password",
    },
    emailChange: {
      subject: "Confirm your new email address",
      heading: "Confirm your new email address",
      content: (newEmail: string) =>
        `You have requested to change your email to ${newEmail}. Please verify this change by clicking the link below.`,
      action: "Verify Email Change",
    },
    emailInvitation: {
      subject: "You have been invited",
      heading: "You have been invited",
      content: (inviteLink: string) =>
        `You have been invited. Click the link below to accept the invitation. ${inviteLink}`,
      action: "Accept invitation",
    },
  },
  de: {
    emailVerification: {
      subject: "E-Mail-Verifizierung",
      heading: "E-Mail-Verifizierung",
      content: "Um sich anmelden zu können, müssen Sie Ihre E-Mail-Adresse bestätigen.",
      action: "E-Mail bestätigen",
    },
    passwordReset: {
      subject: "Passwort zurücksetzen",
      heading: "Passwort zurücksetzen",
      content: "Klicken Sie auf den Link, um Ihr Passwort zurückzusetzen.",
      action: "Passwort zurücksetzen",
    },
    emailChange: {
      subject: "Bestätigen Sie Ihre neue E-Mail-Adresse",
      heading: "Bestätigen Sie Ihre neue E-Mail-Adresse",
      content: (newEmail: string) =>
        `Sie haben beantragt, Ihre E-Mail-Adresse auf ${newEmail} zu ändern. Bitte bestätigen Sie diese Änderung, indem Sie auf den untenstehenden Link klicken.`,
      action: "E-Mail-Änderung bestätigen",
    },
    emailInvitation: {
      subject: "Sie wurden eingeladen",
      heading: "Sie wurden eingeladen",
      content: (inviteLink: string) =>
        `Sie wurden von eingeladen. Klicken Sie auf den untenstehenden Link, um die Einladung anzunehmen. ${inviteLink}`,
      action: "Einladung annehmen",
    },
  },
} as const;

type EmailType = keyof typeof emailTemplates.en;
type Locale = keyof typeof emailTemplates;

/**
 * Get a localized email message
 * @param type Type of email message
 * @param locale User's preferred locale (defaults to 'en')
 * @param data Additional data for message interpolation
 * @returns Localized email message with content as a string
 */
export function getEmailMessage(
  type: EmailType,
  locale: string = "en",
  data?: { newEmail?: string; inviteLink?: string }
) {
  // Default to 'en' if locale is not supported
  const lang: Locale = locale in emailTemplates ? (locale as Locale) : "en";
  const template = emailTemplates[lang][type] || emailTemplates.en[type];

  // Handle dynamic content if it's a function
  const content = typeof template.content === "function" ? template.content(data?.newEmail || "") : template.content;

  return {
    subject: template.subject,
    heading: template.heading,
    content,
    action: template.action,
  };
}
