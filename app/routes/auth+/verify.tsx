import { LoaderFunction, redirect } from "@remix-run/node";
import { db } from "~/services/db.server";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/auth/login");
  }

  const user = await db.users.findUnique({
    where: { verifyToken: token },
  });

  if (!user) return redirect("/auth/login");

  await db.users.update({
    where: { id: user.id },
    data: {
      isVerify: true,
      verifyToken: null,
    },
  });
  return redirect("/auth/login?verified=1");
};
