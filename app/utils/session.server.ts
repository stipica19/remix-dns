import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "~/services/db.server";
import type { users } from "@prisma/client";

const sessionSecret = process.env.SESSION_SECRET || "supersecret";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "user_session",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;


export async function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function getUserFromSession(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");

  if (!userId) return null;

  // Pretpostavimo da dohvaćaš usera iz baze
  const user = await db.users.findUnique({ where: { id: userId } });
  console.log(user)
  return user;
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
// Funkcija za provjeru da li je korisnik prijavljen
export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);

  if (!user) {
    throw redirect("/auth/login");
  }

  return user;
}

// Funkcija za provjeru da li je korisnik verificiran tj email mu je potvrđen
export async function requireVerifiedUser(request: Request) :Promise<users> {

  const user = await getUserFromSession(request);

  if(!user || !user.isVerify) {
    console.log("iffffffff", user);
    
    throw redirect("/");
  }

  return user;
  
}