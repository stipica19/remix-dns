import { LoaderFunction, redirect } from "@remix-run/node";
import { db } from "~/services/db.server";

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

  if (!tokenRecord) {
    return redirect("/auth/login?error=invalid_token");
  }

  if (new Date(tokenRecord.expiresAt) < new Date()) {
    return redirect("/auth/login?error=token_expired");
  }

  if (tokenRecord.type === "VERIFY_EMAIL") {
    await db.users.update({
      where: { id: tokenRecord.userId },
      data: {
        isVerify: true,
      },
    });

    // (opcionalno) obriši token:
    await db.userToken.delete({ where: { token } });

    return redirect("/auth/login?verified=1");
  }

  if (tokenRecord.type === "RESET_PASSWORD") {
    return redirect(`/auth/reset-password?token=${token}`);
  }

  return redirect("/auth/login?error=invalid_type");
};
