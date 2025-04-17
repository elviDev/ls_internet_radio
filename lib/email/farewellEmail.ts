export const farewellEmail = ({ name }: { name?: string }) => ({
  subject: "Goodbye from Virtual Radio Station 🎧",
  html: `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2>Goodbye${name ? `, ${name}` : ""}!</h2>
      <p>We're sad to see you go. Your account has been deleted from our system.</p>
      <p>If this was a mistake, please feel free to sign up again anytime.</p>
      <p>— The Virtual Radio Team</p>
    </div>
  `,
});
