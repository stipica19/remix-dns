import {
  json,
  type ActionFunction,
  type LoaderFunction,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { db } from "~/services/db.server";
import bcrypt from "bcryptjs";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/auth/login?error=missing_token");
  }

  const tokenRecord = await db.userToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.type !== "RESET_PASSWORD") {
    return redirect("/auth/login?error=invalid_token");
  }

  if (new Date(tokenRecord.expiresAt) < new Date()) {
    return redirect("/auth/login?error=token_expired");
  }

  return json({ token });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const token = formData.get("token") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !newPassword || !confirmPassword) {
    return json({ error: "Sva polja su obavezna." }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return json({ error: "Lozinke se ne podudaraju." }, { status: 400 });
  }

  if (!isStrongPassword(newPassword)) {
    return json(
      {
        error:
          "Lozinka mora imati najmanje 8 znakova, veliko i malo slovo te broj.",
      },
      { status: 400 }
    );
  }

  const tokenRecord = await db.userToken.findUnique({
    where: { token },
  });

  if (
    !tokenRecord ||
    tokenRecord.type !== "RESET_PASSWORD" ||
    new Date(tokenRecord.expiresAt) < new Date()
  ) {
    return json(
      { error: "Token nije ispravan ili je istekao." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.users.update({
    where: { id: tokenRecord.userId },
    data: { password: passwordHash },
  });

  await db.userToken.delete({ where: { token } });

  return redirect("/auth/login?reset=success");
};

function isStrongPassword(password: string): boolean {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
}

export default function ResetPassword() {
  const { token } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Resetiraj lozinku</h1>

      {actionData?.error && (
        <p className="text-red-500 text-sm mb-4">{actionData.error}</p>
      )}

      <Form method="post" className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nova lozinka
          </label>
          <input
            type="password"
            name="newPassword"
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Potvrdi lozinku
          </label>
          <input
            type="password"
            name="confirmPassword"
            className="w-full border rounded p-2"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Postavi novu lozinku
        </button>
      </Form>
    </div>
  );
}
