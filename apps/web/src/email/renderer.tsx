import { render } from "@react-email/components";
import { EmailTemplate, EmailTemplateProps } from "@/components/email/email-template";

export async function renderDefaultTemplateWithProps(props: EmailTemplateProps) {
  return await render(<EmailTemplate {...props} />);
}
