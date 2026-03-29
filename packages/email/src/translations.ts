const emailTranslations = {
  en: {
    emailVerification: {
      subject: "Email Verification",
      heading: "Email verification",
      content: "In order to be able to log in, you need to verify your email address.",
      action: "Verify email",
      urlInstructions: "or copy and paste this URL into your browser:",
    },
    passwordReset: {
      subject: "Reset your password",
      heading: "Reset your password",
      content: "You are receiving this email because we received a password reset request for your account.",
      action: "Reset password",
      instructions: "Please click the button below to reset your password.",
      urlInstructions: "or copy and paste this URL into your browser:",
    },
    emailChange: {
      subject: "Confirm your new email address",
      heading: "Confirm your new email address",
      content: "You have requested to change your email address.",
      action: "Verify Email Change",
      newEmailLabel: "Your new email address will be:",
      confirmInstructions: "Please confirm this change by clicking the button below.",
      urlInstructions: "or copy and paste this URL into your browser:",
    },
    organizationInvite: {
      subject: (_organizationName: string, siteName: string) =>
        siteName ? `Invitation to join ${siteName}` : "Invitation to join an organization",
      heading: "You have been invited",
      content: (organizationName: string, siteName: string) => {
        const organization = organizationName ? `the organization "${organizationName}"` : "an organization";
        const platform = siteName ? ` on the platform "${siteName}"` : "";

        return `You have been invited to join ${organization}${platform}.`;
      },
      action: "Accept invitation",
      invitedBy: (_inviterName: string, organizationName: string, siteName: string) => {
        const organization = organizationName ? `the organization "${organizationName}"` : "an organization";
        const platform = siteName ? ` on the platform "${siteName}"` : "";

        return `has invited you to join ${organization}${platform}.`;
      },
      joinPrompt: (_organizationName: string, _siteName: string) => "Click the button below to accept this invitation.",
      urlInstructions: "or copy and paste this URL into your browser:",
    },
    footer: {
      intendedFor: "This email was intended for",
      disclaimer:
        "If you were not expecting this email, you can ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.",
    },
  },
  de: {
    emailVerification: {
      subject: "E-Mail-Verifizierung",
      heading: "E-Mail-Verifizierung",
      content: "Um sich anmelden zu können, müssen Sie Ihre E-Mail-Adresse bestätigen.",
      action: "E-Mail bestätigen",
      urlInstructions: "oder kopieren Sie diese URL und fügen Sie sie in Ihren Browser ein:",
    },
    passwordReset: {
      subject: "Passwort zurücksetzen",
      heading: "Passwort zurücksetzen",
      content:
        "Sie erhalten diese E-Mail, weil wir eine Anfrage zum Zurücksetzen des Passworts für Ihr Konto erhalten haben.",
      action: "Passwort zurücksetzen",
      instructions: "Bitte klicken Sie auf die Schaltfläche unten, um Ihr Passwort zurückzusetzen.",
      urlInstructions: "oder kopieren Sie diese URL und fügen Sie sie in Ihren Browser ein:",
    },
    emailChange: {
      subject: "Bestätigen Sie Ihre neue E-Mail-Adresse",
      heading: "Bestätigen Sie Ihre neue E-Mail-Adresse",
      content: "Sie haben beantragt, Ihre E-Mail-Adresse zu ändern.",
      action: "E-Mail-Änderung bestätigen",
      newEmailLabel: "Ihre neue E-Mail-Adresse wird sein:",
      confirmInstructions: "Bitte bestätigen Sie diese Änderung, indem Sie auf die Schaltfläche unten klicken.",
      urlInstructions: "oder kopieren Sie diese URL und fügen Sie sie in Ihren Browser ein:",
    },
    organizationInvite: {
      subject: (_organizationName: string, siteName: string) =>
        siteName ? `Einladung zum Beitritt zu ${siteName}` : "Einladung zum Beitritt zu einer Organisation",
      heading: "Sie wurden eingeladen",
      content: (organizationName: string, siteName: string) => {
        const organization = organizationName ? `der Organisation "${organizationName}"` : "einer Organisation";
        const platform = siteName ? ` auf der Plattform "${siteName}"` : "";

        return `Sie wurden eingeladen, ${organization}${platform} beizutreten.`;
      },
      action: "Einladung annehmen",
      invitedBy: (_inviterName: string, organizationName: string, siteName: string) => {
        const organization = organizationName ? `der Organisation "${organizationName}"` : "einer Organisation";
        const platform = siteName ? ` auf der Plattform "${siteName}"` : "";

        return `hat Sie eingeladen, ${organization}${platform} beizutreten.`;
      },
      joinPrompt: (_organizationName: string, _siteName: string) =>
        "Klicken Sie auf die Schaltfläche unten, um diese Einladung anzunehmen.",
      urlInstructions: "oder kopieren Sie diese URL und fügen Sie sie in Ihren Browser ein:",
    },
    footer: {
      intendedFor: "Diese E-Mail war bestimmt für",
      disclaimer:
        "Wenn Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren. Wenn Sie Bedenken bezüglich der Sicherheit Ihres Kontos haben, antworten Sie bitte auf diese E-Mail, um mit uns in Kontakt zu treten.",
    },
  },
} as const;

