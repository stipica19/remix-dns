import { LoaderFunction, json } from "@remix-run/node";
import { requireVerifiedUser } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireVerifiedUser(request);

  return json({ user });
};

export default function Users() {
  return <h1>test</h1>;
}
