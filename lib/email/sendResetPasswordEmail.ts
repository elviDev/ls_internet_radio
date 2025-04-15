import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendResetPasswordEmail = async (
  email: string,
  resetLink: string
) => {
  try {
    await resend.emails.send({
      from: process.env.RESEND_RESEND_EMAIL_SENDER || "noreply@yourdomain.com",
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`,
    });
  } catch (error) {
    console.error("Error sending reset email:", error);
  }
};