export type EmailType = "emailVerification" | "passwordReset" | "emailChange" | "organizationInvite";
export type Locale = "en" | "de";

type BaseEmailTranslations = {
  subject: string;
  heading: string;
  content: string;
  action: string;
  urlInstructions: string;
};

type PasswordResetEmailTranslations = BaseEmailTranslations & {
  instructions: string;
};

type EmailChangeEmailTranslations = BaseEmailTranslations & {
  newEmailLabel: string;
  confirmInstructions: string;
};

type OrganizationInviteEmailTranslations = BaseEmailTranslations & {
  invitedBy: string;
  joinPrompt: string;
};

type EmailTranslationsByType = {
  emailVerification: BaseEmailTranslations;
  passwordReset: PasswordResetEmailTranslations;
  emailChange: EmailChangeEmailTranslations;
  organizationInvite: OrganizationInviteEmailTranslations;
};

interface EmailTranslationData {
  newEmail?: string;
  organizationName?: string;
  inviterName?: string;
  siteName?: string;
}

export function getEmailTranslations<T extends EmailType>(
  type: T,
  locale?: string,
  data?: EmailTranslationData
): EmailTranslationsByType[T] {
  const lang: Locale = locale === "de" ? "de" : "en";

  switch (type) {
    case "emailVerification": {
      const template = emailTranslations[lang].emailVerification;

      return {
        subject: template.subject,
        heading: template.heading,
        content: template.content,
        action: template.action,
        urlInstructions: template.urlInstructions,
      } as EmailTranslationsByType[T];
    }

    case "passwordReset": {
      const template = emailTranslations[lang].passwordReset;

      return {
        subject: template.subject,
        heading: template.heading,
        content: template.content,
        action: template.action,
        instructions: template.instructions,
        urlInstructions: template.urlInstructions,
      } as EmailTranslationsByType[T];
    }

    case "emailChange": {
      const template = emailTranslations[lang].emailChange;

      return {
        subject: template.subject,
        heading: template.heading,
        content: template.content,
        action: template.action,
        newEmailLabel: template.newEmailLabel,
        confirmInstructions: template.confirmInstructions,
        urlInstructions: template.urlInstructions,
      } as EmailTranslationsByType[T];
    }

    case "organizationInvite": {
      const template = emailTranslations[lang].organizationInvite;

      return {
        subject: template.subject(data?.organizationName || "", data?.siteName || ""),
        heading: template.heading,
        content: template.content(data?.organizationName || "", data?.siteName || ""),
        action: template.action,
        invitedBy: template.invitedBy(data?.inviterName || "", data?.organizationName || "", data?.siteName || ""),
        joinPrompt: template.joinPrompt(data?.organizationName || "", data?.siteName || ""),
        urlInstructions: template.urlInstructions,
      } as EmailTranslationsByType[T];
    }
  }

  throw new Error(`Unsupported email translation type: ${type}`);
}

export function getFooterTranslations(locale?: string) {
  const lang: Locale = locale === "de" ? "de" : "en";
  return emailTranslations[lang].footer;
}
