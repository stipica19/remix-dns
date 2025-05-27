// app/services/auth.server.ts
import { Authenticator } from 'remix-auth';
import { GoogleStrategy } from 'remix-auth-google';
import { sessionStorage } from '../utils/session.server';
import { db } from './db.server';


export const authenticator = new Authenticator<number>(sessionStorage, {
  sessionKey: "userId",
});

authenticator.use(
  new GoogleStrategy<number>(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/auth/callback',
    },
    async ({ profile }: { profile: any }) => {
      const email = profile.emails?.[0].value!;
     const name = profile.displayName || profile.name?.givenName || 'Unknown User';
      const google_id = profile.id;
      const picture = profile.photos?.[0].value;

      console.log("imeeeeeeeeeeeeeeeee", name);

      // Find user by google_id (assuming google_id is unique in your schema)
      let user = await db.users.findUnique({
        where: { google_id },
      });

      if (!user) {
        user = await db.users.create({
          data: {
            email,
            name,
            google_id,
            profile_picture: picture,
            isVerify: true,
          },
        });
      }

      return user.id; // <- tvoje Session ID je tipa broj (number)
    }
  )
);
