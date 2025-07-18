import { Form, Link, useLocation } from "@remix-run/react";
import { User2Icon, Globe, LogOut, LogIn, Package2 } from "lucide-react";

type SidebarProps = {
  user: any;
};

export default function Sidebar({ user }: SidebarProps) {
  const location = useLocation();

  const linkClass = (path: string) =>
    `p-2 rounded hover:bg-gray-200 block flex items-center  ${
      location.pathname === path ? "bg-gray-300 font-semibold" : ""
    }`;

  return (
    <div className="w-48 h-screen bg-gray-100 p-4">
      <div>
        <h2 className="text-xl font-bold mb-4">Dinio App</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        <Link to="/user" className={linkClass("/user")}>
          <User2Icon className="mr-2" /> {user?.username || "Profile"}
        </Link>
        <Link to="/packages" className={linkClass("/packages")}>
          <Package2 className="mr-2" /> Packages
        </Link>
        <Link to="/zones" className={linkClass("/zones")}>
          <Globe className="mr-2" /> Zones
        </Link>

        {user ? (
          <Form method="post" action="/auth/logout">
            <button
              type="submit"
              className="p-2 text-left rounded hover:bg-red-100 w-full flex items-center"
            >
              <LogOut className="mr-2" />
              Logout
            </button>
          </Form>
        ) : (
          <Link
            to="/auth/login"
            className="p-2 text-left rounded hover:bg-blue-100  flex items-center"
          >
            <LogIn className="mr-2" /> Login
          </Link>
        )}
      </nav>
    </div>
  );
}
