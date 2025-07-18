import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { AlignVerticalJustifyCenter, Ban, Check, User } from "lucide-react";
import {
  getUserFromSession,
  requireVerifiedUser,
  updateUserPassword,
} from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);

  if (!user) {
    return redirect("/auth/login");
  }

  return json({ user });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await getUserFromSession(request);

  console.log("saaaaaaaaaaaaaaaaaaaaa", user);
  if (!user) {
    return redirect("/auth/login");
  }

  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmNewPassword = formData.get("confirmNewPassword") as string;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return json({ error: "All fields are required." }, { status: 400 });
  }
  if (newPassword !== confirmNewPassword) {
    return json({ error: "New passwords do not match." }, { status: 400 });
  }

  if (!user.password) {
    return json({ error: "User password not found." }, { status: 400 });
  }
  const passwordMatch = await bcrypt.compare(
    currentPassword,
    user.password as string
  );
  if (!passwordMatch) {
    return json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(user.id, hashedPassword);
  return json({ success: "Password updated successfully!" });
};

export default function Users() {
  const actionData = useActionData<typeof action>();
  const { user } = useLoaderData<typeof loader>();
  console.log("User data -:", user);
  return (
    <div
      className="w-full mt-3 
     p-6 bg-white rounded-lg space-y-10"
    >
      <h1 className="text-2xl font-semibold">Personal Info</h1>

      {/* Basic Info */}
      <div className="flex gap-6 items-start border-t pt-6">
        <div className="w-24 h-24 bg-gray-400 rounded-full flex items-center justify-center text-white text-3xl">
          <User className="w-12 h-12" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-gray-600">Neki text ovdje koji ce srat bzvz</p>
          <div className="border-b pb-4">
            <div className="flex items-center">
              <div className="w-32 font-semibold">Name</div>
              <div className="text-gray-500 ml-10">
                {user.first_name} {user.last_name}
              </div>
            </div>
          </div>
          <div className="border-b pb-4">
            <div className="flex items-center">
              <div className="w-32 font-semibold">Username</div>
              <div className="text-gray-500 ml-10">{user.username}</div>
            </div>
          </div>
          <div className="border-b pb-4">
            <div className="flex items-center">
              <div className="w-32 font-semibold">Email</div>
              <div className="text-gray-500 ml-10">{user.email}</div>
            </div>
          </div>
          <div className="border-b pb-4">
            <div className="flex items-center">
              <div className="w-32 font-semibold">Verifiy</div>
              <div className="text-gray-500 ml-10">
                {user.isVerify ? <Check color="green" /> : <Ban color="red" />}
              </div>
            </div>
          </div>
          <div className="border-b pb-4">
            <div className="flex items-center">
              <div className="w-32 font-semibold">Created at</div>
              <div className="text-gray-500 ml-10">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
          <Form method="post">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {" "}
                Current Password{" "}
              </label>
              <input
                type="password"
                name="currentPassword"
                required
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                required
                className="w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmNewPassword"
                required
                className="w-full border rounded-md p-2"
              />
            </div>
            {actionData?.error && (
              <p className="text-red-500 text-sm">{actionData.error}</p>
            )}
            {actionData?.success && (
              <p className="text-green-500 text-sm">{actionData.success}</p>
            )}
            <button
              type="submit"
              className="bg-blue-500 mt-3 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update Password
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
