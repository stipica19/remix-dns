import { Form, Link, useActionData } from "@remix-run/react";
import { json, redirect, type ActionFunction } from "@remix-run/node";
import { db } from "~/services/db.server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "~/utils/email.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (
    !email ||
    !password ||
    !confirmPassword ||
    !username ||
    !first_name ||
    !last_name
  ) {
    return { error: "Sva polja su obavezna." };
  }
  if (password !== confirmPassword) {
    return { error: "Lozinke se ne podudaraju." };
  }

  if (!isStrongPassword(password)) {
    return json(
      {
        error:
          "Lozinka mora imati najmanje 8 znakova, veliko i malo slovo te broj.",
      },
      { status: 400 }
    );
  }
  const existingUser = await db.users.findFirst({ where: { email } });

  if (existingUser) {
    return (
      json({ error: "Korisnik s tim emailom već postoji." }), { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await db.users.create({
    data: {
      email,
      username,
      first_name,
      last_name,
      password: passwordHash,
      isVerify: false,
    },
  });

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 sat

  await db.userToken.create({
    data: {
      token,
      userId: newUser.id,
      type: "VERIFY_EMAIL",
      expiresAt: expiresAt,
    },
  });

  await sendVerificationEmail(email, token);

  return json({ success: "Email za potvrdu je poslan!" });
};

function isStrongPassword(password: string): boolean {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
}
export default function Register() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Registracija</h1>

      {actionData?.error && (
        <p className="text-red-500 text-center mb-4">{actionData.error}</p>
      )}
      {actionData?.success && (
        <p className="text-green-500 text-center mb-4">{actionData.success}</p>
      )}
      <p className="text-gray-800 text-left mb-6 text-sm">
        All new passwords must contain at least 8 characters. We also suggest
        having at least one capital and one lower-case letter (Aa-Zz), one
        special symbol (#, &, % etc), and one number (0-9) in your password for
        the best strength.
      </p>

      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            placeholder="Unesi korisničko ime"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="first_name"
            placeholder="Unesi ime"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="last_name"
            placeholder="Unesi prezime"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Unesi email"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="Unesi lozinku"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Ponovi lozinku"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          Registriraj se
        </button>
      </Form>
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Već imaš račun?{" "}
          <Link to="/auth/login" className="text-blue-500 hover:underline">
            Prijavi se ovdje
          </Link>
        </p>
      </div>
    </div>
  );
}
