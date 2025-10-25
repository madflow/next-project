import { ReactElement } from "react";

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  react: ReactElement;
}

export interface EmailTemplateProps {
  email: string;
  url: string;
  heading: string;
  content: string;
  action: string;
  baseUrl?: string;
  siteName?: string;
  locale?: string;
}

export interface EmailChangeProps extends EmailTemplateProps {
  newEmail: string;
}

export interface OrganizationInviteProps extends EmailTemplateProps {
  organizationName: string;
  inviterName?: string;
  inviterEmail?: string;
}
