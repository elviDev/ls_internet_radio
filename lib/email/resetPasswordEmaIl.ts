import { resend } from "../resend";

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "RadioStation <no-reply@yourapp.com>",
    to: email,
    subject: "Reset Your Password",
    html: `
      <h1>Reset Password</h1>
      <p>You requested a password reset. Click below to continue:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn’t request this, ignore this email.</p>
    `,
  });
}
