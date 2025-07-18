import { json, type ActionFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { db } from "~/services/db.server";
import { sendResetPasswordEmail } from "~/utils/email.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return json({ error: "Email je obavezan" }, { status: 400 });
  }

  const user = await db.users.findFirst({ where: { email } });

  if (!user) {
    return json(
      { error: "Korisnik s tim emailom ne postoji" },
      { status: 404 }
    );
  }

  // Generiraj token i pošalji email
  const token = crypto.randomUUID(); // ili nešto sigurnije
  const tokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h

  await db.userToken.create({
    data: {
      userId: user.id,
      token,
      type: "RESET_PASSWORD",
      expiresAt: tokenExpires,
    },
  });

  await sendResetPasswordEmail(user.email, token);

  return json({ success: "Email za reset lozinke je poslan." });
};

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Zaboravljena lozinka</h1>
      {actionData?.error && (
        <p className="text-red-500 text-sm">{actionData.error}</p>
      )}
      {actionData?.success && (
        <p className="text-green-500 text-sm">{actionData.success}</p>
      )}
      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email adresa
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full border rounded p-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Pošalji link za reset
        </button>
      </Form>
    </div>
  );
}
