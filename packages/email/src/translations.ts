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
      subject: "You have been invited",
      heading: "You have been invited",
      content: (organizationName: string) => `You have been invited to join an organization.`,
      action: "Accept invitation",
      invitedBy: (inviterName: string, organizationName: string) =>
        `has invited you to join ${organizationName}.`,
      joinPrompt: (organizationName: string) => `Join ${organizationName} to get started.`,
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
      subject: "Sie wurden eingeladen",
      heading: "Sie wurden eingeladen",
      content: (organizationName: string) => `Sie wurden eingeladen, einer Organisation beizutreten.`,
      action: "Einladung annehmen",
      invitedBy: (inviterName: string, organizationName: string) =>
        `hat Sie eingeladen, der Organisation ${organizationName} beizutreten.`,
      joinPrompt: (organizationName: string) => `Treten Sie ${organizationName} bei, um loszulegen.`,
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

interface EmailTranslationData {
  newEmail?: string;
  organizationName?: string;
  inviterName?: string;
}

export function getEmailTranslations(type: EmailType, locale?: string, data?: EmailTranslationData) {
  const lang: Locale = locale === "de" ? "de" : "en";
  const template = emailTranslations[lang][type];

  const content = typeof template.content === "function" 
    ? template.content(data?.newEmail || data?.organizationName || "") 
    : template.content;

  let invitedBy = "";
  let joinPrompt = "";
  
  if (type === "organizationInvite" && "invitedBy" in template) {
    invitedBy = typeof template.invitedBy === "function"
      ? template.invitedBy(data?.inviterName || "", data?.organizationName || "")
      : template.invitedBy;
    
    joinPrompt = typeof template.joinPrompt === "function"
      ? template.joinPrompt(data?.organizationName || "")
      : template.joinPrompt;
  }

  return {
    subject: template.subject,
    heading: template.heading,
    content,
    action: template.action,
    ...(type === "passwordReset" && "instructions" in template ? { instructions: template.instructions } : {}),
    ...(type === "emailChange" && "newEmailLabel" in template ? { 
      newEmailLabel: template.newEmailLabel,
      confirmInstructions: template.confirmInstructions,
    } : {}),
    ...(type === "organizationInvite" ? { 
      invitedBy,
      joinPrompt,
    } : {}),
    urlInstructions: template.urlInstructions,
  };
}

export function getFooterTranslations(locale?: string) {
  const lang: Locale = locale === "de" ? "de" : "en";
  return emailTranslations[lang].footer;
}
