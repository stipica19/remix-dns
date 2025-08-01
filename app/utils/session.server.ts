import { users } from "@prisma/client/wasm";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";
import { db } from "~/services/db.server";
export const sessionKey = 'userId'
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

//getUserId  kod njega se zove tako
export async function getUserFromSession(request: Request) {

  const authSession = await getUserSession(request);

  if (!authSession) return null;
  const sessionId = authSession.get(sessionKey);

  if (!sessionId) return null;

  try {
    const session = await db.sessions.findUnique({
      select: { user_id: true },
      where: {
        id: sessionId,
        expiration_date: { gt: new Date() },
      },
    });

    if (!session?.user_id) {
      throw redirect("/", {
        headers: {
          "set-cookie": await destroySession(authSession),
        },
      });
    }

    return session.user_id;
  } catch (error) {
    console.error("DB error in getUserFromSession", error);
    return null;
  }

}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set(sessionKey, userId);

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
//requireUserId
export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);

  if (!user) {
    throw redirect("/auth/login");
  }

  return user;
}

// Funkcija za provjeru da li je korisnik verificiran tj email mu je potvrđen
export async function requireVerifiedUser(request: Request): Promise<users> {
  const user = await getUserFromSession(request);

  if (!user || !user.isVerify) {

    throw redirect("/");
  }

  return user;
}
export async function updateUserPassword(id: number, hashedPassword: string) {
  return db.users.update({
    where: { id },
    data: { password: hashedPassword },
  });
}




//dodati login / logout funkciju koja će se koristiti u login.tsx
export async function login({ email, password }: { email: string, password: string }) {
  const user = await verifyEmailAndPassword(email, password)

  if (!user) return null;

  const session = await db.sessions.create({
    select: { id: true, expiration_date: true, user_id: true },
    data: {
      expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 sata
      user_id: user.id,
    }
  })
  return session;

}

export async function verifyEmailAndPassword(
  email: string,
  password: any
) {
  if (!email || !password) {
    return null;
  }
  const user = await db.users.findFirst({
    where: { email: email }
  })
  // Provjeravamo da li korisnik postoji i da li ima lozinku
  if (!user || !user.password) {
    return null
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return null
  }

  return { id: user.id }
}