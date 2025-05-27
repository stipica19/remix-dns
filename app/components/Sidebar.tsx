import { Form, Link, useLocation } from "@remix-run/react";

type SidebarProps = {
  user: any;
};

export default function Sidebar({ user }: SidebarProps) {
  const location = useLocation();

  const linkClass = (path: string) =>
    `p-2 rounded hover:bg-gray-200 block ${
      location.pathname === path ? "bg-gray-300 font-semibold" : ""
    }`;

  return (
    <div className="w-48 h-screen bg-gray-100 p-4">
      <div>
        <h2 className="text-xl font-bold mb-4">Dinio App</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        <Link to="/user" className={linkClass("/user")}>
          {user?.name || "Profile"}
        </Link>
        <Link to="/zones" className={linkClass("/zones")}>
          Zones
        </Link>

        {user ? (
          <Form method="post" action="/auth/logout">
            <button
              type="submit"
              className="p-2 text-left rounded hover:bg-red-100 w-full"
            >
              Logout
            </button>
          </Form>
        ) : (
          <Link
            to="/auth/login"
            className="p-2 text-left rounded hover:bg-blue-100 block"
          >
            Login
          </Link>
        )}
      </nav>
    </div>
  );
}
