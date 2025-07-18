import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerificationEmail } from "../components/VerificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `http://localhost:5173/auth/verify?token=${token}`; // zamijeni domenom u produkciji

  const html = await render(VerificationEmail({ verificationUrl }));

  await resend.emails.send({
    from: "remix@resend.dev", // mora biti domena koju si verificirao
    to: email,
    subject: "Potvrda registracije",
    html,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const link = `http://localhost:5173/auth/verify?token=${token}`;
  await resend.emails.send({
    from:"remix@resend.dev",
    to: email,
    subject: "Reset lozinke",
    html: `<p>Klikni na link da resetiraš lozinku: <a href="${link}">${link}</a></p>`,
  });
}