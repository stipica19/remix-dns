import { Form, Link } from "@remix-run/react";
import { json, type ActionFunction } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { createUserSession } from "~/utils/session.server";
import { db } from "~/services/db.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return json({ error: "Email i lozinka su obavezni" }, { status: 400 });
  }

  const user = await db.users.findFirst({
    where: {
      email: email,
      password: { not: null },
    },
  });

  if (!user) {
    return json(
      { error: "Korisnik ne postoji ili koristi Google prijavu" },
      { status: 400 }
    );
  }
  if (typeof user.password !== "string") {
    return json(
      { error: "Došlo je do greške sa lozinkom korisnika" },
      { status: 400 }
    );
  }
  const isCorrectPassword = await bcrypt.compare(password, user.password);

  if (!isCorrectPassword) {
    return json({ error: "Pogrešna lozinka" }, { status: 400 });
  }
  return createUserSession(user.id, "/zones");
};

export default function Login() {
  console.log("first");
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border p-2"
          />
        </div>
        <div className="text-right text-sm">
          <Link
            to="/auth/forgot-password"
            className="text-blue-500 hover:underline"
          >
            Zaboravljena lozinka?
          </Link>
        </div>

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Sign in
        </button>
      </Form>
      <div className="text-center my-4">ili</div>
      <a
        href="/auth/google"
        className="block text-center bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Prijavi se preko Google-a
      </a>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Nemaš račun?{" "}
          <Link to="/auth/register" className="text-blue-500 hover:underline">
            Registriaj se ovdje
          </Link>
        </p>
      </div>
    </div>
  );
}
