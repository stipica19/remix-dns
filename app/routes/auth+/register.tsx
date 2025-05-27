import { Form, useActionData } from "@remix-run/react";
import { json, redirect, type ActionFunction } from "@remix-run/node";
import { db } from "~/services/db.server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "~/utils/email.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Sva polja su obavezna." };
  }
  if (password !== confirmPassword) {
    return { error: "Lozinke se ne podudaraju." };
  }
  const existingUser = await db.users.findFirst({ where: { email } });

  if (existingUser) {
    return (
      json({ error: "Korisnik s tim emailom već postoji." }), { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const token = nanoid(32);

  await db.users.create({
    data: {
      email,
      password: passwordHash,
      isVerify: false,
      verifyToken: token,
    },
  });

  await sendVerificationEmail(email, token);

  return json({ success: "Email za potvrdu je poslan!" });
};

export default function Register() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
      {actionData?.success && (
        <p className="text-green-500">{actionData.success}</p>
      )}
      <Form method="post" className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border p-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border p-2"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="ponovi password"
          className="w-full border p-2"
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Sign in
        </button>
      </Form>
    </div>
  );
}
