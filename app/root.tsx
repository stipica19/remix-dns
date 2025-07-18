import {
  Outlet,
  LiveReload,
  Links,
  Meta,
  useLoaderData,
  ScrollRestoration,
  Scripts,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserFromSession } from "~/utils/session.server";

import "./tailwind.css";
import Sidebar from "./components/Sidebar";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];
export const meta = () => {
  return [
    { name: "description", content: "A cool blog built with Remix" },
    { name: "keywords", content: "remix, react, javascript" },
    { title: "Dinio" }, // naslov stranice (ako želiš)
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  return json({ user });
};

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const showWarning = user && !user.isVerify;

  return (
    <Document>
      <Layout user={user}>
        <Outlet />
      </Layout>
    </Document>
  );
}

// 💡 Global HTML dokument
function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <script
          src={`https://www.paypal.com/sdk/js?client-id=Adajw2bRJEQ4ohojAi718VYTiqsaYPM5de1t4W-V8eN1CHL9avg_ACZS7jqF8TUU54nW7Xxiz9IbGzkk&currency=EUR`}
        />

        <Meta />
        <Links />
        <title>{title ?? "Dinio App"}</title>
      </head>
      <body className="h-full bg-gray-50 text-gray-800">
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "production" && <LiveReload />}
      </body>
    </html>
  );
}

// 💡 Layout sa Sidebar navigacijom
function Layout({ children, user }: { children: React.ReactNode; user: any }) {
  const showWarning = user && !user.isVerify;

  return (
    <div className="min-h-screen">
      {/* 🔔 Traka za upozorenje */}
      {showWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-300 text-black text-center p-3">
          ⚠️ Molimo potvrdite svoju email adresu kako biste mogli koristiti sve
          funkcije.
        </div>
      )}

      {/* 🔽 Ovo sad gura cijeli sadržaj (sidebar + main) dolje */}
      <div className={`flex min-h-full ${showWarning ? "pt-8" : ""}`}>
        <aside className="w-64 bg-gray-100 border-r p-4 flex flex-col justify-between">
          <Sidebar user={user || null} />
          <footer className="text-sm text-gray-500 mt-10">
            &copy; {new Date().getFullYear()} Dinio-remix App
          </footer>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

// 💥 Error handler

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} --- {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
