import { resend } from "../resend";

export const sendVerificationEmail = async (token: string, email: string) => {
  await resend.emails.send({
    from: "RadioStation <no-reply@yourapp.com>",
    to: email,
    subject: "Verify your email",
    html: `<p>Click <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}">here</a> to verify your email.</p>`,
  });
};
