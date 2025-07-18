import { LoaderFunction } from "@remix-run/node";
import { json, useLoaderData } from "@remix-run/react";
import { PackageCard } from "~/components/PackageCard";
import { db } from "~/services/db.server";
import { requireUser } from "~/utils/session.server";

// Define the Paket type according to your database schema
type Package = {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  package_type: string;
  // features: string[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const packages = await db.packages.findMany({});
  const user = await requireUser(request); // 🔁 zamijeni s pravim userom iz sessiona

  return json({ packages, userId: user.id });
};

export default function PackagesRoute() {
  const { userId, packages } = useLoaderData<typeof loader>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
      {packages.map((p: Package, i: number) => {
        // Find the matching serverPackage by name to get features, monthly, yearly

        return <PackageCard key={i} data={{ ...p, userId }} />;
      })}
    </div>
  );
}
