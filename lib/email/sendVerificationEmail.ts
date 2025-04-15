import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: process.env.RESEND_RESEND_EMAIL_SENDER || "noreply@yourdomain.com",
    to: email,
    subject: "Verify your email",
    html: `<p>Please verify your email address by clicking the link below:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>If you didn't request this, just ignore this email.</p>`,
  });
}
