import { Form } from "@remix-run/react";

export function AuthButtons({ userId }: { userId: number | null }) {
  if (userId) {
    return (
      <Form action="/logout" method="post">
        <button type="submit">Logout</button>
      </Form>
    );
  }

  return (
    <a href="/auth/google">
      <button>Login with Google</button>
    </a>
  );
}
